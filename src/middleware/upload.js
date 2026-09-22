const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

const ALLOWED_TYPES = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'video/mp4': 'video',
  'video/quicktime': 'video',
  'video/webm': 'video',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const unique = crypto.randomBytes(16).toString('hex');
    cb(null, `${Date.now()}-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  // Generous enough for a short video clip; images will be far under this.
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES[file.mimetype]) {
      return cb(new Error('Unsupported file type. Use JPEG/PNG/GIF/WebP images or MP4/MOV/WebM videos.'));
    }
    cb(null, true);
  },
});

function mediaTypeFromMimetype(mimetype) {
  return ALLOWED_TYPES[mimetype] || 'none';
}

module.exports = { upload, mediaTypeFromMimetype, UPLOADS_DIR };
