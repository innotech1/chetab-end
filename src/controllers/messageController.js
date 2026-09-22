const Message = require('../models/Message');

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, text } = req.body;
    const files = req.files || [];

    if ((!text || !text.trim()) && files.length === 0) {
      return res.status(400).json({ message: 'Message text or media is required' });
    }

    const images = files.filter((f) => f.mimetype.startsWith('image/'));
    const videos = files.filter((f) => f.mimetype.startsWith('video/'));

    if (images.length > 100) {
      return res.status(400).json({ message: 'Maximum 100 images allowed per message.' });
    }
    if (videos.length > 10) {
      return res.status(400).json({ message: 'Maximum 10 videos allowed per message.' });
    }

    const mediaItems = files.map((file) => ({
      mediaUrl: `/uploads/${file.filename}`,
      mediaType: file.mimetype.startsWith('video/') ? 'video' : 'image',
    }));

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      text: text ? text.trim() : '',
      media: mediaItems,
    });

    await message.populate('sender', 'displayName username avatarUrl');

    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ message: 'Could not send message', error: err.message });
  }
};