const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Base upload directory
const UPLOAD_BASE = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_BASE, { recursive: true });

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const t = file.mimetype;
    const sub = t.startsWith('image/') ? 'images' : t.startsWith('video/') ? 'videos' : 'other';
    const dir = path.join(UPLOAD_BASE, sub);
    fs.mkdirSync(dir, { recursive: true });
    file.subdirectory = sub;
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    const filename = `${Date.now()}_${base}${ext}`;
    
    // Store both filesystem path and URL-friendly path
    file.url = `/uploads/${file.subdirectory}/${filename}`;
    
    cb(null, filename);
  }
});

// Allowed file types
const ALLOWED_IMAGES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/jpg'
]);

const ALLOWED_VIDEOS = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska'
]);

// File filters
const imageFilter = (req, file, cb) => {
  if (ALLOWED_IMAGES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, png, webp, gif)'));
  }
};

const videoFilter = (req, file, cb) => {
  if (ALLOWED_VIDEOS.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed (mp4, webm, mov, mkv)'));
  }
};

const mediaFilter = (req, file, cb) => {
  if (ALLOWED_IMAGES.has(file.mimetype) || ALLOWED_VIDEOS.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image or video files are allowed'));
  }
};

// Multer upload configurations
const uploadImage = multer({
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1 
  },
  fileFilter: imageFilter
});

const uploadVideo = multer({
  storage,
  limits: { 
    fileSize: 200 * 1024 * 1024, // 200MB
    files: 1 
  },
  fileFilter: videoFilter
});

const uploadMedia = multer({
  storage,
  limits: { 
    fileSize: 200 * 1024 * 1024, // 200MB
    files: 30 
  },
  fileFilter: mediaFilter
});

// Helper function for multipart requests
const isMultipart = (req) => (req.headers['content-type'] || '').startsWith('multipart/form-data');

// Export configurations
module.exports = {
  uploadImage,
  uploadVideo,
  uploadMedia,
  isMultipart,
  UPLOAD_BASE
};