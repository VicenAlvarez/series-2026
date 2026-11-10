const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'series2026',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp']
  }
});

const upload = multer({ storage });

module.exports = { upload };