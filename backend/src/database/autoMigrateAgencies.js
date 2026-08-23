const { Agency, User, Booking, Customer, Company, Expense, Payment, Transaction, Notification } = require('../models');
const { ROLES, USER_STATUS, AGENCY_STATUS, AGENCY_PLANS } = require('../config/constants');

const autoMigrateAgencies = async () => {
  try {
    // 1. Ensure master Liberty Tours & Travels agency exists
    let masterAgency = await Agency.findOne({ code: 'LIBERTY' });
    if (!masterAgency) {
      masterAgency = await Agency.create({
        name: 'Liberty Tours & Travels',
        code: 'LIBERTY',
        tagline: 'Your Trusted Global Flight & Travel Partner',
        email: 'contact@libertytravel.com',
        phone: '+91 98765 43210',
        address: 'Suite 402, Liberty Business Tower, Connaught Place',
        city: 'New Delhi',
        country: 'India',
        website: 'www.libertytoursandtravels.com',
        gstNumber: '07AAAAA0000A1Z5',
        panNumber: 'AAACL1234K',
        status: AGENCY_STATUS.ACTIVE,
        plan: AGENCY_PLANS.ENTERPRISE,
        contactPerson: {
          name: 'Niladri Mukherjee',
          phone: '+91 98765 43210',
          email: 'admin@libertytravel.com',
          designation: 'Managing Director'
        },
        invoiceSettings: {
          prefix: 'INV-2026-',
          nextNumber: 1001,
          terms: '1. Service cancellation and date change charges apply as per company policy.\n2. Please carry valid Govt ID / Passport for travel.',
          footer: 'Thank you for choosing Liberty Tours & Travels. Have a pleasant and safe journey!'
        }
      });
      console.log('🏢 Initialized Master Agency: Liberty Tours & Travels (LIBERTY)');
    }

    // 2. Link legacy documents with no agencyId to masterAgency
    const masterId = masterAgency._id;

    await Promise.all([
      User.updateMany({ role: { $ne: ROLES.SUPER_ADMIN }, agencyId: { $in: [null, undefined] } }, { agencyId: masterId }),
      Booking.updateMany({ agencyId: { $in: [null, undefined] } }, { agencyId: masterId }),
      Customer.updateMany({ agencyId: { $in: [null, undefined] } }, { agencyId: masterId }),
      Company.updateMany({ agencyId: { $in: [null, undefined] } }, { agencyId: masterId }),
      Expense.updateMany({ agencyId: { $in: [null, undefined] } }, { agencyId: masterId }),
      Payment.updateMany({ agencyId: { $in: [null, undefined] } }, { agencyId: masterId }),
      Transaction.updateMany({ agencyId: { $in: [null, undefined] } }, { agencyId: masterId }),
      Notification.updateMany({ agencyId: { $in: [null, undefined] } }, { agencyId: masterId })
    ]);

    // 3. Ensure a second demo agency exists for testing multi-tenancy
    const secondAgency = await Agency.findOne({ code: 'ROYAL' });
    if (!secondAgency) {
      const royal = await Agency.create({
        name: 'Royal Heritage Holidays',
        code: 'ROYAL',
        tagline: 'Luxury Holiday Packages & Corporate Travel',
        email: 'info@royalheritageholidays.com',
        phone: '+91 98111 22334',
        address: 'B-12, Heritage Square, MG Road',
        city: 'Mumbai',
        country: 'India',
        website: 'www.royalheritageholidays.com',
        gstNumber: '27AABCR9999Z1Z8',
        panNumber: 'AABCR9999Z',
        status: AGENCY_STATUS.ACTIVE,
        plan: AGENCY_PLANS.PROFESSIONAL,
        contactPerson: {
          name: 'Rajesh Sharma',
          phone: '+91 98111 22334',
          email: 'admin@royalheritageholidays.com',
          designation: 'Operations Head'
        },
        invoiceSettings: {
          prefix: 'ROYAL-INV-',
          nextNumber: 101,
          terms: 'Standard holiday cancellation policy applies.',
          footer: 'Experience Royalty with Royal Heritage Holidays.'
        }
      });

      // Create Admin for Royal
      const royalAdmin = await User.findOne({ email: 'admin@royalheritageholidays.com' });
      if (!royalAdmin) {
        await User.create({
          name: 'Rajesh Sharma (Royal Admin)',
          email: 'admin@royalheritageholidays.com',
          password: 'agency123',
          role: ROLES.ADMIN,
          agencyId: royal._id,
          phone: '+91 98111 22334',
          status: USER_STATUS.ACTIVE
        });
      }
      console.log('🏢 Initialized Demo Agency: Royal Heritage Holidays (ROYAL)');
    }

    // 4. Ensure Super Admin (superadmin / password123)
    let superAdmin = await User.findOne({ email: 'superadmin' });
    if (!superAdmin) {
      superAdmin = await User.create({
        name: 'Global Super Admin',
        email: 'superadmin',
        password: 'password123',
        role: ROLES.SUPER_ADMIN,
        status: USER_STATUS.ACTIVE
      });
      console.log('👑 Created Super Admin: superadmin / password123');
    } else {
      superAdmin.role = ROLES.SUPER_ADMIN;
      superAdmin.password = 'password123';
      await superAdmin.save();
    }

    // 5. Ensure Liberty Agency Admin (admin@libertytravel.com / admin123)
    let libertyAdmin = await User.findOne({ email: 'admin@libertytravel.com' });
    if (!libertyAdmin) {
      libertyAdmin = await User.create({
        name: 'Liberty Admin',
        email: 'admin@libertytravel.com',
        password: 'admin123',
        role: ROLES.ADMIN,
        agencyId: masterAgency._id,
        status: USER_STATUS.ACTIVE
      });
      console.log('🏢 Created Liberty Agency Admin: admin@libertytravel.com / admin123');
    } else {
      libertyAdmin.name = 'Liberty Admin';
      libertyAdmin.role = ROLES.ADMIN;
      libertyAdmin.agencyId = masterAgency._id;
      libertyAdmin.password = 'admin123';
      await libertyAdmin.save();
    }

    // 6. Clean up legacy accounts
    await User.deleteMany({ email: 'staff@libertytravel.com' });
    await User.updateMany({ role: 'staff' }, { role: ROLES.ADMIN });

    console.log('✅ Multi-tenant agency auto-migration verified.');
  } catch (err) {
    console.warn('⚠️ Auto-migrate agencies notice:', err.message);
  }
};

module.exports = { autoMigrateAgencies };
