const { Transaction, Customer, Booking, AgencySetting } = require('../models');
const { toDecimal } = require('../utils/financialCalculations');
const { generateTransactionReference } = require('../utils/referenceGenerator');
const { logActivity } = require('../middleware/activityLogger');
const { TRANSACTION_TYPES } = require('../config/constants');

const DEFAULT_BANKS = [
  {
    id: 'hdfc-bank',
    bankName: 'HDFC Bank',
    accountName: 'Liberty Tours & Travels Current A/C',
    accountNumber: '50200084729101',
    ifscCode: 'HDFC0000124',
    upiId: 'libertytravels@okhdfcbank',
    openingBalance: 0,
    isDefault: true
  },
  {
    id: 'icici-bank',
    bankName: 'ICICI Bank',
    accountName: 'Liberty Tours & Travels ICICI A/C',
    accountNumber: '000505039482',
    ifscCode: 'ICIC0000005',
    upiId: 'liberty@icici',
    openingBalance: 0,
    isDefault: false
  },
  {
    id: 'sbi-bank',
    bankName: 'State Bank of India (SBI)',
    accountName: 'Liberty Tours & Travels SBI A/C',
    accountNumber: '389201948271',
    ifscCode: 'SBIN0001234',
    upiId: 'liberty@sbi',
    openingBalance: 0,
    isDefault: false
  },
  {
    id: 'pnb-bank',
    bankName: 'Punjab National Bank (PNB)',
    accountName: 'Liberty Tours & Travels PNB A/C',
    accountNumber: '189200210003492',
    ifscCode: 'PUNB0189200',
    upiId: 'liberty@pnb',
    openingBalance: 0,
    isDefault: false
  },
  {
    id: 'axis-bank',
    bankName: 'Axis Bank',
    accountName: 'Liberty Tours & Travels Axis A/C',
    accountNumber: '91802003849102',
    ifscCode: 'UTIB0000010',
    upiId: 'liberty@axisbank',
    openingBalance: 0,
    isDefault: false
  }
];

