const authService = require('../services/authService');

const auth = (req, res, next) => {
  try {
    console.log('Auth middleware called for', req.method, req.path, 'next type:', typeof next);
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = authService.verifyToken(token);
    req.userId = decoded.id;
    console.log('Auth successful, calling next()');
    
    // Ensure next is a function before calling it
    if (typeof next === 'function') {
      next();
    }
  } catch (error) {
    console.error('Auth middleware error:', error.message, error.stack);
    // Ensure we don't call next() after sending a response
    if (!res.headersSent) {
      res.status(401).json({ message: 'Token is not valid' });
    }
  }
};

module.exports = auth;
