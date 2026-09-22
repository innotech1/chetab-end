const express = require('express');
const { upload } = require('../middleware/upload');
const { uploadMedia } = require('../controllers/mediaController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Multer's error (bad file type, too large) surfaces via the error-handling
// middleware in server.js if upload.single throws — Express 4 passes
// synchronous multer errors to next(err) automatically.
router.post('/upload', requireAuth, upload.single('file'), uploadMedia);

module.exports = router;
