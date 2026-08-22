const { Company, Booking } = require('../models');
const { logActivity } = require('../middleware/activityLogger');

exports.getCompanies = async (req, res, next) => {
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

    const companiesRaw = await Company.find(query).sort({ name: 1 }).lean();
    const companyIds = companiesRaw.map(c => c._id);

    const bookings = await Booking.find({
      companyId: { $in: companyIds }
    })
      .select('companyId totalAmount')
      .lean();

    const companyBookingsMap = {};
    bookings.forEach(b => {
      const cId = String(b.companyId);
      if (!companyBookingsMap[cId]) companyBookingsMap[cId] = [];
      companyBookingsMap[cId].push(b);
    });

    const companies = companiesRaw.map(c => {
      const data = { ...c, id: c._id };
      const cBookings = companyBookingsMap[String(c._id)] || [];
      const totalBookings = cBookings.length;
      const totalRevenue = cBookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);
      const totalPurchasedTickets = parseFloat(c.totalPurchasedTickets || 0);
      const usedTickets = c.usedTickets !== undefined && c.usedTickets > 0 ? c.usedTickets : totalBookings;
      const availableTickets = Math.max(0, totalPurchasedTickets - usedTickets);
      const walletBalance = parseFloat(c.walletBalance || 0);
      const purchasedPrice = parseFloat(c.purchasedPrice || 0);
      const ticketUnitPrice = totalPurchasedTickets > 0 
        ? Math.round((purchasedPrice / totalPurchasedTickets) * 100) / 100 
        : parseFloat(c.ticketUnitPrice || 0);

      return {
        ...data,
        totalBookings,
        totalRevenue,
        totalPurchasedTickets,
        usedTickets,
        availableTickets,
        walletBalance,
        purchasedPrice,
        ticketUnitPrice
      };
    });

    return res.status(200).json({
      success: true,
      companies
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get full company details, linked customer bookings, stats, and stock purchase history
 */
exports.getCompanyDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id).lean();

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const bookings = await Booking.find({ companyId: id })
      .populate('customer', 'name phone email customerCode')
      .populate('passengers', 'title firstName lastName phone')
      .sort({ bookingDate: -1, createdAt: -1 })
      .lean();

    let totalRevenue = 0;
    let totalReceived = 0;
    let totalBalanceDue = 0;
    let pendingTicketsCount = 0;
    let confirmedCount = 0;
    let totalPassengersCount = 0;

    bookings.forEach(b => {
      totalRevenue += parseFloat(b.totalAmount || 0);
      totalReceived += parseFloat(b.amountReceived || 0);
      totalBalanceDue += parseFloat(b.balanceDue || 0);
      if (b.status === 'pending' || parseFloat(b.balanceDue || 0) > 0) {
        pendingTicketsCount += 1;
      }
      if (b.status === 'confirmed') {
        confirmedCount += 1;
      }
      totalPassengersCount += (b.passengers && b.passengers.length > 0) ? b.passengers.length : 1;
    });

    const totalPurchasedTickets = parseFloat(company.totalPurchasedTickets || 0);
    const usedTickets = company.usedTickets !== undefined && company.usedTickets > 0 ? company.usedTickets : bookings.length;
    const availableTickets = Math.max(0, totalPurchasedTickets - usedTickets);
    const walletBalance = parseFloat(company.walletBalance || 0);
    const purchasedPrice = parseFloat(company.purchasedPrice || 0);
    const ticketUnitPrice = totalPurchasedTickets > 0 
      ? Math.round((purchasedPrice / totalPurchasedTickets) * 100) / 100 
      : parseFloat(company.ticketUnitPrice || 0);

    const purchases = (company.purchases || []).map(p => ({
      ...p,
      id: p._id
    })).sort((a, b) => {
      const dateA = new Date(a.purchaseDate || a.createdAt || 0);
      const dateB = new Date(b.purchaseDate || b.createdAt || 0);
      return dateB - dateA;
    });

    const summary = {
      totalBookings: bookings.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalReceived: Math.round(totalReceived * 100) / 100,
      totalBalanceDue: Math.round(totalBalanceDue * 100) / 100,
      pendingTicketsCount,
      confirmedCount,
      totalPassengersCount,
      totalPurchasedTickets,
      usedTickets,
      availableTickets,
      walletBalance,
      purchasedPrice,
      ticketUnitPrice
    };

    return res.status(200).json({
      success: true,
      company: {
        ...company,
        id: company._id,
        availableTickets,
        usedTickets,
        walletBalance,
        purchasedPrice,
        ticketUnitPrice,
        purchases
      },
      bookings: bookings.map(b => ({
        ...b,
        id: b._id
      })),
      summary
    });
  } catch (error) {
    next(error);
  }
};

