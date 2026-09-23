const { Agency, User, Booking, Customer, Company, Expense, Payment, Transaction, Notification, AgencySetting } = require('../models');
const { ROLES, USER_STATUS, AGENCY_STATUS, AGENCY_PLANS } = require('../config/constants');

const autoMigrateAgencies = async () => {
  try {
    // 1. Ensure master Liberty Tours & Travels agency exists
    let masterAgency = await Agency.findOne({ $or: [{ code: 'LIBERTY' }, { email: 'contact@libertytravel.com' }] });
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

    // 5. Ensure Liberty Agency Management Admin (Liberty & admin@libertytravel.com / Liberty123)
    let libertyUser = await User.findOne({ email: 'liberty' });
    if (!libertyUser) {
      libertyUser = await User.create({
        name: 'Liberty Management',
        email: 'liberty',
        password: 'Liberty123',
        role: ROLES.ADMIN,
        agencyId: masterAgency._id,
        status: USER_STATUS.ACTIVE
      });
      console.log('🏢 Created Liberty Management User: Liberty / Liberty123');
    } else {
      libertyUser.name = 'Liberty Management';
      libertyUser.role = ROLES.ADMIN;
      libertyUser.agencyId = masterAgency._id;
      libertyUser.password = 'Liberty123';
      await libertyUser.save();
      console.log('🏢 Verified Liberty Management User: Liberty / Liberty123');
    }

    let libertyAdminEmail = await User.findOne({ email: 'admin@libertytravel.com' });
    if (!libertyAdminEmail) {
      libertyAdminEmail = await User.create({
        name: 'Liberty Admin',
        email: 'admin@libertytravel.com',
        password: 'Liberty123',
        role: ROLES.ADMIN,
        agencyId: masterAgency._id,
        status: USER_STATUS.ACTIVE
      });
    } else {
      libertyAdminEmail.name = 'Liberty Admin';
      libertyAdminEmail.role = ROLES.ADMIN;
      libertyAdminEmail.agencyId = masterAgency._id;
      libertyAdminEmail.password = 'Liberty123';
      await libertyAdminEmail.save();
    }

    // 6. Ensure default bank accounts exist in AgencySetting
    let agencySetting = await AgencySetting.findOne();
    if (!agencySetting) {
      agencySetting = await AgencySetting.create({});
    }
    if (!agencySetting.bankAccounts || agencySetting.bankAccounts.length === 0) {
      agencySetting.bankAccounts = [
        {
          bankName: 'HDFC Bank',
          accountName: 'Liberty Tours & Travels Current A/C',
          accountNumber: '50200084729101',
          ifscCode: 'HDFC0000124',
          upiId: 'libertytravels@okhdfcbank',
          openingBalance: 0,
          isDefault: true,
          isActive: true
        },
        {
          bankName: 'ICICI Bank',
          accountName: 'Liberty Tours & Travels ICICI A/C',
          accountNumber: '000505039482',
          ifscCode: 'ICIC0000005',
          upiId: 'liberty@icici',
          openingBalance: 0,
          isDefault: false,
          isActive: true
        },
        {
          bankName: 'State Bank of India (SBI)',
          accountName: 'Liberty Tours & Travels SBI A/C',
          accountNumber: '389201948271',
          ifscCode: 'SBIN0001234',
          upiId: 'liberty@sbi',
          openingBalance: 0,
          isDefault: false,
          isActive: true
        },
        {
          bankName: 'Punjab National Bank (PNB)',
          accountName: 'Liberty Tours & Travels PNB A/C',
          accountNumber: '189200210003492',
          ifscCode: 'PUNB0189200',
          upiId: 'liberty@pnb',
          openingBalance: 0,
          isDefault: false,
          isActive: true
        },
        {
          bankName: 'Axis Bank',
          accountName: 'Liberty Tours & Travels Axis A/C',
          accountNumber: '91802003849102',
          ifscCode: 'UTIB0000010',
          upiId: 'liberty@axisbank',
          openingBalance: 0,
          isDefault: false,
          isActive: true
        }
      ];
      agencySetting.bankOpeningBalance = 0;
      await agencySetting.save();
      console.log('🏦 Seeded default multi-bank accounts (HDFC, ICICI, SBI, PNB, Axis) into AgencySetting');
    }

    // 7. Clean up legacy accounts
    await User.deleteMany({ email: 'staff@libertytravel.com' });
    await User.updateMany({ role: 'staff' }, { role: ROLES.ADMIN });

    console.log('✅ Multi-tenant agency auto-migration verified.');
  } catch (err) {
    console.warn('⚠️ Auto-migrate agencies notice:', err.message);
  }
};

module.exports = { autoMigrateAgencies };
