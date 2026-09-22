const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, maxlength: 500 },
    mediaUrl: { type: String, default: '' },
    mediaType: { type: String, enum: ['none', 'image', 'video'], default: 'none' },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    repostCount: { type: Number, default: 0 },
    // If this post is a repost of another, point at the original. Null for original posts.
    repostOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
  },
  { timestamps: true }
);

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ mediaType: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
