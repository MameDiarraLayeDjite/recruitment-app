const Interview = require('../models/Interview');
const Application = require('../models/Application');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('../utils/mailer');
const ical = require('ical-generator').default;
const { z } = require('zod');
const logger = require('../utils/logger');
const AppError = require('../utils/errors');

const createInterviewSchema = z.object({
  scheduledAt: z.string().datetime(),
  duration: z.number().optional(),
  participants: z.array(z.object({ userId: z.string().optional(), email: z.string().optional() })),
  location: z.string().optional(),
});

/**
 * @swagger
 * /applications/{applicationId}/interviews:
 *   post:
 *     summary: Crée un entretien pour une candidature (admin/hr only)
 *     tags: [Interviews]
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scheduledAt: { type: string, format: date-time }
 *               duration: { type: number }
 *               participants: { type: array, items: { type: object, properties: { userId: { type: string }, email: { type: string } } } }
 *               location: { type: string }
 *     responses:
 *       201:
 *         description: Entretien créé
 *       403:
 *         description: Accès interdit
 *       400:
 *         description: Erreur de validation
 */
exports.createInterview = async (req, res, next) => {
  if (!['admin', 'hr'].includes(req.user.role)) return next(new AppError('Acces Denied', 403));

  const { applicationId } = req.params;
  try {
    const parsed = createInterviewSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(`Validation Error: ${parsed.error.errors.map(e => e.message).join(', ')}`, 400));

    const interview = await Interview.create({ application: applicationId, ...parsed.data });

    await Application.findByIdAndUpdate(applicationId, { status: 'interview' });

    // Emails aux participants
    for (const participant of parsed.data.participants) {
      const participantEmail = participant.email || (await User.findById(participant.userId))?.email;
      if (participantEmail) {
        await sendEmail({
          to: participantEmail,
          subject: 'Interview Scheduled',
          text: `An interview is scheduled for ${parsed.data.scheduledAt}. Location: ${parsed.data.location}`,
        });
      }
    }

    const application = await Application.findById(applicationId);
    await Notification.create({ user: application.applicant || application.candidateInfo.email, type: 'interview_scheduled', payload: { interviewId: interview._id } });

    // Real-time notif
    if (application.applicant) global.io.to(application.applicant.toString()).emit('interview_scheduled', { interviewId: interview._id });

    await AuditLog.create({ actor: req.user._id, action: 'create_interview', targetType: 'Interview', targetId: interview._id });

    logger.info(`Interview created: ${interview._id}`);

    res.status(201).json(interview);
  } catch (err) {
    logger.error(`Error creating interview: ${err.message}`);
    next(err);
  }
};

/**
 * @swagger
 * /interviews/{id}:
 *   get:
 *     summary: Détail d'un entretien (admin/hr only)
 *     tags: [Interviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Entretien trouvé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Entretien non trouvé
 */
exports.getInterviewById = async (req, res, next) => {
  if (!['admin', 'hr'].includes(req.user.role)) return next(new AppError('Access Denied', 403));

  try {
    const interview = await Interview.findById(req.params.id).populate('application');
    if (!interview) return next(new AppError('Interview not found', 404));

    logger.info(`Interview details retrieved: ${req.params.id}`);

    res.json(interview);
  } catch (err) {
    logger.error(`Error retrieving interview ${req.params.id}: ${err.message}`);
    next(err);
  }
};

/**
 * @swagger
 * /interviews/{id}:
 *   put:
 *     summary: Met à jour un entretien (admin/hr only)
 *     tags: [Interviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scheduledAt: { type: string, format: date-time }
 *               duration: { type: number }
 *               participants: { type: array, items: { type: object, properties: { userId: { type: string }, email: { type: string } } } }
 *               location: { type: string }
 *     responses:
 *       200:
 *         description: Entretien mis à jour
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Entretien non trouvé
 */
exports.updateInterview = async (req, res, next) => {
  if (!['admin', 'hr'].includes(req.user.role)) return next(new AppError('Access Denied', 403));

  try {
    const parsed = createInterviewSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(`Validation Error: ${parsed.error.errors.map(e => e.message).join(', ')}`, 400));

    const interview = await Interview.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
    if (!interview) return next(new AppError('Interview not found', 404));

    await AuditLog.create({ actor: req.user._id, action: 'update_interview', targetType: 'Interview', targetId: interview._id, details: parsed.data });

    logger.info(`Interview updated: ${interview._id}`);

    res.json(interview);
  } catch (err) {
    logger.error(`Error updating interview ${req.params.id}: ${err.message}`);
    next(err);
  }
};

/**
 * @swagger
 * /interviews/{id}/complete:
 *   post:
 *     summary: Complete un entretien avec évaluation (admin/hr only)
 *     tags: [Interviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               evaluation:
 *                 type: object
 *                 properties:
 *                   scores: { type: object }
 *                   notes: { type: string }
 *     responses:
 *       200:
 *         description: Entretien complété
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Entretien non trouvé
 */
exports.completeInterview = async (req, res, next) => {
  if (!['admin', 'hr'].includes(req.user.role)) return next(new AppError('Access Denied', 403));

  const { evaluation } = req.body;
  try {
    const interview = await Interview.findByIdAndUpdate(req.params.id, { status: 'completed', evaluation }, { new: true });
    if (!interview) return next(new AppError('Interview not found', 404));

    await AuditLog.create({ actor: req.user._id, action: 'complete_interview', targetType: 'Interview', targetId: interview._id, details: evaluation });

    logger.info(`Interview completed: ${interview._id}`);

    res.json(interview);
  } catch (err) {
    logger.error(`Error completing interview ${req.params.id}: ${err.message}`);
    next(err);
  }
};

/**
 * @swagger
 * /interviews/{id}/export:
 *   get:
 *     summary: Exporte un entretien en iCal (admin/hr only)
 *     tags: [Interviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Fichier iCal
 *         content:
 *           text/calendar:
 *             schema:
 *               type: string
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Entretien non trouvé
 */
exports.exportInterviewICal = async (req, res, next) => {
  if (!['admin', 'hr'].includes(req.user.role)) return next(new AppError('Access Denied', 403));

  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return next(new AppError('Interview not found', 404));

    const calendar = ical({ name: 'Interview Calendar' });
    calendar.createEvent({
      start: interview.scheduledAt,
      end: new Date(interview.scheduledAt.getTime() + interview.duration * 60000),
      summary: `Interview for application ${interview.application}`,
      description: interview.evaluation.notes || '',
      location: interview.location,
      organizer: { name: 'App Recruitment', email: process.env.EMAIL_FROM },
    });

    logger.info(`iCal exported for interview ${req.params.id}`);

    res.header('Content-Type', 'text/calendar; charset=utf-8');
    res.header('Content-Disposition', 'attachment; filename=interview.ics');
    res.send(calendar.toString());
  } catch (err) {
    logger.error(`Error exporting iCal for interview ${req.params.id}: ${err.message}`);
    next(err);
  }
};