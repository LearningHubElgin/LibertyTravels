/**
 * Safe financial calculations with 2-decimal precision
 */

const toDecimal = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? 0.00 : Math.round(num * 100) / 100;
};


const calculateBookingFinancials = ({
  baseFare = 0,
  tax = 0,
  serviceCharge = 0,
  otherCharges = 0,
  discount = 0,
  amountReceived = 0
}) => {
  const bf = toDecimal(baseFare);
  const tx = toDecimal(tax);
  const sc = toDecimal(serviceCharge);
  const oc = toDecimal(otherCharges);
  const dc = toDecimal(discount);
  const ar = toDecimal(amountReceived);

  // Total Amount Charged = Base Fare + Tax + Service Charge + Other Charges - Discount
  const totalAmount = Math.max(0, toDecimal(bf + tx + sc + oc - dc));
  
  // Balance Due = Total Amount - Amount Received
  const balanceDue = Math.max(0, toDecimal(totalAmount - ar));

  let paymentStatus = 'unpaid';
  if (ar >= totalAmount && totalAmount > 0) {
    paymentStatus = 'paid';
  } else if (ar > 0 && ar < totalAmount) {
    paymentStatus = 'partially_paid';
  } else {
    paymentStatus = 'unpaid';
  }

  return {
    baseFare: bf,
    tax: tx,
    serviceCharge: sc,
    otherCharges: oc,
    discount: dc,
    totalAmount,
    amountReceived: ar,
    balanceDue,
    paymentStatus
  };
};

module.exports = {
  toDecimal,
  calculateBookingFinancials
};
