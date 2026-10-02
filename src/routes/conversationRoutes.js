const express = require('express');
const {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
} = require('../controllers/conversationController');
const requireAuth = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.get('/', requireAuth, getConversations);
router.post('/', requireAuth, getOrCreateConversation);
router.get('/:id/messages', requireAuth, getMessages);
router.post(
  '/:id/messages',
  requireAuth,
  upload.array('media', 20),   // accept up to 20 files under the 'media' field
  sendMessage
);

module.exports = router;