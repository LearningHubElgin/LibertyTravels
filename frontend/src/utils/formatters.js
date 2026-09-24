/**
 * Standard date & time formatting utilities for Liberty Tours & Travels ERP
 * Format: DD/MM/YYYY (or DD-MM-YYYY) and 12-hour AM/PM for all timestamps.
 */

// Format date string or object to DD/MM/YYYY
export const formatDate = (dateValue) => {
  if (!dateValue) return 'N/A';
  
  // If already in YYYY-MM-DD string format
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split('-');
    return `${day}/${month}/${year}`;
  }

  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return String(dateValue);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

// Format date in readable format: DD MMM YYYY (e.g. 18 Aug 2026)
export const formatDateReadable = (dateValue) => {
  if (!dateValue) return 'N/A';
  
  let d;
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split('-');
    d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  } else {
    d = new Date(dateValue);
  }

  if (isNaN(d.getTime())) return String(dateValue);

  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Format time in 12-hour AM / PM format (e.g. 02:45 PM)
export const formatTime = (dateValue) => {
  if (!dateValue) return '';
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Format date + time in DD/MM/YYYY hh:mm AM/PM (e.g. 18/08/2026 02:45 PM)
export const formatDateTime = (dateValue) => {
  if (!dateValue) return 'N/A';
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return String(dateValue);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  const timeStr = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return `${day}/${month}/${year} ${timeStr}`;
};

// Format Indian Currency (INR)
export const formatCurrency = (val, withDecimals = false) => {
  const num = parseFloat(val || 0);
  if (withDecimals) {
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
};

// Convert number to Indian English words (e.g. 58778 -> "Rupees Fifty Eight Thousand Seven Hundred Seventy Eight Only")
export const numberToWords = (num) => {
  const n = Math.floor(Math.abs(Number(num) || 0));
  if (n === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanOneThousand = (number) => {
    let current = '';
    if (number >= 100) {
      current += a[Math.floor(number / 100)] + ' Hundred ';
      number %= 100;
    }
    if (number >= 20) {
      current += b[Math.floor(number / 10)] + ' ';
      number %= 10;
    }
    if (number > 0) {
      current += a[number] + ' ';
    }
    return current.trim();
  };

  let crore = Math.floor(n / 10000000);
  let remainder = n % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder %= 100000;
  let thousand = Math.floor(remainder / 1000);
  let hundred = remainder % 1000;

  let words = '';
  if (crore > 0) words += convertLessThanOneThousand(crore) + ' Crore ';
  if (lakh > 0) words += convertLessThanOneThousand(lakh) + ' Lakh ';
  if (thousand > 0) words += convertLessThanOneThousand(thousand) + ' Thousand ';
  if (hundred > 0) words += convertLessThanOneThousand(hundred) + ' ';

  const paise = Math.round((Math.abs(Number(num) || 0) - n) * 100);
  let result = 'Rupees ' + words.trim();
  if (paise > 0) {
    result += ' and ' + convertLessThanOneThousand(paise) + ' Paise';
  }
  return result + ' Only';
};

