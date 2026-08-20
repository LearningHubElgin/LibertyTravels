const mongoose = require('mongoose');

const airlineSchema = new mongoose.Schema(
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
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
  }
);

module.exports = mongoose.models.Airline || mongoose.model('Airline', airlineSchema);

