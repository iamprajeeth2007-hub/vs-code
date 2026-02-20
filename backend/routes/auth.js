// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllerTemp');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/register', authController.registerStudent);
router.post('/login', authController.loginStudent);

// Vendor login
router.post('/vendor/login', authController.loginVendor);

// Protected routes (example)
// router.get('/profile', authenticateToken, authController.getProfile);
// router.put('/profile', authenticateToken, authController.updateProfile);

module.exports = router;


