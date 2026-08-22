const { Agency, User, Booking, Customer, Company, ActivityLog } = require('../models');
const { ROLES, USER_STATUS } = require('../config/constants');

/**
 * Get all registered travel agencies (Super Admin)
 */
exports.getAgencies = async (req, res, next) => {
  try {
    const { search, status, plan, page = 1, limit = 20 } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (plan && plan !== 'all') {
      query.plan = plan;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { ownerName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { city: searchRegex }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Agency.countDocuments(query);

    const agencies = await Agency.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Attach quick stats (bookings count, total revenue, staff count) for each agency
    const agencyIds = agencies.map((a) => a._id);

    const [bookingStats, staffStats] = await Promise.all([
      Booking.aggregate([
        { $match: { agencyId: { $in: agencyIds } } },
        {
          $group: {
            _id: '$agencyId',
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: { $toDouble: { $ifNull: ['$totalAmount', 0] } } }
          }
        }
      ]),
      User.aggregate([
        { $match: { agencyId: { $in: agencyIds } } },
        { $group: { _id: '$agencyId', staffCount: { $sum: 1 } } }
      ])
    ]);

    const bookingStatsMap = {};
    bookingStats.forEach((b) => {
      bookingStatsMap[String(b._id)] = b;
    });

    const staffStatsMap = {};
    staffStats.forEach((s) => {
      staffStatsMap[String(s._id)] = s.staffCount;
    });

    const enhancedAgencies = agencies.map((agency) => {
      const stats = bookingStatsMap[String(agency._id)] || { totalBookings: 0, totalRevenue: 0 };
      const staffCount = staffStatsMap[String(agency._id)] || 0;
      return {
        ...agency,
        totalBookings: stats.totalBookings,
        totalRevenue: stats.totalRevenue,
        staffCount
      };
    });

    res.status(200).json({
      success: true,
      data: enhancedAgencies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed agency profile, users, and summary metrics (Super Admin)
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

    const [staffList, recentBookings, bookingAgg, customerCount, companyCount] = await Promise.all([
      User.find({ agencyId: id }).select('-password').sort({ createdAt: -1 }).lean(),
      Booking.find({ agencyId: id }).sort({ createdAt: -1 }).limit(5).populate('customer', 'name phone').lean(),
      Booking.aggregate([
        { $match: { agencyId: agency._id } },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: { $toDouble: { $ifNull: ['$totalAmount', 0] } } },
            totalProfit: { $sum: { $toDouble: { $ifNull: ['$profit', 0] } } }
          }
        }
      ]),
      Customer.countDocuments({ agencyId: id }),
      Company.countDocuments({ agencyId: id })
    ]);

    const stats = bookingAgg[0] || { totalBookings: 0, totalRevenue: 0, totalProfit: 0 };

    res.status(200).json({
      success: true,
      data: {
        ...agency,
        staff: staffList,
        recentBookings,
        metrics: {
          totalBookings: stats.totalBookings,
          totalRevenue: stats.totalRevenue,
          totalProfit: stats.totalProfit,
          totalCustomers: customerCount,
          totalCompanies: companyCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register a new Travel Agency + initial Agency Admin account (Super Admin)
 */
exports.createAgency = async (req, res, next) => {
  try {
    const {
      name,
      code,
      ownerName,
      email,
      phone,
      address,
      city,
      state,
      country = 'India',
      gstNumber,
      panNumber,
      plan = 'pro',
      status = 'active',
      invoicePrefix,
      adminName,
      adminEmail,
      adminPassword
    } = req.body;

    if (!name || !code || !email) {
      return res.status(400).json({
        success: false,
        message: 'Agency name, unique code, and official email are required.'
      });
    }

    const cleanCode = code.trim().toUpperCase();

    // Check duplicate code or email
    const existing = await Agency.findOne({
      $or: [{ code: cleanCode }, { email: email.trim().toLowerCase() }]
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An agency with this code or email already exists.'
      });
    }

    const agency = await Agency.create({
      name: name.trim(),
      code: cleanCode,
      ownerName: ownerName ? ownerName.trim() : '',
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
      city: city ? city.trim() : '',
      state: state ? state.trim() : '',
      country: country.trim(),
      gstNumber: gstNumber ? gstNumber.trim() : '',
      panNumber: panNumber ? panNumber.trim() : '',
      plan,
      status,
      settings: {
        invoicePrefix: invoicePrefix ? invoicePrefix.trim().toUpperCase() : `${cleanCode}-INV-`
      }
    });

    // If initial admin credentials provided, create the agency admin account
    let adminUser = null;
    if (adminEmail && adminPassword) {
      const existingUser = await User.findOne({ email: adminEmail.trim().toLowerCase() });
      if (existingUser) {
        // Link existing user or warn
        existingUser.agencyId = agency._id;
        existingUser.role = ROLES.ADMIN;
        await existingUser.save();
        adminUser = existingUser;
      } else {
        adminUser = await User.create({
          name: adminName ? adminName.trim() : `${name} Admin`,
          email: adminEmail.trim().toLowerCase(),
          password: adminPassword,
          role: ROLES.ADMIN,
          agencyId: agency._id,
          phone: phone ? phone.trim() : '',
          status: USER_STATUS.ACTIVE
        });
      }
    }

    // Activity log
    await ActivityLog.create({
      userId: req.user._id,
      agencyId: agency._id,
      action: 'CREATE_AGENCY',
      module: 'Agency',
      details: `Created new travel agency: ${agency.name} (${agency.code}) with plan ${agency.plan}`
    });

    res.status(201).json({
      success: true,
      message: `Travel agency "${agency.name}" registered successfully!`,
      data: {
        agency,
        adminUser: adminUser ? { id: adminUser._id, name: adminUser.name, email: adminUser.email } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing Travel Agency (Super Admin)
 */
exports.updateAgency = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.code) {
      updates.code = updates.code.trim().toUpperCase();
      const existing = await Agency.findOne({ code: updates.code, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Another agency with this code already exists.'
        });
      }
    }

    if (updates.email) {
      updates.email = updates.email.trim().toLowerCase();
      const existing = await Agency.findOne({ email: updates.email, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Another agency with this email already exists.'
        });
      }
    }

    const agency = await Agency.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Travel agency not found.'
      });
    }

    // Activity log
    await ActivityLog.create({
      userId: req.user._id,
      agencyId: agency._id,
      action: 'UPDATE_AGENCY',
      module: 'Agency',
      details: `Updated agency profile: ${agency.name} (${agency.code})`
    });

    res.status(200).json({
      success: true,
      message: 'Travel agency updated successfully.',
      data: agency
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete / archive travel agency (Super Admin)
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

    // Prevent deleting the primary LTT agency
    if (agency.code === 'LTT') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the primary system agency (Liberty Tours & Travels).'
      });
    }

    await Agency.findByIdAndDelete(id);

    // Activity log
    await ActivityLog.create({
      userId: req.user._id,
      action: 'DELETE_AGENCY',
      module: 'Agency',
      details: `Deleted travel agency: ${agency.name} (${agency.code})`
    });

    res.status(200).json({
      success: true,
      message: `Travel agency "${agency.name}" has been removed.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Super Admin Global Platform Overview KPI Metrics
 */
exports.getPlatformStats = async (req, res, next) => {
  try {
    const [
      totalAgencies,
      activeAgencies,
      trialAgencies,
      suspendedAgencies,
      bookingAgg,
      totalCustomers
    ] = await Promise.all([
      Agency.countDocuments(),
      Agency.countDocuments({ status: 'active' }),
      Agency.countDocuments({ status: 'trial' }),
      Agency.countDocuments({ status: 'suspended' }),
      Booking.aggregate([
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: { $toDouble: { $ifNull: ['$totalAmount', 0] } } },
            totalProfit: { $sum: { $toDouble: { $ifNull: ['$profit', 0] } } }
          }
        }
      ]),
      Customer.countDocuments()
    ]);

    const bookingStats = bookingAgg[0] || { totalBookings: 0, totalRevenue: 0, totalProfit: 0 };

    res.status(200).json({
      success: true,
      data: {
        totalAgencies,
        activeAgencies,
        trialAgencies,
        suspendedAgencies,
        totalPlatformBookings: bookingStats.totalBookings,
        totalPlatformRevenue: bookingStats.totalRevenue,
        totalPlatformProfit: bookingStats.totalProfit,
        totalPlatformCustomers: totalCustomers
      }
    });
  } catch (error) {
    next(error);
  }
};
