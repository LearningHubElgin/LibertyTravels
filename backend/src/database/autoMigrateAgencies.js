const {
  Agency,
  User,
  Booking,
  Customer,
  Company,
  Payment,
  Transaction,
  Expense,
  AgencySetting,
  Notification,
  ActivityLog
} = require('../models');

/**
 * Migration helper to ensure primary agency exists and backfills agencyId on legacy records
 */
const autoMigrateAgencies = async () => {
  try {
    let defaultAgency = await Agency.findOne({ code: 'LTT' });

    if (!defaultAgency) {
      defaultAgency = await Agency.create({
        name: 'Liberty Tours & Travels',
        code: 'LTT',
        slug: 'liberty-tours',
        ownerName: 'Niladri / Liberty Admin',
        email: 'contact@libertytravel.com',
        phone: '+91 98300 12345',
        address: '124, Park Street, Kolkata, West Bengal 700016, India',
        city: 'Kolkata',
        state: 'West Bengal',
        country: 'India',
        status: 'active',
        plan: 'enterprise',
        maxUsers: 50,
        settings: {
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          invoicePrefix: 'LTT-INV-',
          invoiceNextNumber: 1001
        }
      });
      console.log('🏛️ Initialized Primary Agency: Liberty Tours & Travels (LTT)');
    }

    const agencyId = defaultAgency._id;

    // Backfill legacy records that have agencyId: null
    const [
      usersUpdated,
      bookingsUpdated,
      customersUpdated,
      companiesUpdated,
      paymentsUpdated,
      transactionsUpdated,
      expensesUpdated,
      settingsUpdated,
      notifsUpdated,
      logsUpdated
    ] = await Promise.all([
      User.updateMany({ agencyId: null, role: { $ne: 'super_admin' } }, { $set: { agencyId } }),
      Booking.updateMany({ agencyId: null }, { $set: { agencyId } }),
      Customer.updateMany({ agencyId: null }, { $set: { agencyId } }),
      Company.updateMany({ agencyId: null }, { $set: { agencyId } }),
      Payment.updateMany({ agencyId: null }, { $set: { agencyId } }),
      Transaction.updateMany({ agencyId: null }, { $set: { agencyId } }),
      Expense.updateMany({ agencyId: null }, { $set: { agencyId } }),
      AgencySetting.updateMany({ agencyId: null }, { $set: { agencyId } }),
      Notification.updateMany({ agencyId: null }, { $set: { agencyId } }),
      ActivityLog.updateMany({ agencyId: null }, { $set: { agencyId } })
    ]);

    if (bookingsUpdated.modifiedCount > 0 || companiesUpdated.modifiedCount > 0) {
      console.log(`✅ Multi-Tenant Migration: Linked ${bookingsUpdated.modifiedCount} bookings and ${companiesUpdated.modifiedCount} companies to Liberty Tours & Travels.`);
    }

    return defaultAgency;
  } catch (error) {
    console.warn('⚠️ Non-critical autoMigrateAgencies notice:', error.message);
  }
};

module.exports = { autoMigrateAgencies };
