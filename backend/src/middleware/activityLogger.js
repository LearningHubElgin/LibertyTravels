const { ActivityLog } = require('../models');

/**
 * Utility to log activities safely without interrupting the main transaction/response
 */
const logActivity = async (userId, action, moduleName, referenceId, description, ipAddress = null) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      module: moduleName,
      referenceId: referenceId ? String(referenceId) : null,
      description,
      ipAddress
    });
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
};

module.exports = { logActivity };
