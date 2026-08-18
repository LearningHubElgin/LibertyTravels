const { Transaction, Customer, Booking } = require('../models');
const { toDecimal } = require('../utils/financialCalculations');

/**
 * Get Customer Ledger statement with accurate running balance
 */
exports.getCustomerLedger = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { startDate, endDate } = req.query;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    let openingBalance = 0.00;
    if (startDate) {
      const priorTransactions = await Transaction.find({
        customerId,
        transactionDate: { $lt: startDate }
      }).select('debit credit');

      const priorDebit = priorTransactions.reduce((sum, t) => sum + parseFloat(t.debit || 0), 0);
      const priorCredit = priorTransactions.reduce((sum, t) => sum + parseFloat(t.credit || 0), 0);
      openingBalance = toDecimal(priorDebit - priorCredit);
    }

    const query = { customerId };
    if (startDate && endDate) {
      query.transactionDate = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.transactionDate = { $gte: startDate };
    } else if (endDate) {
      query.transactionDate = { $lte: endDate };
    }

    const transactions = await Transaction.find(query)
      .populate('booking', 'referenceNo sector flightNumber')
      .sort({ transactionDate: 1, createdAt: 1 });

    let currentRunningBalance = openingBalance;
    const ledgerEntries = transactions.map(t => {
      const debit = parseFloat(t.debit || 0);
      const credit = parseFloat(t.credit || 0);
      currentRunningBalance = currentRunningBalance + debit - credit;

      return {
        id: t.id || t._id,
        date: t.transactionDate,
        referenceNo: t.referenceNo,
        description: t.description,
        type: t.type,
        booking: t.booking,
        paymentMethod: t.paymentMethod,
        debit: toDecimal(debit),
        credit: toDecimal(credit),
        runningBalance: toDecimal(currentRunningBalance)
      };
    });

    const periodDebit = transactions.reduce((sum, t) => sum + parseFloat(t.debit || 0), 0);
    const periodCredit = transactions.reduce((sum, t) => sum + parseFloat(t.credit || 0), 0);

    return res.status(200).json({
      success: true,
      customer: {
        id: customer.id || customer._id,
        customerCode: customer.customerCode,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address
      },
      openingBalance,
      entries: ledgerEntries,
      summary: {
        openingBalance,
        totalDebit: toDecimal(periodDebit),
        totalCredit: toDecimal(periodCredit),
        closingBalance: toDecimal(currentRunningBalance)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get General Agency Ledger with complete chronological running balance
 */
exports.getGeneralLedger = async (req, res, next) => {
  try {
    const { startDate, endDate, type } = req.query;

    const query = {};
    if (type) query.type = type;
    if (startDate && endDate) {
      query.transactionDate = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.transactionDate = { $gte: startDate };
    } else if (endDate) {
      query.transactionDate = { $lte: endDate };
    }

    const transactions = await Transaction.find(query)
      .populate('customer', 'name customerCode')
      .populate('booking', 'referenceNo sector')
      .sort({ transactionDate: 1, createdAt: 1 });

    let runningCashFlow = 0.00;
    const entries = transactions.map(t => {
      const debit = parseFloat(t.debit || 0);
      const credit = parseFloat(t.credit || 0);
      runningCashFlow = runningCashFlow + credit - debit;

      return {
        id: t.id || t._id,
        date: t.transactionDate,
        referenceNo: t.referenceNo,
        description: t.description,
        type: t.type,
        customer: t.customer,
        booking: t.booking,
        paymentMethod: t.paymentMethod,
        debit: toDecimal(debit),
        credit: toDecimal(credit),
        runningCashFlow: toDecimal(runningCashFlow)
      };
    });

    const totalDebit = transactions.reduce((sum, t) => sum + parseFloat(t.debit || 0), 0);
    const totalCredit = transactions.reduce((sum, t) => sum + parseFloat(t.credit || 0), 0);

    return res.status(200).json({
      success: true,
      entries,
      summary: {
        totalDebit: toDecimal(totalDebit),
        totalCredit: toDecimal(totalCredit),
        netBalance: toDecimal(totalCredit - totalDebit)
      }
    });
  } catch (error) {
    next(error);
  }
};
