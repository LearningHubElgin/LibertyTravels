const { Company, Booking } = require('../models');
const { logActivity } = require('../middleware/activityLogger');

const getTxTime = (t) => {
  if (!t) return 0;
  if (t.date) {
    const rawDate = String(t.date).trim();
    let dateStr = rawDate;
    if (rawDate.includes('/')) {
      const parts = rawDate.split('/');
      if (parts.length === 3 && parts[2].length === 4) {
        dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    } else if (rawDate.includes('T')) {
      dateStr = rawDate.split('T')[0];
    }

    let timeStr = '00:00:00';
    if (t.time && String(t.time).trim()) {
      const parts = String(t.time).trim().split(':');
      if (parts.length === 2) {
        timeStr = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
      } else if (parts.length >= 3) {
        timeStr = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].slice(0, 2).padStart(2, '0')}`;
      }
    }

    const isoStr = `${dateStr}T${timeStr}`;
    const ms = new Date(isoStr).getTime();
    if (!isNaN(ms) && ms > 0) return ms;

    const fallbackMs = new Date(rawDate).getTime();
    if (!isNaN(fallbackMs) && fallbackMs > 0) return fallbackMs;
  }

  if (t.createdAt) {
    const ms = new Date(t.createdAt).getTime();
    if (!isNaN(ms) && ms > 0) return ms;
  }
  return 0;
};

/**
 * Filter out any transactions that belong to deleted bookings (which no longer exist in Booking collection).
 * Also cleans up any artificial DELETE- refund entries, ensures every active booking with costPrice > 0
 * has its deduction transaction recorded, and recalculates running balances chronologically.
 */
const sanitizeCompanyTransactions = async (company, companyActiveBookings) => {
  if (!company) {
    return { transactions: [], walletBalance: 0 };
  }

  // Ensure active bookings have referenceNo, costPrice, passengerName, bookingDate, etc.
  let activeBookings = companyActiveBookings;
  if (!activeBookings || activeBookings.some(b => b.referenceNo === undefined)) {
    activeBookings = await Booking.find({ companyId: company._id || company.id })
      .select('referenceNo costPrice passengerName bookingDate createdAt status')
      .lean();
  }

  const activeBookingMap = new Map();
  activeBookings.forEach(b => {
    const ref = (b.referenceNo || '').trim().toUpperCase();
    if (ref) activeBookingMap.set(ref, b);
  });

  const existingTransactions = Array.isArray(company.transactions) ? [...company.transactions] : [];
  let modified = false;

  // 1. Filter out artificial DELETE- entries or transactions referencing deleted bookings
  const filtered = existingTransactions.filter(t => {
    const r = (t.reference || '').trim().toUpperCase();

    // Direct deposits
    if (t.type === 'deposit') {
      if (r.startsWith('DELETE-')) {
        modified = true;
        return false;
      }
      if (r.startsWith('REFUND-')) {
        const cleanRef = r.replace(/^REFUND-/, '').trim();
        if (cleanRef && !activeBookingMap.has(cleanRef)) {
          modified = true;
          return false;
        }
      }
      return true;
    }

    // Rewards / cashbacks
    if (t.type === 'reward') {
      return true;
    }

    // Always keep manually entered transactions
    if (t.isManual) {
      return true;
    }

    // Refunds from supplier cancellations
    if (t.type === 'refund') {
      if (r.startsWith('REFUND-')) {
        const cleanRef = r.replace(/^REFUND-/, '').trim();
        if (cleanRef && !activeBookingMap.has(cleanRef) && !t.isManual) {
          modified = true;
          return false;
        }
      }
      return true;
    }

    // Booking supplier deduction: if reference corresponds to a deleted booking, remove it
    if (t.type === 'deduction') {
      if (t.isManual) return true;
      if (r) {
        if (!activeBookingMap.has(r)) {
          modified = true;
          return false;
        }
      }
      return true;
    }

    return true;
  });

  // 2. Ensure each active booking with costPrice > 0 has its deduction in the wallet ledger
  const existingDeductionMap = new Map();
  filtered.forEach(t => {
    if (t.type === 'deduction') {
      const ref = (t.reference || '').trim().toUpperCase();
      if (ref) existingDeductionMap.set(ref, t);
    }
  });

  activeBookings.forEach(b => {
    const ref = (b.referenceNo || '').trim().toUpperCase();
    const cost = parseFloat(b.costPrice || 0);
    if (ref && cost > 0) {
      let bTime = '';
      if (b.createdAt) {
        const d = new Date(b.createdAt);
        if (!isNaN(d.getTime())) {
          bTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
      }
      if (!existingDeductionMap.has(ref)) {
        filtered.push({
          type: 'deduction',
          amount: cost,
          reference: b.referenceNo,
          notes: `Booking for ${b.passengerName || 'Passenger'}`,
          date: b.bookingDate || (b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          time: bTime,
          createdAt: b.createdAt || new Date()
        });
        modified = true;
      } else {
        const existing = existingDeductionMap.get(ref);
        if (parseFloat(existing.amount || 0) !== cost) {
          existing.amount = cost;
          modified = true;
        }
        if (!existing.time && bTime) {
          existing.time = bTime;
          modified = true;
        }
      }
    }
  });

  // 2.5 Ensure every transaction has a time property (backfilling from createdAt if empty)
  filtered.forEach(t => {
    if (!t.time && t.createdAt) {
      const d = new Date(t.createdAt);
      if (!isNaN(d.getTime())) {
        t.time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        modified = true;
      }
    }
  });

  // 3. Chronologically sort and compute running balances
  filtered.sort((a, b) => {
    const timeA = getTxTime(a);
    const timeB = getTxTime(b);
    if (timeA !== timeB) return timeA - timeB;
    if (a.type !== b.type) {
      const typeRank = { deposit: 1, reward: 2, refund: 2.5, deduction: 3 };
      return (typeRank[a.type] || 4) - (typeRank[b.type] || 4);
    }
    const cA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const cB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return cA - cB;
  });

  let running = 0;
  for (let i = 0; i < filtered.length; i++) {
    const current = filtered[i];
    current.balanceBefore = running;
    const effect = current.type === 'deduction' ? -parseFloat(current.amount || 0) : parseFloat(current.amount || 0);
    running = Math.round((running + effect) * 100) / 100;
    current.balanceAfter = running;
  }

  const finalBalance = running;

  const orderOrBalanceChanged = filtered.some((tx, idx) => {
    const orig = existingTransactions[idx];
    if (!orig) return true;
    const origId = orig._id ? orig._id.toString() : orig.id;
    const txId = tx._id ? tx._id.toString() : tx.id;
    return origId !== txId || orig.balanceAfter !== tx.balanceAfter || orig.balanceBefore !== tx.balanceBefore;
  });

  if (modified || orderOrBalanceChanged || finalBalance !== parseFloat(company.walletBalance || 0) || filtered.length !== existingTransactions.length) {
    company.transactions = filtered;
    company.walletBalance = finalBalance;

    await Company.findByIdAndUpdate(company._id || company.id, {
      transactions: filtered,
      walletBalance: finalBalance
    }).catch(() => {});
  }

  return { transactions: filtered, walletBalance: finalBalance };
};

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
      .populate('passengers', '_id')
      .select('companyId totalAmount passengerCount extraGuests referenceNo costPrice passengerName bookingDate createdAt status')
      .lean();

    const companyBookingsMap = {};
    bookings.forEach(b => {
      const cId = String(b.companyId);
      if (!companyBookingsMap[cId]) companyBookingsMap[cId] = [];
      companyBookingsMap[cId].push(b);
    });

    const companies = await Promise.all(companiesRaw.map(async (c) => {
      const data = { ...c, id: c._id };
      const cBookings = companyBookingsMap[String(c._id)] || [];
      const { walletBalance: cleanWalletBalance } = await sanitizeCompanyTransactions(c, cBookings);
      const totalBookings = cBookings.length;
      const totalRevenue = cBookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);
      const totalPurchasedTickets = parseFloat(c.totalPurchasedTickets || 0);

      // Compute exact tickets / passengers used across all active bookings for this company
      const bookingTicketsSum = cBookings.reduce((sum, b) => {
        const paxFromDoc = (b.passengers && Array.isArray(b.passengers) && b.passengers.length > 0)
          ? b.passengers.length
          : null;
        const count = paxFromDoc !== null
          ? paxFromDoc
          : (b.passengerCount !== undefined && b.passengerCount > 0
            ? b.passengerCount
            : (1 + (parseInt(b.extraGuests || 0, 10) || 0)));
        return sum + count;
      }, 0);

      const usedTickets = bookingTicketsSum;
      const availableTickets = Math.max(0, totalPurchasedTickets - usedTickets);
      const walletBalance = parseFloat(c.walletBalance || 0);
      const purchasedPrice = parseFloat(c.purchasedPrice || 0);
      const ticketUnitPrice = totalPurchasedTickets > 0 
        ? Math.round((purchasedPrice / totalPurchasedTickets) * 100) / 100 
        : parseFloat(c.ticketUnitPrice || 0);

      // Keep DB Company usedTickets in perfect sync with real bookings
      if (c.usedTickets !== usedTickets) {
        Company.findByIdAndUpdate(c._id, { usedTickets }).catch(() => {});
      }

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
    }));

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
    let totalCost = 0;
    let totalReceived = 0;
    let totalBalanceDue = 0;
    let pendingTicketsCount = 0;
    let confirmedCount = 0;
    let totalPassengersCount = 0;

    bookings.forEach(b => {
      totalRevenue += parseFloat(b.totalAmount || 0);
      totalCost += parseFloat(b.costPrice || 0);
      totalReceived += parseFloat(b.amountReceived || 0);
      totalBalanceDue += parseFloat(b.balanceDue || 0);
      if (b.status === 'pending' || parseFloat(b.balanceDue || 0) > 0) {
        pendingTicketsCount += 1;
      }
      if (b.status === 'confirmed') {
        confirmedCount += 1;
      }
      const paxFromDoc = (b.passengers && Array.isArray(b.passengers) && b.passengers.length > 0)
        ? b.passengers.length
        : null;
      const bPax = paxFromDoc !== null
        ? paxFromDoc
        : (b.passengerCount !== undefined && b.passengerCount > 0
          ? b.passengerCount
          : (1 + (parseInt(b.extraGuests || 0, 10) || 0)));
      totalPassengersCount += bPax;
    });

    const totalPurchasedTickets = parseFloat(company.totalPurchasedTickets || 0);
    const usedTickets = totalPassengersCount;
    const availableTickets = Math.max(0, totalPurchasedTickets - usedTickets);

    if (company.usedTickets !== usedTickets) {
      Company.findByIdAndUpdate(company._id, { usedTickets }).catch(() => {});
    }
    const { transactions: cleanTransactions, walletBalance: cleanWalletBalance } = await sanitizeCompanyTransactions(company, bookings);

    const walletBalance = parseFloat(cleanWalletBalance ?? company.walletBalance ?? 0);
    const purchasedPrice = parseFloat(company.purchasedPrice || 0);
    const ticketUnitPrice = totalPurchasedTickets > 0 
      ? Math.round((purchasedPrice / totalPurchasedTickets) * 100) / 100 
      : parseFloat(company.ticketUnitPrice || 0);

    const transactions = (cleanTransactions || []).map((t, idx) => ({
      ...t,
      id: t._id || `tx-${idx}`
    })).sort((a, b) => {
      const timeA = getTxTime(a);
      const timeB = getTxTime(b);
      if (timeA !== timeB) return timeB - timeA;
      const typeRank = { deposit: 1, reward: 2, refund: 2.5, deduction: 3 };
      return (typeRank[b.type] || 4) - (typeRank[a.type] || 4);
    });

    const totalWalletDeductions = (cleanTransactions || [])
      .filter(t => t.type === 'deduction')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const summary = {
      totalBookings: bookings.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalDeductions: Math.round((totalWalletDeductions || totalCost) * 100) / 100,
      totalProfit: Math.round((totalRevenue - totalCost) * 100) / 100,
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
        transactions
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
 * Deposit funds to a company's wallet ledger
 */
exports.depositFunds = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      amount = 0,
      date = new Date().toISOString().split('T')[0],
      time = '',
      reference = '',
      notes = ''
    } = req.body;

    const depositAmount = parseFloat(amount);

    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Deposit amount must be greater than zero.'
      });
    }

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    if (!company.transactions) company.transactions = [];
    company.transactions.push({
      type: 'deposit',
      amount: depositAmount,
      balanceBefore: 0,
      balanceAfter: 0,
      reference: reference.trim().toUpperCase(),
      notes: notes.trim(),
      date,
      time: time ? time.trim() : '',
      createdAt: new Date()
    });

    const { transactions: cleanTransactions, walletBalance: cleanBalance } = await sanitizeCompanyTransactions(company);

    await logActivity(
      req.user.id || req.user._id,
      'Deposit Funds',
      'Company',
      company._id,
      `Deposited ₹${depositAmount} to company ${company.name} (${company.code}).`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: `Successfully deposited ₹${depositAmount} to ${company.name}'s wallet.`,
      company: {
        ...company.toJSON(),
        transactions: cleanTransactions,
        walletBalance: cleanBalance
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Receive reward / cashback from a company
 */
exports.receiveReward = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      amount = 0,
      date = new Date().toISOString().split('T')[0],
      time = '',
      reference = '',
      notes = ''
    } = req.body;

    const rewardAmount = parseFloat(amount);

    if (isNaN(rewardAmount) || rewardAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Reward amount must be greater than zero.'
      });
    }

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    if (!company.transactions) company.transactions = [];
    company.transactions.push({
      type: 'reward',
      amount: rewardAmount,
      balanceBefore: 0,
      balanceAfter: 0,
      reference: reference.trim().toUpperCase(),
      notes: notes.trim(),
      date,
      time: time ? time.trim() : '',
      createdAt: new Date()
    });

    const { transactions: cleanTransactions, walletBalance: cleanBalance } = await sanitizeCompanyTransactions(company);

    await logActivity(
      req.user.id || req.user._id,
      'Receive Reward',
      'Company',
      company._id,
      `Received reward of ₹${rewardAmount} from company ${company.name} (${company.code}).`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: `Successfully received reward of ₹${rewardAmount} from ${company.name}.`,
      company: {
        ...company.toJSON(),
        transactions: cleanTransactions,
        walletBalance: cleanBalance
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a manual transaction (refund, deduction, deposit, or reward)
 */
exports.createManualTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      type = 'deduction',
      amount = 0,
      date = new Date().toISOString().split('T')[0],
      time = '',
      reference = '',
      notes = ''
    } = req.body;

    const txAmount = parseFloat(amount);
    if (isNaN(txAmount) || txAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than zero.'
      });
    }

    if (!['deduction', 'refund', 'deposit', 'reward'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction type.'
      });
    }

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    if (!company.transactions) company.transactions = [];
    company.transactions.push({
      type,
      amount: txAmount,
      balanceBefore: 0,
      balanceAfter: 0,
      reference: reference.trim().toUpperCase(),
      notes: notes.trim(),
      date,
      time: time ? time.trim() : '',
      isManual: true,
      createdAt: new Date()
    });

    const { transactions: cleanTransactions, walletBalance: cleanBalance } = await sanitizeCompanyTransactions(company);

    await logActivity(
      req.user.id || req.user._id,
      `Manual ${type.toUpperCase()}`,
      'Company',
      company._id,
      `Recorded manual ${type} of ₹${txAmount} for company ${company.name} (${company.code}).`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: `Successfully recorded ${type} of ₹${txAmount} for ${company.name}.`,
      company: {
        ...company.toJSON(),
        transactions: cleanTransactions,
        walletBalance: cleanBalance
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.deductFunds = async (req, res, next) => {
  req.body.type = 'deduction';
  return exports.createManualTransaction(req, res, next);
};

exports.recordRefund = async (req, res, next) => {
  req.body.type = 'refund';
  return exports.createManualTransaction(req, res, next);
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

/**
 * Update a wallet ledger transaction
 */
exports.updateTransaction = async (req, res, next) => {
  try {
    const { id, transactionId } = req.params;
    const {
      type,
      amount,
      date,
      time,
      reference,
      notes
    } = req.body;

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    if (!company.transactions || company.transactions.length === 0) {
      return res.status(404).json({ success: false, message: 'No transactions found for this company' });
    }

    const txIndex = company.transactions.findIndex(
      (t) => (t._id && t._id.toString() === transactionId) || t.id === transactionId
    );

    if (txIndex === -1) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const targetTx = company.transactions[txIndex];

    if (type && !['deposit', 'reward', 'refund', 'deduction'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction type' });
    }

    const newAmount = amount !== undefined ? parseFloat(amount) : targetTx.amount;
    if (isNaN(newAmount) || newAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero' });
    }

    const newType = type || targetTx.type;
    const newDate = date !== undefined ? date : targetTx.date;
    const newRef = reference !== undefined ? reference.trim().toUpperCase() : targetTx.reference;
    const newNotes = notes !== undefined ? notes.trim() : targetTx.notes;

    // Update target transaction
    targetTx.type = newType;
    targetTx.amount = newAmount;
    targetTx.date = newDate;
    if (time !== undefined) {
      targetTx.time = time ? time.trim() : '';
    }
    targetTx.reference = newRef;
    targetTx.notes = newNotes;

    const { transactions: cleanTransactions, walletBalance: cleanBalance } = await sanitizeCompanyTransactions(company);

    await logActivity(
      req.user.id || req.user._id,
      'Update Ledger Transaction',
      'Company',
      company._id,
      `Updated ${newType} transaction (${newRef || 'No Ref'}) for ${company.name} to ₹${newAmount}.`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'Wallet transaction updated successfully.',
      company: {
        ...company.toJSON(),
        transactions: cleanTransactions,
        walletBalance: cleanBalance
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a wallet ledger transaction
 */
exports.deleteTransaction = async (req, res, next) => {
  try {
    const { id, transactionId } = req.params;

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const txIndex = company.transactions.findIndex(
      (t) => (t._id && t._id.toString() === transactionId) || t.id === transactionId
    );

    if (txIndex === -1) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const deletedTx = company.transactions[txIndex];
    company.transactions.splice(txIndex, 1);

    const { transactions: cleanTransactions, walletBalance: cleanBalance } = await sanitizeCompanyTransactions(company);

    await logActivity(
      req.user.id || req.user._id,
      'Delete Ledger Transaction',
      'Company',
      company._id,
      `Deleted ${deletedTx.type} transaction of ₹${deletedTx.amount} for ${company.name}.`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'Wallet transaction deleted successfully.',
      company: {
        ...company.toJSON(),
        transactions: cleanTransactions,
        walletBalance: cleanBalance
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.sanitizeCompanyTransactions = sanitizeCompanyTransactions;

