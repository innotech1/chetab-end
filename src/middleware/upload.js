const multer = require('multer');
const path = require('path');

const ALLOWED_MIME_TYPES = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'video/mp4': 'video',
  'video/quicktime': 'video',
  'video/webm': 'video',
};

// Fallback by file extension, used whenever the client didn't send a
// specific mimetype (some mobile FormData implementations send a generic
// 'application/octet-stream' instead of the real type — this has already
// changed once due to an Expo SDK update, so don't rely on mimetype alone).
const ALLOWED_EXTENSIONS = {
  '.jpg': 'image',
  '.jpeg': 'image',
  '.png': 'image',
  '.gif': 'image',
  '.webp': 'image',
  '.mp4': 'video',
  '.mov': 'video',
  '.webm': 'video',
};

function detectMediaType(file) {
  const byMimetype = ALLOWED_MIME_TYPES[file.mimetype];
  if (byMimetype) return byMimetype;

  const ext = path.extname(file.originalname || '').toLowerCase();
  return ALLOWED_EXTENSIONS[ext] || null;
}

// Memory storage, not disk: the file buffer goes straight to Cloudinary
// (see mediaController.js) rather than being saved locally. Render's free
// tier has an ephemeral filesystem — anything written to local disk can
// vanish whenever the instance spins down and back up, which is exactly
// what was causing uploaded media to disappear.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  // Generous enough for a short video clip; images will be far under this.
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const mediaType = detectMediaType(file);
    if (!mediaType) {
      return cb(new Error('Unsupported file type. Use JPEG/PNG/GIF/WebP images or MP4/MOV/WebM videos.'));
    }
    // Stash it on the file object so the controller doesn't have to
    // re-derive it (and so it stays consistent with what the filter decided).
    file.detectedMediaType = mediaType;
    cb(null, true);
  },
});

module.exports = { upload };
