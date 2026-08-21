const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Company code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['flight', 'train', 'bus', 'hotel', 'car', 'general'],
      default: 'flight',
      index: true
    },
    category: {
      type: String,
      default: 'flight'
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    },
    contact: {
      type: String,
      default: '',
      trim: true
    },
    email: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true
    },
    commissionRate: {
      type: Number,
      default: 0
    },
    walletBalance: {
      type: Number,
      default: 0
    },
    totalPurchasedTickets: {
      type: Number,
      default: 0
    },
    purchasedPrice: {
      type: Number,
      default: 0
    },
    ticketUnitPrice: {
      type: Number,
      default: 0
    },
    usedTickets: {
      type: Number,
      default: 0
    },
    purchases: [
      {
        ticketsCount: { type: Number, default: 0 },
        totalPrice: { type: Number, default: 0 },
        unitPrice: { type: Number, default: 0 },
        purchaseDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
        reference: { type: String, default: '' },
        notes: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
  }
);

// Register and export Company model (mapped to 'companies' MongoDB collection)
const Company = mongoose.models.Company || mongoose.model('Company', companySchema);

module.exports = Company;
