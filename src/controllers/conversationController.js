const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

const AUTHOR_FIELDS = 'displayName username avatarUrl';

function serializeConversation(conv, viewerId) {
  const other = conv.participants.find((p) => String(p._id) !== String(viewerId));
  return {
    id: conv._id,
    otherUser: other && {
      id: other._id,
      displayName: other.displayName,
      username: other.username,
      avatarUrl: other.avatarUrl,
    },
    lastMessageText: conv.lastMessageText,
    lastMessageAt: conv.lastMessageAt,
  };
}

function serializeMessage(msg) {
  return {
    id: msg._id,
    conversationId: msg.conversation,
    text: msg.text,
    createdAt: msg.createdAt,
    media: (msg.media || []).map((m) => ({
      mediaUrl: m.mediaUrl,
      mediaType: m.mediaType,
    })),
    sender: msg.sender && {
      id: msg.sender._id,
      displayName: msg.sender.displayName,
      username: msg.sender.username,
      avatarUrl: msg.sender.avatarUrl,
    },
  };
}

function uploadBufferToCloudinary(buffer, resourceType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType, folder: 'cheta/messages' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

// GET /api/conversations
async function getConversations(req, res) {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .sort({ lastMessageAt: -1 })
      .populate('participants', AUTHOR_FIELDS);

    res.json({
      conversations: conversations.map((c) => serializeConversation(c, req.user._id)),
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not load conversations', error: err.message });
  }
}

// POST /api/conversations   body: { username }
async function getOrCreateConversation(req, res) {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ message: 'username is required' });
    }

    const other = await User.findOne({ username: username.toLowerCase() });
    if (!other) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (String(other._id) === String(req.user._id)) {
      return res.status(400).json({ message: "You can't message yourself" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, other._id], $size: 2 },
    }).populate('participants', AUTHOR_FIELDS);

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, other._id],
      });
      await conversation.populate('participants', AUTHOR_FIELDS);
    }

    res.status(201).json({ conversation: serializeConversation(conversation, req.user._id) });
  } catch (err) {
    res.status(500).json({ message: 'Could not start conversation', error: err.message });
  }
}

// GET /api/conversations/:id/messages?page=1
async function getMessages(req, res) {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    if (!conversation.participants.some((p) => String(p) === String(req.user._id))) {
      return res.status(403).json({ message: 'Not a participant in this conversation' });
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 30;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', AUTHOR_FIELDS);

    res.json({
      messages: messages.map(serializeMessage).reverse(),
      page,
      hasMore: messages.length === limit,
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not load messages', error: err.message });
  }
}

// POST /api/conversations/:id/messages   multipart/form-data { text, media[] }
async function sendMessage(req, res) {
  try {
    const text = (req.body.text || '').trim();
    const files = req.files || [];

    if (!text && files.length === 0) {
      return res.status(400).json({ message: 'Message must contain text or media' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    if (!conversation.participants.some((p) => String(p) === String(req.user._id))) {
      return res.status(403).json({ message: 'Not a participant in this conversation' });
    }

    // Upload each file to Cloudinary
    const media = [];
    for (const file of files) {
      const resourceType = file.detectedMediaType === 'video' ? 'video' : 'image';
      try {
        const result = await uploadBufferToCloudinary(file.buffer, resourceType);
        media.push({
          mediaUrl: result.secure_url,
          mediaType: resourceType,
        });
      } catch (uploadErr) {
        console.error('Cloudinary upload failed for one message file:', uploadErr);
        return res.status(500).json({
          message: 'Could not upload media',
          error: uploadErr.message,
        });
      }
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text,
      media,
    });
    await message.populate('sender', AUTHOR_FIELDS);

    // Update conversation preview text
    const previewText = text || (media.length ? `📎 ${media.length} attachment${media.length > 1 ? 's' : ''}` : '');
    conversation.lastMessageText = previewText;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    const serialized = serializeMessage(message);

    const io = req.app.get('io');
    const recipientId = conversation.participants.find(
      (p) => String(p) !== String(req.user._id)
    );
    if (io && recipientId) {
      io.to(String(recipientId)).emit('new_message', serialized);
    }

    res.status(201).json({ message: serialized });
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ message: 'Could not send message', error: err.message });
  }
}

module.exports = { getConversations, getOrCreateConversation, getMessages, sendMessage };