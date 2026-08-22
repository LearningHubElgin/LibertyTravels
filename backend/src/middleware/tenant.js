const { ROLES } = require('../config/constants');

/**
 * Middleware to extract and attach the active tenant (agencyId) to the request
 */
const resolveTenant = (req, res, next) => {
  if (!req.user) {
    return next();
  }

  // Super Admin can view specific agency or all agencies
  if (req.user.role === ROLES.SUPER_ADMIN) {
    const headerAgencyId = req.headers['x-agency-id'];
    const queryAgencyId = req.query.agencyId;
    req.agencyId = queryAgencyId || headerAgencyId || null;
    req.isSuperAdmin = true;
    return next();
  }

  // Agency Admin / Staff is locked strictly to their assigned agencyId
  req.agencyId = req.user.agencyId || null;
  req.isSuperAdmin = false;
  next();
};

/**
 * Helper to build a MongoDB query filter scoped to the current tenant
 * @param {Object} req Express request object
 * @param {Object} baseFilter Optional existing filter
 * @returns {Object} Scoped filter object
 */
const getTenantFilter = (req, baseFilter = {}) => {
  if (req.agencyId) {
    return { ...baseFilter, agencyId: req.agencyId };
  }
  return { ...baseFilter };
};

module.exports = {
  resolveTenant,
  getTenantFilter
};
