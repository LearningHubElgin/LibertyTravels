const { Payment, Booking, Customer, Transaction, Notification } = require('../models');
const { toDecimal } = require('../utils/financialCalculations');
const { generatePaymentReference, generateTransactionReference } = require('../utils/referenceGenerator');
const { logActivity } = require('../middleware/activityLogger');
const { PAYMENT_STATUS, TRANSACTION_TYPES } = require('../config/constants');

exports.getPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, method, startDate, endDate, sort = 'paymentDate', order = 'DESC' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (method) query.paymentMethod = method;
    if (startDate && endDate) {
      query.paymentDate = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.paymentDate = { $gte: startDate };
    } else if (endDate) {
      query.paymentDate = { $lte: endDate };
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');

      const matchingCustomers = await Customer.find({ name: regex }).select('_id');
      const matchingBookings = await Booking.find({ referenceNo: regex }).select('_id');

      query.$or = [
        { receiptNo: regex },
        { reference: regex },
        { customerId: { $in: matchingCustomers.map(c => c._id) } },
        { bookingId: { $in: matchingBookings.map(b => b._id) } }
      ];
    }

    const sortDirection = order.toUpperCase() === 'ASC' ? 1 : -1;
    const sortObj = { [sort === 'id' ? '_id' : sort]: sortDirection };

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('customer', 'customerCode name phone')
      .populate('booking', 'referenceNo sector totalAmount amountReceived balanceDue')
      .populate('receiver', 'name role')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      payments,
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

exports.createPayment = async (req, res, next) => {
  try {
    const {
      bookingId,
      amount,
      paymentDate = new Date().toISOString().split('T')[0],
      accountType = 'cash',
      bankId = null,
      bankName = null,
      paymentMethod = 'cash',
      upiMethod,
      upiApp,
      splits,
      reference,
      notes
    } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and payment amount are required'
      });
    }

    const payAmount = toDecimal(amount);
    if (payAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero'
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const currentBalance = parseFloat(booking.balanceDue);
    if (payAmount > currentBalance + 0.01) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${payAmount}) cannot exceed outstanding balance (₹${currentBalance}).`
      });
    }

    const isSplit = Array.isArray(splits) && splits.length > 0;
    const payRef = reference || await generatePaymentReference();

    const payment = await Payment.create({
      receiptNo: payRef,
      bookingId: booking._id,
      customerId: booking.customerId,
      amount: payAmount,
      paymentDate,
      accountType: isSplit ? 'cash' : (accountType || (paymentMethod === 'cash' ? 'cash' : 'bank')),
      bankId: isSplit ? null : (bankId || null),
      bankName: isSplit ? null : (bankName || null),
      paymentMethod: isSplit ? 'other' : paymentMethod,
      upiMethod: isSplit ? null : (upiMethod || upiApp || null),
      upiApp: isSplit ? null : (upiApp || upiMethod || null),
      splits: isSplit ? splits.map(s => ({
        accountType: s.accountType || (s.paymentMethod === 'cash' ? 'cash' : 'bank'),
        bankId: s.bankId || null,
        bankName: s.bankName || null,
        paymentMethod: s.paymentMethod || 'cash',
        upiApp: s.upiApp || s.upiMethod || null,
        amount: toDecimal(s.amount),
        reference: s.reference || ''
      })) : [],
      reference: payRef,
      notes: notes || `Payment for booking ${booking.referenceNo}`,
      receivedBy: req.user ? (req.user.id || req.user._id) : null
    });

    const newAmountReceived = toDecimal(parseFloat(booking.amountReceived) + payAmount);
    const newBalanceDue = toDecimal(Math.max(0, parseFloat(booking.totalAmount) - newAmountReceived));
    booking.amountReceived = newAmountReceived;
    booking.balanceDue = newBalanceDue;
    booking.paymentStatus = newBalanceDue <= 0 ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PARTIALLY_PAID;
    await booking.save();

    // Record ledger transactions for each split or single payment
    if (isSplit) {
      for (const s of splits) {
        const sAmount = toDecimal(s.amount);
        if (sAmount <= 0) continue;
        const txnRef = await generateTransactionReference('TXN-PAY');
        const sAccountType = s.accountType || (s.paymentMethod === 'cash' ? 'cash' : 'bank');
        const sBankDesc = s.bankName ? ` (${s.bankName})` : '';
        const sUpiDesc = s.upiApp ? ` via ${s.upiApp}` : '';
        await Transaction.create({
          transactionDate: paymentDate,
          referenceNo: txnRef,
          bookingId: booking._id,
          customerId: booking.customerId,
          description: `Payment received for ${booking.referenceNo} [Split] - ${s.paymentMethod.toUpperCase()}${sBankDesc}${sUpiDesc}`,
          type: TRANSACTION_TYPES.CUSTOMER_PAYMENT,
          debit: 0.00,
          credit: sAmount,
          balance: newBalanceDue,
          accountType: sAccountType,
          bankId: s.bankId || null,
          bankName: s.bankName || null,
          paymentMethod: s.paymentMethod,
          upiMethod: s.upiApp || s.upiMethod || null,
          upiApp: s.upiApp || null,
          createdBy: req.user ? (req.user.id || req.user._id) : null
        });
      }
    } else {
      const txnRef = await generateTransactionReference('TXN-PAY');
      const singleAccountType = accountType || (paymentMethod === 'cash' ? 'cash' : 'bank');
      const bankDesc = bankName ? ` (${bankName})` : '';
      const upiDesc = (upiApp || upiMethod) ? ` via ${upiApp || upiMethod}` : '';
      await Transaction.create({
        transactionDate: paymentDate,
        referenceNo: txnRef,
        bookingId: booking._id,
        customerId: booking.customerId,
        description: `Payment received for ${booking.referenceNo} via ${paymentMethod.toUpperCase()}${bankDesc}${upiDesc}`,
        type: TRANSACTION_TYPES.CUSTOMER_PAYMENT,
        debit: 0.00,
        credit: payAmount,
        balance: newBalanceDue,
        accountType: singleAccountType,
        bankId: bankId || null,
        bankName: bankName || null,
        paymentMethod,
        upiMethod: upiMethod || upiApp || null,
        upiApp: upiApp || upiMethod || null,
        createdBy: req.user ? (req.user.id || req.user._id) : null
      });
    }

    await Notification.create({
      userId: null,
      title: 'Payment Received',
      message: `Payment of ₹${payAmount} received for ${booking.referenceNo}.`,
      type: 'info'
    });

    await logActivity(
      req.user ? (req.user.id || req.user._id) : null,
      'Receive Payment',
      'Payment',
      payment._id,
      `Payment of ₹${payAmount} received for ${booking.referenceNo} via ${paymentMethod.toUpperCase()}.`,
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
