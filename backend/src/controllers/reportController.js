const { Booking, Customer, Airline, Expense } = require('../models');
const { toDecimal } = require('../utils/financialCalculations');

// Helper for date filtering
const applyDateFilter = (query, startDate, endDate, dateField = 'bookingDate') => {
  if (startDate && endDate) {
    query[dateField] = { $gte: startDate, $lte: endDate };
  } else if (startDate) {
    query[dateField] = { $gte: startDate };
  } else if (endDate) {
    query[dateField] = { $lte: endDate };
  }
};

/**
 * 1. Sales Report
 */
exports.getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, airlineId, customerId, sector } = req.query;
    const query = {};
    applyDateFilter(query, startDate, endDate, 'bookingDate');

    if (airlineId) query.airlineId = airlineId;
    if (customerId) query.customerId = customerId;
    if (sector) query.sector = new RegExp(sector.trim(), 'i');

    const bookings = await Booking.find(query)
      .populate('customer', 'name customerCode')
      .populate('airline', 'name code')
      .sort({ bookingDate: -1 })
      .lean();

    const totalBookings = bookings.length;
    const totalRevenue = bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);
    const totalReceived = bookings.reduce((sum, b) => sum + parseFloat(b.amountReceived || 0), 0);
    const totalOutstanding = bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + parseFloat(b.balanceDue || 0), 0);

    return res.status(200).json({
      success: true,
      summary: {
        totalBookings,
        totalRevenue: toDecimal(totalRevenue),
        totalReceived: toDecimal(totalReceived),
        totalOutstanding: toDecimal(totalOutstanding)
      },
      bookings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Booking Status & Type Report
 */
exports.getBookingReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    applyDateFilter(query, startDate, endDate, 'bookingDate');

    const bookings = await Booking.find(query).select('status bookingType totalAmount').lean();

    const statusCounts = { confirmed: 0, pending: 0, cancelled: 0, completed: 0, refunded: 0 };
    const typeCounts = { one_way: 0, round_trip: 0, multi_city: 0 };

    bookings.forEach(b => {
      if (statusCounts[b.status] !== undefined) statusCounts[b.status] += 1;
      if (typeCounts[b.bookingType] !== undefined) typeCounts[b.bookingType] += 1;
    });

    return res.status(200).json({
      success: true,
      totalBookings: bookings.length,
      statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
      typeBreakdown: Object.entries(typeCounts).map(([type, count]) => ({ type, count }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Revenue Breakdown Report
 */
exports.getRevenueReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { status: { $ne: 'cancelled' } };
    applyDateFilter(query, startDate, endDate, 'bookingDate');

    const bookings = await Booking.find(query)
      .select('baseFare tax serviceCharge otherCharges discount totalAmount commission')
      .lean();

    const totals = bookings.reduce((acc, b) => {
      acc.baseFare += parseFloat(b.baseFare || 0);
      acc.tax += parseFloat(b.tax || 0);
      acc.serviceCharge += parseFloat(b.serviceCharge || 0);
      acc.otherCharges += parseFloat(b.otherCharges || 0);
      acc.discount += parseFloat(b.discount || 0);
      acc.totalRevenue += parseFloat(b.totalAmount || 0);
      acc.commission += parseFloat(b.commission || 0);
      return acc;
    }, { baseFare: 0, tax: 0, serviceCharge: 0, otherCharges: 0, discount: 0, totalRevenue: 0, commission: 0 });

    return res.status(200).json({
      success: true,
      revenueSummary: {
        baseFare: toDecimal(totals.baseFare),
        tax: toDecimal(totals.tax),
        serviceCharge: toDecimal(totals.serviceCharge),
        otherCharges: toDecimal(totals.otherCharges),
        discount: toDecimal(totals.discount),
        commission: toDecimal(totals.commission),
        totalGrossRevenue: toDecimal(totals.totalRevenue)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Profit & Loss Report
 */
exports.getProfitReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const bookingQuery = { status: { $ne: 'cancelled' } };
    const expenseQuery = {};

    applyDateFilter(bookingQuery, startDate, endDate, 'bookingDate');
    applyDateFilter(expenseQuery, startDate, endDate, 'expenseDate');

    const bookings = await Booking.find(bookingQuery).select('totalAmount serviceCharge commission').lean();
    const expenses = await Expense.find(expenseQuery).select('amount category').lean();

    const totalRevenue = bookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);
    const serviceRevenue = bookings.reduce((sum, b) => sum + parseFloat(b.serviceCharge || 0) + parseFloat(b.commission || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    return res.status(200).json({
      success: true,
      profitSummary: {
        totalGrossRevenue: toDecimal(totalRevenue),
        serviceRevenue: toDecimal(serviceRevenue),
        totalExpenses: toDecimal(totalExpenses),
        netProfit: toDecimal(netProfit),
        profitMargin: totalRevenue > 0 ? toDecimal((netProfit / totalRevenue) * 100) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Customer Outstanding Report
 */
exports.getCustomerOutstandingReport = async (req, res, next) => {
  try {
    const customers = await Customer.find().lean();
    const bookings = await Booking.find({ status: { $ne: 'cancelled' } })
      .select('customerId totalAmount amountReceived balanceDue status')
      .lean();

    const customerBookingsMap = {};
    bookings.forEach(b => {
      const cId = String(b.customerId);
      if (!customerBookingsMap[cId]) customerBookingsMap[cId] = [];
      customerBookingsMap[cId].push(b);
    });

    const report = customers.map(c => {
      const activeBookings = customerBookingsMap[String(c._id)] || [];
      const totalAmount = activeBookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);
      const paid = activeBookings.reduce((sum, b) => sum + parseFloat(b.amountReceived || 0), 0);
      const outstanding = activeBookings.reduce((sum, b) => sum + parseFloat(b.balanceDue || 0), 0);

      return {
        id: c.id || c._id,
        customerCode: c.customerCode,
        name: c.name,
        phone: c.phone,
        email: c.email,
        totalBookings: activeBookings.length,
        totalAmount: toDecimal(totalAmount),
        paidAmount: toDecimal(paid),
        outstandingAmount: toDecimal(outstanding)
      };
    }).filter(c => c.outstandingAmount > 0)
      .sort((a, b) => b.outstandingAmount - a.outstandingAmount);

    const grandOutstanding = report.reduce((sum, r) => sum + r.outstandingAmount, 0);

    return res.status(200).json({
      success: true,
      grandOutstanding: toDecimal(grandOutstanding),
      customers: report
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Expense Breakdown Report
 */
exports.getExpenseReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    applyDateFilter(query, startDate, endDate, 'expenseDate');

    const expenses = await Expense.find(query).select('category amount');
    const categoryMap = {};
    let totalExpenses = 0;

    expenses.forEach(e => {
      const amt = parseFloat(e.amount || 0);
      categoryMap[e.category] = (categoryMap[e.category] || 0) + amt;
      totalExpenses += amt;
    });

    const breakdown = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount: toDecimal(amount),
      percentage: totalExpenses > 0 ? toDecimal((amount / totalExpenses) * 100) : 0
    })).sort((a, b) => b.amount - a.amount);

    return res.status(200).json({
      success: true,
      totalExpenses: toDecimal(totalExpenses),
      categories: breakdown
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Airline Share & Revenue Report
 */
exports.getAirlineReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const bookingQuery = { status: { $ne: 'cancelled' } };
    applyDateFilter(bookingQuery, startDate, endDate, 'bookingDate');

    const airlines = await Airline.find();
    const bookings = await Booking.find(bookingQuery).select('airlineId totalAmount amountReceived');

    const airlineBookingsMap = {};
    bookings.forEach(b => {
      const aId = String(b.airlineId);
      if (!airlineBookingsMap[aId]) airlineBookingsMap[aId] = [];
      airlineBookingsMap[aId].push(b);
    });

    let overallBookings = 0;
    let overallRevenue = 0;

    const stats = airlines.map(a => {
      const bList = airlineBookingsMap[String(a._id)] || [];
      const bookingsCount = bList.length;
      const revenue = bList.reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);
      overallBookings += bookingsCount;
      overallRevenue += revenue;

      return {
        id: a.id || a._id,
        name: a.name,
        code: a.code,
        country: a.country,
        bookingsCount,
        revenue: toDecimal(revenue)
      };
    });

    const report = stats.map(s => ({
      ...s,
      bookingShare: overallBookings > 0 ? toDecimal((s.bookingsCount / overallBookings) * 100) : 0,
      revenueShare: overallRevenue > 0 ? toDecimal((s.revenue / overallRevenue) * 100) : 0
    })).sort((a, b) => b.revenue - a.revenue);

    return res.status(200).json({
      success: true,
      totalBookings: overallBookings,
      totalRevenue: toDecimal(overallRevenue),
      airlines: report
    });
  } catch (error) {
    next(error);
  }
};
