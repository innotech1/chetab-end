const Like = require('../models/Like');
const Post = require('../models/Post');
const notify = require('../utils/notify');

// POST /api/posts/:id/like
async function likePost(req, res) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const existing = await Like.findOne({ user: req.user._id, post: post._id });
    if (existing) {
      return res.status(409).json({ message: 'Already liked' });
    }

    await Like.create({ user: req.user._id, post: post._id });
    post.likeCount += 1;
    await post.save();

    await notify({ recipient: post.author, actor: req.user._id, type: 'like', post: post._id });

    res.status(201).json({ likeCount: post.likeCount });
  } catch (err) {
    res.status(500).json({ message: 'Could not like post', error: err.message });
  }
}

// DELETE /api/posts/:id/like
async function unlikePost(req, res) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const removed = await Like.findOneAndDelete({ user: req.user._id, post: post._id });
    if (!removed) {
      return res.status(404).json({ message: 'You have not liked this post' });
    }

    post.likeCount = Math.max(0, post.likeCount - 1);
    await post.save();

    res.json({ likeCount: post.likeCount });
  } catch (err) {
    res.status(500).json({ message: 'Could not unlike post', error: err.message });
  }
}

module.exports = { likePost, unlikePost };
