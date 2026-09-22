const express = require('express');
const multer = require('multer');
const path = require('path');
const { sendMessage } = require('../controllers/messageController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10 GB limit
});

router.post('/', requireAuth, upload.array('media', 100), sendMessage);

module.exports = router;