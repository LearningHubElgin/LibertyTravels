module.exports = {
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin'
  },
  USER_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive'
  },
  BOOKING_TYPES: {
    ONE_WAY: 'one_way',
    ROUND_TRIP: 'round_trip',
    MULTI_CITY: 'multi_city'
  },
  BOOKING_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
    REFUNDED: 'refunded'
  },
  PAYMENT_STATUS: {
    PAID: 'paid',
    PARTIALLY_PAID: 'partially_paid',
    UNPAID: 'unpaid'
  },
  PAYMENT_METHODS: {
    CASH: 'cash',
    UPI: 'upi',
    BANK_TRANSFER: 'bank_transfer',
    CARD: 'card',
    CHEQUE: 'cheque',
    OTHER: 'other'
  },
  TRANSACTION_TYPES: {
    BOOKING: 'booking',
    CUSTOMER_PAYMENT: 'customer_payment',
    REFUND: 'refund',
    EXPENSE: 'expense',
    ADJUSTMENT: 'adjustment',
    COMMISSION: 'commission',
    OTHER_INCOME: 'other_income'
  },
  EXPENSE_CATEGORIES: [
    'Office Rent',
    'Salary',
    'Electricity',
    'Internet',
    'Telephone',
    'Marketing',
    'Transport',
    'Software',
    'Maintenance',
    'Travel',
    'Miscellaneous'
  ]
};
