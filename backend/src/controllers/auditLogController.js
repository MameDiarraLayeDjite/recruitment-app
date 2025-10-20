const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');
const AppError = require('../utils/errors');
const redisClient = require('../config/redis');

/**
 * @swagger
 * /audit-logs:
 *   get:
 *     summary: Liste les logs d'audit (admin only)
 *     tags: [Audit]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Tri (ex. -createdAt)
 *     responses:
 *       200:
 *         description: Liste des logs
 *       403:
 *         description: Accès interdit
 */
exports.getAuditLogs = async (req, res, next) => {
  if (req.user.role !== 'admin') return next(new AppError('Access denied', 403));

  const cacheKey = `audit_logs_${JSON.stringify(req.query)}`;
  const { page = 1, limit = 20 } = req.query;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info('Audit logs served from cache');
      return res.json(JSON.parse(cached));
    }

    const logs = await AuditLog.find({})
      .populate('actor', 'firstName lastName')
      .sort(req.query.sort || '-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const count = await AuditLog.countDocuments();

    const response = { logs, count, page, totalPages: Math.ceil(count / limit) };
    await redisClient.setEx(cacheKey, 300, JSON.stringify(response));

    logger.info('Audit logs retrieved');

    res.json(response);
  } catch (err) {
    logger.error(`Error retrieving audit logs: ${err.message}`);
    next(err);
  }
};