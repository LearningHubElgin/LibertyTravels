const { Agency, User, Booking, Customer, Company, ActivityLog } = require('../models');
const { ROLES, USER_STATUS, AGENCY_STATUS } = require('../config/constants');

/**
 * Super Admin: Get all Travel Agencies with live statistics
 */
exports.getAgencies = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { city: searchRegex }
      ];
    }

    const agenciesRaw = await Agency.find(query).sort({ createdAt: -1 }).lean();

    // Aggregate statistics for each agency
    const agencyIds = agenciesRaw.map(a => a._id);

    const [bookingsList, usersList] = await Promise.all([
      Booking.find({ agencyId: { $in: agencyIds } }).select('agencyId totalAmount status').lean(),
      User.find({ agencyId: { $in: agencyIds } }).select('agencyId name email role status').lean()
    ]);

    const agencyStatsMap = {};
    agencyIds.forEach(id => {
      agencyStatsMap[String(id)] = {
        totalBookings: 0,
        totalRevenue: 0,
        usersCount: 0,
        admins: []
      };
    });

    bookingsList.forEach(b => {
      if (b.agencyId && agencyStatsMap[String(b.agencyId)]) {
        agencyStatsMap[String(b.agencyId)].totalBookings += 1;
        if (b.status !== 'cancelled') {
          agencyStatsMap[String(b.agencyId)].totalRevenue += parseFloat(b.totalAmount || 0);
        }
      }
    });

    usersList.forEach(u => {
      if (u.agencyId && agencyStatsMap[String(u.agencyId)]) {
        agencyStatsMap[String(u.agencyId)].usersCount += 1;
        if (u.role === ROLES.ADMIN) {
          agencyStatsMap[String(u.agencyId)].admins.push({
            id: u._id,
            name: u.name,
            email: u.email,
            status: u.status
          });
        }
      }
    });

    const agencies = agenciesRaw.map(a => {
      const stats = agencyStatsMap[String(a._id)] || { totalBookings: 0, totalRevenue: 0, usersCount: 0, admins: [] };
      return {
        ...a,
        totalBookings: stats.totalBookings,
        totalRevenue: stats.totalRevenue,
        usersCount: stats.usersCount,
        adminUser: stats.admins[0] || null
      };
    });

    res.status(200).json({
      success: true,
      count: agencies.length,
      data: agencies
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Super Admin: Get single Travel Agency details
 */
exports.getAgencyDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const agency = await Agency.findById(id).lean();

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Travel agency not found.'
      });
    }

    const [users, recentBookings, totalBookingsCount, totalCustomersCount] = await Promise.all([
      User.find({ agencyId: id }).select('-password').sort({ createdAt: -1 }).lean(),
      Booking.find({ agencyId: id })
        .populate('company', 'name code')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Booking.countDocuments({ agencyId: id }),
      Customer.countDocuments({ agencyId: id })
    ]);

    // Financial totals
    const bookings = await Booking.find({ agencyId: id, status: { $ne: 'cancelled' } }).select('totalAmount amountReceived balanceDue').lean();
    const totalSales = bookings.reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0);
    const totalCollected = bookings.reduce((sum, b) => sum + (parseFloat(b.amountReceived) || 0), 0);
    const totalReceivables = bookings.reduce((sum, b) => sum + (parseFloat(b.balanceDue) || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        ...agency,
        stats: {
          totalBookings: totalBookingsCount,
          totalCustomers: totalCustomersCount,
          totalSales,
          totalCollected,
          totalReceivables,
          usersCount: users.length
        },
        users,
        recentBookings
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Super Admin: Create a new Travel Agency + initial Agency Admin Account
 */
exports.createAgency = async (req, res, next) => {
  try {
    const {
      name,
      code,
      tagline,
      email,
      phone,
      address,
      city,
      country,
      website,
      gstNumber,
      panNumber,
      plan,
      adminName,
      adminEmail,
      adminPassword,
      adminPhone,
      invoicePrefix,
      notes
    } = req.body;

    if (!name || !code || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Agency Name, Code, Email, and Phone number are required.'
      });
    }

    // Check code uniqueness
    const cleanCode = code.trim().toUpperCase();
    const existingAgency = await Agency.findOne({ code: cleanCode });
    if (existingAgency) {
      return res.status(400).json({
        success: false,
        message: `Agency Code "${cleanCode}" is already in use by another agency.`
      });
    }

    // Check admin email uniqueness if creating admin account
    const cleanAdminEmail = (adminEmail || email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: cleanAdminEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `User with email "${cleanAdminEmail}" already exists in the platform.`
      });
    }

    // 1. Create Agency Document
    const agency = await Agency.create({
      name: name.trim(),
      code: cleanCode,
      tagline: tagline ? tagline.trim() : '',
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: address ? address.trim() : '',
      city: city ? city.trim() : '',
      country: country ? country.trim() : 'India',
      website: website ? website.trim() : '',
      gstNumber: gstNumber ? gstNumber.trim().toUpperCase() : '',
      panNumber: panNumber ? panNumber.trim().toUpperCase() : '',
      plan: plan || 'professional',
      status: AGENCY_STATUS.ACTIVE,
      contactPerson: {
        name: adminName ? adminName.trim() : name.trim(),
        phone: adminPhone || phone,
        email: cleanAdminEmail
      },
      invoiceSettings: {
        prefix: invoicePrefix ? invoicePrefix.trim() : `${cleanCode}-INV-`,
        nextNumber: 1001
      },
      notes: notes || ''
    });

    // 2. Create Initial Agency Admin Account
    const initialPassword = adminPassword && adminPassword.trim().length >= 6 ? adminPassword.trim() : 'agency123';
    const adminUser = await User.create({
      name: adminName ? adminName.trim() : `${name.trim()} Admin`,
      email: cleanAdminEmail,
      password: initialPassword,
      role: ROLES.ADMIN,
      agencyId: agency._id,
      phone: adminPhone ? adminPhone.trim() : phone.trim(),
      status: USER_STATUS.ACTIVE
    });

    // Log Activity
    await ActivityLog.create({
      userId: req.user._id,
      agencyId: agency._id,
      action: 'CREATE_AGENCY',
      module: 'SUPER_ADMIN',
      details: `Created new Travel Agency "${agency.name}" (${agency.code}) with Admin ${adminUser.email}`,
      ipAddress: req.ip || '127.0.0.1'
    });

    res.status(201).json({
      success: true,
      message: `Travel Agency "${agency.name}" and Admin account created successfully!`,
      data: {
        agency,
        adminUser: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Super Admin: Update Travel Agency
 */
exports.updateAgency = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      tagline,
      logo,
      email,
      phone,
      address,
      city,
      country,
      website,
      gstNumber,
      panNumber,
      status,
      plan,
      contactPerson,
      invoiceSettings,
      notes
    } = req.body;

    const agency = await Agency.findById(id);
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Travel agency not found.'
      });
    }

    if (code && code.trim().toUpperCase() !== agency.code) {
      const cleanCode = code.trim().toUpperCase();
      const duplicate = await Agency.findOne({ code: cleanCode, _id: { $ne: id } });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Agency code "${cleanCode}" is already in use.`
        });
      }
      agency.code = cleanCode;
    }

    if (name) agency.name = name.trim();
    if (tagline !== undefined) agency.tagline = tagline;
    if (logo !== undefined) agency.logo = logo;
    if (email) agency.email = email.trim().toLowerCase();
    if (phone) agency.phone = phone.trim();
    if (address !== undefined) agency.address = address;
    if (city !== undefined) agency.city = city;
    if (country !== undefined) agency.country = country;
    if (website !== undefined) agency.website = website;
    if (gstNumber !== undefined) agency.gstNumber = gstNumber;
    if (panNumber !== undefined) agency.panNumber = panNumber;
    if (status) agency.status = status;
    if (plan) agency.plan = plan;
    if (contactPerson) agency.contactPerson = { ...agency.contactPerson, ...contactPerson };
    if (invoiceSettings) agency.invoiceSettings = { ...agency.invoiceSettings, ...invoiceSettings };
    if (notes !== undefined) agency.notes = notes;

    await agency.save();

    res.status(200).json({
      success: true,
      message: `Travel agency "${agency.name}" updated successfully.`,
      data: agency
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Super Admin: Deactivate or Delete Travel Agency
 */
exports.deleteAgency = async (req, res, next) => {
  try {
    const { id } = req.params;
    const agency = await Agency.findById(id);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Travel agency not found.'
      });
    }

    // Toggle status to inactive rather than destructive cascade
    agency.status = agency.status === 'active' ? 'inactive' : 'active';
    await agency.save();

    // Also update users of this agency
    await User.updateMany({ agencyId: id }, { status: agency.status === 'active' ? 'active' : 'inactive' });

    res.status(200).json({
      success: true,
      message: `Agency "${agency.name}" has been set to ${agency.status}.`,
      data: agency
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Super Admin: Global Platform Dashboard Statistics
 */
exports.getPlatformStats = async (req, res, next) => {
  try {
    const [
      totalAgencies,
      activeAgencies,
      totalUsers,
      totalBookingsCount,
      allBookings
    ] = await Promise.all([
      Agency.countDocuments(),
      Agency.countDocuments({ status: AGENCY_STATUS.ACTIVE }),
      User.countDocuments(),
      Booking.countDocuments(),
      Booking.find({ status: { $ne: 'cancelled' } }).select('totalAmount amountReceived').lean()
    ]);

    const totalGrossVolume = allBookings.reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0);
    const totalCollected = allBookings.reduce((sum, b) => sum + (parseFloat(b.amountReceived) || 0), 0);

    // Leaderboard of top 5 agencies
    const recentAgencies = await Agency.find().sort({ createdAt: -1 }).limit(5).lean();

    res.status(200).json({
      success: true,
      data: {
        totalAgencies,
        activeAgencies,
        totalUsers,
        totalBookings: totalBookingsCount,
        totalGrossVolume,
        totalCollected,
        recentAgencies
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Super Admin: Master User List across all agencies
 */
exports.getSuperAdminUsers = async (req, res, next) => {
  try {
    const { agencyId, role, status, search } = req.query;
    const query = {};

    if (agencyId && agencyId !== 'all') query.agencyId = agencyId;
    if (role && role !== 'all') query.role = role;
    if (status && status !== 'all') query.status = status;

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const users = await User.find(query)
      .populate('agencyId', 'name code')
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Super Admin: Create User for any agency (Admin or Staff)
 */
exports.createAgencyUser = async (req, res, next) => {
  try {
    const { name, email, password, role, agencyId, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, Email, Password, and Role are required.'
      });
    }

    if (role !== ROLES.SUPER_ADMIN && !agencyId) {
      return res.status(400).json({
        success: false,
        message: 'Please assign a Travel Agency for Admin and Staff users.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `User with email "${cleanEmail}" already exists.`
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: password.trim(),
      role,
      agencyId: role === ROLES.SUPER_ADMIN ? null : agencyId,
      phone: phone ? phone.trim() : '',
      status: USER_STATUS.ACTIVE
    });

    res.status(201).json({
      success: true,
      message: `User "${user.name}" (${user.role}) created successfully.`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        agencyId: user.agencyId,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};
