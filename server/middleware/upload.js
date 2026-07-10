const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// === Allowed file types with extensions and MIME types ===
const ALLOWED_IMAGE = {
  mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  maxSize: 10 * 1024 * 1024 // 10 MB
};

const ALLOWED_AUDIO = {
  mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-wav', 'audio/wave'],
  extensions: ['.mp3', '.wav', '.ogg'],
  maxSize: 10 * 1024 * 1024 // 10 MB
};

const ALLOWED_VIDEO = {
  mimeTypes: ['video/mp4', 'video/webm', 'video/ogg'],
  extensions: ['.mp4', '.webm', '.ogv'],
  maxSize: 25 * 1024 * 1024 // 25 MB
};

// Combine all allowed types for the file filter
const ALL_ALLOWED_MIMES = [
  ...ALLOWED_IMAGE.mimeTypes,
  ...ALLOWED_AUDIO.mimeTypes,
  ...ALLOWED_VIDEO.mimeTypes
];

const ALL_ALLOWED_EXTENSIONS = [
  ...ALLOWED_IMAGE.extensions,
  ...ALLOWED_AUDIO.extensions,
  ...ALLOWED_VIDEO.extensions
];

// Media upload storage (images, audio, video)
const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const mediaFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Check both MIME type AND file extension to prevent spoofing
  if (!ALL_ALLOWED_MIMES.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type "${file.mimetype}". Only images (JPEG, PNG, GIF, WebP), audio (MP3, WAV, OGG), and video (MP4, WebM, OGV) are allowed.`), false);
  }

  if (!ALL_ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Invalid file extension "${ext}". Allowed extensions: ${ALL_ALLOWED_EXTENSIONS.join(', ')}`), false);
  }

  // Cross-validate: extension must match MIME type category
  const isImageMime = ALLOWED_IMAGE.mimeTypes.includes(file.mimetype);
  const isImageExt = ALLOWED_IMAGE.extensions.includes(ext);
  const isAudioMime = ALLOWED_AUDIO.mimeTypes.includes(file.mimetype);
  const isAudioExt = ALLOWED_AUDIO.extensions.includes(ext);
  const isVideoMime = ALLOWED_VIDEO.mimeTypes.includes(file.mimetype);
  const isVideoExt = ALLOWED_VIDEO.extensions.includes(ext);

  if ((isImageMime && !isImageExt) || (isAudioMime && !isAudioExt) || (isVideoMime && !isVideoExt)) {
    return cb(new Error('File extension does not match its content type. Upload rejected.'), false);
  }

  // Store detected category for size validation in the route handler
  if (isVideoMime) req._uploadCategory = 'video';
  else if (isAudioMime) req._uploadCategory = 'audio';
  else req._uploadCategory = 'image';

  cb(null, true);
};

// Use the largest limit (25MB for video) as the multer hard cap;
// per-category limits are enforced after upload in the route handler
const uploadMedia = multer({
  storage: mediaStorage,
  fileFilter: mediaFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB hard cap (video max)
});

// Export category limits so the route can enforce per-type limits
const MEDIA_LIMITS = { ALLOWED_IMAGE, ALLOWED_AUDIO, ALLOWED_VIDEO };

// Excel upload storage
const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `excel_${uuidv4()}${ext}`);
  }
});

const excelFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ];
  const allowedExts = ['.xlsx', '.xls', '.csv'];

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed.'), false);
  }
};

const uploadExcel = multer({
  storage: excelStorage,
  fileFilter: excelFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

module.exports = { uploadMedia, uploadExcel, MEDIA_LIMITS };
