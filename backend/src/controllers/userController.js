const User = require('../models/User');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');
const AppError = require('../utils/errors');
const redisClient = require('../config/redis');

const createUserSchema = z.object({
  firstName: z.string().min(3),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin','hr','employee','applicant']).optional(),
  department: z.string().optional()
});

const updateUserSchema = z.object({
  firstName: z.string().min(3).optional(),
  lastName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin','hr','employee','applicant']).optional(),
  department: z.string().optional(),
  managerId: z.string().optional(),
  profilePhotoUrl: z.string().optional(),
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Liste tous les utilisateurs (admin/hr only)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Tri (ex. -createdAt)
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *       403:
 *         description: Accès interdit
 */
exports.getUsers = async (req, res, next) => {
  if (!['admin', 'hr'].includes(req.user.role)) return next(new AppError('Accès interdit', 403));

  const cacheKey = 'all_users';
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info('Users list served from cache');
      return res.json(JSON.parse(cached));
    }

    const users = await User.find().select('-password').sort(req.query.sort || '-createdAt');
    await redisClient.setEx(cacheKey, 300, JSON.stringify(users));

    logger.info('Users list retrieved from DB');
    res.json(users);
  } catch (err) {
    logger.error(`Error retrieving users: ${err.message}`);
    next(err);
  }
};

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Détail d'un utilisateur
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Utilisateur non trouvé
 */
exports.getUserById = async (req, res, next) => {
  const { id } = req.params;
  if (!['admin', 'hr'].includes(req.user.role) && req.user.id !== id) return next(new AppError('Accès interdit', 403));

  try {
    const user = await User.findById(id).select('-password');
    if (!user) return next(new AppError('User not found', 404));

    logger.info(`User detail retrieved: ${id}`);
    res.json(user);
  } catch (err) {
    logger.error(`Error retrieving user ${id}: ${err.message}`);
    next(err);
  }
};

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Crée un utilisateur (admin only)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string }
 *               department: { type: string }
 *     responses:
 *       201:
 *         description: Utilisateur créé
 *       403:
 *         description: Accès interdit
 *       400:
 *         description: Erreur de validation
 */
exports.createUser = async (req, res, next) => {
  if (req.user.role !== 'admin') return next(new AppError('Access denied', 403));

  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(`Validation error: ${parsed.error.errors.map(e => e.message).join(', ')}`, 400));

    const { firstName, lastName, email, password, role, department } = parsed.data;
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return next(new AppError('Email already registered', 400));

    let passwordHash = password ? await bcrypt.hash(password, 12) : await bcrypt.hash(Math.random().toString(36).slice(-8), 12);

    const newUser = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      password: passwordHash,
      role: role || 'employee',
      department: department || ''
    });

    await AuditLog.create({ actor: req.user.id, action: 'create_user', targetType: 'User', targetId: newUser._id });

    // Invalide cache
    await redisClient.del('all_users');

    logger.info(`User created: ${newUser._id}`);

    const out = newUser.toObject();
    delete out.password;
    res.status(201).json({ message: 'User created', user: out });
  } catch (err) {
    logger.error(`Error creating user: ${err.message}`);
    next(err);
  }
};

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Met à jour un utilisateur
 *     tags: [Users]
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
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string }
 *               department: { type: string }
 *               managerId: { type: string }
 *               profilePhotoUrl: { type: string }
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Utilisateur non trouvé
 */
exports.updateUser = async (req, res, next) => {
  const { id } = req.params;
  if (req.user.role !== 'admin' && req.user.id !== id) return next(new AppError('Access denied', 403));

  try {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(`Validation error: ${parsed.error.errors.map(e => e.message).join(', ')}`, 400));

    const updates = parsed.data;
    if (updates.email) updates.email = updates.email.toLowerCase().trim();
    if (updates.password) updates.password = await bcrypt.hash(updates.password, 12);

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    if (!user) return next(new AppError('User not found', 404));

    await AuditLog.create({ actor: req.user.id, action: 'update_user', targetType: 'User', targetId: id, details: updates });

    // Invalide cache
    await redisClient.del('all_users');

    logger.info(`User updated: ${id}`);

    res.json({ message: 'User updated', user });
  } catch (err) {
    logger.error(`Error updating user ${id}: ${err.message}`);
    next(err);
  }
};

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Supprime un utilisateur (soft delete, admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Utilisateur supprimé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Utilisateur non trouvé
 */
exports.deleteUser = async (req, res, next) => {
  if (req.user.role !== 'admin') return next(new AppError('Access denied', 403));

  const { id } = req.params;
  try {
    const user = await User.deleteById(id); // Soft delete
    if (!user) return next(new AppError('User not found', 404));

    await AuditLog.create({ actor: req.user.id, action: 'delete_user', targetType: 'User', targetId: id });

    // Invalide cache
    await redisClient.del('all_users');

    logger.info(`User deleted (soft): ${id}`);

    res.json({ message: 'User deleted' });
  } catch (err) {
    logger.error(`Error deleting user ${id}: ${err.message}`);
    next(err);
  }
};