const { Airline, Booking } = require('../models');
const { logActivity } = require('../middleware/activityLogger');

exports.getAirlines = async (req, res, next) => {
  try {
    const { search, status, type } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      query.$or = [
        { name: regex },
        { code: regex },
        { country: regex },
        { type: regex }
      ];
    }

    const airlinesRaw = await Airline.find(query).sort({ name: 1 }).lean();
    const airlineIds = airlinesRaw.map(a => a._id);

    const bookings = await Booking.find({
      $or: [
        { airlineId: { $in: airlineIds } },
        { companyId: { $in: airlineIds } }
      ]
    })
      .select('airlineId companyId totalAmount')
      .lean();

    const airlineBookingsMap = {};
    bookings.forEach(b => {
      const aId = String(b.companyId || b.airlineId);
      if (!airlineBookingsMap[aId]) airlineBookingsMap[aId] = [];
      airlineBookingsMap[aId].push(b);
    });

    const airlines = airlinesRaw.map(a => {
      const data = { ...a, id: a._id };
      const aBookings = airlineBookingsMap[String(a._id)] || [];
      const totalBookings = aBookings.length;
      const totalRevenue = aBookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);
      return {
        ...data,
        totalBookings,
        totalRevenue
      };
    });

    return res.status(200).json({
      success: true,
      airlines,
      companies: airlines
    });
  } catch (error) {
    next(error);
  }
};

exports.createAirline = async (req, res, next) => {
  try {
    const { name, code, type = 'flight', category, country, contact, email, status } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Company name and company code are required'
      });
    }

    const airline = await Airline.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type: type || 'flight',
      category: category || type || 'flight',
      country: country ? country.trim() : 'India',
      contact: contact ? contact.trim() : '',
      email: email ? email.trim() : '',
      status: status || 'active'
    });

    await logActivity(
      req.user.id || req.user._id,
      'Create Company',
      'Company',
      airline._id,
      `Company ${airline.name} (${airline.code}) created.`,
      req.ip
    );

    const airlineData = airline.toJSON();
    return res.status(201).json({
      success: true,
      message: 'Company created successfully',
      airline: airlineData,
      company: airlineData
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAirline = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, type, category, country, contact, email, status } = req.body;

    const airline = await Airline.findById(id);
    if (!airline) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    if (name) airline.name = name.trim();
    if (code) airline.code = code.trim().toUpperCase();
    if (type) airline.type = type;
    if (category) airline.category = category;
    if (country !== undefined) airline.country = country ? country.trim() : airline.country;
    if (contact !== undefined) airline.contact = contact ? contact.trim() : airline.contact;
    if (email !== undefined) airline.email = email ? email.trim() : airline.email;
    if (status) airline.status = status;

    await airline.save();

    await logActivity(
      req.user.id || req.user._id,
      'Update Company',
      'Company',
      airline._id,
      `Company ${airline.name} (${airline.code}) updated.`,
      req.ip
    );

    const airlineData = airline.toJSON();
    return res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      airline: airlineData,
      company: airlineData
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAirline = async (req, res, next) => {
  try {
    const { id } = req.params;
    const airline = await Airline.findById(id);

    if (!airline) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const bookingCount = await Booking.countDocuments({
      $or: [{ airlineId: id }, { companyId: id }]
    });
    if (bookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete company with ${bookingCount} linked bookings. Set status to inactive instead.`
      });
    }

    const airlineName = airline.name;
    await Airline.findByIdAndDelete(id);

    await logActivity(
      req.user.id || req.user._id,
      'Delete Company',
      'Company',
      id,
      `Company ${airlineName} (${airline.code}) deleted.`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

