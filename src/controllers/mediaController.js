const { mediaTypeFromMimetype } = require('../middleware/upload');

// POST /api/media/upload  (multipart/form-data, field name: "file")
async function uploadMedia(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded (expected field "file")' });
  }

  const mediaType = mediaTypeFromMimetype(req.file.mimetype);
  // req.get('host') reflects whatever host:port the client actually connected
  // to (e.g. localhost:5000 via adb reverse), so the returned URL is directly
  // usable by the app that just uploaded the file.
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  res.status(201).json({ url, mediaType });
}

module.exports = { uploadMedia };
