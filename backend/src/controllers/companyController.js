const { Company, Booking } = require('../models');
const { logActivity } = require('../middleware/activityLogger');

exports.getCompanies = async (req, res, next) => {
  try {
    const { search, status, type } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      query.$or = [
        { name: regex },
        { code: regex },
        { country: regex },
        { type: regex }
      ];
    }

    const companiesRaw = await Company.find(query).sort({ name: 1 }).lean();
    const companyIds = companiesRaw.map(c => c._id);

    const bookings = await Booking.find({
      companyId: { $in: companyIds }
    })
      .select('companyId totalAmount')
      .lean();

    const companyBookingsMap = {};
    bookings.forEach(b => {
      const cId = String(b.companyId);
      if (!companyBookingsMap[cId]) companyBookingsMap[cId] = [];
      companyBookingsMap[cId].push(b);
    });

    const companies = companiesRaw.map(c => {
      const data = { ...c, id: c._id };
      const cBookings = companyBookingsMap[String(c._id)] || [];
      const totalBookings = cBookings.length;
      const totalRevenue = cBookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);
      return {
        ...data,
        totalBookings,
        totalRevenue
      };
    });

    return res.status(200).json({
      success: true,
      companies
    });
  } catch (error) {
    next(error);
  }
};

exports.createCompany = async (req, res, next) => {
  try {
    const { name, code, type = 'flight', category, country, contact, email, status } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Company name and company code are required'
      });
    }

    const company = await Company.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type: type || 'flight',
      category: category || type || 'flight',
      country: country ? country.trim() : 'India',
      contact: contact ? contact.trim() : '',
      email: email ? email.trim() : '',
      status: status || 'active'
    });

    await logActivity(
      req.user.id || req.user._id,
      'Create Company',
      'Company',
      company._id,
      `Company ${company.name} (${company.code}) created.`,
      req.ip
    );

    const companyData = company.toJSON();
    return res.status(201).json({
      success: true,
      message: 'Company created successfully',
      company: companyData
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, type, category, country, contact, email, status } = req.body;

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    if (name) company.name = name.trim();
    if (code) company.code = code.trim().toUpperCase();
    if (type) company.type = type;
    if (category) company.category = category;
    if (country !== undefined) company.country = country ? country.trim() : company.country;
    if (contact !== undefined) company.contact = contact ? contact.trim() : company.contact;
    if (email !== undefined) company.email = email ? email.trim() : company.email;
    if (status) company.status = status;

    await company.save();

    await logActivity(
      req.user.id || req.user._id,
      'Update Company',
      'Company',
      company._id,
      `Company ${company.name} (${company.code}) updated.`,
      req.ip
    );

    const companyData = company.toJSON();
    return res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      company: companyData
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const bookingCount = await Booking.countDocuments({
      companyId: id
    });
    if (bookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete company with ${bookingCount} linked bookings. Set status to inactive instead.`
      });
    }

    const companyName = company.name;
    await Company.findByIdAndDelete(id);

    await logActivity(
      req.user.id || req.user._id,
      'Delete Company',
      'Company',
      id,
      `Company ${companyName} (${company.code}) deleted.`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
