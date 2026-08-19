import React, { useState, useEffect } from 'react';
import {
  Users2,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  Scale,
  Calendar
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner, TableSkeleton } from '../../components/common/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/formatters';

export const CustomersPage = () => {
  const { success, error: toastError } = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [customerLedger, setCustomerLedger] = useState(null);
  const [customerTab, setCustomerTab] = useState('overview'); // 'overview' or 'ledger'
  const [deleteCustomerId, setDeleteCustomerId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Form State
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    passportNumber: '',
    nationality: 'Indian'
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let query = `page=${pagination.page}&limit=${pagination.limit}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;

      const res = await api.get(`/customers?${query}`);
      if (res.data.success) {
        setCustomers(res.data.customers || []);
        setPagination(res.data.pagination);
      }
    } catch (e) {
      console.error('Failed to fetch customers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, pagination.limit]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCustomers();
  };

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setCustomerForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      passportNumber: '',
      nationality: 'Indian'
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCustomer(c);
    setCustomerForm({
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      address: c.address || '',
      passportNumber: c.passportNumber || '',
      nationality: c.nationality || 'Indian'
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!customerForm.name || !customerForm.phone) {
      return toastError('Customer name and phone number are required.');
    }

    setActionLoading(true);
    try {
      if (editingCustomer) {
        const res = await api.put(`/customers/${editingCustomer.id}`, customerForm);
        if (res.data.success) {
          success('Customer profile updated successfully.');
          setIsCreateModalOpen(false);
          fetchCustomers();
        }
      } else {
        const res = await api.post('/customers', customerForm);
        if (res.data.success) {
          success(`Customer ${res.data.customer.customerCode} created successfully.`);
          setIsCreateModalOpen(false);
          fetchCustomers();
        }
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenProfile = async (c) => {
    setCustomerTab('overview');
    setViewingCustomer(c); // Instant 0ms modal popup!
    setCustomerLedger(null);
    setProfileLoading(true);

    try {
      const [detailsRes, ledgerRes] = await Promise.all([
        api.get(`/customers/${c.id}`),
        api.get(`/customers/${c.id}/ledger`)
      ]);
      if (detailsRes.data.success) {
        setViewingCustomer((prev) => (prev ? { ...prev, ...detailsRes.data.customer } : detailsRes.data.customer));
      }
      if (ledgerRes.data.success) {
        setCustomerLedger(ledgerRes.data);
      }
    } catch (e) {
      toastError('Failed to load full customer statement');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteCustomerId) return;
    setActionLoading(true);
    try {
      const res = await api.delete(`/customers/${deleteCustomerId}`);
      if (res.data.success) {
        success('Customer deleted successfully.');
        setDeleteCustomerId(null);
        fetchCustomers();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to delete customer.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (val) => `₹${parseFloat(val || 0).toLocaleString('en-IN')}`;

  const columns = [
    {
      header: 'Customer Code',
      accessor: 'customerCode',
      render: (row) => (
        <span
          onClick={() => handleOpenProfile(row)}
          className="font-mono font-bold text-brand-700 hover:underline cursor-pointer"
        >
          {row.customerCode}
        </span>
      )
    },
    {
      header: 'Customer Name & Contact',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 leading-tight">{row.name}</p>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
            <span className="flex items-center gap-1 font-mono">{row.phone}</span>
            {row.email && <span>&bull; {row.email}</span>}
          </div>
        </div>
      )
    },
    {
      header: 'Passport / Nationality',
      render: (row) => (
        <div className="text-xs">
          <span className="font-mono font-semibold text-slate-800">{row.passportNumber || '-'}</span>
          <span className="text-[10px] text-slate-400 block">{row.nationality || 'Indian'}</span>
        </div>
      )
    },
    {
      header: 'Total Bookings',
      accessor: 'totalBookings',
      className: 'text-center',
      cellClassName: 'text-center font-bold text-slate-800'
    },
    {
      header: 'Total Charged',
      className: 'text-right',
      cellClassName: 'text-right font-mono font-semibold text-slate-900',
      render: (row) => formatCurrency(row.totalAmount)
    },
    {
      header: 'Paid Amount',
      className: 'text-right',
      cellClassName: 'text-right font-mono font-semibold text-emerald-600',
      render: (row) => formatCurrency(row.paidAmount)
    },
    {
      header: 'Outstanding Balance',
      className: 'text-right',
      cellClassName: 'text-right font-mono font-bold',
      render: (row) => (
        <span className={parseFloat(row.outstandingAmount || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}>
          {formatCurrency(row.outstandingAmount)}
        </span>
      )
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenProfile(row)}
            title="View Profile & Ledger"
            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            title="Edit Customer"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteCustomerId(row.id)}
            title="Delete Customer"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      <PageHeader
        title="Customer Management"
        subtitle="Manage customer profiles, booking history, ledger statements and outstanding balances"
        icon={Users2}
        actions={
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-[10px] sm:text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 transition"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Add Customer
          </button>
        }
      />

      {/* Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs w-full min-w-0">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 sm:gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, code, phone, email, passport..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-[11px] sm:text-xs border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 sm:px-5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] sm:text-xs font-semibold rounded-lg sm:rounded-xl transition shrink-0"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                fetchCustomers();
              }}
              className="px-2 py-1 text-[10px] sm:text-xs font-semibold text-slate-500 hover:text-slate-800 shrink-0"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Customers Data Table */}
      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
        emptyTitle="No customers found"
        emptyDescription="Create your first customer profile to start issuing bookings."
        emptyAction={handleOpenCreate}
        emptyActionLabel="Create Customer"
      />

      {/* Customer Profile & Ledger Drawer / Modal */}
      {viewingCustomer && (
        <Modal
          isOpen={!!viewingCustomer}
          onClose={() => setViewingCustomer(null)}
          title={`${viewingCustomer.name} (${viewingCustomer.customerCode})`}
          subtitle="Full customer file, booking manifest and accounting statement"
          maxWidth="max-w-4xl"
          footer={
            <button
              onClick={() => setViewingCustomer(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Close Profile
            </button>
          }
        >
          <div className="space-y-6">
            {/* KPI Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Total Bookings</span>
                <span className="text-lg font-bold text-slate-900 font-mono">{viewingCustomer.totalBookings}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Total Charged</span>
                <span className="text-lg font-bold text-slate-900 font-mono">{formatCurrency(viewingCustomer.totalAmount)}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Paid to Date</span>
                <span className="text-lg font-bold text-emerald-600 font-mono">{formatCurrency(viewingCustomer.paidAmount)}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Outstanding Balance</span>
                <span className={`text-lg font-bold font-mono ${parseFloat(viewingCustomer.outstandingAmount || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatCurrency(viewingCustomer.outstandingAmount)}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
              <button
                onClick={() => setCustomerTab('overview')}
                className={`pb-2.5 transition border-b-2 ${customerTab === 'overview' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
              >
                Booking History ({viewingCustomer.bookings?.length || 0})
              </button>
              <button
                onClick={() => setCustomerTab('ledger')}
                className={`pb-2.5 transition border-b-2 ${customerTab === 'ledger' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
              >
                Accounting Ledger Statement
              </button>
            </div>

            {/* Tab 1: Booking History */}
            {customerTab === 'overview' && (
              <div className="space-y-3">
                {profileLoading ? (
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                    <TableSkeleton rows={3} cols={3} />
                  </div>
                ) : viewingCustomer.bookings && viewingCustomer.bookings.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                    {viewingCustomer.bookings.map((b) => (
                      <div key={b.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-brand-700">{b.referenceNo}</span>
                            <span className="font-semibold text-slate-900">{b.sector}</span>
                            <StatusBadge status={b.status} />
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Journey: {formatDate(b.journeyDate)} &bull; Flight: {b.flightNumber} ({b.pnr})
                          </p>
                        </div>
                        <div className="text-right font-mono">
                          <p className="font-bold text-slate-900">{formatCurrency(b.totalAmount)}</p>
                          <p className="text-[10px] text-slate-400">Bal: {formatCurrency(b.balanceDue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">No bookings for this customer.</p>
                )}
              </div>
            )}

            {/* Tab 2: Chronological Ledger Statement */}
            {customerTab === 'ledger' && (
              <div className="space-y-3">
                {profileLoading ? (
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                    <TableSkeleton rows={4} cols={5} />
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="bg-slate-100/80 text-slate-600 font-sans font-bold border-b border-slate-200">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Reference</th>
                          <th className="py-2.5 px-3 font-sans">Description</th>
                          <th className="py-2.5 px-3 text-right">Debit (Dr)</th>
                          <th className="py-2.5 px-3 text-right">Credit (Cr)</th>
                          <th className="py-2.5 px-3 text-right">Running Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {customerLedger?.ledger?.length > 0 ? (
                          customerLedger.ledger.map((entry) => (
                            <tr key={entry.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 text-slate-500">{formatDate(entry.date)}</td>
                              <td className="py-2.5 px-3 font-bold text-brand-700">{entry.referenceNo}</td>
                              <td className="py-2.5 px-3 font-sans max-w-xs truncate">{entry.description}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                                {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                                {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-black text-slate-900">
                                {formatCurrency(entry.runningBalance)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="py-6 text-center font-sans text-slate-400">
                              No ledger entries found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300">
                        <tr>
                          <td colSpan="3" className="py-2.5 px-3 font-sans text-right">Ledger Totals:</td>
                          <td className="py-2.5 px-3 text-right text-rose-700">{formatCurrency(customerLedger?.summary?.totalDebit)}</td>
                          <td className="py-2.5 px-3 text-right text-emerald-700">{formatCurrency(customerLedger?.summary?.totalCredit)}</td>
                          <td className="py-2.5 px-3 text-right text-slate-900 text-sm">{formatCurrency(customerLedger?.summary?.closingBalance)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create / Edit Customer Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingCustomer ? 'Edit Customer Profile' : 'Register New Customer'}
        subtitle="Manage personal, passport and contact details"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleSaveCustomer}
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : editingCustomer ? 'Update Profile' : 'Create Customer'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Customer Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Vikramaditya Singhania"
              value={customerForm.name}
              onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                placeholder="+91..."
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="client@example.com"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Passport Number</label>
              <input
                type="text"
                placeholder="e.g. P1234567"
                value={customerForm.passportNumber}
                onChange={(e) => setCustomerForm({ ...customerForm, passportNumber: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none uppercase font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nationality</label>
              <input
                type="text"
                value={customerForm.nationality}
                onChange={(e) => setCustomerForm({ ...customerForm, nationality: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Billing & Postal Address</label>
            <textarea
              rows="2"
              placeholder="Suite, Street, City, State, PIN"
              value={customerForm.address}
              onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteCustomerId}
        onClose={() => setDeleteCustomerId(null)}
        onConfirm={handleDeleteCustomer}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action is only permitted if the customer has no active bookings."
        type="danger"
        loading={actionLoading}
      />
    </div>
  );
};
