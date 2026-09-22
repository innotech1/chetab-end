const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { createPost, getPost, deletePost } = require('../controllers/postController');
const { likePost, unlikePost } = require('../controllers/likeController');
const { createComment, getComments } = require('../controllers/commentController');
const { createRepost, deleteRepost } = require('../controllers/repostController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// 1. Ensure the uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Configure Storage Engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '';
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// 3. File Filter for Images and Videos
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    // Videos
    'video/mp4',
    'video/quicktime', // MOV
    'video/x-matroska', // MKV
    'video/webm'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type! Only image and video files are allowed.'), false);
  }
};

// 4. Configure Multer (Supports large file uploads up to 10GB per file)
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10 GB per file limit
  fileFilter: fileFilter
});

// 5. Attach upload.array('media', 100) to accept up to 100 items per post
router.post('/', requireAuth, upload.array('media', 100), createPost);

// Other post routes
router.get('/:id', requireAuth, getPost);
router.delete('/:id', requireAuth, deletePost);
router.post('/:id/like', requireAuth, likePost);
router.delete('/:id/like', requireAuth, unlikePost);
router.post('/:id/comments', requireAuth, createComment);
router.get('/:id/comments', requireAuth, getComments);
router.post('/:id/repost', requireAuth, createRepost);
router.delete('/:id/repost', requireAuth, deleteRepost);

module.exports = router;