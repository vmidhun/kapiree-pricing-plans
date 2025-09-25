const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err); // Added logging
      return res.status(403).json({ message: 'Invalid or expired token', error: err.message }); // Include error message
    }
    req.user = user;
    next();
  });
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
      next();
    });
  } else {
    next();
  }
};

// Middleware to check if user has required permissions
const authorize = (requiredPermissions) => (req, res, next) => {
  if (!req.user || !req.user.permissions) {
    return res.status(403).json({ message: 'Forbidden: User not authenticated or no permissions found.' });
  }

  const userPermissions = req.user.permissions;
  const hasPermission = requiredPermissions.some(permission => userPermissions.includes(permission));

  if (hasPermission) {
    next();
  } else {
    return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  authorize,
};
