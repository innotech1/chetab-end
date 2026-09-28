const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    // Always exactly 2 users for now — group DMs aren't supported yet.
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessageText: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
