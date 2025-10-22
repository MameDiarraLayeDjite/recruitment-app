const Job = require("../models/Job");
const AuditLog = require("../models/AuditLog");
const { z } = require("zod");
const logger = require("../utils/logger");
const AppError = require("../utils/errors");
const redisClient = require("../config/redis");

const createJobSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  department: z.string(),
  location: z.string().optional(),
  salaryRange: z.string().optional(),
  type: z.enum(["CDI", "CDD", "Stage", "Intern"]).optional(),
  requirements: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(["internal", "public"]).optional(),
});

/**
 * @swagger
 * /jobs:
 *   post:
 *     summary: Crée une nouvelle offre d'emploi (admin/hr only)
 *     tags: [Jobs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               department: { type: string }
 *               location: { type: string }
 *               salaryRange: { type: string }
 *               type: { type: string }
 *               requirements: { type: array, items: { type: string } }
 *               benefits: { type: array, items: { type: string } }
 *               tags: { type: array, items: { type: string } }
 *               visibility: { type: string }
 *     responses:
 *       201:
 *         description: Offre créée
 *       403:
 *         description: Accès interdit
 *       400:
 *         description: Erreur de validation
 */
exports.createJob = async (req, res, next) => {
  if (!["admin", "hr"].includes(req.user.role))
    return next(new AppError("Access Denied", 403));

  try {
    const parsed = createJobSchema.safeParse(req.body);
    if (!parsed.success)
      return next(
        new AppError(
          `Validation Error: ${parsed.error.errors
            .map((e) => e.message)
            .join(", ")}`,
          400
        )
      );

    const job = await Job.create({ ...parsed.data, createdBy: req.user.id });

    await AuditLog.create({
      actor: req.user.id,
      action: "create_job",
      targetType: "Job",
      targetId: job._id,
    });

    // Invalide cache
    await redisClient.del("all_jobs");

    // Real-time notif
    global.io
      .to(req.user.id)
      .emit("new_job", { jobId: job._id, title: job.title });

    logger.info(`Job created: ${job._id}`);

    res.status(201).json(job);
  } catch (err) {
    logger.error(`Error creating job: ${err.message}`);
    next(err);
  }
};

/**
 * @swagger
 * /jobs:
 *   get:
 *     summary: Liste toutes les offres d'emploi
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Recherche textuelle
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
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
 *         description: Liste des offres
 */
exports.getAllJobs = async (req, res, next) => {
  const cacheKey = `jobs_${JSON.stringify(req.query)}`; // Cache par query pour efficience
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info("Job list served from cache");
      return res.json(JSON.parse(cached));
    }

    const {
      q,
      department,
      status,
      visibility,
      page = 1,
      limit = 10,
    } = req.query;
    const query = {};
    if (q) query.$text = { $search: q };
    if (department) query.department = department;
    if (status) query.status = status;
    if (visibility) query.visibility = visibility;

    const jobs = await Job.find(query)
      .populate("createdBy", "firstName lastName")
      .sort(req.query.sort || "-createdAt")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const count = await Job.countDocuments(query);

    const response = {
      jobs,
      count,
      page,
      totalPages: Math.ceil(count / limit),
    };
    await redisClient.set(cacheKey, 300, JSON.stringify(response));

    logger.info("Job list retrieved from DB and cached");

    res.json(response);
  } catch (err) {
    logger.error(`Error retrieving job list: ${err.message}`);
    next(err);
  }
};

/**
 * @swagger
 * /jobs/{id}:
 *   get:
 *     summary: Détail d'une offre d'emploi
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Offre trouvée
 *       404:
 *         description: Offre non trouvée
 */
exports.getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "createdBy",
      "firstName lastName"
    );
    if (!job) return next(new AppError("Offer not found", 404));

    logger.info(`Job detail retrieved: ${req.params.id}`);

    res.json(job);
  } catch (err) {
    logger.error(
      `Error retrieving job ${req.params.id}: ${err.message}`
    );
    next(err);
  }
};

