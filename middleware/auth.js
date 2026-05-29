/* JWT auth middleware*/

const jwt    = require('jsonwebtoken');
const db     = require('../config/db');
const logger = require('../config/logger');

/**
 * Verify JWT and attach user to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided.' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const rows = await db.query(
      'SELECT id, email, role, is_active, tenant_id FROM users WHERE id = ?',
      [decoded.sub]
    );
    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated.' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    logger.warn('Auth middleware error:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

/**
 * Role-based authorization factory
 * Usage: authorize('admin', 'superadmin')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated.' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
  }
  next();
};

/**
 * Tenant isolation — ensures user belongs to tenant in request context
 */
const tenantGuard = (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'] || req.query.tenant_id;
  if (tenantId && req.user.role !== 'superadmin' && req.user.tenant_id !== tenantId) {
    return res.status(403).json({ success: false, message: 'Cross-tenant access denied.' });
  }
  req.tenantId = tenantId || req.user.tenant_id;
  next();
};

module.exports = { authenticate, authorize, tenantGuard };