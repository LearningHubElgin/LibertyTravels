const { Expense, Transaction } = require('../models');
const { toDecimal } = require('../utils/financialCalculations');
const { generateTransactionReference } = require('../utils/referenceGenerator');
const { logActivity } = require('../middleware/activityLogger');
const { TRANSACTION_TYPES } = require('../config/constants');

exports.getExpenses = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, search, category, startDate, endDate, sort = 'expenseDate', order = 'DESC' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (category) query.category = category;
    if (startDate && endDate) {
      query.expenseDate = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.expenseDate = { $gte: startDate };
    } else if (endDate) {
      query.expenseDate = { $lte: endDate };
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      query.$or = [
        { description: regex },
        { paidTo: regex },
        { reference: regex },
        { category: regex }
      ];
    }

    const sortDirection = order.toUpperCase() === 'ASC' ? 1 : -1;
    const sortObj = { [sort === 'id' ? '_id' : sort]: sortDirection };

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .populate('creator', 'name role')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const allExpenses = await Expense.find(query).select('amount');
    const totalAmount = allExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    return res.status(200).json({
      success: true,
      expenses,
      totalAmount: toDecimal(totalAmount),
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

exports.createExpense = async (req, res, next) => {
  try {
    const {
      expenseDate = new Date().toISOString().split('T')[0],
      category,
      description,
      amount,
      paymentMethod = 'bank_transfer',
      paidTo,
      reference,
      notes
    } = req.body;

    if (!category || !description || !amount || !paidTo) {
      return res.status(400).json({
        success: false,
        message: 'Category, description, amount, and paid-to recipient are required'
      });
    }

    const expAmount = toDecimal(amount);
    if (expAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Expense amount must be greater than zero'
      });
    }

    const expense = await Expense.create({
      expenseDate,
      category,
      description: description.trim(),
      amount: expAmount,
      paymentMethod,
      paidTo: paidTo.trim(),
      reference: reference ? reference.trim() : '',
      notes: notes ? notes.trim() : '',
      createdBy: req.user ? (req.user.id || req.user._id) : null
    });

    const txnRef = await generateTransactionReference('TXN-EXP');
    await Transaction.create({
      transactionDate: expenseDate,
      referenceNo: txnRef,
      description: `Expense: [${category}] ${description.trim()} (Paid to: ${paidTo.trim()})`,
      type: TRANSACTION_TYPES.EXPENSE,
      debit: expAmount,
      credit: 0.00,
      balance: toDecimal(-expAmount),
      paymentMethod,
      createdBy: req.user ? (req.user.id || req.user._id) : null
    });

    await logActivity(
      req.user ? (req.user.id || req.user._id) : null,
      'Create Expense',
      'Expense',
      expense._id,
      `Expense of ₹${expAmount} logged for ${category} (${paidTo}).`,
      req.ip
    );

    return res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      expense: expense.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

exports.updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { expenseDate, category, description, amount, paymentMethod, paidTo, reference, notes } = req.body;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    if (expenseDate) expense.expenseDate = expenseDate;
    if (category) expense.category = category;
    if (description) expense.description = description.trim();
    if (amount !== undefined) expense.amount = toDecimal(amount);
    if (paymentMethod) expense.paymentMethod = paymentMethod;
    if (paidTo) expense.paidTo = paidTo.trim();
    if (reference !== undefined) expense.reference = reference ? reference.trim() : '';
    if (notes !== undefined) expense.notes = notes ? notes.trim() : '';

    await expense.save();

    await logActivity(
      req.user ? (req.user.id || req.user._id) : null,
      'Update Expense',
      'Expense',
      expense._id,
      `Expense #${expense._id} updated.`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      expense: expense.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const desc = expense.description;
    const amt = expense.amount;
    await Expense.findByIdAndDelete(id);

    await logActivity(
      req.user ? (req.user.id || req.user._id) : null,
      'Delete Expense',
      'Expense',
      id,
      `Expense "${desc}" of ₹${amt} deleted.`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getExpenseCategorySummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    if (startDate && endDate) {
      query.expenseDate = { $gte: startDate, $lte: endDate };
    }

    const expenses = await Expense.find(query).select('category amount');

    const categoryMap = {};
    let total = 0;
    expenses.forEach(e => {
      const amt = parseFloat(e.amount || 0);
      categoryMap[e.category] = (categoryMap[e.category] || 0) + amt;
      total += amt;
    });

    const breakdown = Object.entries(categoryMap).map(([cat, amt]) => ({
      category: cat,
      amount: toDecimal(amt),
      percentage: total > 0 ? toDecimal((amt / total) * 100) : 0
    })).sort((a, b) => b.amount - a.amount);

    return res.status(200).json({
      success: true,
      totalExpenses: toDecimal(total),
      breakdown
    });
  } catch (error) {
    next(error);
  }
};
