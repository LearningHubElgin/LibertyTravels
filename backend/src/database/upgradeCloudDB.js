require('dotenv').config();
const mongoose = require('mongoose');
const {
  Agency,
  User,
  Booking,
  Customer,
  Company,
  Payment,
  Transaction,
  Expense,
  Notification,
  ActivityLog
} = require('../models');
const { ROLES, USER_STATUS, AGENCY_STATUS, AGENCY_PLANS } = require('../config/constants');

async function upgradeCloudDatabase() {
  console.log('🚀 Connecting to MongoDB Atlas Cloud...');
  console.log('🌐 MongoDB URI:', process.env.MONGODB_URI.split('@')[1] ? 'Atlas Cluster: ' + process.env.MONGODB_URI.split('@')[1].split('/')[0] : 'Connected');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB Atlas Cloud successfully!');

  // 1. Ensure Liberty Tours & Travels Master Agency
  let masterAgency = await Agency.findOne({
    $or: [{ code: 'LIBERTY' }, { email: 'contact@libertytravel.com' }]
  });
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
    console.log('🏢 Initialized Master Agency: Liberty Tours & Travels');
  } else {
    masterAgency.status = AGENCY_STATUS.ACTIVE;
    masterAgency.plan = AGENCY_PLANS.ENTERPRISE;
    await masterAgency.save();
    console.log('🏢 Verified Master Agency: Liberty Tours & Travels');
  }

  // 2. Ensure Royal Heritage Holidays Agency
  let royalAgency = await Agency.findOne({
    $or: [{ code: 'ROYAL' }, { email: 'info@royalheritageholidays.com' }]
  });
  if (!royalAgency) {
    royalAgency = await Agency.create({
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
    console.log('🏢 Initialized Demo Agency: Royal Heritage Holidays');
  }

  // 3. Ensure Super Admin (superadmin / password123)
  let superAdmin = await User.findOne({ email: 'superadmin' });
  if (!superAdmin) {
    superAdmin = await User.create({
      name: 'Global Super Admin',
      email: 'superadmin',
      password: 'password123',
      role: ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE
    });
  } else {
    superAdmin.name = 'Global Super Admin';
    superAdmin.role = ROLES.SUPER_ADMIN;
    superAdmin.password = 'password123';
    await superAdmin.save();
  }
  console.log('👑 Verified Super Admin: superadmin / password123');

  // 4. Ensure Liberty Agency Admin (admin@libertytravel.com / admin123)
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
  } else {
    libertyAdmin.name = 'Liberty Admin';
    libertyAdmin.role = ROLES.ADMIN;
    libertyAdmin.agencyId = masterAgency._id;
    libertyAdmin.password = 'admin123';
    await libertyAdmin.save();
  }
  console.log('🏢 Verified Liberty Admin: admin@libertytravel.com / admin123');

  // 5. Ensure Royal Agency Admin (admin@royalheritageholidays.com / agency123)
  let royalAdmin = await User.findOne({ email: 'admin@royalheritageholidays.com' });
  if (!royalAdmin) {
    royalAdmin = await User.create({
      name: 'Rajesh Sharma (Royal Admin)',
      email: 'admin@royalheritageholidays.com',
      password: 'agency123',
      role: ROLES.ADMIN,
      agencyId: royalAgency._id,
      status: USER_STATUS.ACTIVE
    });
  } else {
    royalAdmin.agencyId = royalAgency._id;
    royalAdmin.password = 'agency123';
    await royalAdmin.save();
  }
  console.log('🏢 Verified Royal Admin: admin@royalheritageholidays.com / agency123');

  // 6. Link legacy documents with no agencyId to master Liberty agency
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
  console.log('🔗 Linked legacy records to Master Agency');

  // 7. Clean up removed roles
  await User.deleteMany({ email: 'staff@libertytravel.com' });
  await User.updateMany({ role: 'staff' }, { role: ROLES.ADMIN });

  // 8. Print Atlas Database summary
  const [agenciesCount, usersCount, bookingsCount, customersCount, companiesCount] = await Promise.all([
    Agency.countDocuments(),
    User.countDocuments(),
    Booking.countDocuments(),
    Customer.countDocuments(),
    Company.countDocuments()
  ]);

  console.log('==================================================');
  console.log('📊 MONGODB ATLAS CLOUD DATABASE STATUS');
  console.log('==================================================');
  console.log('🏢 Travel Agencies:', agenciesCount);
  console.log('👥 Total Users:', usersCount);
  console.log('📖 Total Bookings:', bookingsCount);
  console.log('🧑 Total Customers:', customersCount);
  console.log('🏢 Total Companies/Airlines:', companiesCount);
  console.log('==================================================');
  console.log('🎉 MongoDB Atlas Cloud Database is 100% Upgraded and Ready!');

  await mongoose.disconnect();
}

upgradeCloudDatabase().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
