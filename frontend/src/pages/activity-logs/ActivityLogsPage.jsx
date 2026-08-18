import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Shield,
  Clock,
  User
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDateTime } from '../../utils/formatters';

export const ActivityLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = `page=${pagination.page}&limit=${pagination.limit}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (moduleName) query += `&moduleName=${encodeURIComponent(moduleName)}`;
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;

      const res = await api.get(`/activity-logs?${query}`);
      if (res.data.success) {
        setLogs(res.data.logs || []);
        setPagination(res.data.pagination);
      }
    } catch (e) {
      console.error('Failed to load activity logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, pagination.limit, moduleName, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'createdAt',
      render: (row) => (
        <div className="font-mono text-xs text-slate-700 font-semibold">
          {formatDateTime(row.createdAt)}
        </div>
      )
    },
    {
      header: 'User & Role',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-700">
            {row.user?.name ? row.user.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-tight text-xs">{row.user?.name || 'System Auto'}</p>
            <span className="text-[10px] font-semibold text-brand-600 capitalize">
              {row.user?.role?.replace('_', ' ') || 'Internal'}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Module',
      render: (row) => (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
          {row.module}
        </span>
      )
    },
    {
      header: 'Action',
      render: (row) => (
        <span className="font-semibold text-xs text-slate-900">{row.action}</span>
      )
    },
    {
      header: 'Description & Reference',
      render: (row) => (
        <div className="max-w-md text-xs">
          <p className="text-slate-800 leading-relaxed">{row.description}</p>
          {row.referenceId && (
            <span className="font-mono text-[10px] text-slate-400 mt-0.5 block">
              Ref ID: {row.referenceId}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'IP Address',
      render: (row) => (
        <span className="font-mono text-[11px] text-slate-400">{row.ipAddress || '127.0.0.1'}</span>
      )
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      <PageHeader
        title="Activity Audit Log"
        subtitle="Chronological audit trail of all staff logins, bookings, payment receipts and system operations"
        icon={History}
      />

      {/* Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs w-full min-w-0">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search action or details description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-[11px] sm:text-xs border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <select
            value={moduleName}
            onChange={(e) => setModuleName(e.target.value)}
            className="px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs border border-slate-200 rounded-lg sm:rounded-xl bg-white focus:outline-none"
          >
            <option value="">All Modules</option>
            <option value="Auth">Auth & Session</option>
            <option value="Booking">Bookings</option>
            <option value="Payment">Payments</option>
            <option value="Customer">Customers</option>
            <option value="Airline">Airlines</option>
            <option value="Expense">Expenses</option>
            <option value="User Management">Users</option>
            <option value="Agency Settings">Settings</option>
          </select>
          <button
            type="submit"
            className="px-3 py-1.5 sm:px-5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] sm:text-xs font-semibold rounded-lg sm:rounded-xl transition shrink-0"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Audit Logs Table */}
      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
        emptyTitle="No activity logs found"
        emptyDescription="System actions and user sessions will appear here automatically."
      />
    </div>
  );
};
