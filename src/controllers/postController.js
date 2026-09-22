const Post = require('../models/Post');
const Like = require('../models/Like');

const AUTHOR_FIELDS = 'displayName username avatarUrl';

/**
 * Serializes a post for the client. If `post` is itself a repost wrapper
 * (post.repostOf is populated), the client is given the ORIGINAL post's id,
 * content, and stats — plus `repostedBy`/`repostedAt` describing the repost.
 */
function serializePost(post, viewerLikedSet, viewerRepostedSet) {
  const isRepost = post.repostOf && typeof post.repostOf === 'object';
  const target = isRepost ? post.repostOf : post;
  const targetIdStr = String(target._id);

  return {
    id: target._id,
    text: target.text,
    // Return array of media objects, or backward-compatible single media values if present
    media: target.media && target.media.length > 0 
      ? target.media 
      : (target.mediaUrl ? [{ mediaUrl: target.mediaUrl, mediaType: target.mediaType }] : []),
    likeCount: target.likeCount,
    commentCount: target.commentCount,
    repostCount: target.repostCount,
    createdAt: target.createdAt,
    author: target.author && {
      id: target.author._id,
      displayName: target.author.displayName,
      username: target.author.username,
      avatarUrl: target.author.avatarUrl,
    },
    likedByViewer: viewerLikedSet ? viewerLikedSet.has(targetIdStr) : undefined,
    repostedByViewer: viewerRepostedSet ? viewerRepostedSet.has(targetIdStr) : undefined,
    repostedBy: isRepost
      ? { id: post.author._id, displayName: post.author.displayName, username: post.author.username }
      : undefined,
    repostedAt: isRepost ? post.createdAt : undefined,
  };
}

// POST /api/posts
async function createPost(req, res) {
  try {
    const { text } = req.body;
    const files = req.files || [];

    if ((!text || !text.trim()) && files.length === 0) {
      return res.status(400).json({ message: 'Post text or media is required' });
    }

    // Separate media into image and video groups
    const images = files.filter((f) => f.mimetype.startsWith('image/'));
    const videos = files.filter((f) => f.mimetype.startsWith('video/'));

    // Count Caps Check
    if (images.length > 100) {
      return res.status(400).json({ message: 'Maximum 100 images allowed per post.' });
    }
    if (videos.length > 10) {
      return res.status(400).json({ message: 'Maximum 10 videos allowed per post.' });
    }

    // Byte Limits: 5 GB total for images, 10 GB total for videos
    const FIVE_GB = 5 * 1024 * 1024 * 1024;
    const TEN_GB = 10 * 1024 * 1024 * 1024;

    const totalImgSize = images.reduce((sum, f) => sum + f.size, 0);
    const totalVidSize = videos.reduce((sum, f) => sum + f.size, 0);

    if (totalImgSize > FIVE_GB) {
      return res.status(400).json({ message: 'Total image size exceeds 5 GB limit.' });
    }
    if (totalVidSize > TEN_GB) {
      return res.status(400).json({ message: 'Total video size exceeds 10 GB limit.' });
    }

    // Structure media array for schema storage
    const mediaItems = files.map((file) => ({
      mediaUrl: `/uploads/${file.filename}`,
      mediaType: file.mimetype.startsWith('video/') ? 'video' : 'image',
    }));

    const post = await Post.create({
      author: req.user._id,
      text: text ? text.trim() : '',
      media: mediaItems,
    });

    await post.populate('author', AUTHOR_FIELDS);

    res.status(201).json({ post: serializePost(post) });
  } catch (err) {
    res.status(500).json({ message: 'Could not create post', error: err.message });
  }
}

// GET /api/posts/:id
async function getPost(req, res) {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', AUTHOR_FIELDS)
      .populate({ path: 'repostOf', populate: { path: 'author', select: AUTHOR_FIELDS } });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    let likedSet;
    let repostedSet;
    if (req.user) {
      const targetId = post.repostOf ? post.repostOf._id : post._id;
      const like = await Like.findOne({ user: req.user._id, post: targetId });
      likedSet = new Set(like ? [String(targetId)] : []);

      const repost = await Post.findOne({ author: req.user._id, repostOf: targetId });
      repostedSet = new Set(repost ? [String(targetId)] : []);
    }

    res.json({ post: serializePost(post, likedSet, repostedSet) });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch post', error: err.message });
  }
}

// DELETE /api/posts/:id
async function deletePost(req, res) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (String(post.author) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }

    if (post.repostOf) {
      await Post.findByIdAndUpdate(post.repostOf, { $inc: { repostCount: -1 } });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete post', error: err.message });
  }
}

// GET /api/users/:username/posts
async function getUserPosts(req, res) {
  try {
    const User = require('../models/User');
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate('author', AUTHOR_FIELDS)
      .populate({ path: 'repostOf', populate: { path: 'author', select: AUTHOR_FIELDS } })
      .limit(50);

    res.json({ posts: posts.map((p) => serializePost(p)) });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch posts', error: err.message });
  }
}

module.exports = { createPost, getPost, deletePost, getUserPosts, serializePost, AUTHOR_FIELDS };