exports.createCompany = async (req, res, next) => {
  try {
    const {
      name,
      code,
      type = 'flight',
      category,
      country,
      contact,
      email,
      status,
      walletBalance = 0,
      totalPurchasedTickets = 0,
      purchasedPrice = 0
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Company name and company code are required'
      });
    }

    const tCount = parseInt(totalPurchasedTickets, 10) || 0;
    const pPrice = parseFloat(purchasedPrice) || 0;
    const uPrice = tCount > 0 ? Math.round((pPrice / tCount) * 100) / 100 : 0;

    const activeAgencyId = req.agencyId || (req.user && req.user.agencyId) || null;

    const company = await Company.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      agencyId: activeAgencyId,
      type: type || 'flight',
      category: category || type || 'flight',
      country: country ? country.trim() : 'India',
      contact: contact ? contact.trim() : '',
      email: email ? email.trim() : '',
      status: status || 'active',
      walletBalance: parseFloat(walletBalance) || 0,
      totalPurchasedTickets: tCount,
      purchasedPrice: pPrice,
      ticketUnitPrice: uPrice
    });

    await logActivity(
      req.user.id || req.user._id,
      'Create Company',
      'Company',
      company._id,
      `Company ${company.name} (${company.code}) created.`,
      req.ip
    );

    const companyData = company.toJSON();
    return res.status(201).json({
      success: true,
      message: 'Company created successfully',
      company: companyData
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      type,
      category,
      country,
      contact,
      email,
      status,
      walletBalance,
      totalPurchasedTickets,
      purchasedPrice
    } = req.body;

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    if (name) company.name = name.trim();
    if (code) company.code = code.trim().toUpperCase();
    if (type) company.type = type;
    if (category) company.category = category;
    if (country !== undefined) company.country = country ? country.trim() : company.country;
    if (contact !== undefined) company.contact = contact ? contact.trim() : company.contact;
    if (email !== undefined) company.email = email ? email.trim() : company.email;
    if (status) company.status = status;
    if (walletBalance !== undefined) company.walletBalance = parseFloat(walletBalance) || 0;
    if (totalPurchasedTickets !== undefined) {
      company.totalPurchasedTickets = parseInt(totalPurchasedTickets, 10) || 0;
      if (company.totalPurchasedTickets > 0 && company.purchasedPrice > 0) {
        company.ticketUnitPrice = Math.round((company.purchasedPrice / company.totalPurchasedTickets) * 100) / 100;
      }
    }
    if (purchasedPrice !== undefined) {
      company.purchasedPrice = parseFloat(purchasedPrice) || 0;
      if (company.totalPurchasedTickets > 0) {
        company.ticketUnitPrice = Math.round((company.purchasedPrice / company.totalPurchasedTickets) * 100) / 100;
      }
    }

    await company.save();

    await logActivity(
      req.user.id || req.user._id,
      'Update Company',
      'Company',
      company._id,
      `Company ${company.name} (${company.code}) updated.`,
      req.ip
    );

    const companyData = company.toJSON();
    return res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      company: companyData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Buy bulk tickets / Top-up inventory quota & wallet deposit for a company
 */
exports.buyTickets = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      ticketsCount = 0,
      totalPrice = 0,
      depositAmount,
      purchaseDate = new Date().toISOString().split('T')[0],
      reference = '',
      notes = ''
    } = req.body;

    const count = parseInt(ticketsCount, 10);
    const price = parseFloat(totalPrice);
    const deposit = depositAmount !== undefined ? parseFloat(depositAmount) : price;

    if (!count || count <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid number of tickets (greater than 0).'
      });
    }

    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Total purchase price cannot be negative.'
      });
    }

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const unitPrice = count > 0 ? Math.round((price / count) * 100) / 100 : 0;

    company.totalPurchasedTickets = (company.totalPurchasedTickets || 0) + count;
    company.purchasedPrice = (company.purchasedPrice || 0) + price;
    company.walletBalance = (company.walletBalance || 0) + deposit;
    company.ticketUnitPrice = company.totalPurchasedTickets > 0
      ? Math.round((company.purchasedPrice / company.totalPurchasedTickets) * 100) / 100
      : unitPrice;

    if (!company.purchases) company.purchases = [];
    company.purchases.push({
      ticketsCount: count,
      totalPrice: price,
      unitPrice,
      purchaseDate,
      reference: reference.trim().toUpperCase(),
      notes: notes.trim(),
      createdAt: new Date()
    });

    await company.save();

    await logActivity(
      req.user.id || req.user._id,
      'Buy Tickets / Top-up Stock',
      'Company',
      company._id,
      `Purchased ${count} tickets for ₹${price} (Unit: ₹${unitPrice}) for company ${company.name} (${company.code}).`,
      req.ip
    );

    const bookingCount = await Booking.countDocuments({ companyId: id });
    const used = company.usedTickets > 0 ? company.usedTickets : bookingCount;
    const availableTickets = Math.max(0, company.totalPurchasedTickets - used);

    return res.status(200).json({
      success: true,
      message: `Successfully purchased ${count} tickets for ${company.name}!`,
      company: {
        ...company.toJSON(),
        availableTickets,
        usedTickets: used
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const bookingCount = await Booking.countDocuments({
      companyId: id
    });
    if (bookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete company with ${bookingCount} linked bookings. Set status to inactive instead.`
      });
    }

    const companyName = company.name;
    await Company.findByIdAndDelete(id);

    await logActivity(
      req.user.id || req.user._id,
      'Delete Company',
      'Company',
      id,
      `Company ${companyName} (${company.code}) deleted.`,
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
