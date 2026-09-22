const Post = require('../models/Post');
const Like = require('../models/Like');
const { serializePost, AUTHOR_FIELDS } = require('./postController');

// GET /api/videos?page=1&limit=10
// A public discovery feed of video posts from ALL users (not just people you
// follow) — this is deliberately different from /api/feed, since a
// follows-only video feed would be nearly empty on a small/new network.
async function getVideoFeed(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 30);
    const skip = (page - 1) * limit;

    // Reposts of videos ARE eligible (repostOf populated below resolves to
    // the original), but a repost wrapper's own mediaType is always 'none',
    // so we match on either the post's own mediaType or its original's.
    const posts = await Post.find({ mediaType: 'video' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', AUTHOR_FIELDS)
      .populate({ path: 'repostOf', populate: { path: 'author', select: AUTHOR_FIELDS } });

    const postIds = posts.map((p) => p._id);
    const likes = req.user
      ? await Like.find({ user: req.user._id, post: { $in: postIds } })
      : [];
    const likedSet = new Set(likes.map((l) => String(l.post)));

    res.json({
      posts: posts.map((p) => serializePost(p, likedSet)),
      page,
      hasMore: posts.length === limit,
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not load video feed', error: err.message });
  }
}

module.exports = { getVideoFeed };
