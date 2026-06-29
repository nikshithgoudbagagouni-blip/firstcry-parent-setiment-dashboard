const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getIsConnected } = require('../config/db');
const { readStore } = require('../services/userService');

const JWT_SECRET = process.env.JWT_SECRET || 'firstcry-development-secret-change-before-production';


async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'firstcry-intellitots',
      audience: 'firstcry-portals'
    });

    let userObj = null;
    if (getIsConnected()) {
      userObj = await User.findById(req.user.sub);
    } else {
      userObj = readStore().users.find(u => u.id === req.user.sub);
    }

    if (!userObj || userObj.status === 'disabled') {
      return res.status(401).json({ error: 'Account suspended or unavailable.' });
    }

    req.currentUser = userObj;
    return next();
  } catch (_error) {
    return res.status(401).json({ error: 'Session expired or invalid.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to access this resource.' });
    }
    return next();
  };
}

function signUser(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email, name: user.name },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '8h', issuer: 'firstcry-intellitots', audience: 'firstcry-portals' }
  );
}

module.exports = { authenticate, requireRole, signUser };
