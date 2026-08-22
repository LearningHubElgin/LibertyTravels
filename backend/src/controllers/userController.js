const { User } = require('../models');
const { ROLES, USER_STATUS } = require('../config/constants');
const { logActivity } = require('../middleware/activityLogger');

exports.getUsers = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role !== ROLES.SUPER_ADMIN) {
      query.agencyId = req.user.agencyId || req.agencyId;
    } else if (req.agencyId) {
      query.agencyId = req.agencyId;
    }

    const users = await User.find(query)
      .populate('agencyId', 'name code')
      .select('name email role status agencyId phone lastLogin createdAt updatedAt')
      .sort({ role: 1, name: 1 });

    return res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role = ROLES.STAFF, agencyId, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    if (![ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Allowed roles are: super_admin, admin, staff'
      });
    }

    // Only super admin can create super admin or create users for other agencies
    if (role === ROLES.SUPER_ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can create Super Admin accounts'
      });
    }

    const targetAgencyId = req.user.role === ROLES.SUPER_ADMIN ? (agencyId || null) : (req.user.agencyId || null);

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists'
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      agencyId: targetAgencyId,
      phone: phone ? phone.trim() : '',
      status: USER_STATUS.ACTIVE
    });

    await logActivity(
      req.user.id || req.user._id,
      'Create User',
      'User Management',
      user._id,
      `User ${user.name} (${user.role}) created by ${req.user.name}.`,
      req.ip
    );

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === ROLES.SUPER_ADMIN && String(req.user.id || req.user._id) !== String(user._id) && req.user.role !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Cannot modify Super Admin account'
      });
    }

    if (name) user.name = name.trim();
    if (email && email.toLowerCase().trim() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing && String(existing._id) !== String(user._id)) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
      user.email = email.toLowerCase().trim();
    }

    if (role) {
      if (role !== ROLES.ADMIN && role !== ROLES.SUPER_ADMIN) {
        return res.status(400).json({ success: false, message: 'Invalid role specified' });
      }
      user.role = role;
    }

    if (status && Object.values(USER_STATUS).includes(status)) {
      user.status = status;
    }

    await user.save();

    await logActivity(
      req.user.id || req.user._id,
      'Update User',
      'User Management',
      user._id,
      `User ${user.name} (${user.role}) was updated by ${req.user.name}.`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (String(req.user.id || req.user._id) === String(user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot disable your own active account'
      });
    }

    if (user.role === ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Super Admin accounts cannot be disabled'
      });
    }

    user.status = user.status === USER_STATUS.ACTIVE ? USER_STATUS.INACTIVE : USER_STATUS.ACTIVE;
    await user.save();

    await logActivity(
      req.user.id || req.user._id,
      'Toggle User Status',
      'User Management',
      user._id,
      `User ${user.name} status changed to ${user.status} by ${req.user.name}.`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: `User account is now ${user.status}`,
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

exports.resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    await logActivity(
      req.user.id || req.user._id,
      'Reset User Password',
      'User Management',
      user._id,
      `Password reset for user ${user.name} by ${req.user.name}.`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: `Password reset successfully for ${user.name}`
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Super Admin accounts cannot be deleted'
      });
    }

    if (String(req.user.id || req.user._id) === String(user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const userName = user.name;
    await User.findByIdAndDelete(id);

    await logActivity(
      req.user.id || req.user._id,
      'Delete User',
      'User Management',
      id,
      `User ${userName} deleted by ${req.user.name}.`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
