const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { requireAuthApi } = require('../middleware/authMiddleware');

// Public post queries
router.get('/', postController.getPosts);
router.get('/:id', postController.getPostById);

// Protected post actions (requires logged in session)
router.post('/', requireAuthApi, postController.createPost);
router.put('/:id', requireAuthApi, postController.updatePost);
router.delete('/:id', requireAuthApi, postController.deletePost);

// Like / Unlike endpoints
router.post('/:id/like', requireAuthApi, postController.likePost);
router.delete('/:id/like', requireAuthApi, postController.unlikePost);

module.exports = router;
