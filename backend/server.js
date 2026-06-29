const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/db');
const { authenticate, requireRole } = require('./middleware/auth');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

// Serve static assets if they exist
const fs = require('fs');
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

// Connect to Database (MongoDB)
connectDB();

// Bind API Routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin/users', require('./routes/users'));
app.use('/api/feedback', authenticate, requireRole('admin', 'teacher', 'parent'), require('./routes/feedback'));
app.use('/api/meeting', authenticate, requireRole('admin', 'teacher', 'parent'), require('./routes/meeting'));
app.use('/api/analytics', authenticate, requireRole('admin'), require('./routes/analytics'));
app.use('/api/dashboard', authenticate, requireRole('admin'), require('./routes/dashboard'));
app.use('/api/sentiment', authenticate, requireRole('admin'), require('./routes/sentiment'));
app.use('/api/report', authenticate, requireRole('admin'), require('./routes/report'));
app.use('/api/notices', authenticate, requireRole('admin', 'teacher'), require('./routes/notice'));

// Root Status Endpoint
app.get('/api/status', (req, res) => {
  const { getIsConnected, getDbType } = require('./config/db');
  let dbStatus = 'Fallback Mode (Local mockStore JSON)';
  if (getIsConnected()) {
    if (getDbType() === 'postgres') {
      dbStatus = 'Connected (Supabase PostgreSQL)';
    } else if (getDbType() === 'mongodb') {
      dbStatus = 'Connected (MongoDB)';
    }
  }
  const fs = require('fs');
  let parentContents = [];
  try {
    parentContents = fs.readdirSync(path.join(__dirname, '..'));
  } catch (err) {
    parentContents = [err.message];
  }
  res.status(200).json({
    status: 'Online',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    version: "v4-debug-paths",
    parentContents
  });
});

// Catch-all route to serve the React SPA frontend if it exists
if (fs.existsSync(frontendDistPath)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
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
