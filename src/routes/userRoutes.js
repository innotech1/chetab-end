const express = require('express');
const { getUserProfile, followUser, unfollowUser } = require('../controllers/userController');
const { getUserPosts } = require('../controllers/postController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/:username', requireAuth, getUserProfile);
router.get('/:username/posts', requireAuth, getUserPosts);
router.post('/:username/follow', requireAuth, followUser);
router.delete('/:username/follow', requireAuth, unfollowUser);

module.exports = router;
