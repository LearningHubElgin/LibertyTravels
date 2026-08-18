const mongoose = require('mongoose');

const airlineSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Airline code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Airline name is required'],
      trim: true
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
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
