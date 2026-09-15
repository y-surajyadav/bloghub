const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Authentication REST Endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

module.exports = router;
