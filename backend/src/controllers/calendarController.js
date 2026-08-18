const { Booking } = require('../models');

exports.getCalendarEvents = async (req, res, next) => {
  try {
    const { start, end } = req.query;

    const query = {};
    if (start && end) {
      query.journeyDate = { $gte: start, $lte: end };
    }

    const bookings = await Booking.find(query)
      .populate('customer', 'name phone')
      .populate('airline', 'name code')
      .populate('passengers', 'title firstName lastName')
      .sort({ journeyDate: 1 });

    const events = bookings.map(b => {
      const passengerNames = (b.passengers || []).map(p => `${p.firstName} ${p.lastName}`).join(', ');
      return {
        id: b.id || b._id,
        title: `${b.referenceNo} - ${b.airline ? b.airline.code : ''} ${b.flightNumber} (${b.sector})`,
        start: b.journeyDate,
        end: b.returnDate || b.journeyDate,
        status: b.status,
        paymentStatus: b.paymentStatus,
        customerName: b.customer ? b.customer.name : 'Unknown',
        passengers: passengerNames,
        sector: b.sector,
        flightNumber: b.flightNumber,
        airline: b.airline ? b.airline.name : '',
        totalAmount: b.totalAmount,
        balanceDue: b.balanceDue
      };
    });

    return res.status(200).json({
      success: true,
      events
    });
  } catch (error) {
    next(error);
  }
};
