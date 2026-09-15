const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { requireAuthApi } = require('../middleware/authMiddleware');

// Comments endpoints
router.get('/posts/:id/comments', commentController.getCommentsByPost);
router.post('/posts/:id/comments', requireAuthApi, commentController.createComment);
router.delete('/:id', requireAuthApi, commentController.deleteComment);

module.exports = router;
