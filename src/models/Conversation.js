const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    // Always exactly 2 users for now — group DMs aren't supported yet.
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    
    lastMessageText: { type: String, default: '' },
    lastMessageSender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastMessageAt: { type: Date, default: Date.now },

    // Track unread message count per user ID e.g., { "userId123": 2 }
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

// Compound index for fast lookup and chronological sorting per participant
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);