const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const auth = require('../middlewares/auth');

const authController = require('../controllers/authController');
const auditLogController = require('../controllers/auditLogController');
const userController = require('../controllers/userController');

const router = express.Router();

// Auth (non protégées)
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/logout', authController.logout);

// Routes protégées
router.use(auth);

router.get('/users', userController.getUsers);
router.get('/users/:id', userController.getUserById);
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

router.get('/audit-logs', auditLogController.getAuditLogs);

module.exports = router;