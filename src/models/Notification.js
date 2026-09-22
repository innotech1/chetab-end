const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // Who this notification is for
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Who caused it (the liker, commenter, or new follower)
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['like', 'comment', 'follow', 'repost'], required: true },
    // Present for 'like' and 'comment', absent for 'follow'
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
