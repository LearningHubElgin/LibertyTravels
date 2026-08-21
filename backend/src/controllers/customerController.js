const { Customer, Booking, Payment, Transaction, Passenger } = require('../models');
const { generateCustomerCode } = require('../utils/referenceGenerator');
const { logActivity } = require('../middleware/activityLogger');
const { toDecimal } = require('../utils/financialCalculations');

exports.getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10, sort = 'createdAt', order = 'DESC' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      query.$or = [
        { name: regex },
        { customerCode: regex },
        { phone: regex },
        { email: regex },
        { passportNumber: regex }
      ];
    }

    const sortDirection = order.toUpperCase() === 'ASC' ? 1 : -1;
    const sortObj = { [sort === 'id' ? '_id' : sort]: sortDirection };

    const total = await Customer.countDocuments(query);
    const customersRaw = await Customer.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get aggregated metrics for each customer
    const customerIds = customersRaw.map(c => c._id);
    const bookings = await Booking.find({ customerId: { $in: customerIds } })
      .select('customerId totalAmount amountReceived balanceDue status')
      .lean();

    const customerBookingsMap = {};
    bookings.forEach(b => {
      const cId = String(b.customerId);
      if (!customerBookingsMap[cId]) customerBookingsMap[cId] = [];
      customerBookingsMap[cId].push(b);
    });

    const customers = customersRaw.map(c => {
      const data = { ...c, id: c._id };
      const cBookings = customerBookingsMap[String(c._id)] || [];
      const totalBookings = cBookings.length;
      const totalAmount = cBookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);
      const paidAmount = cBookings.reduce((sum, b) => sum + parseFloat(b.amountReceived || 0), 0);
      const outstandingAmount = cBookings.reduce((sum, b) => sum + parseFloat(b.balanceDue || 0), 0);

      return {
        ...data,
        totalBookings,
        totalAmount: toDecimal(totalAmount),
        paidAmount: toDecimal(paidAmount),
        outstandingAmount: toDecimal(outstandingAmount)
      };
    });

    return res.status(200).json({
      success: true,
      customers,
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

exports.getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id).lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const [bookings, payments, passengers] = await Promise.all([
      Booking.find({ customerId: id })
        .populate('company', 'name code')
        .sort({ createdAt: -1 })
        .lean(),
      Payment.find({ customerId: id })
        .sort({ paymentDate: -1 })
        .lean(),
      Passenger.find({ customerId: id }).lean()
    ]);

    const totalAmount = bookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);
    const paidAmount = bookings.reduce((sum, b) => sum + parseFloat(b.amountReceived || 0), 0);
    const outstandingAmount = bookings.reduce((sum, b) => sum + parseFloat(b.balanceDue || 0), 0);

    return res.status(200).json({
      success: true,
      customer: {
        ...customer,
        id: customer._id,
        bookings,
        payments,
        passengers,
        totalBookings: bookings.length,
        totalAmount: toDecimal(totalAmount),
        paidAmount: toDecimal(paidAmount),
        outstandingAmount: toDecimal(outstandingAmount)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, address, passportNumber, nationality } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and phone number are required'
      });
    }

    const customerCode = await generateCustomerCode();

    const customer = await Customer.create({
      customerCode,
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.toLowerCase().trim() : '',
      address: address ? address.trim() : '',
      passportNumber: passportNumber ? passportNumber.trim().toUpperCase() : '',
      nationality: nationality ? nationality.trim() : 'Indian'
    });

    await logActivity(
      req.user.id || req.user._id,
      'Create Customer',
      'Customer',
      customer._id,
      `Customer ${customer.name} (${customer.customerCode}) created.`,
      req.ip
    );

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer: customer.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, passportNumber, nationality } = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    if (name) customer.name = name.trim();
    if (phone) customer.phone = phone.trim();
    if (email !== undefined) customer.email = email ? email.toLowerCase().trim() : '';
    if (address !== undefined) customer.address = address ? address.trim() : '';
    if (passportNumber !== undefined) customer.passportNumber = passportNumber ? passportNumber.trim().toUpperCase() : '';
    if (nationality !== undefined) customer.nationality = nationality ? nationality.trim() : customer.nationality;

    await customer.save();

    await logActivity(
      req.user.id || req.user._id,
      'Update Customer',
      'Customer',
      customer._id,
      `Customer ${customer.name} (${customer.customerCode}) updated.`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      customer: customer.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const bookingCount = await Booking.countDocuments({ customerId: id });
    if (bookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete customer with ${bookingCount} linked bookings. Deactivate or archive instead.`
      });
    }

    const customerName = customer.name;
    await Customer.findByIdAndDelete(id);

    await logActivity(
      req.user.id || req.user._id,
      'Delete Customer',
      'Customer',
      id,
      `Customer ${customerName} (${customer.customerCode}) was deleted.`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getCustomerLedger = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id).lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const transactions = await Transaction.find({ customerId: id })
      .sort({ transactionDate: 1, createdAt: 1 })
      .lean();

    let runningBalance = 0.00;
    const ledgerEntries = transactions.map(t => {
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
        debit: toDecimal(debit),
        credit: toDecimal(credit),
        runningBalance: toDecimal(runningBalance)
      };
    });

    const totalDebit = transactions.reduce((sum, t) => sum + parseFloat(t.debit || 0), 0);
    const totalCredit = transactions.reduce((sum, t) => sum + parseFloat(t.credit || 0), 0);

    return res.status(200).json({
      success: true,
      customer: {
        id: customer.id || customer._id,
        customerCode: customer.customerCode,
        name: customer.name,
        phone: customer.phone,
        email: customer.email
      },
      ledger: ledgerEntries,
      summary: {
        totalDebit: toDecimal(totalDebit),
        totalCredit: toDecimal(totalCredit),
        closingBalance: toDecimal(runningBalance)
      }
    });
  } catch (error) {
    next(error);
  }
};
