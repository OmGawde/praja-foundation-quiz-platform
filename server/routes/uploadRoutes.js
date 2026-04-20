const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { uploadMedia } = require('../middleware/upload');

// POST /api/upload/media - Upload media file
router.post('/media', auth, uploadMedia.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
