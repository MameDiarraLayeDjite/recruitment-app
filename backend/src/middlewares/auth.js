const jwt = require('jsonwebtoken');
const AppError = require('../utils/errors');
const redisClient = require('../config/redis');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) return next(new AppError('No token provided', 401));

  // Accept "Bearer <token>" or a raw token
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return next(new AppError('No token provided', 401));

  if (!process.env.JWT_SECRET) {
    // server misconfiguration
    return next(new AppError('Server configuration error', 500));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);


    // Optional: check token blacklist in Redis (key "bl_<token>")
    try {
      if (redisClient && typeof redisClient.get === 'function') {
        const blocked = await redisClient.get(`bl_${token}`);
        if (blocked) return next(new AppError('Token revoked', 401));
      }
    } catch (redisErr) {
      // non-fatal: log and continue (don't block requests if Redis is down)
      // eslint-disable-next-line no-console
      console.error('Redis token blacklist check failed:', redisErr.message || redisErr);
    }

    req.user = {
      ...decoded,
      _id: decoded._id || decoded.id,
    };
    return next();
  } catch (err) {
    return next(new AppError('Invalid token', 401));
  }
};  