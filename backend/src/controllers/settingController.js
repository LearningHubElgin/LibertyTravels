const { AgencySetting } = require('../models');
const { logActivity } = require('../middleware/activityLogger');

exports.getSettings = async (req, res, next) => {
  try {
    let settings = await AgencySetting.findOne();
    if (!settings) {
      settings = await AgencySetting.create({});
    }

    return res.status(200).json({
      success: true,
      settings: settings.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await AgencySetting.findOne();
    if (!settings) {
      settings = await AgencySetting.create({});
    }

    const {
      agencyName,
      tagline,
      address,
      phone,
      email,
      website,
      gstNumber,
      panNumber,
      invoicePrefix,
      invoiceNextNumber,
      termsAndConditions,
      invoiceFooter,
      cashOpeningBalance,
      bankOpeningBalance,
      bankAccounts,
      upiMethods
    } = req.body;

    if (agencyName) settings.agencyName = agencyName.trim();
    if (tagline !== undefined) settings.tagline = tagline ? tagline.trim() : '';
    if (address !== undefined) settings.address = address ? address.trim() : '';
    if (phone !== undefined) settings.phone = phone ? phone.trim() : '';
    if (email !== undefined) settings.email = email ? email.trim() : '';
    if (website !== undefined) settings.website = website ? website.trim() : '';
    if (gstNumber !== undefined) settings.gstNumber = gstNumber ? gstNumber.trim() : '';
    if (panNumber !== undefined) settings.panNumber = panNumber ? panNumber.trim() : '';
    if (invoicePrefix !== undefined) settings.invoicePrefix = invoicePrefix.trim();
    if (invoiceNextNumber !== undefined) settings.invoiceNextNumber = parseInt(invoiceNextNumber, 10);
    if (termsAndConditions !== undefined) settings.termsAndConditions = termsAndConditions;
    if (invoiceFooter !== undefined) settings.invoiceFooter = invoiceFooter;
    if (cashOpeningBalance !== undefined) settings.cashOpeningBalance = parseFloat(cashOpeningBalance) || 0;
    if (bankOpeningBalance !== undefined) settings.bankOpeningBalance = parseFloat(bankOpeningBalance) || 0;
    if (bankAccounts !== undefined && Array.isArray(bankAccounts)) {
      settings.bankAccounts = bankAccounts.map(b => ({
        id: b.id || new require('mongoose').Types.ObjectId().toString(),
        bankName: (b.bankName || '').trim(),
        accountName: (b.accountName || '').trim(),
        accountNumber: (b.accountNumber || '').trim(),
        ifscCode: (b.ifscCode || '').trim().toUpperCase(),
        upiId: (b.upiId || '').trim(),
        openingBalance: parseFloat(b.openingBalance) || 0,
        isDefault: Boolean(b.isDefault),
        isActive: b.isActive !== undefined ? Boolean(b.isActive) : true
      })).filter(b => b.bankName);
      
      // Also update total bankOpeningBalance as sum if accounts exist
      if (settings.bankAccounts.length > 0) {
        settings.bankOpeningBalance = settings.bankAccounts.reduce((sum, b) => sum + (parseFloat(b.openingBalance) || 0), 0);
      }
    }
    if (upiMethods !== undefined && Array.isArray(upiMethods)) settings.upiMethods = upiMethods;

    await settings.save();

    await logActivity(
      req.user.id || req.user._id,
      'Update Settings',
      'Agency Settings',
      settings._id,
      `Agency and Invoice settings updated by ${req.user.name}.`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      settings: settings.toJSON()
    });
  } catch (error) {
    next(error);
  }
};
