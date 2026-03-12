const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: missing token' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'Server misconfiguration: missing JWT_SECRET' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized: invalid or expired token' });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }

    return next();
  };
}

function ownerOnly(req, res, next) {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!adminEmail) {
    return res.status(500).json({ message: 'Server misconfiguration: missing ADMIN_EMAIL' });
  }

  if (!req.user.email || req.user.email.toLowerCase() !== adminEmail.toLowerCase()) {
    return res.status(403).json({ message: 'Forbidden: owner access only' });
  }

  return next();
}

module.exports = { auth, authorize, ownerOnly };