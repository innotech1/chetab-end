const User = require('../models/User');
const Follow = require('../models/Follow');
const notify = require('../utils/notify');

// GET /api/users/:username
async function getUserProfile(req, res) {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let isFollowing = false;
    if (req.user) {
      const follow = await Follow.findOne({ follower: req.user._id, following: user._id });
      isFollowing = !!follow;
    }

    res.json({ user: { ...user.toPublicJSON(), isFollowing } });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch user', error: err.message });
  }
}

// POST /api/users/:username/follow
async function followUser(req, res) {
  try {
    const target = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!target) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (String(target._id) === String(req.user._id)) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const existing = await Follow.findOne({ follower: req.user._id, following: target._id });
    if (existing) {
      return res.status(409).json({ message: 'Already following' });
    }

    await Follow.create({ follower: req.user._id, following: target._id });
    await Promise.all([
      User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: 1 } }),
      User.findByIdAndUpdate(target._id, { $inc: { followerCount: 1 } }),
    ]);

    await notify({ recipient: target._id, actor: req.user._id, type: 'follow' });

    res.status(201).json({ message: 'Followed' });
  } catch (err) {
    res.status(500).json({ message: 'Could not follow user', error: err.message });
  }
}

// DELETE /api/users/:username/follow
async function unfollowUser(req, res) {
  try {
    const target = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!target) {
      return res.status(404).json({ message: 'User not found' });
    }

    const removed = await Follow.findOneAndDelete({
      follower: req.user._id,
      following: target._id,
    });
    if (!removed) {
      return res.status(404).json({ message: 'You are not following this user' });
    }

    await Promise.all([
      User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: -1 } }),
      User.findByIdAndUpdate(target._id, { $inc: { followerCount: -1 } }),
    ]);

    res.json({ message: 'Unfollowed' });
  } catch (err) {
    res.status(500).json({ message: 'Could not unfollow user', error: err.message });
  }
}

module.exports = { getUserProfile, followUser, unfollowUser };
