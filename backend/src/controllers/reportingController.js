const Application = require('../models/Application');
const { Parser } = require('json2csv');
const logger = require('../utils/logger');
const AppError = require('../utils/errors');
const redisClient = require('../config/redis');

/**
 * @swagger
 * /reports/export:
 *   get:
 *     summary: Exporte les candidatures en CSV (admin/hr only)
 *     tags: [Reporting]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *         description: Date de début (ISO)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         description: Date de fin (ISO)
 *     responses:
 *       200:
 *         description: Fichier CSV
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       403:
 *         description: Accès interdit
 */
exports.exportApplicationsCSV = async (req, res, next) => {
  if (!['admin', 'hr'].includes(req.user.role)) return next(new AppError('Accès interdit', 403));

  try {
    const { from, to } = req.query;
    const query = {};
    if (from) query.createdAt = { $gte: new Date(from) };
    if (to) query.createdAt = { ...query.createdAt, $lte: new Date(to) };

    const applications = await Application.find(query)
      .populate('applicant', 'firstName lastName email')
      .populate('job', 'title department');

    const fields = [
      { label: 'Nom Candidat', value: row => `${row.candidateInfo.name || `${row.applicant.firstName} ${row.applicant.lastName}`}` },
      { label: 'Email', value: row => row.candidateInfo.email || row.applicant.email },
      { label: 'Titre Offre', value: 'job.title' },
      { label: 'Département', value: 'job.department' },
      { label: 'Statut', value: 'status' },
      { label: 'CV URL', value: 'resume' },
      { label: 'Date Candidature', value: row => row.createdAt.toISOString() }
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(applications);

    logger.info('Export CSV des candidatures généré');

    res.header('Content-Type', 'text/csv');
    res.attachment('candidatures_report.csv');
    res.send(csv);
  } catch (err) {
    logger.error(`Erreur lors de l'export CSV: ${err.message}`);
    next(err);
  }
};

/**
 * @swagger
 * /reports/pipeline:
 *   get:
 *     summary: Métriques du pipeline de recrutement (admin/hr only)
 *     tags: [Reporting]
 *     responses:
 *       200:
 *         description: Métriques (counts par statut, temps moyen embauche)
 *       403:
 *         description: Accès interdit
 */
exports.getPipelineMetrics = async (req, res, next) => {
  if (!['admin', 'hr'].includes(req.user.role)) return next(new AppError('Accès interdit', 403));

  const cacheKey = 'pipeline_metrics';
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info('Métriques servies depuis le cache');
      return res.json(JSON.parse(cached));
    }

    const pipelineCounts = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const timeToHire = await Application.aggregate([
      { $match: { status: 'offer' } },
      { $project: { duration: { $subtract: ['$updatedAt', '$createdAt'] } } },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } },
    ]);

    const response = {
      pipeline: pipelineCounts,
      avgTimeToHire: timeToHire[0]?.avgDuration / (1000 * 60 * 60 * 24) || 0, // en jours
    };

    await redisClient.setEx(cacheKey, 600, JSON.stringify(response)); // 10 min

    logger.info('Métriques du pipeline récupérées');

    res.json(response);
  } catch (err) {
    logger.error(`Erreur lors de la récupération des métriques: ${err.message}`);
    next(err);
  }
};