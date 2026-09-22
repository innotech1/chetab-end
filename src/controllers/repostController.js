const Post = require('../models/Post');
const notify = require('../utils/notify');
const { serializePost, AUTHOR_FIELDS } = require('./postController');

// POST /api/posts/:id/repost
async function createRepost(req, res) {
  try {
    const original = await Post.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ message: 'Post not found' });
    }
    // Repost the original post, not a repost-of-a-repost — keeps the chain flat.
    const originalId = original.repostOf || original._id;

    const existing = await Post.findOne({ author: req.user._id, repostOf: originalId });
    if (existing) {
      return res.status(409).json({ message: 'Already reposted' });
    }

    const repost = await Post.create({
      author: req.user._id,
      text: '',
      repostOf: originalId,
    });

    await Post.findByIdAndUpdate(originalId, { $inc: { repostCount: 1 } });

    // Populate AFTER incrementing, so the returned repostCount is already up to date
    await repost.populate('author', AUTHOR_FIELDS);
    await repost.populate({ path: 'repostOf', populate: { path: 'author', select: AUTHOR_FIELDS } });

    const originalAuthor = await Post.findById(originalId).select('author');
    await notify({
      recipient: originalAuthor.author,
      actor: req.user._id,
      type: 'repost',
      post: originalId,
    });

    res.status(201).json({ post: serializePost(repost) });
  } catch (err) {
    res.status(500).json({ message: 'Could not repost', error: err.message });
  }
}

// DELETE /api/posts/:id/repost — undo your own repost of this post
async function deleteRepost(req, res) {
  try {
    const original = await Post.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ message: 'Post not found' });
    }
    const originalId = original.repostOf || original._id;

    const repost = await Post.findOneAndDelete({ author: req.user._id, repostOf: originalId });
    if (!repost) {
      return res.status(404).json({ message: 'You have not reposted this' });
    }

    await Post.findByIdAndUpdate(originalId, { $inc: { repostCount: -1 } });

    res.json({ message: 'Repost removed' });
  } catch (err) {
    res.status(500).json({ message: 'Could not undo repost', error: err.message });
  }
}

module.exports = { createRepost, deleteRepost };
