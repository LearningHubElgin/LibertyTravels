const mongoose = require('mongoose');

const agencySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Agency name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Agency code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
      index: true
    },
    ownerName: {
      type: String,
      default: '',
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Agency contact email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      default: '',
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
    state: {
      type: String,
      default: '',
      trim: true
    },
    country: {
      type: String,
      default: 'India',
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
    logo: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'trial', 'inactive'],
      default: 'active',
      index: true
    },
    plan: {
      type: String,
      enum: ['trial', 'basic', 'pro', 'enterprise'],
      default: 'pro'
    },
    subscriptionExpiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year default
    },
    maxUsers: {
      type: Number,
      default: 10
    },
    settings: {
      currency: { type: String, default: 'INR' },
      timezone: { type: String, default: 'Asia/Kolkata' },
      invoicePrefix: { type: String, default: 'INV-' },
      invoiceNextNumber: { type: Number, default: 1001 },
      termsAndConditions: {
        type: String,
        default: '1. All bookings are subject to respective service provider policies.\n2. Date changes or cancellations apply as per carrier / hotel fare rules.\n3. Valid government ID / Passport required for travel.'
      },
      invoiceFooter: {
        type: String,
        default: 'Thank you for choosing our travel services. Have a pleasant journey!'
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
  }
);

// Pre-save slug generation if not provided
agencySchema.pre('save', function () {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
});

const Agency = mongoose.models.Agency || mongoose.model('Agency', agencySchema);

module.exports = Agency;
