require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { z } = require('zod');
const logger = require('../utils/logger');
const AppError = require('../utils/errors');
const { sendEmail } = require('../utils/mailer');

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  firstName: z.string().min(3),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['employee', 'hr', 'admin', 'applicant']).optional(),
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Enregistre un nouvel utilisateur
 *     tags: [Auth]
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
 *     responses:
 *       201:
 *         description: Utilisateur enregistré
 *       400:
 *         description: Erreur de validation ou email existant
 */
exports.register = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(`Validation error: ${parsed.error.errors.map(e => e.message).join(', ')}`, 400));

    const { firstName, lastName, email, password, role } = parsed.data;
    const existingUser = await User.findOne({ email });
    if (existingUser) return next(new AppError('Email already registered', 400));

    const newUser = await User.create({ firstName, lastName, email, password, role: role || 'employee' });
    logger.info(`User registered: ${newUser._id} with role ${newUser.role}`);

    // Optionnel : Envoi email de bienvenue
    await sendEmail({
      to: email,
      subject: 'Welcome to the Recruitment App',
      text: `Hello ${firstName}, your account has been successfully created.`,
    });

    res.status(201).json({ message: 'User registered', userId: newUser._id });
  } catch (err) {
    logger.error(`Error registering user: ${err.message}`);
    next(err);
  }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Connexion réussie, tokens fournis
 *       400:
 *         description: Identifiants invalides
 */
exports.login = async (req, res, next) => {
  try {
    console.log('Login request body:', req.body);
    console.log('Environment JWT_SECRET:', process.env.JWT_SECRET);
    console.log('Environment JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET);
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(`Validation error: ${parsed.error.errors.map(e => e.message).join(', ')}`, 400));

    const { email, password } = parsed.data;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) return next(new AppError('Invalid credentials', 400));

    user.lastLogin = Date.now();
    await user.save();

    const accessToken = jwt.sign(
      {
        _id: user._id,
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign({ _id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });

    logger.info(`Login successful for user: ${user._id}`);

    res.json({
      message: 'Login successful',
      accessToken,
      user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role }
    });
  } catch (err) {
    logger.error(`Error logging in: ${err.message}`);
    next(err);
  }
};

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Rafraîchit le token d'accès
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Nouveau token d'accès fourni
 *       401:
 *         description: Token de rafraîchissement invalide
 */
exports.refreshToken = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return next(new AppError('No refresh token provided', 401));

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new AppError('Invalid token', 401));

    const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });

    logger.info(`Token refreshed for user: ${user._id}`);

    res.json({ accessToken });
  } catch (err) {
    logger.error(`Error refreshing token: ${err.message}`);
    next(new AppError('Invalid refresh token', 401));
  }
};

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Déconnexion utilisateur
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 */
exports.logout = (req, res, next) => {
  res.clearCookie('refreshToken');
  logger.info('Logged out successfully');
  res.json({ message: 'Logged out successfully' });
};