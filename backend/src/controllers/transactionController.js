const { Transaction, Customer, Booking, AgencySetting } = require('../models');
const { toDecimal } = require('../utils/financialCalculations');
const { generateTransactionReference } = require('../utils/referenceGenerator');
const { logActivity } = require('../middleware/activityLogger');
const { TRANSACTION_TYPES } = require('../config/constants');

exports.getAccountBalances = async (req, res, next) => {
  try {
    const agencySetting = await AgencySetting.findOne().lean() || {};
    const cashOpening = parseFloat(agencySetting.cashOpeningBalance || 0);
    const configuredBanks = agencySetting.bankAccounts || [];

    // Fetch all transactions to compute balances
    const allTxns = await Transaction.find().sort({ transactionDate: -1, createdAt: -1 }).lean();

    // 1. Calculate Cash Account
    const cashTxns = allTxns.filter(t => {
      if (t.accountType === 'cash') return true;
      if (!t.accountType && (t.paymentMethod === 'cash' || (!t.paymentMethod && t.type === 'expense'))) return true;
      return false;
    });
    const cashCredits = cashTxns.reduce((sum, t) => sum + parseFloat(t.credit || 0), 0);
    const cashDebits = cashTxns.reduce((sum, t) => sum + parseFloat(t.debit || 0), 0);
    const cashCurrentBalance = toDecimal(cashOpening + cashCredits - cashDebits);

    // 2. Calculate Configured Bank Accounts
    const bankCards = [];
    let totalBankOpening = 0;
    let totalBankCredits = 0;
    let totalBankDebits = 0;

    if (configuredBanks.length > 0) {
      for (const bank of configuredBanks) {
        const bankOpen = parseFloat(bank.openingBalance || 0);
        totalBankOpening += bankOpen;

        const bankTxns = allTxns.filter(t => {
          if (t.bankId && t.bankId.toString() === bank.id?.toString()) return true;
          if (t.bankName && t.bankName.toLowerCase().trim() === bank.bankName.toLowerCase().trim()) return true;
          return false;
        });

        const bCredits = bankTxns.reduce((sum, t) => sum + parseFloat(t.credit || 0), 0);
        const bDebits = bankTxns.reduce((sum, t) => sum + parseFloat(t.debit || 0), 0);
        const bBalance = toDecimal(bankOpen + bCredits - bDebits);

        totalBankCredits += bCredits;
        totalBankDebits += bDebits;

        bankCards.push({
          id: bank.id || bank._id,
          bankName: bank.bankName,
          accountName: bank.accountName || '',
          accountNumber: bank.accountNumber || '',
          ifscCode: bank.ifscCode || '',
          upiId: bank.upiId || '',
          openingBalance: toDecimal(bankOpen),
          totalCredits: toDecimal(bCredits),
          totalDebits: toDecimal(bDebits),
          currentBalance: bBalance,
          isDefault: bank.isDefault || false,
          recentTransactions: bankTxns.slice(0, 5)
        });
      }
    } else {
      // Fallback if no specific banks configured, aggregate all bank transactions
      const genBankTxns = allTxns.filter(t => t.accountType === 'bank' || ['upi', 'bank_transfer', 'card', 'cheque'].includes(t.paymentMethod));
      const bOpen = parseFloat(agencySetting.bankOpeningBalance || 0);
      const bCredits = genBankTxns.reduce((sum, t) => sum + parseFloat(t.credit || 0), 0);
      const bDebits = genBankTxns.reduce((sum, t) => sum + parseFloat(t.debit || 0), 0);
      totalBankOpening = bOpen;
      totalBankCredits = bCredits;
      totalBankDebits = bDebits;

      bankCards.push({
        id: 'primary-bank',
        bankName: 'Primary Bank Account',
        accountName: agencySetting.agencyName || 'Agency Bank',
        accountNumber: 'Configured in Settings',
        ifscCode: '',
        upiId: '',
        openingBalance: toDecimal(bOpen),
        totalCredits: toDecimal(bCredits),
        totalDebits: toDecimal(bDebits),
        currentBalance: toDecimal(bOpen + bCredits - bDebits),
        isDefault: true,
        recentTransactions: genBankTxns.slice(0, 5)
      });
    }

    const totalBankBalance = toDecimal(bankCards.reduce((sum, b) => sum + parseFloat(b.currentBalance || 0), 0));
    const totalLiquidBalance = toDecimal(cashCurrentBalance + totalBankBalance);

    return res.status(200).json({
      success: true,
      cashAccount: {
        accountType: 'cash',
        name: 'Cash in Hand (Counter / Register)',
        openingBalance: toDecimal(cashOpening),
        totalCredits: toDecimal(cashCredits),
        totalDebits: toDecimal(cashDebits),
        currentBalance: cashCurrentBalance,
        recentTransactions: cashTxns.slice(0, 5)
      },
      bankAccounts: bankCards,
      summary: {
        totalCashBalance: cashCurrentBalance,
        totalBankBalance,
        totalLiquidBalance,
        totalBankOpening: toDecimal(totalBankOpening),
        cashOpeningBalance: toDecimal(cashOpening)
      },
      upiApps: agencySetting.upiMethods || ['PhonePe', 'Google Pay', 'Paytm', 'BHIM', 'PayPal', 'Amazon Pay']
    });
  } catch (error) {
    next(error);
  }
};

exports.getTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 15,
      search,
      type,
      startDate,
      endDate,
      customerId,
      accountType,
      bankName,
      sort = 'transactionDate',
      order = 'DESC'
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (type) query.type = type;
    if (customerId) query.customerId = customerId;
    if (accountType && accountType !== 'all') {
      if (accountType === 'cash') {
        query.$or = [
          { accountType: 'cash' },
          { accountType: { $exists: false }, paymentMethod: 'cash' },
          { accountType: null, paymentMethod: 'cash' }
        ];
      } else if (accountType === 'bank') {
        query.$or = [
          { accountType: 'bank' },
          { paymentMethod: { $in: ['upi', 'bank_transfer', 'card', 'cheque'] } }
        ];
      }
    }
    if (bankName && bankName !== 'all') {
      query.bankName = new RegExp(`^${bankName.trim()}$`, 'i');
    }

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

      const searchConditions = [
        { referenceNo: regex },
        { description: regex },
        { bankName: regex },
        { upiApp: regex },
        { customerId: { $in: matchingCustomers.map(c => c._id) } },
        { bookingId: { $in: matchingBookings.map(b => b._id) } }
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
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
      accountType = 'cash',
      bankId = null,
      bankName = null,
      paymentMethod = 'cash',
      upiMethod,
      upiApp
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
      accountType: accountType || (paymentMethod === 'cash' ? 'cash' : 'bank'),
      bankId: bankId || null,
      bankName: bankName || null,
      paymentMethod: paymentMethod || null,
      upiMethod: upiMethod || upiApp || null,
      upiApp: upiApp || upiMethod || null,
      createdBy: req.user ? (req.user.id || req.user._id) : null
    });

    await logActivity(
      req.user ? (req.user.id || req.user._id) : null,
      'Create Manual Transaction',
      'Transaction',
      transaction._id,
      `Transaction ${transaction.referenceNo} (${type}) created. Account: ${accountType} ${bankName || ''}. Debit: ₹${dAmount}, Credit: ₹${cAmount}.`,
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
