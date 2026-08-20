const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    referenceNo: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      index: true
    },
    serviceType: {
      type: String,
      enum: ['flight', 'train', 'bus', 'hotel', 'car', 'other'],
      default: 'flight',
      index: true
    },
    bookingDate: {
      type: String,
      required: true,
      index: true
    },
    bookingType: {
      type: String,
      enum: ['one_way', 'round_trip', 'multi_city'],
      default: 'one_way'
    },
    journeyDate: {
      type: String,
      default: '',
      index: true
    },
    returnDate: {
      type: String,
      default: null
    },
    sector: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
      index: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    airlineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Airline',
      default: null,
      index: true
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Airline',
      default: null,
      index: true
    },
    flightNumber: {
      type: String,
      default: '',
      trim: true,
      uppercase: true
    },
    pnr: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
      index: true
    },
    ticketNumber: {
      type: String,
      default: '',
      trim: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true
    },
    passengerName: {
      type: String,
      default: '',
      trim: true
    },
    costPrice: {
      type: Number,
      default: 0
    },
    sellPrice: {
      type: Number,
      default: 0
    },
    profit: {
      type: Number,
      default: 0
    },
    baseFare: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    serviceCharge: {
      type: Number,
      default: 0
    },
    otherCharges: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    commission: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0
    },
    amountReceived: {
      type: Number,
      default: 0
    },
    balanceDue: {
      type: Number,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'partially_paid', 'unpaid'],
      default: 'unpaid',
      index: true
    },
    status: {
      type: String,
      enum: ['confirmed', 'pending', 'completed', 'cancelled', 'refunded'],
      default: 'confirmed',
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
  }
);

// Virtual relationships
bookingSchema.virtual('airline', {
  ref: 'Airline',
  localField: 'airlineId',
  foreignField: '_id',
  justOne: true
});

bookingSchema.virtual('company', {
  ref: 'Airline',
  localField: 'companyId',
  foreignField: '_id',
  justOne: true
});

bookingSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

bookingSchema.virtual('passengers', {
  ref: 'Passenger',
  localField: '_id',
  foreignField: 'bookingId'
});

bookingSchema.virtual('payments', {
  ref: 'Payment',
  localField: '_id',
  foreignField: 'bookingId'
});

bookingSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

