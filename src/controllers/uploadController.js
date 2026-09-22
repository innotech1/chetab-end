const cloudinary = require('../config/cloudinary');
const { IMAGE_MIME } = require('../middleware/upload');

// POST /api/upload  (multipart/form-data, field name: "file")
async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const isVideo = !IMAGE_MIME.includes(req.file.mimetype);
    const resourceType = isVideo ? 'video' : 'image';

    // Stream the buffer to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'cheta',
          resource_type: resourceType,
          // Auto-optimize image quality + format
          transformation: isVideo
            ? [{ quality: 'auto' }]
            : [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (err, out) => (err ? reject(err) : resolve(out))
      );
      stream.end(req.file.buffer);
    });

    res.json({
      url: result.secure_url,
      type: isVideo ? 'video' : 'image',
      width: result.width,
      height: result.height,
      duration: result.duration || null,
    });
  } catch (err) {
    console.error('upload error', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
}

module.exports = { uploadFile };