const express = require('express');
const multer = require('multer');
const path = require('path');
const Article = require('../models/Article');
const jwtAuth = require('../middleware/auth');

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

/**
 * ✅ GET /articles - Public route to fetch all articles
 */
router.get('/', async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    console.error('❌ Failed to fetch articles:', err);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

/**
 * 🔐 POST /articles - Admin creates an article
 */
router.post('/', jwtAuth, upload.single('image'), async (req, res) => {
  try {
    const { title, category, content } = req.body;

    const article = new Article({
      title,
      category,
      content,
      image: req.file ? `/uploads/${req.file.filename}` : null
    });

    await article.save();
    res.status(201).json(article);
  } catch (err) {
    console.error('❌ Failed to create article:', err);
    res.status(400).json({ error: 'Invalid article data' });
  }
});

module.exports = router;
