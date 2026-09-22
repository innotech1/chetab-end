const express = require('express');
const {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
} = require('../controllers/conversationController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, getConversations);
router.post('/', requireAuth, getOrCreateConversation);
router.get('/:id/messages', requireAuth, getMessages);
router.post('/:id/messages', requireAuth, sendMessage);

module.exports = router;
