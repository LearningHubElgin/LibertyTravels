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
