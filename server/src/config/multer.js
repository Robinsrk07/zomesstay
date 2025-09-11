const path = require('path');
const fs = require('fs');
const multer = require('multer');

const UPLOAD_BASE = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_BASE, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const t = file.mimetype;
    const sub = t.startsWith('image/') ? 'images' : t.startsWith('video/') ? 'videos' : 'other';
    const dir = path.join(UPLOAD_BASE, sub);
    fs.mkdirSync(dir, { recursive: true });
    // Store the subdirectory in the file object for later use in the controller
    file.subdirectory = sub;
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    const filename = `${Date.now()}_${base}${ext}`;
    // Store the full relative path in the file object
    file.relativePath = path.join(file.subdirectory, filename).replace(/\\/g, '/');
    cb(null, filename);
  }
});

const ALLOWED_IMAGES = new Set(['image/jpeg','image/png','image/webp','image/gif']);
const ALLOWED_VIDEOS = new Set(['video/mp4','video/webm','video/quicktime','video/x-matroska']);

const imageFilter = (req, file, cb) =>
  ALLOWED_IMAGES.has(file.mimetype) ? cb(null, true) : cb(new Error('Only image files are allowed'));

const videoFilter = (req, file, cb) =>
  ALLOWED_VIDEOS.has(file.mimetype) ? cb(null, true) : cb(new Error('Only video files are allowed'));

const mediaFilter = (req, file, cb) =>
  (ALLOWED_IMAGES.has(file.mimetype) || ALLOWED_VIDEOS.has(file.mimetype))
    ? cb(null, true)
    : cb(new Error('Only image or video files are allowed'));

const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5MB
  fileFilter: imageFilter
});

const uploadVideo = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024, files: 1 }, // 200MB
  fileFilter: videoFilter
});

const uploadMedia = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024, files: 30 },
  fileFilter: mediaFilter
});

// Helper: only run Multer for multipart requests (file optional)
const isMultipart = (req) => (req.headers['content-type'] || '').startsWith('multipart/form-data');

module.exports = { uploadImage, uploadVideo, uploadMedia, isMultipart, UPLOAD_BASE };
