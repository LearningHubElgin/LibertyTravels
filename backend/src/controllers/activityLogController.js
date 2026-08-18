const { ActivityLog, User } = require('../models');

exports.getActivityLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, moduleName, action, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (moduleName) query.module = moduleName;
    if (action) query.action = action;
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      
      const matchingUsers = await User.find({ name: regex }).select('_id');
      query.$or = [
        { details: regex },
        { action: regex },
        { module: regex },
        { userId: { $in: matchingUsers.map(u => u._id) } }
      ];
    }

    const total = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};
