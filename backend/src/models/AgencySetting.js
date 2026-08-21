const mongoose = require('mongoose');

const agencySettingSchema = new mongoose.Schema(
  {
    agencyName: {
      type: String,
      required: true,
      default: 'Liberty Tours & Travels'
    },
    tagline: {
      type: String,
      default: 'Your Trusted Global Travel & Aviation Partner'
    },
    address: {
      type: String,
      default: '124, Park Street, Kolkata, West Bengal 700016, India'
    },
    phone: {
      type: String,
      default: '+91 98300 12345 / +91 33 2288 9900'
    },
    email: {
      type: String,
      default: 'contact@libertytravel.com'
    },
    website: {
      type: String,
      default: 'https://www.libertytravel.com'
    },
    gstNumber: {
      type: String,
      default: '19AAACL1234F1Z5'
    },
    panNumber: {
      type: String,
      default: 'AAACL1234F'
    },
    invoicePrefix: {
      type: String,
      default: 'LTT-INV'
    },
    invoiceNextNumber: {
      type: Number,
      default: 1001
    },
    termsAndConditions: {
      type: String,
      default: '1. All tickets and vouchers are subject to carrier / supplier fare rules and cancellation policies.\n2. Date change or cancellation penalties are levied as per respective supplier rules.\n3. Refunds, if applicable, will be credited after deduction of supplier cancellation charges and agency service fees.\n4. Valid Govt ID / Passport (min 6 months validity) and relevant visas are the responsibility of the passenger.\n5. Please report for departure well in advance as per service guidelines.'
    },
    invoiceFooter: {
      type: String,
      default: 'Thank you for choosing Liberty Tours & Travels. Wish you a pleasant journey!'
    },
    currency: {
      type: String,
      default: 'INR'
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
  }
);

module.exports = mongoose.models.AgencySetting || mongoose.model('AgencySetting', agencySettingSchema);
