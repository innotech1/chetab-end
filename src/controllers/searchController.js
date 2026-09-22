const User = require('../models/User');
const Post = require('../models/Post');
const { serializePost } = require('./postController');

// GET /api/search?q=...
async function search(req, res) {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json({ users: [], posts: [] });
    }

    // Escape regex special characters so a search like "c++" doesn't break the query
    const safeQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(safeQuery, 'i');

    const [users, posts] = await Promise.all([
      User.find({ $or: [{ username: pattern }, { displayName: pattern }] })
        .limit(10)
        .select('displayName username avatarUrl bio'),
      Post.find({ text: pattern })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('author', 'displayName username avatarUrl'),
    ]);

    res.json({
      users: users.map((u) => ({
        id: u._id,
        displayName: u.displayName,
        username: u.username,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
      })),
      posts: posts.map((p) => serializePost(p)),
    });
  } catch (err) {
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
}

module.exports = { search };
