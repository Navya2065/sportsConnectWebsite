const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage for images
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith('image/');
    return {
      folder: 'sportsconnect',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: isImage ? [{ width: 1080, crop: 'limit', quality: 'auto' }] : [],
      resource_type: 'auto',
    };
  },
});

// Local disk storage for non-image files (pdf, doc, mp4 etc)
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|mp4|mov/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    file.mimetype === 'application/pdf' ||
    file.mimetype.includes('document');

  if (extname || mimetype) {
    return cb(null, true);
  }
  cb(new Error('File type not supported'));
};

// Use Cloudinary for images, disk for other files
const getStorage = (req, file) => {
  if (file.mimetype.startsWith('image/')) {
    return cloudinaryStorage;
  }
  return diskStorage;
};

// Dynamic storage selector
const dynamicStorage = {
  _handleFile(req, file, cb) {
    const storage = getStorage(req, file);
    storage._handleFile(req, file, cb);
  },
  _removeFile(req, file, cb) {
    const storage = getStorage(req, file);
    storage._removeFile(req, file, cb);
  },
};

const upload = multer({
  storage: dynamicStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});

// Export cloudinary too so we can delete images if needed
module.exports = upload;
module.exports.cloudinary = cloudinary;