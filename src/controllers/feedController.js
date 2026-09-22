const Post = require('../models/Post');
const Follow = require('../models/Follow');
const Like = require('../models/Like');
const { serializePost, AUTHOR_FIELDS } = require('./postController');

// GET /api/feed?page=1&limit=20
// Chronological feed: posts from people you follow, plus your own posts.
// Reposts show up as normal Post documents (with repostOf populated), so
// they naturally appear here without any special-casing.
async function getFeed(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const follows = await Follow.find({ follower: req.user._id }).select('following');
    const authorIds = [...follows.map((f) => f.following), req.user._id];

    const posts = await Post.find({ author: { $in: authorIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', AUTHOR_FIELDS)
      .populate({ path: 'repostOf', populate: { path: 'author', select: AUTHOR_FIELDS } });

    const postIds = posts.map((p) => p._id);
    // For reposts, likes/repost-status conceptually apply to the ORIGINAL post,
    // so also check against the ids they point at.
    const originalIds = posts.map((p) => p.repostOf?._id || p._id);
    const relevantIds = [...new Set([...postIds, ...originalIds].map(String))];

    const [likes, reposts] = await Promise.all([
      Like.find({ user: req.user._id, post: { $in: relevantIds } }),
      Post.find({ author: req.user._id, repostOf: { $in: relevantIds } }),
    ]);
    const likedSet = new Set(likes.map((l) => String(l.post)));
    const repostedSet = new Set(reposts.map((r) => String(r.repostOf)));

    res.json({
      posts: posts.map((p) => serializePost(p, likedSet, repostedSet)),
      page,
      hasMore: posts.length === limit,
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not load feed', error: err.message });
  }
}

module.exports = { getFeed };
