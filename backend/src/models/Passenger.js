const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null
    },
    title: {
      type: String,
      enum: ['Mr', 'Mrs', 'Ms', 'Master', 'Dr'],
      default: 'Mr'
    },
    firstName: {
      type: String,
      required: [true, 'Passenger first name is required'],
      trim: true
    },
    lastName: {
      type: String,
      default: '',
      trim: true
    },
    dateOfBirth: {
      type: String,
      default: ''
    },
    passportNumber: {
      type: String,
      uppercase: true,
      trim: true,
      default: ''
    },
    passportExpiry: {
      type: String,
      default: ''
    },
    nationality: {
      type: String,
      default: 'Indian',
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
  }
);

module.exports = mongoose.models.Passenger || mongoose.model('Passenger', passengerSchema);
