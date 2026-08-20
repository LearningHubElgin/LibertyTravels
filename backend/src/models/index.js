const User = require('./User');
const Customer = require('./Customer');
const Airline = require('./Airline');
const Booking = require('./Booking');
const Passenger = require('./Passenger');
const Payment = require('./Payment');
const Transaction = require('./Transaction');
const Expense = require('./Expense');
const AgencySetting = require('./AgencySetting');
const ActivityLog = require('./ActivityLog');
const Notification = require('./Notification');

module.exports = {
  User,
  Customer,
  Airline,
  Company: Airline,
  Booking,
  Passenger,
  Payment,
  Transaction,
  Expense,
  AgencySetting,
  ActivityLog,
  Notification
};

