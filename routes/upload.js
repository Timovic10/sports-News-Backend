const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary'); // ✅ Corrected path

const router = express.Router();

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sports-news-images',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const upload = multer({ storage });

// POST /upload
router.post('/', upload.single('image'), (req, res) => {
  res.json({ url: req.file.path }); // or req.file.path/secure_url
});

module.exports = router;
