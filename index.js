const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const articleRoutes = require('./routes/articles');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/', (req, res) => {
  res.send('SportsNews API is running ✅');
});
app.use('/articles', articleRoutes);
app.use('/auth', authRoutes);

// MongoDB connection
mongoose.connect('mongodb+srv://Timovic10:Fugason94@cluster0.ygztgbg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Start server
app.listen(3001, () => console.log('🚀 Server running at http://localhost:3001'));
