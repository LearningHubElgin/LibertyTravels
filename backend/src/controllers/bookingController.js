const mongoose = require('mongoose');
const { Booking, Customer, Airline, Passenger, Payment, Transaction, Notification } = require('../models');
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
      airlineId,
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
    
    const targetCompId = companyId || airlineId;
    if (targetCompId) {
      query.$or = [{ companyId: targetCompId }, { airlineId: targetCompId }];
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
      .populate('airline', 'name code type')
      .populate('company', 'name code type')
      .populate('passengers', 'title firstName lastName passportNumber phone')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const normalizedBookings = bookings.map(b => ({
      ...b,
      id: b._id,
      company: b.company || b.airline
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
      .populate('airline')
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
    bookingData.company = bookingData.company || bookingData.airline;
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
      airlineId,
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

    const chosenCompanyId = companyId || airlineId || null;

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

    const booking = await Booking.create({
      referenceNo,
      serviceType: serviceType || 'flight',
      bookingDate,
      bookingType,
      sector: (sector || description || `${serviceType.toUpperCase()} BOOKING`).trim().toUpperCase(),
      description: description ? description.trim() : (sector || ''),
      journeyDate: journeyDate || bookingDate,
      returnDate: returnDate || null,
      airlineId: chosenCompanyId,
      companyId: chosenCompanyId,
      flightNumber: flightNumber ? flightNumber.trim().toUpperCase() : '',
      pnr: (pnr || referenceNo).trim().toUpperCase(),
      ticketNumber: ticketNumber ? ticketNumber.trim() : '',
      passengerName: primaryPassengerName,
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
      airlineId,
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

    if (serviceType) booking.serviceType = serviceType;
    if (bookingType) booking.bookingType = bookingType;
    if (sector) booking.sector = sector.trim().toUpperCase();
    if (description !== undefined) booking.description = description ? description.trim() : '';
    if (journeyDate) booking.journeyDate = journeyDate;
    if (returnDate !== undefined) booking.returnDate = returnDate || null;
    
    const chosenCompanyId = companyId || airlineId;
    if (chosenCompanyId) {
      booking.airlineId = chosenCompanyId;
      booking.companyId = chosenCompanyId;
    }
    if (flightNumber !== undefined) booking.flightNumber = flightNumber ? flightNumber.trim().toUpperCase() : '';
    if (pnr) booking.pnr = pnr.trim().toUpperCase();
    if (ticketNumber !== undefined) booking.ticketNumber = ticketNumber ? ticketNumber.trim() : '';
    if (passengerName !== undefined) booking.passengerName = passengerName ? passengerName.trim() : '';
    if (status) booking.status = status;
    if (notes !== undefined) booking.notes = notes ? notes.trim() : '';
    if (commission !== undefined) booking.commission = toDecimal(commission);

    if (costPrice !== undefined) booking.costPrice = toDecimal(costPrice);
    if (sellPrice !== undefined) {
      booking.sellPrice = toDecimal(sellPrice);
      booking.profit = toDecimal(booking.sellPrice - (booking.costPrice || 0));
      booking.totalAmount = booking.sellPrice;
      booking.balanceDue = toDecimal(Math.max(0, booking.totalAmount - (booking.amountReceived || 0)));
      booking.paymentStatus = booking.balanceDue <= 0 ? PAYMENT_STATUS.PAID : (booking.amountReceived > 0 ? PAYMENT_STATUS.PARTIALLY_PAID : PAYMENT_STATUS.UNPAID);
    }

    if (baseFare !== undefined || tax !== undefined || serviceCharge !== undefined || otherCharges !== undefined || discount !== undefined) {
      const financials = calculateBookingFinancials({
        baseFare: baseFare !== undefined ? baseFare : (booking.sellPrice || booking.baseFare),
        tax: tax !== undefined ? tax : booking.tax,
        serviceCharge: serviceCharge !== undefined ? serviceCharge : booking.serviceCharge,
        otherCharges: otherCharges !== undefined ? otherCharges : booking.otherCharges,
        discount: discount !== undefined ? discount : booking.discount,
        amountReceived: booking.amountReceived
      });

      booking.baseFare = financials.baseFare;
      booking.tax = financials.tax;
      booking.serviceCharge = financials.serviceCharge;
      booking.otherCharges = financials.otherCharges;
      booking.discount = financials.discount;
      if (sellPrice === undefined) {
        booking.totalAmount = financials.totalAmount;
        booking.sellPrice = financials.totalAmount;
        booking.profit = toDecimal(booking.sellPrice - (booking.costPrice || 0));
      }
      booking.balanceDue = financials.balanceDue;
      booking.paymentStatus = financials.paymentStatus;
    }

    await booking.save();

    if (passengers && Array.isArray(passengers) && passengers.length > 0) {
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
    }

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

