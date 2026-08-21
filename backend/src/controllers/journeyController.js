const { Booking } = require('../models');

exports.getUpcomingJourneys = async (req, res, next) => {
  try {
    const { filter = '7days', startDate: customStart, endDate: customEnd, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let startDate = todayStr;
    let endDate = todayStr;

    if (customStart && customEnd) {
      startDate = customStart;
      endDate = customEnd;
    } else {
      switch (filter) {
        case 'today': {
          startDate = todayStr;
          endDate = todayStr;
          break;
        }
        case 'tomorrow': {
          const t = new Date(now);
          t.setDate(t.getDate() + 1);
          startDate = t.toISOString().split('T')[0];
          endDate = startDate;
          break;
        }
        case '7days': {
          startDate = todayStr;
          const next7 = new Date(now);
          next7.setDate(next7.getDate() + 7);
          endDate = next7.toISOString().split('T')[0];
          break;
        }
        case '30days': {
          startDate = todayStr;
          const next30 = new Date(now);
          next30.setDate(next30.getDate() + 30);
          endDate = next30.toISOString().split('T')[0];
          break;
        }
        default: {
          startDate = todayStr;
          const next30 = new Date(now);
          next30.setDate(next30.getDate() + 30);
          endDate = next30.toISOString().split('T')[0];
          break;
        }
      }
    }

    const query = {
      journeyDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['confirmed', 'pending'] }
    };

    const total = await Booking.countDocuments(query);
    const journeys = await Booking.find(query)
      .populate('customer', 'name phone email')
      .populate('company', 'name code type')
      .populate('passengers', 'title firstName lastName phone passportNumber')
      .sort({ journeyDate: 1, flightNumber: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      filter: { filter, startDate, endDate },
      journeys,
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
