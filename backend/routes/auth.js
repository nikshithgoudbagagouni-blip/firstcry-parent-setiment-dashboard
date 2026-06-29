const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate, signUser } = require('../middleware/auth');
const { readStore, writeStore, publicUser, verifyPassword, hashPassword } = require('../services/userService');
const User = require('../models/User');
const { getIsConnected } = require('../config/db');

const router = express.Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many sign-in attempts. Please try again later.' } });

router.post('/login', loginLimiter, async (req, res) => {
  let email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password || password.length > 128) return res.status(400).json({ error: 'Email and password are required.' });

  // Map role name shortcuts to correct emails
  if (email === 'parent') email = 'rahul.sharma@example.com';
  else if (email === 'teacher') email = 'priya@firstcry.com';
  else if (email === 'admin') email = 'admin@firstcry.com';

  let user = null;
  if (getIsConnected()) {
    user = await User.findOne({ email });
  } else {
    const data = readStore();
    user = data.users.find(item => item.email.toLowerCase() === email);
  }

  if (!user || !(await verifyPassword(user, password))) return res.status(401).json({ error: 'Invalid email or password.' });
  if (user.status !== 'active') return res.status(403).json({ error: 'This account is disabled. Contact the administrator.' });

  const now = new Date().toISOString();
  const forwarded = req.headers['x-forwarded-for'];
  const ipAddress = String(Array.isArray(forwarded) ? forwarded[0] : forwarded || req.ip || '').split(',')[0].trim();
  
  user.lastLogin = now;
  user.loginHistory = [{ timestamp: now, ipAddress, userAgent: req.get('user-agent') || 'Unknown', result: 'Success' }, ...(user.loginHistory || [])].slice(0, 30);
  user.activityLogs = [{ timestamp: now, action: 'Signed in', actor: user.name }, ...(user.activityLogs || [])].slice(0, 50);
  
  if (!user.password.startsWith('$2')) {
    user.password = await hashPassword(password);
  }

  if (getIsConnected()) {
    await user.save();
  } else {
    const data = readStore();
    const idx = data.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      data.users[idx] = user;
    }
    writeStore(data);
  }

  return res.json({ token: signUser(user), user: publicUser(user) });
});

router.get('/me', authenticate, (req, res) => {
  return res.json({ user: publicUser(req.currentUser) });
});

router.post('/logout', authenticate, async (req, res) => {
  const user = req.currentUser;
  if (user) {
    user.activityLogs = [{ timestamp: new Date().toISOString(), action: 'Signed out', actor: user.name }, ...(user.activityLogs || [])].slice(0, 50);
    if (getIsConnected()) {
      await user.save();
    } else {
      const data = readStore();
      const idx = data.users.findIndex(u => u.id === user.id);
      if (idx >= 0) {
        data.users[idx] = user;
      }
      writeStore(data);
    }
  }
  return res.status(204).end();
});

module.exports = router;