/**
 * @swagger
 * /jobs/{id}:
 *   put:
 *     summary: Met à jour une offre d'emploi (admin/hr only)
 *     tags: [Jobs]
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
 *               title: { type: string }
 *               description: { type: string }
 *               department: { type: string }
 *               location: { type: string }
 *               salaryRange: { type: string }
 *               type: { type: string }
 *               requirements: { type: array, items: { type: string } }
 *               benefits: { type: array, items: { type: string } }
 *               tags: { type: array, items: { type: string } }
 *               visibility: { type: string }
 *     responses:
 *       200:
 *         description: Offre mise à jour
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Offre non trouvée
 */
exports.updateJob = async (req, res, next) => {
  if (!["admin", "hr"].includes(req.user.role))
    return next(new AppError("Access Denied", 403));

  try {
    const parsed = createJobSchema.safeParse(req.body);
    if (!parsed.success)
      return next(
        new AppError(
          `Validation Error: ${parsed.error.errors
            .map((e) => e.message)
            .join(", ")}`,
          400
        )
      );

    const job = await Job.findByIdAndUpdate(req.params.id, parsed.data, {
      new: true,
    });
    if (!job) return next(new AppError("Offer not found", 404));

    await AuditLog.create({
      actor: req.user.id,
      action: "update_job",
      targetType: "Job",
      targetId: job._id,
      details: parsed.data,
    });

    // Invalide cache
    await redisClient.del("all_jobs");

    logger.info(`Job updated: ${job._id}`);

    res.json(job);
  } catch (err) {
    logger.error(
      `Error updating job ${req.params.id}: ${err.message}`
    );
    next(err);
  }
};

/**
 * @swagger
 * /jobs/{id}:
 *   delete:
 *     summary: Supprime une offre d'emploi (soft delete, admin/hr only)
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Offre supprimée
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Offre non trouvée
 */
exports.deleteJob = async (req, res, next) => {
  if (!["admin", "hr"].includes(req.user.role))
    return next(new AppError("Accès interdit", 403));

  try {
    const job = await Job.deleteById(req.params.id);
    if (!job) return next(new AppError("Offre non trouvée", 404));

    await AuditLog.create({
      actor: req.user.id,
      action: "delete_job",
      targetType: "Job",
      targetId: req.params.id,
    });

    // Invalide cache
    await redisClient.del("all_jobs");

    logger.info(`Job deleted (soft): ${req.params.id}`);

    res.json({ message: "Job deleted" });
  } catch (err) {
    logger.error(
      `Error deleting job ${req.params.id}: ${err.message}`
    );
    next(err);
  }
};

/**
 * @swagger
 * /jobs/{id}/publish:
 *   post:
 *     summary: Publie une offre d'emploi (admin/hr only)
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Offre publiée
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Offre non trouvée
 */
exports.publishJob = async (req, res, next) => {
  if (!["admin", "hr"].includes(req.user.role))
    return next(new AppError("Access Denied", 403));

  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: "published" },
      { new: true }
    );
    if (!job) return next(new AppError("Offer not found", 404));

    await AuditLog.create({
      actor: req.user.id,
      action: "publish_job",
      targetType: "Job",
      targetId: job._id,
    });

    // Invalide cache
    await redisClient.del("all_jobs");

    // Real-time notif
    global.io
      .to(job.createdBy.toString())
      .emit("job_published", { jobId: job._id, title: job.title });

    logger.info(`Job published: ${job._id}`);

    res.json(job);
  } catch (err) {
    logger.error(
      `Error publishing job ${req.params.id}: ${err.message}`
    );
    next(err);
  }
};

/**
 * @swagger
 * /jobs/{id}/close:
 *   post:
 *     summary: Ferme une offre d'emploi (admin/hr only)
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Offre fermée
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Offre non trouvée
 */
exports.closeJob = async (req, res, next) => {
  if (!["admin", "hr"].includes(req.user.role))
    return next(new AppError("Access Denied", 403));

  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: "closed" },
      { new: true }
    );
    if (!job) return next(new AppError("Offer not found", 404));

    await AuditLog.create({
      actor: req.user.id,
      action: "close_job",
      targetType: "Job",
      targetId: job._id,
    });

    // Invalide cache
    await redisClient.del("all_jobs");

    // Real-time notif
    global.io
      .to(job.createdBy.toString())
      .emit("job_closed", { jobId: job._id, title: job.title });

    logger.info(`Offre fermée: ${job._id}`);

    res.json(job);
  } catch (err) {
    logger.error(
      `Error closing job ${req.params.id}: ${err.message}`
    );
    next(err);
  }
};
