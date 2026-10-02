const express = require('express');
const requireAuth = require('../middleware/auth');
const { getCallToken } = require('../controllers/callController');

const router = express.Router();

// GET /api/call/token?channelName=xxx
router.get('/token', requireAuth, getCallToken);

module.exports = router;