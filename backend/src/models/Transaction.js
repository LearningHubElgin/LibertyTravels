const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    referenceNo: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      index: true
    },
    transactionDate: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['booking', 'customer_payment', 'expense', 'refund', 'adjustment', 'commission', 'other_income'],
      required: true,
      index: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    debit: {
      type: Number,
      default: 0
    },
    credit: {
      type: Number,
      default: 0
    },
    balance: {
      type: Number,
      default: 0
    },
    paymentMethod: {
      type: String,
      default: null
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
      index: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
  }
);

transactionSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true
});

transactionSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

transactionSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
