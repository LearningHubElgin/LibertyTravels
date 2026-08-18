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
  USER_STATUS,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  TRANSACTION_TYPES
} = require('../config/constants');
const { toDecimal } = require('../utils/financialCalculations');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting MongoDB database seed for Liberty Tours & Travels ERP...');

    await connectDB();

    // 0. Clear existing data
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
    console.log('📦 Cleared all MongoDB collections.');

    // 1. Create Default Users (Super Admin & Admin)
    const superAdmin = await User.create({
      name: 'Liberty Super Admin',
      email: 'admin@libertytravel.com',
      password: 'admin123',
      role: ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE
    });

    const admin = await User.create({
      name: 'Rahul Operations Manager',
      email: 'staff@libertytravel.com',
      password: 'staff123',
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE
    });
    console.log('👤 Created Super Admin and Admin users.');

    // 2. Create Agency Settings
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
      invoiceNextNumber: 1025,
      termsAndConditions: '1. Flight ticket cancellation and date change charges apply as per airline policy.\n2. Please carry valid Govt ID / Passport for domestic / international travel.\n3. Recheck flight timings 24 hours prior to scheduled departure.\n4. Baggage allowance is subject to airline rules specified on ticket.',
      invoiceFooter: 'Thank you for choosing Liberty Tours & Travels. Have a pleasant and safe journey!'
    });
    console.log('⚙️ Created Agency & Invoice Settings.');

    // 3. Create Airlines
    const airlinesData = [
      { name: 'IndiGo Airlines', code: '6E', country: 'India', status: 'active', commissionRate: 2.5 },
      { name: 'Air India', code: 'AI', country: 'India', status: 'active', commissionRate: 3.0 },
      { name: 'Emirates', code: 'EK', country: 'UAE', status: 'active', commissionRate: 4.0 },
      { name: 'Qatar Airways', code: 'QR', country: 'Qatar', status: 'active', commissionRate: 3.5 },
      { name: 'Singapore Airlines', code: 'SQ', country: 'Singapore', status: 'active', commissionRate: 3.5 },
      { name: 'Vistara', code: 'UK', country: 'India', status: 'active', commissionRate: 2.5 }
    ];
    const airlines = await Airline.insertMany(airlinesData);
    console.log(`✈️ Created ${airlines.length} Airlines.`);

    // 4. Create Customers
    const customersData = [
      { customerCode: 'CUST-1001', name: 'Rajesh Malhotra', phone: '+91 98111 22334', email: 'rajesh.malhotra@gmail.com', address: 'B-42 Greater Kailash, New Delhi', passportNumber: 'P1234567', nationality: 'Indian' },
      { customerCode: 'CUST-1002', name: 'Ananya Deshmukh', phone: '+91 98222 33445', email: 'ananya.deshmukh@yahoo.com', address: '12 Marine Drive, Mumbai', passportNumber: 'M7654321', nationality: 'Indian' },
      { customerCode: 'CUST-1003', name: 'Vikramaditya Singhania', phone: '+91 98333 44556', email: 'vikram.singhania@corp.in', address: '77 Residency Road, Bangalore', passportNumber: 'K9876543', nationality: 'Indian' },
      { customerCode: 'CUST-1004', name: 'Pooja Bhattacharya', phone: '+91 98444 55667', email: 'pooja.bhatt@outlook.com', address: '15 Park Street, Kolkata', passportNumber: 'C3456789', nationality: 'Indian' },
      { customerCode: 'CUST-1005', name: 'Karthik Ramanathan', phone: '+91 98555 66778', email: 'karthik.r@techcorp.com', address: '40 Anna Nagar, Chennai', passportNumber: 'T5678901', nationality: 'Indian' },
      { customerCode: 'CUST-1006', name: 'Sunil & Renu Verma', phone: '+91 98666 77889', email: 'sunil.verma@vermagroup.com', address: 'Sector 15, Chandigarh', passportNumber: 'N2345678', nationality: 'Indian' },
      { customerCode: 'CUST-1007', name: 'Deepak Agarwal', phone: '+91 98777 88990', email: 'deepak.agarwal@gmail.com', address: 'Civil Lines, Jaipur', passportNumber: 'J8765432', nationality: 'Indian' },
      { customerCode: 'CUST-1008', name: 'Meera Patel', phone: '+91 98888 99001', email: 'meera.patel@pateltex.in', address: 'Navrangpura, Ahmedabad', passportNumber: 'A4567890', nationality: 'Indian' },
      { customerCode: 'CUST-1009', name: 'Sanjay Kapoor', phone: '+91 98999 00112', email: 'sanjay.k@kapoorstudio.com', address: 'Bandra West, Mumbai', passportNumber: 'B6789012', nationality: 'Indian' },
      { customerCode: 'CUST-1010', name: 'Dr. Ramesh Nambiar', phone: '+91 97111 12233', email: 'dr.ramesh@medcare.org', address: 'MG Road, Kochi', passportNumber: 'K1122334', nationality: 'Indian' },
      { customerCode: 'CUST-1011', name: 'Neha Chawla', phone: '+91 97222 23344', email: 'neha.chawla@gmail.com', address: 'DLF Phase 2, Gurgaon', passportNumber: 'G9988776', nationality: 'Indian' },
      { customerCode: 'CUST-1012', name: 'Amitabh Sen', phone: '+91 97333 34455', email: 'amitabh.sen@sensolutions.in', address: 'Salt Lake Sector 5, Kolkata', passportNumber: 'S4455667', nationality: 'Indian' }
    ];
    const customers = await Customer.insertMany(customersData);
    console.log(`👥 Created ${customers.length} Customers.`);

    // 5. Create Realistic Bookings, Multi-Passengers, Payments and Transactions
    const bookingSeeds = [
      {
        ref: 'TRV-2026-00001',
        bDate: '2026-08-01',
        type: 'one_way',
        sector: 'DEL-DXB',
        jDate: '2026-08-20',
        rDate: null,
        airlineIdx: 2,
        flight: 'EK-511',
        pnr: 'EK98XA',
        ticket: '176-2451892110',
        status: 'confirmed',
        custIdx: 0,
        baseFare: 28000,
        tax: 4500,
        serviceCharge: 1500,
        otherCharges: 0,
        discount: 1000,
        amountReceived: 33000,
        commission: 2000,
        passengers: [
          { title: 'Mr', firstName: 'Rajesh', lastName: 'Malhotra', dob: '1982-05-14', passport: 'P1234567', expiry: '2030-05-14' },
          { title: 'Mrs', firstName: 'Geeta', lastName: 'Malhotra', dob: '1985-08-22', passport: 'P7654321', expiry: '2031-08-22' }
        ],
        payments: [
          { amount: 33000, date: '2026-08-01', method: 'bank_transfer', ref: 'NEFT-889102' }
        ]
      },
      {
        ref: 'TRV-2026-00002',
        bDate: '2026-08-03',
        type: 'round_trip',
        sector: 'BOM-LHR-BOM',
        jDate: '2026-08-22',
        rDate: '2026-09-05',
        airlineIdx: 1,
        flight: 'AI-131',
        pnr: 'AIR77L',
        ticket: '098-4432190871',
        status: 'confirmed',
        custIdx: 1,
        baseFare: 65000,
        tax: 12000,
        serviceCharge: 3000,
        otherCharges: 1000,
        discount: 2000,
        amountReceived: 40000,
        commission: 4500,
        passengers: [
          { title: 'Ms', firstName: 'Ananya', lastName: 'Deshmukh', dob: '1992-11-10', passport: 'M7654321', expiry: '2029-11-10' }
        ],
        payments: [
          { amount: 40000, date: '2026-08-03', method: 'card', ref: 'CARD-TXN-5541' }
        ]
      },
      {
        ref: 'TRV-2026-00003',
        bDate: '2026-08-05',
        type: 'one_way',
        sector: 'BLR-SIN',
        jDate: '2026-08-24',
        rDate: null,
        airlineIdx: 4,
        flight: 'SQ-503',
        pnr: 'SQ659M',
        ticket: '618-9901827461',
        status: 'confirmed',
        custIdx: 2,
        baseFare: 22000,
        tax: 3800,
        serviceCharge: 1200,
        otherCharges: 0,
        discount: 0,
        amountReceived: 0,
        commission: 1800,
        passengers: [
          { title: 'Mr', firstName: 'Vikramaditya', lastName: 'Singhania', dob: '1978-02-18', passport: 'K9876543', expiry: '2028-02-18' }
        ],
        payments: []
      },
      {
        ref: 'TRV-2026-00004',
        bDate: '2026-08-06',
        type: 'one_way',
        sector: 'CCU-BKK',
        jDate: '2026-08-19',
        rDate: null,
        airlineIdx: 0,
        flight: '6E-1051',
        pnr: 'IG889K',
        ticket: '312-5561829012',
        status: 'confirmed',
        custIdx: 3,
        baseFare: 14000,
        tax: 2500,
        serviceCharge: 1000,
        otherCharges: 500,
        discount: 500,
        amountReceived: 17500,
        commission: 1200,
        passengers: [
          { title: 'Ms', firstName: 'Pooja', lastName: 'Bhattacharya', dob: '1995-09-04', passport: 'C3456789', expiry: '2032-09-04' }
        ],
        payments: [
          { amount: 17500, date: '2026-08-06', method: 'upi', ref: 'UPI-98112233' }
        ]
      },
      {
        ref: 'TRV-2026-00005',
        bDate: '2026-08-08',
        type: 'round_trip',
        sector: 'DEL-DOH-DEL',
        jDate: '2026-08-25',
        rDate: '2026-09-02',
        airlineIdx: 3,
        flight: 'QR-571',
        pnr: 'QTR12Z',
        ticket: '157-8891024567',
        status: 'confirmed',
        custIdx: 4,
        baseFare: 42000,
        tax: 7500,
        serviceCharge: 2000,
        otherCharges: 0,
        discount: 1500,
        amountReceived: 50000,
        commission: 3000,
        passengers: [
          { title: 'Mr', firstName: 'Karthik', lastName: 'Ramanathan', dob: '1987-03-29', passport: 'T5678901', expiry: '2030-03-29' }
        ],
        payments: [
          { amount: 50000, date: '2026-08-08', method: 'bank_transfer', ref: 'IMPS-443311' }
        ]
      },
      {
        ref: 'TRV-2026-00006',
        bDate: '2026-08-10',
        type: 'round_trip',
        sector: 'DEL-GOI-DEL',
        jDate: '2026-08-26',
        rDate: '2026-08-30',
        airlineIdx: 5,
        flight: 'UK-847',
        pnr: 'VIS99X',
        ticket: '228-7761524310',
        status: 'confirmed',
        custIdx: 5,
        baseFare: 24000,
        tax: 4200,
        serviceCharge: 1800,
        otherCharges: 0,
        discount: 1000,
        amountReceived: 20000,
        commission: 2200,
        passengers: [
          { title: 'Mr', firstName: 'Sunil', lastName: 'Verma', dob: '1975-06-12', passport: 'N2345678', expiry: '2028-06-12' },
          { title: 'Mrs', firstName: 'Renu', lastName: 'Verma', dob: '1979-10-15', passport: 'N8765432', expiry: '2029-10-15' },
          { title: 'Master', firstName: 'Aarav', lastName: 'Verma', dob: '2014-04-05', passport: 'N1122446', expiry: '2029-04-05' }
        ],
        payments: [
          { amount: 20000, date: '2026-08-10', method: 'cash', ref: 'CASH-REC-0012' }
        ]
      },
      {
        ref: 'TRV-2026-00007',
        bDate: '2026-08-18',
        type: 'one_way',
        sector: 'DEL-BOM',
        jDate: '2026-08-18',
        rDate: null,
        airlineIdx: 0,
        flight: '6E-208',
        pnr: 'IG776V',
        ticket: '312-9988112233',
        status: 'confirmed',
        custIdx: 6,
        baseFare: 7500,
        tax: 1200,
        serviceCharge: 800,
        otherCharges: 0,
        discount: 500,
        amountReceived: 9000,
        commission: 800,
        passengers: [
          { title: 'Mr', firstName: 'Deepak', lastName: 'Agarwal', dob: '1984-01-20', passport: 'J8765432', expiry: '2030-01-20' }
        ],
        payments: [
          { amount: 9000, date: '2026-08-18', method: 'upi', ref: 'UPI-7711223344' }
        ]
      },
      {
        ref: 'TRV-2026-00008',
        bDate: '2026-07-20',
        type: 'one_way',
        sector: 'BOM-DEL',
        jDate: '2026-07-28',
        rDate: null,
        airlineIdx: 1,
        flight: 'AI-888',
        pnr: 'AI112Z',
        ticket: '098-1122334455',
        status: 'completed',
        custIdx: 7,
        baseFare: 8200,
        tax: 1300,
        serviceCharge: 800,
        otherCharges: 0,
        discount: 300,
        amountReceived: 10000,
        commission: 900,
        passengers: [
          { title: 'Ms', firstName: 'Meera', lastName: 'Patel', dob: '1990-07-11', passport: 'A4567890', expiry: '2031-07-11' }
        ],
        payments: [
          { amount: 10000, date: '2026-07-20', method: 'bank_transfer', ref: 'IMPS-998811' }
        ]
      },
      {
        ref: 'TRV-2026-00009',
        bDate: '2026-07-25',
        type: 'round_trip',
        sector: 'DEL-DXB-DEL',
        jDate: '2026-08-15',
        rDate: '2026-08-22',
        airlineIdx: 2,
        flight: 'EK-513',
        pnr: 'EK334B',
        ticket: '176-8877665544',
        status: 'cancelled',
        custIdx: 8,
        baseFare: 36000,
        tax: 6000,
        serviceCharge: 2000,
        otherCharges: 0,
        discount: 1000,
        amountReceived: 43000,
        commission: 0,
        passengers: [
          { title: 'Mr', firstName: 'Sanjay', lastName: 'Kapoor', dob: '1981-12-05', passport: 'B6789012', expiry: '2028-12-05' }
        ],
        payments: [
          { amount: 43000, date: '2026-07-25', method: 'card', ref: 'CARD-TXN-9912' }
        ]
      },
      {
        ref: 'TRV-2026-00010',
        bDate: '2026-08-14',
        type: 'one_way',
        sector: 'COK-DOH',
        jDate: '2026-08-28',
        rDate: null,
        airlineIdx: 3,
        flight: 'QR-515',
        pnr: 'QR998K',
        ticket: '157-3344556677',
        status: 'pending',
        custIdx: 9,
        baseFare: 21000,
        tax: 3500,
        serviceCharge: 1200,
        otherCharges: 0,
        discount: 700,
        amountReceived: 0,
        commission: 1500,
        passengers: [
          { title: 'Dr', firstName: 'Ramesh', lastName: 'Nambiar', dob: '1970-04-18', passport: 'K1122334', expiry: '2027-04-18' }
        ],
        payments: []
      },
      {
        ref: 'TRV-2026-00011',
        bDate: '2026-08-15',
        type: 'multi_city',
        sector: 'DEL-SIN-BKK-DEL',
        jDate: '2026-08-30',
        rDate: '2026-09-08',
        airlineIdx: 4,
        flight: 'SQ-401',
        pnr: 'SQ887P',
        ticket: '618-1122998877',
        status: 'confirmed',
        custIdx: 10,
        baseFare: 55000,
        tax: 9500,
        serviceCharge: 2500,
        otherCharges: 1000,
        discount: 2000,
        amountReceived: 66000,
        commission: 4000,
        passengers: [
          { title: 'Ms', firstName: 'Neha', lastName: 'Chawla', dob: '1993-08-30', passport: 'G9988776', expiry: '2033-08-30' },
          { title: 'Mr', firstName: 'Rohan', lastName: 'Chawla', dob: '1990-03-14', passport: 'G1144778', expiry: '2032-03-14' }
        ],
        payments: [
          { amount: 66000, date: '2026-08-15', method: 'bank_transfer', ref: 'RTGS-887766' }
        ]
      },
      {
        ref: 'TRV-2026-00012',
        bDate: '2026-08-16',
        type: 'one_way',
        sector: 'CCU-DEL',
        jDate: '2026-08-21',
        rDate: null,
        airlineIdx: 5,
        flight: 'UK-720',
        pnr: 'UK665M',
        ticket: '228-3344119900',
        status: 'confirmed',
        custIdx: 11,
        baseFare: 6800,
        tax: 1100,
        serviceCharge: 700,
        otherCharges: 0,
        discount: 200,
        amountReceived: 5000,
        commission: 600,
        passengers: [
          { title: 'Mr', firstName: 'Amitabh', lastName: 'Sen', dob: '1988-10-09', passport: 'S4455667', expiry: '2029-10-09' }
        ],
        payments: [
          { amount: 5000, date: '2026-08-16', method: 'upi', ref: 'UPI-11992288' }
        ]
      },
      {
        ref: 'TRV-2026-00013',
        bDate: '2026-08-12',
        type: 'round_trip',
        sector: 'DEL-DXB-DEL',
        jDate: '2026-08-27',
        rDate: '2026-09-03',
        airlineIdx: 1,
        flight: 'AI-995',
        pnr: 'AI884K',
        ticket: '098-6677889900',
        status: 'confirmed',
        custIdx: 0,
        baseFare: 32000,
        tax: 5500,
        serviceCharge: 1500,
        otherCharges: 0,
        discount: 1000,
        amountReceived: 38000,
        commission: 2500,
        passengers: [
          { title: 'Mr', firstName: 'Rajesh', lastName: 'Malhotra', dob: '1982-05-14', passport: 'P1234567', expiry: '2030-05-14' }
        ],
        payments: [
          { amount: 38000, date: '2026-08-12', method: 'card', ref: 'CARD-TXN-1122' }
        ]
      },
      {
        ref: 'TRV-2026-00014',
        bDate: '2026-08-17',
        type: 'one_way',
        sector: 'BOM-BLR',
        jDate: '2026-08-23',
        rDate: null,
        airlineIdx: 0,
        flight: '6E-442',
        pnr: 'IG551P',
        ticket: '312-8877112233',
        status: 'confirmed',
        custIdx: 1,
        baseFare: 5200,
        tax: 900,
        serviceCharge: 600,
        otherCharges: 0,
        discount: 200,
        amountReceived: 0,
        commission: 500,
        passengers: [
          { title: 'Ms', firstName: 'Ananya', lastName: 'Deshmukh', dob: '1992-11-10', passport: 'M7654321', expiry: '2029-11-10' }
        ],
        payments: []
      },
      {
        ref: 'TRV-2026-00015',
        bDate: '2026-08-18',
        type: 'one_way',
        sector: 'DEL-LHR',
        jDate: '2026-09-01',
        rDate: null,
        airlineIdx: 2,
        flight: 'EK-007',
        pnr: 'EK771Q',
        ticket: '176-3399118822',
        status: 'confirmed',
        custIdx: 2,
        baseFare: 48000,
        tax: 8000,
        serviceCharge: 2500,
        otherCharges: 0,
        discount: 1500,
        amountReceived: 57000,
        commission: 3500,
        passengers: [
          { title: 'Mr', firstName: 'Vikramaditya', lastName: 'Singhania', dob: '1978-02-18', passport: 'K9876543', expiry: '2028-02-18' }
        ],
        payments: [
          { amount: 57000, date: '2026-08-18', method: 'bank_transfer', ref: 'IMPS-774411' }
        ]
      },
      {
        ref: 'TRV-2026-00016',
        bDate: '2026-07-15',
        type: 'round_trip',
        sector: 'BLR-DXB-BLR',
        jDate: '2026-07-22',
        rDate: '2026-07-29',
        airlineIdx: 2,
        flight: 'EK-565',
        pnr: 'EK889L',
        ticket: '176-1188229933',
        status: 'completed',
        custIdx: 3,
        baseFare: 34000,
        tax: 5800,
        serviceCharge: 1800,
        otherCharges: 0,
        discount: 1000,
        amountReceived: 40600,
        commission: 2800,
        passengers: [
          { title: 'Ms', firstName: 'Pooja', lastName: 'Bhattacharya', dob: '1995-09-04', passport: 'C3456789', expiry: '2032-09-04' }
        ],
        payments: [
          { amount: 40600, date: '2026-07-15', method: 'card', ref: 'CARD-TXN-4411' }
        ]
      },
      {
        ref: 'TRV-2026-00017',
        bDate: '2026-08-11',
        type: 'one_way',
        sector: 'MAA-SIN',
        jDate: '2026-08-29',
        rDate: null,
        airlineIdx: 4,
        flight: 'SQ-529',
        pnr: 'SQ442V',
        ticket: '618-4411228833',
        status: 'confirmed',
        custIdx: 4,
        baseFare: 19500,
        tax: 3200,
        serviceCharge: 1200,
        otherCharges: 0,
        discount: 500,
        amountReceived: 23400,
        commission: 1600,
        passengers: [
          { title: 'Mr', firstName: 'Karthik', lastName: 'Ramanathan', dob: '1987-03-29', passport: 'T5678901', expiry: '2030-03-29' }
        ],
        payments: [
          { amount: 23400, date: '2026-08-11', method: 'upi', ref: 'UPI-44991122' }
        ]
      },
      {
        ref: 'TRV-2026-00018',
        bDate: '2026-08-13',
        type: 'one_way',
        sector: 'DEL-JAI',
        jDate: '2026-08-25',
        rDate: null,
        airlineIdx: 0,
        flight: '6E-311',
        pnr: 'IG112C',
        ticket: '312-7744119922',
        status: 'confirmed',
        custIdx: 6,
        baseFare: 3800,
        tax: 600,
        serviceCharge: 400,
        otherCharges: 0,
        discount: 100,
        amountReceived: 3000,
        commission: 300,
        passengers: [
          { title: 'Mr', firstName: 'Deepak', lastName: 'Agarwal', dob: '1984-01-20', passport: 'J8765432', expiry: '2030-01-20' }
        ],
        payments: [
          { amount: 3000, date: '2026-08-13', method: 'cash', ref: 'CASH-REC-0019' }
        ]
      },
      {
        ref: 'TRV-2026-00019',
        bDate: '2026-08-09',
        type: 'round_trip',
        sector: 'AMD-DXB-AMD',
        jDate: '2026-08-28',
        rDate: '2026-09-04',
        airlineIdx: 2,
        flight: 'EK-539',
        pnr: 'EK991M',
        ticket: '176-5544118899',
        status: 'confirmed',
        custIdx: 7,
        baseFare: 31000,
        tax: 5200,
        serviceCharge: 1500,
        otherCharges: 0,
        discount: 800,
        amountReceived: 36900,
        commission: 2400,
        passengers: [
          { title: 'Ms', firstName: 'Meera', lastName: 'Patel', dob: '1990-07-11', passport: 'A4567890', expiry: '2031-07-11' }
        ],
        payments: [
          { amount: 36900, date: '2026-08-09', method: 'bank_transfer', ref: 'NEFT-339911' }
        ]
      },
      {
        ref: 'TRV-2026-00020',
        bDate: '2026-08-17',
        type: 'one_way',
        sector: 'BOM-GOI',
        jDate: '2026-08-20',
        rDate: null,
        airlineIdx: 1,
        flight: 'AI-661',
        pnr: 'AI449V',
        ticket: '098-7711228844',
        status: 'confirmed',
        custIdx: 8,
        baseFare: 4900,
        tax: 800,
        serviceCharge: 500,
        otherCharges: 0,
        discount: 200,
        amountReceived: 6000,
        commission: 450,
        passengers: [
          { title: 'Mr', firstName: 'Sanjay', lastName: 'Kapoor', dob: '1981-12-05', passport: 'B6789012', expiry: '2028-12-05' }
        ],
        payments: [
          { amount: 6000, date: '2026-08-17', method: 'upi', ref: 'UPI-88441199' }
        ]
      }
    ];

    for (const bData of bookingSeeds) {
      const cust = customers[bData.custIdx];
      const airl = airlines[bData.airlineIdx];
      const totalAmount = toDecimal(bData.baseFare + bData.tax + bData.serviceCharge + bData.otherCharges - bData.discount);
      const amountReceived = toDecimal(bData.amountReceived);
      const balanceDue = toDecimal(totalAmount - amountReceived);
      
      let payStatus = PAYMENT_STATUS.UNPAID;
      if (amountReceived >= totalAmount && totalAmount > 0) payStatus = PAYMENT_STATUS.PAID;
      else if (amountReceived > 0) payStatus = PAYMENT_STATUS.PARTIALLY_PAID;

      const booking = await Booking.create({
        referenceNo: bData.ref,
        bookingDate: bData.bDate,
        bookingType: bData.type,
        sector: bData.sector,
        journeyDate: bData.jDate,
        returnDate: bData.rDate,
        airlineId: airl._id,
        flightNumber: bData.flight,
        pnr: bData.pnr,
        ticketNumber: bData.ticket,
        status: bData.status,
        paymentStatus: payStatus,
        customerId: cust._id,
        baseFare: bData.baseFare,
        tax: bData.tax,
        serviceCharge: bData.serviceCharge,
        otherCharges: bData.otherCharges,
        discount: bData.discount,
        totalAmount,
        amountReceived,
        balanceDue,
        commission: bData.commission,
        createdBy: superAdmin._id
      });

      // Passengers
      const passData = bData.passengers.map(p => ({
        bookingId: booking._id,
        customerId: cust._id,
        title: p.title,
        firstName: p.firstName,
        lastName: p.lastName,
        dateOfBirth: p.dob,
        passportNumber: p.passport,
        passportExpiry: p.expiry,
        nationality: 'Indian',
        phone: cust.phone
      }));
      await Passenger.insertMany(passData);

      // Initial Debit Transaction for Booking
      await Transaction.create({
        transactionDate: bData.bDate,
        referenceNo: `TXN-BKG-${bData.ref.split('-')[2]}`,
        bookingId: booking._id,
        customerId: cust._id,
        description: `Flight Booking ${booking.referenceNo} (${booking.sector}) - ${booking.flightNumber}`,
        type: TRANSACTION_TYPES.BOOKING,
        debit: totalAmount,
        credit: 0.00,
        balance: totalAmount,
        paymentMethod: null,
        createdBy: superAdmin._id
      });

      // Payments & Credit Transactions
      for (const p of bData.payments) {
        await Payment.create({
          receiptNo: p.ref,
          bookingId: booking._id,
          customerId: cust._id,
          amount: p.amount,
          paymentDate: p.date,
          paymentMethod: p.method,
          reference: p.ref,
          notes: `Payment received for ${booking.referenceNo}`,
          receivedBy: superAdmin._id
        });

        await Transaction.create({
          transactionDate: p.date,
          referenceNo: `TXN-PAY-${booking.referenceNo.split('-')[2]}`,
          bookingId: booking._id,
          customerId: cust._id,
          description: `Payment received for ${booking.referenceNo} via ${p.method.toUpperCase()}`,
          type: TRANSACTION_TYPES.CUSTOMER_PAYMENT,
          debit: 0.00,
          credit: p.amount,
          balance: toDecimal(totalAmount - p.amount),
          paymentMethod: p.method,
          createdBy: superAdmin._id
        });
      }
    }
    console.log(`🎫 Created ${bookingSeeds.length} Complete Bookings with Passengers, Ledger Transactions & Payments.`);

    // 6. Create Realistic Expenses
    const expenseSeeds = [
      { date: '2026-08-01', category: 'Office Rent', desc: 'August 2026 Office Rent for Connaught Place office', amount: 45000, method: 'bank_transfer', to: 'Connaught Realty Pvt Ltd', ref: 'RENT-AUG-2026' },
      { date: '2026-08-05', category: 'Salary', desc: 'Staff Salary for July 2026 - Operations & Accounts team', amount: 85000, method: 'bank_transfer', to: 'Staff Payroll Account', ref: 'SAL-JUL-2026' },
      { date: '2026-08-07', category: 'Electricity', desc: 'Office BSES Electricity Bill for July', amount: 6200, method: 'upi', to: 'BSES Rajdhani Power', ref: 'BSES-991823' },
      { date: '2026-08-08', category: 'Internet', desc: 'Airtel Enterprise Fiber High-speed Internet', amount: 3500, method: 'card', to: 'Airtel Broadband', ref: 'AIRTEL-AUG-01' },
      { date: '2026-08-10', category: 'Marketing', desc: 'Google Ads and Facebook Promotion for Dubai Packages', amount: 18000, method: 'card', to: 'Google India / Meta', ref: 'ADS-DUBAI-01' },
      { date: '2026-08-12', category: 'Software', desc: 'GDS Terminal & Amadeus API Monthly Access Subscription', amount: 12500, method: 'bank_transfer', to: 'Amadeus IT Group', ref: 'GDS-SUB-881' },
      { date: '2026-08-14', category: 'Telephone', desc: 'Office PRI Line and Mobile Sim cards postpaid bills', amount: 2800, method: 'upi', to: 'Vodafone Idea', ref: 'VI-BILL-4412' },
      { date: '2026-08-16', category: 'Maintenance', desc: 'Air Conditioning maintenance and office deep cleaning', amount: 4200, method: 'cash', to: 'Urban Clap Services', ref: 'AC-MAINT-09' },
      { date: '2026-08-18', category: 'Transport', desc: 'Airport client pick-up and staff local commute allowances', amount: 3100, method: 'upi', to: 'Uber / Cab Services', ref: 'CAB-AUG-18' }
    ];

    for (let i = 0; i < expenseSeeds.length; i++) {
      const exp = expenseSeeds[i];
      const expense = await Expense.create({
        expenseDate: exp.date,
        category: exp.category,
        description: exp.desc,
        amount: exp.amount,
        paymentMethod: exp.method,
        paidTo: exp.to,
        reference: exp.ref,
        notes: '',
        createdBy: superAdmin._id
      });

      await Transaction.create({
        transactionDate: exp.date,
        referenceNo: `TXN-EXP-${i + 1}`,
        description: `Expense: [${exp.category}] ${exp.desc} (Paid to: ${exp.to})`,
        type: TRANSACTION_TYPES.EXPENSE,
        debit: exp.amount,
        credit: 0.00,
        balance: toDecimal(-exp.amount),
        paymentMethod: exp.method,
        createdBy: superAdmin._id
      });
    }
    console.log(`💸 Created ${expenseSeeds.length} Expenses and associated General Ledger transactions.`);

    // 7. Create System Notifications
    const notificationsData = [
      { userId: null, title: 'New Flight Booking Confirmed', message: 'Booking TRV-2026-00015 for Vikramaditya Singhania (DEL-LHR) has been confirmed.', type: 'info', read: false },
      { userId: null, title: 'Customer Payment Received', message: 'Payment of ₹57,000 received via Bank Transfer for booking TRV-2026-00015.', type: 'success', read: false },
      { userId: null, title: 'Upcoming Journey Tomorrow', message: 'Flight 6E-1051 (CCU-BKK) for passenger Pooja Bhattacharya departs on 19-Aug-2026.', type: 'info', read: false },
      { userId: null, title: 'Payment Outstanding Reminder', message: 'Customer Ananya Deshmukh has an outstanding balance of ₹35,000 on booking TRV-2026-00002.', type: 'warning', read: true },
      { userId: null, title: 'System Backup Completed', message: 'Daily automated ERP database backup completed successfully.', type: 'success', read: true }
    ];
    await Notification.insertMany(notificationsData);
    console.log(`🔔 Created ${notificationsData.length} Notifications.`);

    // 8. Create Activity Logs
    const activityLogsData = [
      { userId: superAdmin._id, action: 'User Login', module: 'Auth', details: 'Super Admin logged into ERP portal.', ipAddress: '127.0.0.1' },
      { userId: superAdmin._id, action: 'Create Booking', module: 'Booking', details: 'Created booking TRV-2026-00001 for Rajesh Malhotra (DEL-DXB).', ipAddress: '127.0.0.1' },
      { userId: superAdmin._id, action: 'Receive Payment', module: 'Payment', details: 'Received payment of ₹33,000 for booking TRV-2026-00001.', ipAddress: '127.0.0.1' },
      { userId: admin._id, action: 'Create Booking', module: 'Booking', details: 'Created booking TRV-2026-00002 for Ananya Deshmukh (BOM-LHR).', ipAddress: '127.0.0.1' },
      { userId: superAdmin._id, action: 'Create Expense', module: 'Expense', details: 'Logged August Office Rent expense of ₹45,000.', ipAddress: '127.0.0.1' }
    ];
    await ActivityLog.insertMany(activityLogsData);
    console.log(`📝 Created ${activityLogsData.length} Activity Logs.`);

    console.log('\n============================================================');
    console.log('✅ MONGODB DATABASE SEED COMPLETED SUCCESSFULLY!');
    console.log('------------------------------------------------------------');
    console.log('🔑 Login Credentials:');
    console.log('   1. Super Admin: admin@libertytravel.com | admin123');
    console.log('   2. Admin:       staff@libertytravel.com | staff123');
    console.log('============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database seed:', error);
    process.exit(1);
  }
};

seedDatabase();
