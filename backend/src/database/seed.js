require('dotenv').config();
const { connectDB } = require('../config/db');
const {
  User,
  Customer,
  Airline,
  Booking,
  Passenger,
  Payment,
  Transaction,
  Expense,
  Notification,
  ActivityLog,
  AgencySetting
} = require('../models');
const {
  ROLES,
  USER_STATUS
} = require('../config/constants');

const seedDatabase = async () => {
  try {
    console.log('🌱 Initializing database with essential setup for Liberty Tours & Travels ERP...');

    await connectDB();

    // 0. Clear all existing collections for clean state
    await Promise.all([
      User.deleteMany({}),
      Customer.deleteMany({}),
      Airline.deleteMany({}),
      Booking.deleteMany({}),
      Passenger.deleteMany({}),
      Payment.deleteMany({}),
      Transaction.deleteMany({}),
      Expense.deleteMany({}),
      Notification.deleteMany({}),
      ActivityLog.deleteMany({}),
      AgencySetting.deleteMany({})
    ]);
    console.log('📦 Cleared existing MongoDB collections.');

    // 1. Create Default Users (Super Admin & Admin)
    const superAdmin = await User.create({
      name: 'Liberty Super Admin',
      email: 'admin@libertytravel.com',
      password: 'admin123',
      role: ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE
    });

    const admin = await User.create({
      name: 'Operations Manager',
      email: 'staff@libertytravel.com',
      password: 'staff123',
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE
    });
    console.log('👤 Created Super Admin and Admin staff accounts.');

    // 2. Create Default Agency Settings
    await AgencySetting.create({
      agencyName: 'Liberty Tours & Travels',
      tagline: 'Your Trusted Global Flight & Travel Partner',
      address: 'Suite 402, Liberty Business Tower, Connaught Place, New Delhi - 110001, India',
      phone: '+91 98765 43210 / 011-23456789',
      email: 'contact@libertytravel.com',
      website: 'www.libertytoursandtravels.com',
      gstNumber: '07AAAAA0000A1Z5',
      panNumber: 'AAACL1234K',
      invoicePrefix: 'INV-2026-',
      invoiceNextNumber: 1001,
      termsAndConditions: '1. Flight ticket cancellation and date change charges apply as per airline policy.\n2. Please carry valid Govt ID / Passport for domestic / international travel.\n3. Recheck flight timings 24 hours prior to scheduled departure.\n4. Baggage allowance is subject to airline rules specified on ticket.',
      invoiceFooter: 'Thank you for choosing Liberty Tours & Travels. Have a pleasant and safe journey!'
    });
    console.log('⚙️ Created Agency & Invoice Settings.');

    // 3. Create Standard Airlines Master List
    const airlinesData = [
      { name: 'IndiGo Airlines', code: '6E', country: 'India', status: 'active', commissionRate: 2.5 },
      { name: 'Air India', code: 'AI', country: 'India', status: 'active', commissionRate: 3.0 },
      { name: 'Emirates', code: 'EK', country: 'UAE', status: 'active', commissionRate: 4.0 },
      { name: 'Qatar Airways', code: 'QR', country: 'Qatar', status: 'active', commissionRate: 3.5 },
      { name: 'Singapore Airlines', code: 'SQ', country: 'Singapore', status: 'active', commissionRate: 3.5 },
      { name: 'Vistara', code: 'UK', country: 'India', status: 'active', commissionRate: 2.5 },
      { name: 'Akasa Air', code: 'QP', country: 'India', status: 'active', commissionRate: 2.0 },
      { name: 'SpiceJet', code: 'SG', country: 'India', status: 'active', commissionRate: 2.0 },
      { name: 'Etihad Airways', code: 'EY', country: 'UAE', status: 'active', commissionRate: 3.5 },
      { name: 'British Airways', code: 'BA', country: 'UK', status: 'active', commissionRate: 4.0 }
    ];
    const airlines = await Airline.insertMany(airlinesData);
    console.log(`✈️ Created ${airlines.length} Standard Airlines.`);

    // 4. Initial System Notification
    await Notification.create({
      userId: superAdmin._id,
      title: 'ERP System Initialized',
      message: 'Liberty Tours & Travels ERP system database initialized successfully.',
      type: 'info',
      read: false
    });

    console.log('\n============================================================');
    console.log('✅ DATABASE ESSENTIAL INITIALIZATION COMPLETED!');
    console.log('------------------------------------------------------------');
    console.log('🔑 Login Credentials:');
    console.log('   1. Super Admin: admin@libertytravel.com | admin123');
    console.log('   2. Staff Admin: staff@libertytravel.com | staff123');
    console.log('============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database seed:', error);
    process.exit(1);
  }
};

seedDatabase();
