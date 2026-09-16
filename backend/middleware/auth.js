const jwt = require('jsonwebtoken');
const { findUserById, sanitizeUser } = require('../data/store');

async function protect(req, res, next) {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const user = findUserById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = sanitizeUser(user);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

const allow = (...roles) => (req, res, next) => roles.includes(req.user.role)
  ? next() : res.status(403).json({ message: 'Access denied' });

module.exports = { protect, allow };
