const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    receiptNo: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      index: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: 0.01
    },
    paymentDate: {
      type: String,
      required: true,
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'bank_transfer', 'card', 'cheque', 'other'],
      default: 'cash',
      index: true
    },
    reference: {
      type: String,
      default: '',
      trim: true
    },
    notes: {
      type: String,
      default: ''
    },
    receivedBy: {
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

paymentSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true
});

paymentSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

paymentSchema.virtual('receiver', {
  ref: 'User',
  localField: 'receivedBy',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
