const { Customer, Booking, Payment, Transaction } = require('../models');

exports.getProfile = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.user.id || req.user._id)
      .populate('agencyId', 'name code logo phone email address invoiceSettings termsAndConditions');
      
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    return res.status(200).json({ success: true, customer });
  } catch (error) {
    next(error);
  }
};

exports.getBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ customerId: req.user.id || req.user._id })
      .sort({ createdAt: -1 })
      .populate('companyId', 'name code type');

    return res.status(200).json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
};

exports.getPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ customerId: req.user.id || req.user._id })
      .sort({ createdAt: -1 })
      .populate('bookingId', 'referenceNo serviceType totalAmount');

    return res.status(200).json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};

exports.getLedger = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ customerId: req.user.id || req.user._id })
      .sort({ transactionDate: 1, createdAt: 1 });

    let runningBalance = 0.00;
    const ledger = transactions.map(t => {
      const debit = parseFloat(t.debit || 0);
      const credit = parseFloat(t.credit || 0);
      runningBalance = runningBalance + debit - credit;
      return {
        id: t.id || t._id,
        date: t.transactionDate,
        referenceNo: t.referenceNo,
        description: t.description,
        type: t.type,
        paymentMethod: t.paymentMethod,
        debit: debit,
        credit: credit,
        runningBalance: runningBalance
      };
    });

    return res.status(200).json({ success: true, ledger, closingBalance: runningBalance });
  } catch (error) {
    next(error);
  }
};
