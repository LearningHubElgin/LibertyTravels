import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  DollarSign
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';

export const PaymentsPage = () => {
  const { success, error: toastError } = useToast();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Receive Payment Modal
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [unpaidBookings, setUnpaidBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    reference: '',
    notes: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let query = `page=${pagination.page}&limit=${pagination.limit}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (method) query += `&method=${method}`;
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;

      const res = await api.get(`/payments?${query}`);
      if (res.data.success) {
        setPayments(res.data.payments || []);
        setPagination(res.data.pagination);
      }
    } catch (e) {
      console.error('Failed to load payments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [pagination.page, pagination.limit, method, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchPayments();
  };

  const handleOpenReceiveModal = async () => {
    try {
      const res = await api.get('/bookings?limit=100');
      if (res.data.success) {
        const pending = (res.data.bookings || []).filter(
          (b) => parseFloat(b.balanceDue || 0) > 0 && b.status !== 'cancelled'
        );
        setUnpaidBookings(pending);
        if (pending.length > 0) {
          setSelectedBookingId(pending[0].id);
          setPaymentForm({
            amount: pending[0].balanceDue,
            paymentDate: new Date().toISOString().split('T')[0],
            paymentMethod: 'cash',
            reference: '',
            notes: ''
          });
        }
        setIsReceiveModalOpen(true);
      }
    } catch (e) {
      toastError('Failed to load pending bookings');
    }
  };

  const handleBookingSelectChange = (bId) => {
    setSelectedBookingId(bId);
    const chosen = unpaidBookings.find((b) => String(b.id) === String(bId));
    if (chosen) {
      setPaymentForm((prev) => ({ ...prev, amount: chosen.balanceDue }));
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!selectedBookingId) return toastError('Please select a booking.');

    const chosen = unpaidBookings.find((b) => String(b.id) === String(selectedBookingId));
    const amt = parseFloat(paymentForm.amount || 0);

    if (amt <= 0) return toastError('Payment amount must be greater than zero.');
    if (chosen && amt > parseFloat(chosen.balanceDue || 0)) {
      return toastError(`Payment (₹${amt}) cannot exceed remaining balance of ₹${chosen.balanceDue}.`);
    }

    setActionLoading(true);
    try {
      const res = await api.post('/payments', {
        bookingId: selectedBookingId,
        ...paymentForm
      });
      if (res.data.success) {
        success(`Payment of ₹${amt} received successfully!`);
        setIsReceiveModalOpen(false);
        fetchPayments();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (val) => `₹${parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const columns = [
    {
      header: 'Payment Date',
      accessor: 'paymentDate',
      render: (row) => <span className="font-mono text-xs text-slate-800 font-semibold">{formatDate(row.paymentDate)}</span>
    },
    {
      header: 'Payment Reference',
      render: (row) => (
        <span className="font-mono font-bold text-xs text-brand-700">{row.reference || '-'}</span>
      )
    },
    {
      header: 'Customer',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 leading-tight">{row.customer?.name || 'Customer'}</p>
          <p className="text-[11px] text-slate-500 font-mono">{row.customer?.customerCode}</p>
        </div>
      )
    },
    {
      header: 'Linked Booking',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 block">{row.booking?.referenceNo || 'N/A'}</span>
          <span className="text-[11px] text-slate-500">{row.booking?.sector}</span>
        </div>
      )
    },
    {
      header: 'Amount Paid',
      className: 'text-right',
      cellClassName: 'text-right font-mono font-black text-sm text-emerald-600',
      render: (row) => formatCurrency(row.amount)
    },
    {
      header: 'Method',
      render: (row) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase font-mono">
          {row.paymentMethod}
        </span>
      )
    },
    {
      header: 'Received By',
      render: (row) => (
        <span className="text-xs text-slate-600">{row.receiver?.name || 'System Admin'}</span>
      )
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      <PageHeader
        title="Payment Receipts"
        subtitle="Manage customer settlement receipts, bank transfers, UPI transactions and cash collection"
        icon={CreditCard}
        actions={
          <button
            onClick={handleOpenReceiveModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Receive Payment
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs w-full min-w-0">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search reference, customer name, or booking reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-[11px] sm:text-xs border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs border border-slate-200 rounded-lg sm:rounded-xl bg-white focus:outline-none"
          >
            <option value="">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="card">Card</option>
            <option value="cheque">Cheque</option>
            <option value="other">Other</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1 text-[10px] sm:text-xs border border-slate-200 rounded-lg bg-white"
          />
          <span className="text-slate-400 text-[10px] sm:text-xs self-center">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1 text-[10px] sm:text-xs border border-slate-200 rounded-lg bg-white"
          />

          <button
            type="submit"
            className="px-3 py-1.5 sm:px-5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] sm:text-xs font-semibold rounded-lg sm:rounded-xl transition shrink-0"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Payments Table */}
      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
        emptyTitle="No payments recorded"
        emptyDescription="Collect payments on outstanding bookings to view payment records."
        emptyAction={handleOpenReceiveModal}
        emptyActionLabel="Receive Payment"
      />

      {/* Receive Payment Modal */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title="Receive Customer Payment"
        subtitle="Settle outstanding balance against a flight booking"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsReceiveModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading || unpaidBookings.length === 0}
              onClick={handleSubmitPayment}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {actionLoading ? 'Posting...' : 'Record Payment'}
            </button>
          </>
        }
      >
        {unpaidBookings.length > 0 ? (
          <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Booking with Due Balance *</label>
              <select
                required
                value={selectedBookingId}
                onChange={(e) => handleBookingSelectChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              >
                {unpaidBookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.referenceNo} - {b.customer?.name} ({b.sector}) &bull; Due: ₹{b.balanceDue}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  required
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer / NEFT</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reference / UTR / Cheque Number</label>
              <input
                type="text"
                placeholder="e.g. UPI-99881122"
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Notes</label>
              <textarea
                rows="2"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              />
            </div>
          </form>
        ) : (
          <div className="p-6 text-center text-slate-500 text-xs">
            All customer bookings are fully paid! No outstanding balances detected.
          </div>
        )}
      </Modal>
    </div>
  );
};
