const jwt = require('jsonwebtoken');
const { User, Customer } = require('../models');
const { ROLES, USER_STATUS } = require('../config/constants');

const authenticate = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'liberty_travel_erp_super_secret_jwt_key_2026');
    let user;
    if (decoded.role === 'customer') {
      user = await Customer.findById(decoded.id)
        .populate('agencyId', 'name code logo tagline address city country phone email gstNumber invoiceSettings');
    } else {
      user = await User.findById(decoded.id)
        .populate('agencyId', 'name code logo tagline address city country phone email gstNumber invoiceSettings');
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.'
      });
    }

    user.role = decoded.role; // Ensure role is available on the request user object even for customers


    if (user.status !== USER_STATUS.ACTIVE) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact Super Admin.'
      });
    }

    req.user = user;

    // Multi-tenant agency resolution
    if (user.role === ROLES.SUPER_ADMIN) {
      // Super Admin can switch active agency via Header or Query
      const activeAgencyHeader = req.headers['x-agency-id'] || req.query.agencyId;
      req.agencyId = activeAgencyHeader && activeAgencyHeader !== 'all' ? activeAgencyHeader : user.agencyId || null;
    } else {
      // Admin and Staff are strictly locked to their assigned agency
      req.agencyId = user.agencyId || null;
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.'
    });
  }
};

/**
 * Super Admin authorization guard
 */
const authorizeSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === ROLES.SUPER_ADMIN) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Super Admin privileges required.'
  });
};

/**
 * Admin authorization guard (Accessible to Super Admin and Agency Admin)
 */
const authorizeAdmin = (req, res, next) => {
  if (req.user && (req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.ADMIN)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Administrator privileges required.'
  });
};

/**
 * Agency user authorization guard (Accessible to Super Admin and Agency Admin)
 */
const authorizeStaff = (req, res, next) => {
  if (req.user && (req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.ADMIN)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Administrator privileges required.'
  });
};

/**
 * Customer authorization guard
 */
const authorizeCustomer = (req, res, next) => {
  if (req.user && req.user.role === 'customer') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Customer privileges required.'
  });
};

module.exports = {
  authenticate,
  authorizeSuperAdmin,
  authorizeAdmin,
  authorizeStaff,
  authorizeCustomer
};
