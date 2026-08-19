const { Booking, Expense } = require('../models');
const { toDecimal } = require('../utils/financialCalculations');

// Helper to compute date bounds based on period string
const getDateBounds = (period, customStart, customEnd) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  if (customStart && customEnd) {
    return { startDate: customStart, endDate: customEnd };
  }

  let startDate = todayStr;
  let endDate = todayStr;

  switch (period) {
    case 'today': {
      startDate = todayStr;
      endDate = todayStr;
      break;
    }
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      startDate = y.toISOString().split('T')[0];
      endDate = startDate;
      break;
    }
    case 'this_week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      startDate = monday.toISOString().split('T')[0];
      endDate = todayStr;
      break;
    }
    case 'this_month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = firstDay.toISOString().split('T')[0];
      endDate = todayStr;
      break;
    }
    case 'last_month': {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      startDate = firstDayLastMonth.toISOString().split('T')[0];
      endDate = lastDayLastMonth.toISOString().split('T')[0];
      break;
    }
    case 'this_year': {
      const firstDayYear = new Date(now.getFullYear(), 0, 1);
      startDate = firstDayYear.toISOString().split('T')[0];
      endDate = todayStr;
      break;
    }
    default: {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = firstDay.toISOString().split('T')[0];
      endDate = todayStr;
      break;
    }
  }

  return { startDate, endDate };
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const { period = 'this_month', startDate: customStart, endDate: customEnd } = req.query;
    const { startDate, endDate } = getDateBounds(period, customStart, customEnd);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const firstDayMonthStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const allBookings = await Booking.find()
      .select('bookingDate totalAmount amountReceived balanceDue status')
      .lean();

    const allExpenses = await Expense.find()
      .select('expenseDate amount')
      .lean();

    // Total Lifetime Aggregates
    const totalBookingsCount = allBookings.length;
    const totalRevenue = allBookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);
    const totalReceived = allBookings.reduce((sum, b) => sum + parseFloat(b.amountReceived || 0), 0);
    const totalOutstanding = allBookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + parseFloat(b.balanceDue || 0), 0);
    const totalExpenses = allExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    // Today's Aggregates
    const todayBookings = allBookings.filter(b => b.bookingDate === todayStr);
    const todayExpenses = allExpenses.filter(e => e.expenseDate === todayStr);
    const todayBookingsCount = todayBookings.length;
    const todayRevenue = todayBookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);
    const todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    // This Month's Aggregates
    const thisMonthBookings = allBookings.filter(b => b.bookingDate >= firstDayMonthStr && b.bookingDate <= todayStr);
    const thisMonthExpenses = allExpenses.filter(e => e.expenseDate >= firstDayMonthStr && e.expenseDate <= todayStr);
    const thisMonthBookingsCount = thisMonthBookings.length;
    const thisMonthRevenue = thisMonthBookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);
    const thisMonthExpensesTotal = thisMonthExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    // Filtered Period Stats
    const filteredBookings = allBookings.filter(b => b.bookingDate >= startDate && b.bookingDate <= endDate);
    const filteredExpenses = allExpenses.filter(e => e.expenseDate >= startDate && e.expenseDate <= endDate);
    const periodBookingsCount = filteredBookings.length;
    const periodRevenue = filteredBookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);
    const periodReceived = filteredBookings.reduce((sum, b) => sum + parseFloat(b.amountReceived || 0), 0);
    const periodOutstanding = filteredBookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + parseFloat(b.balanceDue || 0), 0);
    const periodExpenses = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const periodNetProfit = periodRevenue - periodExpenses;

    return res.status(200).json({
      success: true,
      period: { period, startDate, endDate },
      stats: {
        totalBookings: {
          today: todayBookingsCount,
          thisMonth: thisMonthBookingsCount,
          total: totalBookingsCount,
          period: periodBookingsCount
        },
        revenue: {
          today: toDecimal(todayRevenue),
          thisMonth: toDecimal(thisMonthRevenue),
          total: toDecimal(totalRevenue),
          period: toDecimal(periodRevenue)
        },
        amountReceived: {
          total: toDecimal(totalReceived),
          period: toDecimal(periodReceived)
        },
        outstandingAmount: {
          total: toDecimal(totalOutstanding),
          period: toDecimal(periodOutstanding)
        },
        expenses: {
          today: toDecimal(todayExpensesTotal),
          thisMonth: toDecimal(thisMonthExpensesTotal),
          total: toDecimal(totalExpenses),
          period: toDecimal(periodExpenses)
        },
        grossProfit: {
          total: toDecimal(totalRevenue),
          period: toDecimal(periodRevenue)
        },
        netProfit: {
          total: toDecimal(netProfit),
          period: toDecimal(periodNetProfit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardCharts = async (req, res, next) => {
  try {
    const { period = 'this_year', startDate: customStart, endDate: customEnd } = req.query;
    const { startDate, endDate } = getDateBounds(period, customStart, customEnd);

    const bookings = await Booking.find({
      bookingDate: { $gte: startDate, $lte: endDate }
    })
      .select('bookingDate totalAmount amountReceived status airlineId')
      .populate('airline', 'name code')
      .lean();

    const expenses = await Expense.find({
      expenseDate: { $gte: startDate, $lte: endDate }
    }).select('expenseDate amount').lean();

    // Timeline mapping
    const dateMap = {};
    bookings.forEach(b => {
      const d = b.bookingDate;
      if (!dateMap[d]) {
        dateMap[d] = { date: d, revenue: 0, received: 0, expenses: 0, bookings: 0 };
      }
      if (b.status !== 'cancelled') {
        dateMap[d].revenue += parseFloat(b.totalAmount || 0);
      }
      dateMap[d].received += parseFloat(b.amountReceived || 0);
      dateMap[d].bookings += 1;
    });

    expenses.forEach(e => {
      const d = e.expenseDate;
      if (!dateMap[d]) {
        dateMap[d] = { date: d, revenue: 0, received: 0, expenses: 0, bookings: 0 };
      }
      dateMap[d].expenses += parseFloat(e.amount || 0);
    });

    const salesOverview = Object.values(dateMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(item => ({
        ...item,
        revenue: toDecimal(item.revenue),
        received: toDecimal(item.received),
        expenses: toDecimal(item.expenses),
        netProfit: toDecimal(item.revenue - item.expenses)
      }));

    // Booking Status Breakdown
    const statusCounts = {
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      completed: 0,
      refunded: 0
    };

    bookings.forEach(b => {
      if (statusCounts[b.status] !== undefined) {
        statusCounts[b.status] += 1;
      }
    });

    const statusDonut = Object.entries(statusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count
    }));

    // Airline-wise Bookings & Revenue
    const airlineMap = {};
    bookings.forEach(b => {
      const name = b.airline ? b.airline.name : 'Other';
      if (!airlineMap[name]) {
        airlineMap[name] = { airline: name, bookings: 0, revenue: 0 };
      }
      airlineMap[name].bookings += 1;
      if (b.status !== 'cancelled') {
        airlineMap[name].revenue += parseFloat(b.totalAmount || 0);
      }
    });

    const airlineStats = Object.values(airlineMap).map(a => ({
      ...a,
      revenue: toDecimal(a.revenue)
    })).sort((a, b) => b.revenue - a.revenue);

    return res.status(200).json({
      success: true,
      salesOverview,
      statusDonut,
      airlineStats
    });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardUpcomingAndRecent = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('customer', 'name phone')
      .populate('airline', 'name code')
      .populate('passengers', 'firstName lastName')
      .lean();

    const upcomingJourneys = await Booking.find({
      journeyDate: { $gte: todayStr },
      status: { $in: ['confirmed', 'pending'] }
    })
      .sort({ journeyDate: 1 })
      .limit(6)
      .populate('customer', 'name phone')
      .populate('airline', 'name code')
      .populate('passengers', 'firstName lastName title')
      .lean();

    const outstandingBookings = await Booking.find({
      balanceDue: { $gt: 0 },
      status: { $ne: 'cancelled' }
    })
      .populate('customer', 'customerCode name phone email')
      .lean();

    const customerBalanceMap = {};
    outstandingBookings.forEach(b => {
      if (b.customer) {
        const id = String(b.customer._id || b.customer.id);
        if (!customerBalanceMap[id]) {
          customerBalanceMap[id] = {
            id,
            customerCode: b.customer.customerCode,
            name: b.customer.name,
            phone: b.customer.phone,
            outstanding: 0,
            bookingCount: 0
          };
        }
        customerBalanceMap[id].outstanding += parseFloat(b.balanceDue || 0);
        customerBalanceMap[id].bookingCount += 1;
      }
    });

    const outstandingCustomers = Object.values(customerBalanceMap)
      .map(c => ({ ...c, outstanding: toDecimal(c.outstanding) }))
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, 6);

    return res.status(200).json({
      success: true,
      recentBookings,
      upcomingJourneys,
      outstandingCustomers
    });
  } catch (error) {
    next(error);
  }
};
