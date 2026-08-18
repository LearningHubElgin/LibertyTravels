const { Booking, Customer } = require('../models');

/**
 * Generate unique booking reference like TRV-2026-00001
 */
const generateBookingReference = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `TRV-${currentYear}-`;
  
  const lastBooking = await Booking.findOne({
    referenceNo: new RegExp(`^${prefix}`)
  }).sort({ createdAt: -1 });

  let nextSequence = 1;
  if (lastBooking && lastBooking.referenceNo) {
    const parts = lastBooking.referenceNo.split('-');
    if (parts.length === 3) {
      const num = parseInt(parts[2], 10);
      if (!isNaN(num)) {
        nextSequence = num + 1;
      }
    }
  }

  return `${prefix}${String(nextSequence).padStart(5, '0')}`;
};

/**
 * Generate unique customer code like CUST-1001
 */
const generateCustomerCode = async () => {
  const lastCustomer = await Customer.findOne().sort({ createdAt: -1 });

  let nextSequence = 1001;
  if (lastCustomer && lastCustomer.customerCode) {
    const parts = lastCustomer.customerCode.split('-');
    if (parts.length === 2) {
      const num = parseInt(parts[1], 10);
      if (!isNaN(num)) {
        nextSequence = num + 1;
      }
    }
  }

  return `CUST-${nextSequence}`;
};

/**
 * Generate unique transaction reference
 */
const generateTransactionReference = async (type = 'TXN') => {
  const currentYear = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);
  return `${type}-${currentYear}-${timestamp}${random}`;
};

/**
 * Generate unique payment reference
 */
const generatePaymentReference = async () => {
  const currentYear = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);
  return `PAY-${currentYear}-${timestamp}${random}`;
};

module.exports = {
  generateBookingReference,
  generateCustomerCode,
  generateTransactionReference,
  generatePaymentReference
};
