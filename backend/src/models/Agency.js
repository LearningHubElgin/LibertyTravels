const mongoose = require('mongoose');
const { AGENCY_STATUS, AGENCY_PLANS } = require('../config/constants');

const agencySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Travel agency name is required'],
      trim: true,
      index: true
    },
    code: {
      type: String,
      required: [true, 'Agency code / identifier is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    tagline: {
      type: String,
      default: '',
      trim: true
    },
    logo: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      required: [true, 'Official agency email is required'],
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true
    },
    address: {
      type: String,
      default: '',
      trim: true
    },
    city: {
      type: String,
      default: '',
      trim: true
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    },
    website: {
      type: String,
      default: '',
      trim: true
    },
    gstNumber: {
      type: String,
      default: '',
      trim: true
    },
    panNumber: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(AGENCY_STATUS),
      default: AGENCY_STATUS.ACTIVE,
      index: true
    },
    plan: {
      type: String,
      enum: Object.values(AGENCY_PLANS),
      default: AGENCY_PLANS.PROFESSIONAL
    },
    subscriptionExpiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year default
    },
    contactPerson: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      designation: { type: String, default: 'Agency Owner / Manager' }
    },
    invoiceSettings: {
      prefix: { type: String, default: 'INV-2026-' },
      nextNumber: { type: Number, default: 1001 },
      terms: {
        type: String,
        default:
          '1. Service cancellation and date change charges apply as per company policy.\n2. Please carry valid Govt ID / Passport for travel.\n3. Recheck travel timings 24 hours prior to scheduled departure.\n4. Baggage allowance is subject to company rules.'
      },
      footer: {
        type: String,
        default: 'Thank you for choosing our travel services. Have a pleasant and safe journey!'
      }
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

// Virtual for linked users count & bookings count
agencySchema.virtual('users', {
  ref: 'User',
  localField: '_id',
  foreignField: 'agencyId'
});

agencySchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'agencyId'
});

const Agency = mongoose.models.Agency || mongoose.model('Agency', agencySchema);

module.exports = Agency;