exports.getAccountBalances = async (req, res, next) => {
  try {
    const agencySetting = (await AgencySetting.findOne().lean()) || {};
    const cashOpening = parseFloat(agencySetting.cashOpeningBalance || 0);
    
    // Configured bank accounts or fallback to standard bank list
    let configuredBanks = (agencySetting.bankAccounts && agencySetting.bankAccounts.length > 0)
      ? agencySetting.bankAccounts
      : DEFAULT_BANKS;

    // Fetch all transactions to compute live balances
    const allTxns = await Transaction.find().sort({ transactionDate: -1, createdAt: -1 }).lean();

    // 1. Calculate Cash Account
    const cashTxns = allTxns.filter((t) => {
      if (t.accountType === 'cash') return true;
      if (!t.accountType && (t.paymentMethod === 'cash' || (!t.paymentMethod && t.type === 'expense'))) return true;
      return false;
    });
    const cashCredits = cashTxns.reduce((sum, t) => sum + parseFloat(t.credit || 0), 0);
    const cashDebits = cashTxns.reduce((sum, t) => sum + parseFloat(t.debit || 0), 0);
    const cashCurrentBalance = toDecimal(cashOpening + cashCredits - cashDebits);

    // 2. Separate all bank transactions
    const allBankTxns = allTxns.filter((t) => {
      if (t.accountType === 'bank') return true;
      if (['upi', 'bank_transfer', 'card', 'cheque', 'netbanking'].includes(t.paymentMethod)) return true;
      if (t.bankName || t.bankId) return true;
      return false;
    });

    // 3. Match each configured bank account
    const bankCards = [];
    const matchedTxnIds = new Set();

    // Check if there are any distinct bank names from transactions not in configuredBanks
    const configuredNames = configuredBanks.map(b => b.bankName.toLowerCase().trim());
    const extraBanks = [];
    allBankTxns.forEach(t => {
      if (t.bankName && !configuredNames.includes(t.bankName.toLowerCase().trim()) && !extraBanks.some(eb => eb.bankName.toLowerCase().trim() === t.bankName.toLowerCase().trim())) {
        extraBanks.push({
          id: `bank-${t.bankName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          bankName: t.bankName,
          accountName: agencySetting.agencyName || 'Liberty Travels',
          accountNumber: '',
          ifscCode: '',
          upiId: '',
          openingBalance: 0,
          isDefault: false
        });
      }
    });

    const fullBankList = [...configuredBanks, ...extraBanks];

    for (const bank of fullBankList) {
      const bankOpen = parseFloat(bank.openingBalance || 0);
      const bKey = (bank.bankName || '').toLowerCase().trim();

      const bankTxns = allBankTxns.filter((t) => {
        if (t.bankId && t.bankId.toString() === (bank.id || bank._id)?.toString()) {
          matchedTxnIds.add(t._id.toString());
          return true;
        }
        if (t.bankName && t.bankName.toLowerCase().trim() === bKey) {
          matchedTxnIds.add(t._id.toString());
          return true;
        }
        // Match abbreviations or keywords (e.g. SBI, PNB, HDFC, ICICI) in bankName or description
        if (bKey.includes('hdfc') && (t.bankName?.toLowerCase().includes('hdfc') || t.description?.toLowerCase().includes('hdfc'))) {
          matchedTxnIds.add(t._id.toString());
          return true;
        }
        if (bKey.includes('icici') && (t.bankName?.toLowerCase().includes('icici') || t.description?.toLowerCase().includes('icici'))) {
          matchedTxnIds.add(t._id.toString());
          return true;
        }
        if (bKey.includes('sbi') && (t.bankName?.toLowerCase().includes('sbi') || t.description?.toLowerCase().includes('sbi'))) {
          matchedTxnIds.add(t._id.toString());
          return true;
        }
        if (bKey.includes('pnb') && (t.bankName?.toLowerCase().includes('pnb') || t.description?.toLowerCase().includes('pnb'))) {
          matchedTxnIds.add(t._id.toString());
          return true;
        }
        if (bKey.includes('axis') && (t.bankName?.toLowerCase().includes('axis') || t.description?.toLowerCase().includes('axis'))) {
          matchedTxnIds.add(t._id.toString());
          return true;
        }
        return false;
      });

      const bCredits = bankTxns.reduce((sum, t) => sum + parseFloat(t.credit || 0), 0);
      const bDebits = bankTxns.reduce((sum, t) => sum + parseFloat(t.debit || 0), 0);
      const bBalance = toDecimal(bankOpen + bCredits - bDebits);

      bankCards.push({
        id: bank.id || bank._id,
        bankName: bank.bankName,
        accountName: bank.accountName || '',
        accountNumber: bank.accountNumber || '',
        ifscCode: bank.ifscCode || '',
        upiId: bank.upiId || '',
        openingBalance: toDecimal(bankOpen),
        totalCredits: toDecimal(bCredits), // Deposited amount into this bank
        totalDebits: toDecimal(bDebits),   // Withdrawn amount from this bank
        currentBalance: bBalance,
        isDefault: Boolean(bank.isDefault),
        recentTransactions: bankTxns.slice(0, 5)
      });
    }

    // Allocate any unassigned bank transactions to default bank (if any)
    const unassignedTxns = allBankTxns.filter(t => !matchedTxnIds.has(t._id.toString()));
    if (unassignedTxns.length > 0) {
      const defaultBankCard = bankCards.find(b => b.isDefault) || bankCards[0];
      if (defaultBankCard) {
        const unassignedCredits = unassignedTxns.reduce((sum, t) => sum + parseFloat(t.credit || 0), 0);
        const unassignedDebits = unassignedTxns.reduce((sum, t) => sum + parseFloat(t.debit || 0), 0);
        defaultBankCard.totalCredits = toDecimal(parseFloat(defaultBankCard.totalCredits) + unassignedCredits);
        defaultBankCard.totalDebits = toDecimal(parseFloat(defaultBankCard.totalDebits) + unassignedDebits);
        defaultBankCard.currentBalance = toDecimal(
          parseFloat(defaultBankCard.openingBalance) + parseFloat(defaultBankCard.totalCredits) - parseFloat(defaultBankCard.totalDebits)
        );
      }
    }

    // 4. Compute Consolidated Total Bank Summary
    const configuredBankOpeningSum = bankCards.reduce((sum, b) => sum + parseFloat(b.openingBalance || 0), 0);
    const totalBankOpening = toDecimal(
      parseFloat(agencySetting.bankOpeningBalance || 0) > 0
        ? parseFloat(agencySetting.bankOpeningBalance || 0)
        : configuredBankOpeningSum
    );
    const totalBankDeposits = toDecimal(allBankTxns.reduce((sum, t) => sum + parseFloat(t.credit || 0), 0));
    const totalBankDebits = toDecimal(allBankTxns.reduce((sum, t) => sum + parseFloat(t.debit || 0), 0));
    const totalBankBalance = toDecimal(totalBankOpening + totalBankDeposits - totalBankDebits);
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
      totalBankSummary: {
        name: 'All Banks (Consolidated Deposits & Balance)',
        openingBalance: totalBankOpening,
        totalCredits: totalBankDeposits, // Total deposited across all banks
        totalDebits: totalBankDebits,    // Total withdrawn across all banks
        currentBalance: totalBankBalance
      },
      bankAccounts: bankCards,
      summary: {
        totalCashBalance: cashCurrentBalance,
        totalBankBalance,
        totalBankDeposits,
        totalLiquidBalance,
        totalBankOpening,
        cashOpeningBalance: toDecimal(cashOpening)
      },
      upiApps: agencySetting.upiMethods || ['PhonePe', 'Google Pay', 'Paytm', 'BHIM', 'PayPal', 'Amazon Pay', 'Cred']
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
        if (bankName && bankName !== 'all') {
          const bPattern = bankName.replace(/[()]/g, '').trim();
          query.$and = [
            {
              $or: [
                { accountType: 'bank' },
                { paymentMethod: { $in: ['upi', 'bank_transfer', 'card', 'cheque', 'netbanking'] } },
                { bankName: { $exists: true, $ne: null } }
              ]
            },
            {
              $or: [
                { bankName: new RegExp(bPattern, 'i') },
                { description: new RegExp(bPattern, 'i') }
              ]
            }
          ];
        } else {
          query.$or = [
            { accountType: 'bank' },
            { paymentMethod: { $in: ['upi', 'bank_transfer', 'card', 'cheque', 'netbanking'] } },
            { bankName: { $exists: true, $ne: null } }
          ];
        }
      }
    } else if (bankName && bankName !== 'all') {
      const bPattern = bankName.replace(/[()]/g, '').trim();
      query.$or = [
        { bankName: new RegExp(bPattern, 'i') },
        { description: new RegExp(bPattern, 'i') }
      ];
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
