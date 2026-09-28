const cloudinary = require('../config/cloudinary');

function uploadBufferToCloudinary(buffer, resourceType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType, folder: 'cheta' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

// POST /api/media/upload  (multipart/form-data, field name: "file")
async function uploadMedia(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded (expected field "file")' });
  }

  // Set by the upload middleware's fileFilter, which already resolved this
  // (falling back to file extension if the client's mimetype was generic/wrong).
  const mediaType = req.file.detectedMediaType || 'none';

  try {
    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      mediaType === 'video' ? 'video' : 'image'
    );
    res.status(201).json({ url: result.secure_url, mediaType });
  } catch (err) {
    res.status(500).json({ message: 'Upload to storage failed', error: err.message });
  }
}

module.exports = { uploadMedia };
