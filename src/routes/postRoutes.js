const express = require('express');
const { createPost, getPost, deletePost } = require('../controllers/postController');
const { likePost, unlikePost } = require('../controllers/likeController');
const { createComment, getComments } = require('../controllers/commentController');
const { createRepost, deleteRepost } = require('../controllers/repostController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, createPost);
router.get('/:id', requireAuth, getPost);
router.delete('/:id', requireAuth, deletePost);
router.post('/:id/like', requireAuth, likePost);
router.delete('/:id/like', requireAuth, unlikePost);
router.post('/:id/comments', requireAuth, createComment);
router.get('/:id/comments', requireAuth, getComments);
router.post('/:id/repost', requireAuth, createRepost);
router.delete('/:id/repost', requireAuth, deleteRepost);

module.exports = router;
