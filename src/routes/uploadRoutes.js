const express = require('express');
const { upload } = require('../middleware/upload');
const { uploadFile } = require('../controllers/uploadController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, upload.single('file'), uploadFile);

module.exports = router;