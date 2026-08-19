const { Airline, Booking } = require('../models');
const { logActivity } = require('../middleware/activityLogger');

exports.getAirlines = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      query.$or = [
        { name: regex },
        { code: regex },
        { country: regex }
      ];
    }

    const airlinesRaw = await Airline.find(query).sort({ name: 1 }).lean();
    const airlineIds = airlinesRaw.map(a => a._id);

    const bookings = await Booking.find({ airlineId: { $in: airlineIds } })
      .select('airlineId totalAmount')
      .lean();

    const airlineBookingsMap = {};
    bookings.forEach(b => {
      const aId = String(b.airlineId);
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
      airlines
    });
  } catch (error) {
    next(error);
  }
};

exports.createAirline = async (req, res, next) => {
  try {
    const { name, code, country, status } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Airline name and airline code are required'
      });
    }

    const airline = await Airline.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      country: country ? country.trim() : 'India',
      status: status || 'active'
    });

    await logActivity(
      req.user.id || req.user._id,
      'Create Airline',
      'Airline',
      airline._id,
      `Airline ${airline.name} (${airline.code}) created.`,
      req.ip
    );

    return res.status(201).json({
      success: true,
      message: 'Airline created successfully',
      airline: airline.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAirline = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, country, status } = req.body;

    const airline = await Airline.findById(id);
    if (!airline) {
      return res.status(404).json({
        success: false,
        message: 'Airline not found'
      });
    }

    if (name) airline.name = name.trim();
    if (code) airline.code = code.trim().toUpperCase();
    if (country !== undefined) airline.country = country ? country.trim() : airline.country;
    if (status) airline.status = status;

    await airline.save();

    await logActivity(
      req.user.id || req.user._id,
      'Update Airline',
      'Airline',
      airline._id,
      `Airline ${airline.name} (${airline.code}) updated.`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'Airline updated successfully',
      airline: airline.toJSON()
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
        message: 'Airline not found'
      });
    }

    const bookingCount = await Booking.countDocuments({ airlineId: id });
    if (bookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete airline with ${bookingCount} linked bookings. Set status to inactive instead.`
      });
    }

    const airlineName = airline.name;
    await Airline.findByIdAndDelete(id);

    await logActivity(
      req.user.id || req.user._id,
      'Delete Airline',
      'Airline',
      id,
      `Airline ${airlineName} (${airline.code}) deleted.`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'Airline deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
