const router = require('express').Router();
const fs = require('fs');
const { auth } = require('../middleware/auth');
const { uploadMedia, MEDIA_LIMITS } = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');

// POST /api/upload/media - Upload media file with type-specific size limits
router.post('/media', auth, (req, res) => {
  uploadMedia.single('file')(req, res, async (err) => {
    // Handle multer errors (file too large, invalid type, etc.)
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Maximum upload size is 25 MB for video and 10 MB for image/audio.' });
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Enforce per-type size limits
    const category = req._uploadCategory;
    let maxSize;
    if (category === 'video') maxSize = MEDIA_LIMITS.ALLOWED_VIDEO.maxSize;
    else if (category === 'audio') maxSize = MEDIA_LIMITS.ALLOWED_AUDIO.maxSize;
    else maxSize = MEDIA_LIMITS.ALLOWED_IMAGE.maxSize;

    if (req.file.size > maxSize) {
      // Delete the uploaded file that exceeded the per-type limit
      fs.unlink(req.file.path, () => {});
      const limitMB = Math.round(maxSize / (1024 * 1024));
      return res.status(413).json({
        error: `${category.charAt(0).toUpperCase() + category.slice(1)} files must be under ${limitMB} MB. Your file is ${(req.file.size / (1024 * 1024)).toFixed(1)} MB.`
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    // Upload to Cloudinary if environment variables are set
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        console.log(`☁️ Uploading media file ${req.file.filename} to Cloudinary...`);
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'praja_quiz_media',
          resource_type: 'auto'
        });

        // Clean up the local temporary file
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.error('Failed to delete temp file:', unlinkErr);
        });

        console.log(`✅ Cloudinary upload success: ${result.secure_url}`);
        return res.json({
          url: result.secure_url,
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          provider: 'cloudinary'
        });
      } catch (cloudinaryErr) {
        console.error('❌ Cloudinary upload failed, falling back to local file:', cloudinaryErr.message);
      }
    }

    // Local serving fallback (development or fallback mode)
    res.json({
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      provider: 'local'
    });
  });
});

module.exports = router;
