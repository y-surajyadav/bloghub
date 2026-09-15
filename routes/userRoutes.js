const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuthApi } = require('../middleware/authMiddleware');

// User profile endpoints
router.get('/:id', userController.getUserProfile);
router.put('/:id', requireAuthApi, userController.updateUserProfile);

module.exports = router;
