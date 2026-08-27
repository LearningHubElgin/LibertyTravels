const mongoose = require('mongoose');
const { Booking, Customer, Company, Passenger, Payment, Transaction, Notification } = require('../models');
const { generateBookingReference, generateCustomerCode, generateTransactionReference, generatePaymentReference } = require('../utils/referenceGenerator');
const { calculateBookingFinancials, toDecimal } = require('../utils/financialCalculations');
const { logActivity } = require('../middleware/activityLogger');
const { BOOKING_STATUS, PAYMENT_STATUS, TRANSACTION_TYPES } = require('../config/constants');

/**
 * Get all bookings with server-side filtering and pagination
 */
exports.getBookings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      paymentStatus,
      bookingType,
      serviceType,
      companyId,
      customerId,
      startDate,
      endDate,
      dateType = 'bookingDate',
      sort = 'createdAt',
      order = 'DESC'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (bookingType) query.bookingType = bookingType;
    if (serviceType && serviceType !== 'all') query.serviceType = serviceType;
    
    if (req.agencyId) {
      query.agencyId = req.agencyId;
    }
    
    if (companyId) {
      query.companyId = companyId;
    }
    if (customerId) query.customerId = customerId;

    if (startDate && endDate) {
      query[dateType] = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query[dateType] = { $gte: startDate };
    } else if (endDate) {
      query[dateType] = { $lte: endDate };
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      
      // Also find matching customer IDs and passenger booking IDs
      const matchingCustomers = await Customer.find({
        $or: [{ name: regex }, { phone: regex }, { customerCode: regex }]
      }).select('_id').lean();
      const matchingCustIds = matchingCustomers.map(c => c._id);

      const matchingPassengers = await Passenger.find({
        $or: [{ firstName: regex }, { lastName: regex }, { passportNumber: regex }]
      }).select('bookingId').lean();
      const matchingBookingIds = matchingPassengers.map(p => p.bookingId);

      query.$or = [
        { referenceNo: regex },
        { pnr: regex },
        { sector: regex },
        { description: regex },
        { passengerName: regex },
        { flightNumber: regex },
        { ticketNumber: regex },
        { customerId: { $in: matchingCustIds } },
        { _id: { $in: matchingBookingIds } }
      ];
    }

    const sortDirection = order.toUpperCase() === 'ASC' ? 1 : -1;
    const sortObj = { [sort === 'id' ? '_id' : sort]: sortDirection };

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('customer', 'customerCode name phone email')
      .populate('company', 'name code type')
      .populate('passengers', 'title firstName lastName passportNumber phone')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const normalizedBookings = bookings.map(b => ({
      ...b,
      id: b._id,
      company: b.company
    }));

    return res.status(200).json({
      success: true,
      bookings: normalizedBookings,
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

/**
 * Get single booking by ID with complete relationships
 */
exports.getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    const booking = await Booking.findById(id)
      .populate('customer')
      .populate('company')
      .populate('passengers')
      .populate({
        path: 'payments',
        populate: { path: 'receiver', select: 'name role' },
        options: { sort: { paymentDate: -1 } }
      })
      .populate('creator', 'name role');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const transactions = await Transaction.find({ bookingId: id })
      .populate('creator', 'name role')
      .sort({ transactionDate: -1, createdAt: -1 });

    const bookingData = booking.toJSON();
    bookingData.transactions = transactions;

    return res.status(200).json({
      success: true,
      booking: bookingData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new booking
 */
exports.createBooking = async (req, res, next) => {
  try {
    const {
      serviceType = 'flight',
      bookingDate = new Date().toISOString().split('T')[0],
      bookingType = 'one_way',
      sector = '',
      description = '',
      journeyDate = '',
      returnDate = null,
      companyId,
      flightNumber = '',
      pnr = '',
      referenceNo: customRefNo,
      ticketNumber = '',
      status = BOOKING_STATUS.CONFIRMED,
      
      passengerName = '',
      customerId: existingCustomerId,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,

      costPrice = 0,
      sellPrice = 0,
      baseFare = 0,
      tax = 0,
      serviceCharge = 0,
      otherCharges = 0,
      discount = 0,
      commission = 0,

      initialPayment = 0,
      paymentMethod = 'cash',
      paymentReference,
      paymentNotes,
      notes = '',

      passengers = []
    } = req.body;

    const chosenCompanyId = companyId || null;

    if (!existingCustomerId && (!customerName || !customerPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please select an existing customer or provide customer name and phone number.'
      });
    }

    let customerId = existingCustomerId;
    let customerObj = null;

    if (customerId) {
      customerObj = await Customer.findById(customerId);
      if (!customerObj) {
        return res.status(404).json({ success: false, message: 'Selected customer does not exist.' });
      }
    } else {
      const customerCode = await generateCustomerCode();
      customerObj = await Customer.create({
        customerCode,
        name: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail ? customerEmail.toLowerCase().trim() : '',
        address: customerAddress ? customerAddress.trim() : ''
      });
      customerId = customerObj._id;
    }

    const cPrice = toDecimal(costPrice);
    const sPrice = toDecimal(sellPrice);
    const calculatedProfit = toDecimal(sPrice - cPrice);

    const initPay = toDecimal(initialPayment);
    
    // Determine effective total amount
    let effectiveTotal = sPrice > 0 ? sPrice : 0;
    if (effectiveTotal === 0 && (baseFare > 0 || tax > 0 || serviceCharge > 0)) {
      effectiveTotal = toDecimal((baseFare || 0) + (tax || 0) + (serviceCharge || 0) + (otherCharges || 0) - (discount || 0));
    }

    const balanceDue = toDecimal(Math.max(0, effectiveTotal - initPay));
    const paymentStatus = balanceDue <= 0 ? PAYMENT_STATUS.PAID : (initPay > 0 ? PAYMENT_STATUS.PARTIALLY_PAID : PAYMENT_STATUS.UNPAID);

    if (initPay > effectiveTotal && effectiveTotal > 0) {
      return res.status(400).json({
        success: false,
        message: `Initial payment (₹${initPay}) cannot exceed total booking amount (₹${effectiveTotal}).`
      });
    }

    const referenceNo = customRefNo && customRefNo.trim() ? customRefNo.trim().toUpperCase() : await generateBookingReference();

    // Check if custom reference number already exists to give a clear user-friendly response
    if (customRefNo && customRefNo.trim()) {
      const existingRef = await Booking.findOne({ referenceNo });
      if (existingRef) {
        return res.status(409).json({
          success: false,
          message: `Booking Reference No / PNR "${referenceNo}" already exists in the system. Please enter a different reference number or leave it blank to auto-generate.`
        });
      }
    }

    // Determine primary passenger name
    let primaryPassengerName = passengerName ? passengerName.trim() : '';
    if (!primaryPassengerName && passengers && passengers.length > 0) {
      const p1 = passengers[0];
      primaryPassengerName = `${p1.firstName || ''} ${p1.lastName || ''}`.trim();
    }
    if (!primaryPassengerName && customerObj) {
      primaryPassengerName = customerObj.name;
    }
    if (!primaryPassengerName) {
      primaryPassengerName = 'Passenger';
    }

    // Compute passenger counts
    let finalPassengerCount = 1;
    let finalExtraGuests = 0;
    if (passengers && Array.isArray(passengers) && passengers.length > 0) {
      finalPassengerCount = passengers.length;
      finalExtraGuests = Math.max(0, passengers.length - 1);
    } else {
      const extra = parseInt(req.body.extraPassengers || req.body.extraGuests || 0, 10) || 0;
      finalExtraGuests = Math.max(0, extra);
      finalPassengerCount = 1 + finalExtraGuests;
    }

    const activeAgencyId = req.agencyId || (req.user && req.user.agencyId) || null;

    const booking = await Booking.create({
      referenceNo,
      agencyId: activeAgencyId,
      serviceType: serviceType || 'flight',
      bookingDate,
      bookingType,
      sector: (sector || description || `${serviceType.toUpperCase()} BOOKING`).trim().toUpperCase(),
      description: description ? description.trim() : (sector || ''),
      journeyDate: journeyDate || bookingDate,
      returnDate: returnDate || null,
      companyId: chosenCompanyId,
      flightNumber: flightNumber ? flightNumber.trim().toUpperCase() : '',
      pnr: (pnr || referenceNo).trim().toUpperCase(),
      ticketNumber: ticketNumber ? ticketNumber.trim() : '',
      passengerName: primaryPassengerName,
      passengerCount: finalPassengerCount,
      extraGuests: finalExtraGuests,
      status,
      paymentStatus,
      customerId,
      costPrice: cPrice,
      sellPrice: sPrice > 0 ? sPrice : effectiveTotal,
      profit: calculatedProfit,
      baseFare: baseFare || sPrice,
      tax: toDecimal(tax),
      serviceCharge: toDecimal(serviceCharge),
      otherCharges: toDecimal(otherCharges),
      discount: toDecimal(discount),
      totalAmount: effectiveTotal,
      amountReceived: initPay,
      balanceDue,
      commission: toDecimal(commission),
      notes: notes || description || '',
      createdBy: req.user ? (req.user.id || req.user._id) : null
    });

    // Handle passenger records
    let passengerRecords = [];
    if (passengers && passengers.length > 0) {
      passengerRecords = passengers.map(p => ({
        bookingId: booking._id,
        customerId,
        title: p.title || 'Mr',
        firstName: (p.firstName || primaryPassengerName.split(' ')[0] || 'Passenger').trim(),
        lastName: (p.lastName || primaryPassengerName.split(' ').slice(1).join(' ') || '').trim(),
        dateOfBirth: p.dateOfBirth || '',
        passportNumber: p.passportNumber ? p.passportNumber.trim().toUpperCase() : '',
        passportExpiry: p.passportExpiry || '',
        nationality: p.nationality ? p.nationality.trim() : 'Indian',
        phone: p.phone ? p.phone.trim() : (customerObj?.phone || '')
      }));
    } else {
      const parts = primaryPassengerName.split(' ');
      passengerRecords = [{
        bookingId: booking._id,
        customerId,
        title: 'Mr',
        firstName: parts[0] || 'Passenger',
        lastName: parts.slice(1).join(' ') || '',
        phone: customerObj?.phone || '',
        nationality: 'Indian'
      }];
    }

    await Passenger.insertMany(passengerRecords);

    const typeLabel = (serviceType || 'Travel').toUpperCase();
    const txnRef1 = await generateTransactionReference('TXN-BKG');
    await Transaction.create({
      transactionDate: bookingDate,
      referenceNo: txnRef1,
      bookingId: booking._id,
      customerId,
      description: `${typeLabel} Booking ${booking.referenceNo} - ${booking.description || booking.sector} (${primaryPassengerName})`,
      type: TRANSACTION_TYPES.BOOKING,
      debit: effectiveTotal,
      credit: 0.00,
      balance: effectiveTotal,
      paymentMethod: null,
      createdBy: req.user ? (req.user.id || req.user._id) : null
    });

    if (initPay > 0) {
      const payRef = paymentReference || await generatePaymentReference();
      await Payment.create({
        receiptNo: payRef,
        bookingId: booking._id,
        customerId,
        amount: initPay,
        paymentDate: bookingDate,
        paymentMethod,
        reference: payRef,
        notes: paymentNotes || `Initial payment received for ${booking.referenceNo}`,
        receivedBy: req.user ? (req.user.id || req.user._id) : null
      });

      const txnRef2 = await generateTransactionReference('TXN-PAY');
      await Transaction.create({
        transactionDate: bookingDate,
        referenceNo: txnRef2,
        bookingId: booking._id,
        customerId,
        description: `Payment received for ${booking.referenceNo} via ${paymentMethod.toUpperCase()}`,
        type: TRANSACTION_TYPES.CUSTOMER_PAYMENT,
        debit: 0.00,
        credit: initPay,
        balance: toDecimal(effectiveTotal - initPay),
        paymentMethod,
        createdBy: req.user ? (req.user.id || req.user._id) : null
      });
    }

    if (chosenCompanyId) {
      const ticketsUsedCount = passengerRecords.length || 1;
      await Company.findByIdAndUpdate(chosenCompanyId, {
        $inc: { usedTickets: ticketsUsedCount }
      });
    }

    await Notification.create({
      userId: null,
      title: `New ${typeLabel} Booking Created`,
      message: `Booking ${booking.referenceNo} created for ${customerObj.name}. Total: ₹${effectiveTotal}`,
      type: 'success'
    });

    await logActivity(
      req.user ? (req.user.id || req.user._id) : null,
      'Create Booking',
      'Booking',
      booking._id,
      `Booking ${booking.referenceNo} (${typeLabel}) created for ${customerObj.name}. Cost: ₹${cPrice}, Sell: ₹${effectiveTotal}, Profit: ₹${calculatedProfit}.`,
      req.ip
    );

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: booking.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update existing booking details
 */
exports.updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      serviceType,
      bookingType,
      sector,
      description,
      journeyDate,
      returnDate,
      companyId,
      flightNumber,
      pnr,
      ticketNumber,
      passengerName,
      status,
      costPrice,
      sellPrice,
      baseFare,
      tax,
      serviceCharge,
      otherCharges,
      discount,
      commission,
      passengers,
      notes
    } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (req.body.bookingDate) booking.bookingDate = req.body.bookingDate;
    if (serviceType) booking.serviceType = serviceType;
    if (bookingType) booking.bookingType = bookingType;
    if (sector) booking.sector = sector.trim().toUpperCase();
    if (description !== undefined) booking.description = description ? description.trim() : '';
    if (journeyDate) booking.journeyDate = journeyDate;
    if (returnDate !== undefined) booking.returnDate = returnDate || null;
    
    if (companyId) {
      booking.companyId = companyId;
    }
    if (flightNumber !== undefined) booking.flightNumber = flightNumber ? flightNumber.trim().toUpperCase() : '';
    if (pnr) booking.pnr = pnr.trim().toUpperCase();
    if (ticketNumber !== undefined) booking.ticketNumber = ticketNumber ? ticketNumber.trim() : '';
    if (passengerName !== undefined) booking.passengerName = passengerName ? passengerName.trim() : '';
    if (status) booking.status = status;
    if (notes !== undefined) booking.notes = notes ? notes.trim() : '';
    if (commission !== undefined) booking.commission = toDecimal(commission);
    if (tax !== undefined) booking.tax = toDecimal(tax);

    if (costPrice !== undefined) booking.costPrice = toDecimal(costPrice);
    if (sellPrice !== undefined) {
      booking.sellPrice = toDecimal(sellPrice);
      booking.totalAmount = booking.sellPrice;
      booking.profit = toDecimal(booking.sellPrice - (booking.costPrice || 0) - (booking.tax || 0));
      booking.balanceDue = toDecimal(Math.max(0, booking.totalAmount - (booking.amountReceived || 0)));
      booking.paymentStatus = booking.balanceDue <= 0 ? PAYMENT_STATUS.PAID : (booking.amountReceived > 0 ? PAYMENT_STATUS.PARTIALLY_PAID : PAYMENT_STATUS.UNPAID);
    }

    if (baseFare !== undefined || serviceCharge !== undefined || otherCharges !== undefined || discount !== undefined) {
      const financials = calculateBookingFinancials({
        baseFare: baseFare !== undefined ? baseFare : (booking.sellPrice || booking.baseFare),
        tax: booking.tax || 0,
        serviceCharge: serviceCharge !== undefined ? serviceCharge : booking.serviceCharge,
        otherCharges: otherCharges !== undefined ? otherCharges : booking.otherCharges,
        discount: discount !== undefined ? discount : booking.discount,
        amountReceived: booking.amountReceived
      });

      booking.baseFare = financials.baseFare;
      booking.serviceCharge = financials.serviceCharge;
      booking.otherCharges = financials.otherCharges;
      booking.discount = financials.discount;
      if (sellPrice === undefined) {
        booking.totalAmount = financials.totalAmount;
        booking.sellPrice = financials.totalAmount;
        booking.profit = toDecimal(booking.sellPrice - (booking.costPrice || 0) - (booking.tax || 0));
      }
      booking.balanceDue = financials.balanceDue;
      booking.paymentStatus = financials.paymentStatus;
    }

    if (passengers && Array.isArray(passengers) && passengers.length > 0) {
      booking.passengerCount = passengers.length;
      booking.extraGuests = Math.max(0, passengers.length - 1);
      await Passenger.deleteMany({ bookingId: id });
      const newPassengers = passengers.map(p => ({
        bookingId: id,
        customerId: booking.customerId,
        title: p.title || 'Mr',
        firstName: (p.firstName || '').trim(),
        lastName: (p.lastName || '').trim(),
        dateOfBirth: p.dateOfBirth || '',
        passportNumber: p.passportNumber ? p.passportNumber.trim().toUpperCase() : '',
        passportExpiry: p.passportExpiry || '',
        nationality: p.nationality ? p.nationality.trim() : 'Indian',
        phone: p.phone ? p.phone.trim() : ''
      }));
      await Passenger.insertMany(newPassengers);
    } else if (req.body.extraGuests !== undefined) {
      const extra = parseInt(req.body.extraGuests || 0, 10) || 0;
      booking.extraGuests = extra;
      booking.passengerCount = 1 + extra;
    }

    await booking.save();

    await logActivity(
      req.user ? (req.user.id || req.user._id) : null,
      'Update Booking',
      'Booking',
      booking._id,
      `Booking ${booking.referenceNo} details updated.`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      booking: booking.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel or update booking status
 */
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !Object.values(BOOKING_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking status'
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const oldStatus = booking.status;
    booking.status = status;
    await booking.save();

    await logActivity(
      req.user ? (req.user.id || req.user._id) : null,
      'Change Booking Status',
      'Booking',
      booking._id,
      `Booking ${booking.referenceNo} status changed from ${oldStatus} to ${status}.`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}`,
      booking: booking.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add payment to a booking
 */
exports.addPaymentToBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, paymentDate = new Date().toISOString().split('T')[0], paymentMethod = 'cash', reference, notes } = req.body;

    const payAmount = toDecimal(amount);
    if (payAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero.'
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const currentBalance = parseFloat(booking.balanceDue);
    if (payAmount > currentBalance) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${payAmount}) cannot exceed outstanding balance (₹${currentBalance}).`
      });
    }

    const payRef = reference || await generatePaymentReference();
    const payment = await Payment.create({
      receiptNo: payRef,
      bookingId: booking._id,
      customerId: booking.customerId,
      amount: payAmount,
      paymentDate,
      paymentMethod,
      reference: payRef,
      notes: notes || `Payment for booking ${booking.referenceNo}`,
      receivedBy: req.user ? (req.user.id || req.user._id) : null
    });

    const newAmountReceived = toDecimal(parseFloat(booking.amountReceived) + payAmount);
    const newBalanceDue = toDecimal(parseFloat(booking.totalAmount) - newAmountReceived);
    const newPaymentStatus = newBalanceDue <= 0 ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PARTIALLY_PAID;

    booking.amountReceived = newAmountReceived;
    booking.balanceDue = newBalanceDue;
    booking.paymentStatus = newPaymentStatus;
    await booking.save();

    const txnRef = await generateTransactionReference('TXN-PAY');
    await Transaction.create({
      transactionDate: paymentDate,
      referenceNo: txnRef,
      bookingId: booking._id,
      customerId: booking.customerId,
      description: `Payment received for ${booking.referenceNo} via ${paymentMethod.toUpperCase()}`,
      type: TRANSACTION_TYPES.CUSTOMER_PAYMENT,
      debit: 0.00,
      credit: payAmount,
      balance: newBalanceDue,
      paymentMethod,
      createdBy: req.user ? (req.user.id || req.user._id) : null
    });

    await Notification.create({
      userId: null,
      title: 'Payment Received',
      message: `Payment of ₹${payAmount} received for ${booking.referenceNo} (${paymentMethod.toUpperCase()}).`,
      type: 'info'
    });

    await logActivity(
      req.user ? (req.user.id || req.user._id) : null,
      'Receive Payment',
      'Payment',
      payment._id,
      `Payment of ₹${payAmount} received for ${booking.referenceNo}. Remaining balance: ₹${newBalanceDue}.`,
      req.ip
    );

    return res.status(201).json({
      success: true,
      message: 'Payment received successfully',
      payment: payment.toJSON(),
      booking: booking.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete booking
 */
exports.deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const refNo = booking.referenceNo;

    await Payment.deleteMany({ bookingId: id });
    await Transaction.deleteMany({ bookingId: id });
    await Passenger.deleteMany({ bookingId: id });

    if (booking.companyId) {
      const ticketsCount = booking.passengerCount || (1 + (parseInt(booking.extraGuests || 0, 10) || 0));
      await Company.findByIdAndUpdate(booking.companyId, {
        $inc: { usedTickets: -ticketsCount }
      }).catch(() => {});
    }

    await Booking.findByIdAndDelete(id);

    await logActivity(
      req.user ? (req.user.id || req.user._id) : null,
      'Delete Booking',
      'Booking',
      id,
      `Booking ${refNo} was deleted along with linked transactions and payments.`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk Import Bookings from Excel / CSV Sheet
 */
exports.bulkImportBookings = async (req, res, next) => {
  try {
    const { bookings = [] } = req.body;

    if (!Array.isArray(bookings) || bookings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No booking rows provided for Excel import.'
      });
    }

    const updateExisting = req.body.updateExisting !== false;
    const activeAgencyId = req.agencyId || (req.user && req.user.agencyId) || null;
    const userId = req.user ? (req.user.id || req.user._id) : null;

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors = [];
    const createdBookings = [];

    // Cache of companies to avoid redundant lookups
    const agencyCompanies = await Company.find({
      ...(activeAgencyId ? { agencyId: activeAgencyId } : {})
    });
    const companyMap = new Map();
    agencyCompanies.forEach((c) => {
      companyMap.set(c.name.toLowerCase().trim(), c);
      if (c.code) companyMap.set(c.code.toLowerCase().trim(), c);
    });

    const normalizeServiceType = (val) => {
      if (!val) return 'flight';
      const s = String(val).toLowerCase().trim();
      if (s.includes('train') || s.includes('rail') || s.includes('irctc')) return 'train';
      if (s.includes('bus') || s.includes('volvo') || s.includes('coach')) return 'bus';
      if (s.includes('hotel') || s.includes('room') || s.includes('resort') || s.includes('stay') || s.includes('villa')) return 'hotel';
      if (s.includes('car') || s.includes('cab') || s.includes('taxi') || s.includes('driver')) return 'car';
      if (s.includes('flight') || s.includes('air') || s.includes('plane') || s.includes('indigo') || s.includes('spicejet') || s.includes('airindia')) return 'flight';
      return 'flight';
    };

    const parseExcelDate = (val) => {
      if (!val) return new Date().toISOString().split('T')[0];
      if (val instanceof Date && !isNaN(val)) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const d = String(val.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      if (typeof val === 'number' && val > 0) {
        const date = new Date(Math.round((val - 25569) * 86400 * 1000));
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const d = String(date.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      const str = String(val).trim();
      const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
      if (dmyMatch) {
        const day = dmyMatch[1].padStart(2, '0');
        const month = dmyMatch[2].padStart(2, '0');
        const year = dmyMatch[3];
        return `${year}-${month}-${day}`;
      }
      const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
      if (ymdMatch) {
        const year = ymdMatch[1];
        const month = ymdMatch[2].padStart(2, '0');
        const day = ymdMatch[3].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      const dmyShortMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/);
      if (dmyShortMatch) {
        const day = dmyShortMatch[1].padStart(2, '0');
        const month = dmyShortMatch[2].padStart(2, '0');
        const year = `20${dmyShortMatch[3]}`;
        return `${year}-${month}-${day}`;
      }
      return str;
    };

    for (let i = 0; i < bookings.length; i++) {
      const row = bookings[i];
      try {
        const customerName = (row.customerName || row.name || row.passengerName || 'Valued Guest').trim();
        const customerPhone = (row.customerPhone || row.phone || row.mobile || '').toString().trim();
        const customerEmail = (row.customerEmail || row.email || '').toString().toLowerCase().trim();
        const serviceType = normalizeServiceType(
          row.serviceType ||
          row.service ||
          row.services ||
          row.type ||
          row['Services - FLIGHT/TRAIN/ETC'] ||
          row['FLIGHT/TRAIN/ETC'] ||
          row['Services'] ||
          row['Service']
        );

        // 1. Find existing customer by ID, Name (case-insensitive), or Phone within agency
        let customer = null;
        if (row.customerId && mongoose.Types.ObjectId.isValid(row.customerId)) {
          customer = await Customer.findOne({
            _id: row.customerId,
            ...(activeAgencyId ? { agencyId: activeAgencyId } : {})
          });
        }

        if (!customer && customerName) {
          const escapedName = customerName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
          customer = await Customer.findOne({
            ...(activeAgencyId ? { agencyId: activeAgencyId } : {}),
            name: { $regex: new RegExp(`^${escapedName}$`, 'i') }
          });
        }

        if (!customer && customerPhone && customerPhone !== '+91 9800000000' && customerPhone !== '+919800000000') {
          customer = await Customer.findOne({
            ...(activeAgencyId ? { agencyId: activeAgencyId } : {}),
            phone: customerPhone
          });
        }

        // If still not found, create new Customer record
        if (!customer) {
          const customerCode = await generateCustomerCode();
          customer = await Customer.create({
            agencyId: activeAgencyId,
            customerCode,
            name: customerName,
            phone: customerPhone || '+91 9800000000',
            email: customerEmail,
            address: row.customerAddress || row.address || ''
          });
        }

        // 2. Find or create Company / Vendor
        const rawCompName = (row.companyName || row.company || row.vendor || `${serviceType.toUpperCase()} Vendor`).trim();
        let company = companyMap.get(rawCompName.toLowerCase());
        if (!company) {
          const compCode = rawCompName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'VND';
          company = await Company.create({
            agencyId: activeAgencyId,
            name: rawCompName,
            code: compCode,
            type: serviceType,
            status: 'active'
          });
          companyMap.set(rawCompName.toLowerCase(), company);
        }

        // 3. Compute Financials
        const costPrice = toDecimal(parseFloat(row.costPrice || row.cost || row.buyRate || 0));
        const sellPrice = toDecimal(parseFloat(row.sellPrice || row.sell || row.price || row.amount || costPrice || 0));
        const tax = toDecimal(parseFloat(row.tax || row.gst || 0));
        const initialPayment = toDecimal(parseFloat(row.initialPayment || row.paid || row.amountReceived || 0));
        
        const grossProfit = toDecimal(sellPrice - costPrice);
        const netProfit = tax > 0 ? toDecimal(grossProfit - tax) : grossProfit;
        const totalAmount = sellPrice > 0 ? sellPrice : costPrice;
        const balanceDue = toDecimal(Math.max(0, totalAmount - initialPayment));
        const paymentStatus = balanceDue <= 0 ? 'paid' : initialPayment > 0 ? 'partially_paid' : 'unpaid';

        // 4. Generate reference if not given & Check if booking already exists in DB
        let referenceNo = (row.referenceNo || row.pnr || row.ref || '').toString().trim().toUpperCase();
        const rawPnr = (row.pnr || referenceNo || '').toString().trim().toUpperCase();

        if (referenceNo) {
          const existingBooking = await Booking.findOne({
            ...(activeAgencyId ? { agencyId: activeAgencyId } : {}),
            $or: [{ referenceNo }, { pnr: referenceNo }, { pnr: rawPnr }]
          });

          if (existingBooking) {
            const shouldUpdateThisRow = row.shouldUpdate !== undefined ? row.shouldUpdate : updateExisting;

            if (!shouldUpdateThisRow) {
              skippedCount++;
              continue;
            }

            // --- Update Existing Booking with Changed / Modified Data ---
            const bookingDate = parseExcelDate(row.bookingDate || row.date);
            const journeyDate = parseExcelDate(row.journeyDate || row.travelDate || row.bookingDate || row.date);
            const sector = (row.sector || row.route || row.description || `${serviceType.toUpperCase()} Booking`).trim().toUpperCase();

            const oldTicketCount = existingBooking.passengerCount || (1 + (existingBooking.extraGuests || 0));
            const extraPaxCount = parseInt(row.extraPassengers || row.extraGuests || row.extraPassenger || row.extraPax || 0, 10) || 0;
            const totalTickets = 1 + Math.max(0, extraPaxCount);
            const deltaTickets = totalTickets - oldTicketCount;
            const primaryPaxName = (row.passengerName || customerName).trim();

            existingBooking.serviceType = serviceType;
            existingBooking.bookingDate = bookingDate;
            existingBooking.sector = sector;
            existingBooking.description = row.description || sector;
            existingBooking.journeyDate = journeyDate;
            existingBooking.companyId = company._id;
            existingBooking.flightNumber = (row.flightNumber || row.trainNumber || existingBooking.flightNumber || '').toString().trim().toUpperCase();
            existingBooking.pnr = rawPnr;
            existingBooking.passengerName = primaryPaxName;
            existingBooking.passengerCount = totalTickets;
            existingBooking.extraGuests = extraPaxCount;
            existingBooking.customerId = customer._id;
            existingBooking.costPrice = costPrice;
            existingBooking.sellPrice = sellPrice;
            existingBooking.profit = netProfit;
            existingBooking.baseFare = sellPrice;
            existingBooking.tax = tax;
            existingBooking.totalAmount = totalAmount;
            existingBooking.balanceDue = balanceDue;
            existingBooking.paymentStatus = paymentStatus;
            if (row.notes) existingBooking.notes = row.notes;

            await existingBooking.save();

            // Re-sync passenger records for this existing booking
            await Passenger.deleteMany({ bookingId: existingBooking._id });
            const nameParts = primaryPaxName.split(' ');
            const p1First = nameParts[0] || primaryPaxName;
            const p1Last = nameParts.slice(1).join(' ') || '';

            const passengerRecords = [{
              bookingId: existingBooking._id,
              customerId: customer._id,
              title: 'Mr',
              firstName: p1First,
              lastName: p1Last,
              phone: customerPhone
            }];

            for (let g = 1; g <= extraPaxCount; g++) {
              passengerRecords.push({
                bookingId: existingBooking._id,
                customerId: customer._id,
                title: 'Mr',
                firstName: `${p1First} (Guest ${g})`,
                lastName: p1Last,
                phone: customerPhone
              });
            }
            await Passenger.insertMany(passengerRecords);

            // Adjust company ticket quota if ticket count changed
            if (deltaTickets !== 0 && company && company._id) {
              await Company.findByIdAndUpdate(company._id, {
                $inc: { usedTickets: deltaTickets }
              });
            }

            updatedCount++;
            createdBookings.push({
              id: existingBooking._id,
              referenceNo: existingBooking.referenceNo,
              customerName: customer.name,
              serviceType: existingBooking.serviceType,
              totalAmount: existingBooking.totalAmount,
              isUpdated: true
            });
            continue;
          }
        } else {
          referenceNo = await generateBookingReference();
        }

        const bookingDate = parseExcelDate(row.bookingDate || row.date);
        const journeyDate = parseExcelDate(row.journeyDate || row.travelDate || row.bookingDate || row.date);
        const sector = (row.sector || row.route || row.description || `${serviceType.toUpperCase()} Booking`).trim().toUpperCase();

        // 5. Compute passenger count & extra guests
        const extraPaxCount = parseInt(row.extraPassengers || row.extraGuests || row.extraPassenger || row.extraPax || 0, 10) || 0;
        const totalTickets = 1 + Math.max(0, extraPaxCount);
        const primaryPaxName = (row.passengerName || customerName).trim();

        // Create Booking Document
        const newBooking = await Booking.create({
          referenceNo,
          agencyId: activeAgencyId,
          serviceType,
          bookingDate,
          bookingType: row.bookingType || 'one_way',
          sector,
          description: row.description || sector,
          journeyDate,
          returnDate: row.returnDate || null,
          companyId: company._id,
          flightNumber: (row.flightNumber || row.trainNumber || '').toString().trim().toUpperCase(),
          pnr: (row.pnr || referenceNo).toString().trim().toUpperCase(),
          ticketNumber: (row.ticketNumber || '').toString().trim(),
          passengerName: primaryPaxName,
          passengerCount: totalTickets,
          extraGuests: extraPaxCount,
          status: row.status || 'confirmed',
          paymentStatus,
          customerId: customer._id,
          costPrice,
          sellPrice,
          profit: netProfit,
          baseFare: sellPrice,
          tax,
          totalAmount,
          amountReceived: initialPayment,
          balanceDue,
          commission: 0,
          notes: row.notes || 'Imported via Excel Sheet',
          createdBy: userId
        });

        // 6. Create Lead Passenger + Extra Guests
        const nameParts = primaryPaxName.split(' ');
        const p1First = nameParts[0] || primaryPaxName;
        const p1Last = nameParts.slice(1).join(' ') || '';

        const passengerRecords = [{
          bookingId: newBooking._id,
          customerId: customer._id,
          title: 'Mr',
          firstName: p1First,
          lastName: p1Last,
          phone: customerPhone
        }];

        for (let g = 1; g <= extraPaxCount; g++) {
          passengerRecords.push({
            bookingId: newBooking._id,
            customerId: customer._id,
            title: 'Mr',
            firstName: `${p1First} (Guest ${g})`,
            lastName: p1Last,
            phone: customerPhone
          });
        }

        await Passenger.insertMany(passengerRecords);

        // Deduct from Company Quota / Available Tickets (increment usedTickets by totalTickets)
        if (company && company._id) {
          await Company.findByIdAndUpdate(company._id, {
            $inc: { usedTickets: totalTickets }
          });
        }

        // 7. If initial payment exists, record Payment and Ledger Transaction
        if (initialPayment > 0) {
          const paymentRef = await generatePaymentReference();
          await Payment.create({
            agencyId: activeAgencyId,
            bookingId: newBooking._id,
            customerId: customer._id,
            amount: initialPayment,
            paymentDate: bookingDate,
            paymentMethod: row.paymentMethod || 'cash',
            reference: paymentRef,
            notes: 'Initial payment recorded during Excel bulk import',
            receivedBy: userId
          });

          const txnRef = await generateTransactionReference();
          await Transaction.create({
            agencyId: activeAgencyId,
            bookingId: newBooking._id,
            customerId: customer._id,
            type: TRANSACTION_TYPES.PAYMENT,
            amount: initialPayment,
            transactionDate: bookingDate,
            reference: txnRef,
            description: `Payment received for ${referenceNo} (Excel Import)`,
            paymentMethod: row.paymentMethod || 'cash',
            createdBy: userId
          });
        }

        importedCount++;
        createdBookings.push({
          id: newBooking._id,
          referenceNo: newBooking.referenceNo,
          customerName: customer.name,
          serviceType: newBooking.serviceType,
          totalAmount: newBooking.totalAmount
        });
      } catch (rowErr) {
        errors.push({ row: i + 1, error: rowErr.message });
      }
    }

    await logActivity(
      userId,
      'Excel Bulk Import',
      'Booking',
      null,
      `Successfully imported ${importedCount} bookings from Excel sheet.`,
      req.ip
    );

    let summaryMsg = `Processed ${importedCount + updatedCount} bookings successfully!`;
    if (importedCount > 0 && updatedCount > 0) {
      summaryMsg = `Successfully created ${importedCount} new bookings and updated ${updatedCount} existing bookings in database!`;
    } else if (updatedCount > 0) {
      summaryMsg = `Successfully updated ${updatedCount} existing bookings with modified data in database!`;
    } else if (importedCount > 0) {
      summaryMsg = `Successfully imported ${importedCount} new bookings into database!`;
    }
    if (skippedCount > 0) {
      summaryMsg += ` (${skippedCount} unchanged bookings kept as-is).`;
    }

    return res.status(200).json({
      success: true,
      message: summaryMsg,
      importedCount,
      updatedCount,
      skippedCount,
      totalRows: bookings.length,
      errors: errors.length > 0 ? errors : undefined,
      data: createdBookings
    });
  } catch (error) {
    next(error);
  }
};

