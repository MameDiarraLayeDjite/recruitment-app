const express = require('express');

const authController = require('../controllers/authController');

const router = express.Router();

// Auth (non protégées)
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/logout', authController.logout);

module.exports = router;