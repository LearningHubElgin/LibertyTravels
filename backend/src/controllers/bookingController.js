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
      airlineId,
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
    if (airlineId) query.airlineId = airlineId;
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
      .populate('airline', 'name code')
      .populate('passengers', 'title firstName lastName passportNumber')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    return res.status(200).json({
      success: true,
      bookings,
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

    const booking = await Booking.findById(id)
      .populate('customer')
      .populate('airline')
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
      bookingDate = new Date().toISOString().split('T')[0],
      bookingType = 'one_way',
      sector,
      journeyDate,
      returnDate,
      airlineId,
      flightNumber,
      pnr,
      ticketNumber,
      status = BOOKING_STATUS.CONFIRMED,
      
      customerId: existingCustomerId,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,

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

      passengers = []
    } = req.body;

    if (!sector || !journeyDate || !airlineId || !flightNumber || !pnr) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Sector, Journey Date, Airline, Flight Number, and PNR.'
      });
    }

    if (!existingCustomerId && (!customerName || !customerPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please select an existing customer or provide customer name and phone number.'
      });
    }

    if (!passengers || passengers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one passenger is required for a booking.'
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

    const initPay = toDecimal(initialPayment);
    const financials = calculateBookingFinancials({
      baseFare,
      tax,
      serviceCharge,
      otherCharges,
      discount,
      amountReceived: initPay
    });

    if (initPay > financials.totalAmount) {
      return res.status(400).json({
        success: false,
        message: `Initial payment (₹${initPay}) cannot exceed total booking amount (₹${financials.totalAmount}).`
      });
    }

    const referenceNo = await generateBookingReference();

    const booking = await Booking.create({
      referenceNo,
      bookingDate,
      bookingType,
      sector: sector.trim().toUpperCase(),
      journeyDate,
      returnDate: returnDate || null,
      airlineId,
      flightNumber: flightNumber.trim().toUpperCase(),
      pnr: pnr.trim().toUpperCase(),
      ticketNumber: ticketNumber ? ticketNumber.trim() : '',
      status,
      paymentStatus: financials.paymentStatus,
      customerId,
      baseFare: financials.baseFare,
      tax: financials.tax,
      serviceCharge: financials.serviceCharge,
      otherCharges: financials.otherCharges,
      discount: financials.discount,
      totalAmount: financials.totalAmount,
      amountReceived: financials.amountReceived,
      balanceDue: financials.balanceDue,
      commission: toDecimal(commission),
      createdBy: req.user ? (req.user.id || req.user._id) : null
    });

    const passengerRecords = passengers.map(p => ({
      bookingId: booking._id,
      customerId,
      title: p.title || 'Mr',
      firstName: (p.firstName || '').trim(),
      lastName: (p.lastName || '').trim(),
      dateOfBirth: p.dateOfBirth || '',
      passportNumber: p.passportNumber ? p.passportNumber.trim().toUpperCase() : '',
      passportExpiry: p.passportExpiry || '',
      nationality: p.nationality ? p.nationality.trim() : 'Indian',
      phone: p.phone ? p.phone.trim() : ''
    }));

    await Passenger.insertMany(passengerRecords);

    const txnRef1 = await generateTransactionReference('TXN-BKG');
    await Transaction.create({
      transactionDate: bookingDate,
      referenceNo: txnRef1,
      bookingId: booking._id,
      customerId,
      description: `Flight Booking ${booking.referenceNo} (${booking.sector}) - ${booking.flightNumber}`,
      type: TRANSACTION_TYPES.BOOKING,
      debit: financials.totalAmount,
      credit: 0.00,
      balance: financials.totalAmount,
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
        notes: paymentNotes || 'Initial payment received at booking',
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
        balance: toDecimal(financials.totalAmount - initPay),
        paymentMethod,
        createdBy: req.user ? (req.user.id || req.user._id) : null
      });
    }

    await Notification.create({
      userId: null,
      title: 'New Booking Created',
      message: `Booking ${booking.referenceNo} created for ${customerObj.name} (${booking.sector}). Amount: ₹${financials.totalAmount}`,
      type: 'success'
    });

    await logActivity(
      req.user ? (req.user.id || req.user._id) : null,
      'Create Booking',
      'Booking',
      booking._id,
      `Booking ${booking.referenceNo} created for ${customerObj.name}. Total: ₹${financials.totalAmount}, Received: ₹${financials.amountReceived}.`,
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
      bookingType,
      sector,
      journeyDate,
      returnDate,
      airlineId,
      flightNumber,
      pnr,
      ticketNumber,
      status,
      baseFare,
      tax,
      serviceCharge,
      otherCharges,
      discount,
      commission,
      passengers
    } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (bookingType) booking.bookingType = bookingType;
    if (sector) booking.sector = sector.trim().toUpperCase();
    if (journeyDate) booking.journeyDate = journeyDate;
    if (returnDate !== undefined) booking.returnDate = returnDate || null;
    if (airlineId) booking.airlineId = airlineId;
    if (flightNumber) booking.flightNumber = flightNumber.trim().toUpperCase();
    if (pnr) booking.pnr = pnr.trim().toUpperCase();
    if (ticketNumber !== undefined) booking.ticketNumber = ticketNumber ? ticketNumber.trim() : '';
    if (status) booking.status = status;
    if (commission !== undefined) booking.commission = toDecimal(commission);

    if (baseFare !== undefined || tax !== undefined || serviceCharge !== undefined || otherCharges !== undefined || discount !== undefined) {
      const financials = calculateBookingFinancials({
        baseFare: baseFare !== undefined ? baseFare : booking.baseFare,
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
      booking.totalAmount = financials.totalAmount;
      booking.balanceDue = financials.balanceDue;
      booking.paymentStatus = financials.paymentStatus;
    }

    await booking.save();

    if (passengers && Array.isArray(passengers)) {
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
