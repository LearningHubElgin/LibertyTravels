import React from 'react';

export const StatusBadge = ({ status, type = 'status' }) => {
  if (!status) return null;

  const normalized = String(status).toLowerCase().replace('-', '_');

  const configs = {
    // Booking Status
    confirmed: { label: 'Confirmed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    pending: { label: 'Pending', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    cancelled: { label: 'Cancelled', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    completed: { label: 'Completed', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    refunded: { label: 'Refunded', bg: 'bg-purple-50 text-purple-700 border-purple-200' },

    // Payment Status
    paid: { label: 'Paid', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    partially_paid: { label: 'Partially Paid', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    unpaid: { label: 'Unpaid', bg: 'bg-rose-50 text-rose-700 border-rose-200' },

    // General
    active: { label: 'Active', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    inactive: { label: 'Inactive', bg: 'bg-slate-100 text-slate-600 border-slate-200' },

    // Roles
    super_admin: { label: 'Super Admin', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    admin: { label: 'Admin', bg: 'bg-sky-50 text-sky-700 border-sky-200' },

    // Booking Types
    one_way: { label: 'One Way', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
    round_trip: { label: 'Round Trip', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    multi_city: { label: 'Multi City', bg: 'bg-purple-50 text-purple-700 border-purple-200' }
  };

  const config = configs[normalized] || {
    label: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
    bg: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} whitespace-nowrap shadow-xs`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
      {config.label}
    </span>
  );
};
