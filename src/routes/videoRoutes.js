const express = require('express');
const { getVideoFeed } = require('../controllers/videoController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, getVideoFeed);

module.exports = router;
