const Comment = require('../models/Comment');
const Post = require('../models/Post');
const notify = require('../utils/notify');

function serializeComment(comment) {
  return {
    id: comment._id,
    text: comment.text,
    createdAt: comment.createdAt,
    author: comment.author && {
      id: comment.author._id,
      displayName: comment.author.displayName,
      username: comment.author.username,
      avatarUrl: comment.author.avatarUrl,
    },
  };
}

// POST /api/posts/:id/comments
async function createComment(req, res) {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      text: text.trim(),
    });
    await comment.populate('author', 'displayName username avatarUrl');

    post.commentCount += 1;
    await post.save();

    await notify({ recipient: post.author, actor: req.user._id, type: 'comment', post: post._id });

    res.status(201).json({ comment: serializeComment(comment), commentCount: post.commentCount });
  } catch (err) {
    res.status(500).json({ message: 'Could not add comment', error: err.message });
  }
}

// GET /api/posts/:id/comments?page=1&limit=20
async function getComments(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ post: req.params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'displayName username avatarUrl');

    res.json({
      comments: comments.map(serializeComment),
      page,
      hasMore: comments.length === limit,
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not load comments', error: err.message });
  }
}

// DELETE /api/comments/:id
async function deleteComment(req, res) {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    if (String(comment.author) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    await comment.deleteOne();
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });

    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete comment', error: err.message });
  }
}

module.exports = { createComment, getComments, deleteComment };
