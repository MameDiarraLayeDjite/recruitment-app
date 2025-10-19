// auth.js (inchangé, vérifie JWT)
const jwt = require('jsonwebtoken');
const AppError = require('../utils/errors');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return next(new AppError('No token provided', 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    next(new AppError('Invalid token', 401));
  }
};