const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Made optional so users can send media-only messages without text
    text: { type: String, maxlength: 1000, default: '' },
    // Array of media attachments for images and videos
    media: [
      {
        mediaUrl: { type: String, required: true },
        mediaType: { type: String, enum: ['image', 'video'], required: true },
      },
    ],
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);