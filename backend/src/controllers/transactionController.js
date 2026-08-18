const { Transaction, Customer, Booking } = require('../models');
const { toDecimal } = require('../utils/financialCalculations');
const { generateTransactionReference } = require('../utils/referenceGenerator');
const { logActivity } = require('../middleware/activityLogger');
const { TRANSACTION_TYPES } = require('../config/constants');

exports.getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, search, type, startDate, endDate, customerId, sort = 'transactionDate', order = 'DESC' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (type) query.type = type;
    if (customerId) query.customerId = customerId;
    if (startDate && endDate) {
      query.transactionDate = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.transactionDate = { $gte: startDate };
    } else if (endDate) {
      query.transactionDate = { $lte: endDate };
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');

      const matchingCustomers = await Customer.find({ name: regex }).select('_id');
      const matchingBookings = await Booking.find({ referenceNo: regex }).select('_id');

      query.$or = [
        { referenceNo: regex },
        { description: regex },
        { customerId: { $in: matchingCustomers.map(c => c._id) } },
        { bookingId: { $in: matchingBookings.map(b => b._id) } }
      ];
    }

    const sortDirection = order.toUpperCase() === 'ASC' ? 1 : -1;
    const sortObj = { [sort === 'id' ? '_id' : sort]: sortDirection };

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .populate('customer', 'customerCode name phone')
      .populate('booking', 'referenceNo sector')
      .populate('creator', 'name role')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Summary totals for transactions matching current filters
    const allMatching = await Transaction.find(query).select('debit credit');
    const totalDebit = allMatching.reduce((sum, t) => sum + parseFloat(t.debit || 0), 0);
    const totalCredit = allMatching.reduce((sum, t) => sum + parseFloat(t.credit || 0), 0);

    return res.status(200).json({
      success: true,
      transactions,
      summary: {
        totalDebit: toDecimal(totalDebit),
        totalCredit: toDecimal(totalCredit),
        netFlow: toDecimal(totalCredit - totalDebit)
      },
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

exports.createTransaction = async (req, res, next) => {
  try {
    const {
      transactionDate = new Date().toISOString().split('T')[0],
      customerId,
      bookingId,
      description,
      type = TRANSACTION_TYPES.ADJUSTMENT,
      debit = 0,
      credit = 0,
      paymentMethod
    } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Transaction description is required'
      });
    }

    const dAmount = toDecimal(debit);
    const cAmount = toDecimal(credit);

    if (dAmount === 0 && cAmount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Transaction must have either a debit or credit amount'
      });
    }

    const referenceNo = await generateTransactionReference('TXN-MAN');
    const transaction = await Transaction.create({
      transactionDate,
      referenceNo,
      bookingId: bookingId || null,
      customerId: customerId || null,
      description: description.trim(),
      type,
      debit: dAmount,
      credit: cAmount,
      balance: toDecimal(dAmount - cAmount),
      paymentMethod: paymentMethod || null,
      createdBy: req.user ? (req.user.id || req.user._id) : null
    });

    await logActivity(
      req.user ? (req.user.id || req.user._id) : null,
      'Create Manual Transaction',
      'Transaction',
      transaction._id,
      `Transaction ${transaction.referenceNo} (${type}) created. Debit: ₹${dAmount}, Credit: ₹${cAmount}.`,
      req.ip
    );

    return res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transaction: transaction.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const ref = transaction.referenceNo;
    await Transaction.findByIdAndDelete(id);

    await logActivity(
      req.user ? (req.user.id || req.user._id) : null,
      'Delete Transaction',
      'Transaction',
      id,
      `Transaction ${ref} was deleted.`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
