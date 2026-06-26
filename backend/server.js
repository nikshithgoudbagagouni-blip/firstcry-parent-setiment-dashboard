const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB } = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
}

// Connect to Database (MongoDB)
connectDB();

// Basic Authenticated Route handler
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // Demo fallback user authentication matching our seed data
  if (email.toLowerCase() === 'admin@firstcry.com' && password === 'admin') {
    return res.status(200).json({
      message: 'Login successful',
      token: 'mock-jwt-token-admin',
      user: { id: 'u1', name: 'Center Head Administrator', email: 'admin@firstcry.com', role: 'admin' }
    });
  } else if (email.toLowerCase() === 'priya@firstcry.com' && password === 'teacher') {
    return res.status(200).json({
      message: 'Login successful',
      token: 'mock-jwt-token-teacher',
      user: { id: 'u2', name: 'Class Teacher Priya', email: 'priya@firstcry.com', role: 'teacher' }
    });
  }

  return res.status(401).json({ error: 'Invalid email or password.' });
});

// Bind API Routers
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/meeting', require('./routes/meeting'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/sentiment', require('./routes/sentiment'));
app.use('/api/report', require('./routes/report'));
app.use('/api/notices', require('./routes/notice'));

// Root Status Endpoint
app.get('/api/status', (req, res) => {
  const mongoose = require('mongoose');
  res.status(200).json({
    status: 'Online',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'Connected (MongoDB)' : 'Fallback Mode (Local mockStore JSON)'
  });
});

// Catch-all route to serve the React SPA frontend in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('FirstCry Intellitots Sentiment Analysis Express Server is running.');
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server successfully fired up on port ${PORT}`);
  console.log(`📡 Status Endpoint: http://localhost:${PORT}/api/status`);
});
