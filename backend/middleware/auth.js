const jwt = require('jsonwebtoken');
const { readStore } = require('../services/userService');

const JWT_SECRET = process.env.JWT_SECRET || 'firstcry-development-secret-change-before-production';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production.');
}

function authenticate(req, res, next) {
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
