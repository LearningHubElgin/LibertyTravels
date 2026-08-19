import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpenCheck,
  Plus,
  Search,
  Filter,
  Eye,
  CreditCard,
  Printer,
  XCircle,
  Trash2,
  Plane,
  Download
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Modal } from '../../components/common/Modal';
import { InvoiceModal } from '../../components/invoice/InvoiceModal';
import { formatDate } from '../../utils/formatters';

export const AllBookingsPage = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [bookings, setBookings] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [airlineId, setAirlineId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState(null);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);
  const [deleteBookingId, setDeleteBookingId] = useState(null);
  const [cancelBookingId, setCancelBookingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Add Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    reference: '',
    notes: ''
  });

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let query = `page=${pagination.page}&limit=${pagination.limit}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (status) query += `&status=${status}`;
      if (paymentStatus) query += `&paymentStatus=${paymentStatus}`;
      if (airlineId) query += `&airlineId=${airlineId}`;
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;

      const res = await api.get(`/bookings?${query}`);
      if (res.data.success) {
        setBookings(res.data.bookings || []);
        setPagination(res.data.pagination);
      }
    } catch (e) {
      console.error('Failed to fetch bookings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [pagination.page, pagination.limit, status, paymentStatus, airlineId, startDate, endDate]);

  useEffect(() => {
    const fetchAirlines = async () => {
      try {
        const res = await api.get('/airlines');
        if (res.data.success) setAirlines(res.data.airlines || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchAirlines();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchBookings();
  };

  const handleOpenPaymentModal = (booking) => {
    setSelectedBookingForPayment(booking);
    setPaymentForm({
      amount: booking.balanceDue,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      reference: '',
      notes: `Payment for booking ${booking.referenceNo}`
    });
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!selectedBookingForPayment) return;

    const amt = parseFloat(paymentForm.amount || 0);
    const balance = parseFloat(selectedBookingForPayment.balanceDue || 0);

    if (amt <= 0) {
      return toastError('Payment amount must be greater than zero.');
    }
    if (amt > balance) {
      return toastError(`Payment amount (₹${amt}) cannot exceed remaining balance (₹${balance}).`);
    }

    setActionLoading(true);
    try {
      const res = await api.post(`/bookings/${selectedBookingForPayment.id}/payments`, paymentForm);
      if (res.data.success) {
        success(`Payment of ₹${amt} received successfully for ${selectedBookingForPayment.referenceNo}!`);
        setSelectedBookingForPayment(null);
        fetchBookings();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelBookingId) return;
    setActionLoading(true);
    try {
      const res = await api.put(`/bookings/${cancelBookingId}/status`, { status: 'cancelled' });
      if (res.data.success) {
        success('Booking cancelled successfully.');
        setCancelBookingId(null);
        fetchBookings();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBooking = async () => {
    if (!deleteBookingId) return;
    setActionLoading(true);
    try {
      const res = await api.delete(`/bookings/${deleteBookingId}`);
      if (res.data.success) {
        success('Booking and associated records deleted successfully.');
        setDeleteBookingId(null);
        fetchBookings();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to delete booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Reference',
      accessor: 'referenceNo',
      render: (row) => (
        <div>
          <span
            onClick={() => navigate(`/bookings/${row.id || row._id}`)}
            className="font-mono font-bold text-brand-700 hover:underline cursor-pointer block"
          >
            {row.referenceNo}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">{formatDate(row.bookingDate)}</span>
        </div>
      )
    },
    {
      header: 'Passenger / Customer',
      render: (row) => {
        const lead = row.passengers?.[0];
        const count = row.passengers?.length || 0;
        return (
          <div>
            <p className="font-semibold text-slate-900 leading-tight">
              {lead ? `${lead.title ? lead.title + ' ' : ''}${lead.firstName} ${lead.lastName}` : 'No passenger'}
            </p>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span>Cust: {row.customer?.name || 'Unknown'}</span>
              {count > 1 && (
                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold text-[10px]">
                  +{count - 1} more
                </span>
              )}
            </p>
          </div>
        );
      }
    },
    {
      header: 'Flight & Sector',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 block">{row.sector}</span>
          <span className="text-[11px] text-slate-500 font-mono">
            {row.airline?.code || ''} {row.flightNumber} &bull; PNR: <strong className="text-slate-700">{row.pnr}</strong>
          </span>
        </div>
      )
    },
    {
      header: 'Journey Date',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-800 block">{formatDate(row.journeyDate)}</span>
          {row.returnDate && (
            <span className="text-[10px] text-slate-400 block">Ret: {formatDate(row.returnDate)}</span>
          )}
        </div>
      )
    },
    {
      header: 'Financials',
      render: (row) => (
        <div className="font-mono">
          <div className="font-bold text-slate-900">₹{parseFloat(row.totalAmount || 0).toLocaleString('en-IN')}</div>
          <div className="text-[10px] flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">Paid: ₹{parseFloat(row.amountReceived || 0).toLocaleString('en-IN')}</span>
            {parseFloat(row.balanceDue || 0) > 0 && (
              <span className="text-rose-600 font-semibold">Due: ₹{parseFloat(row.balanceDue || 0).toLocaleString('en-IN')}</span>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <div className="space-y-1">
          <div><StatusBadge status={row.status} /></div>
          <div><StatusBadge status={row.paymentStatus} /></div>
        </div>
      )
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => navigate(`/bookings/${row.id || row._id}`)}
            title="View Details"
            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
          >
            <Eye className="w-4 h-4" />
          </button>

          {parseFloat(row.balanceDue || 0) > 0 && row.status !== 'cancelled' && (
            <button
              onClick={() => handleOpenPaymentModal(row)}
              title="Add Payment"
              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
            >
              <CreditCard className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setSelectedBookingForInvoice(row)}
            title="Generate & Print Invoice"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          >
            <Printer className="w-4 h-4" />
          </button>

          {row.status !== 'cancelled' && (
            <button
              onClick={() => setCancelBookingId(row.id)}
              title="Cancel Booking"
              className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setDeleteBookingId(row.id)}
            title="Delete Booking"
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
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
        title="All Bookings Management"
        subtitle="Search, filter, view details, collect payments and generate invoices"
        icon={BookOpenCheck}
        actions={
          <button
            onClick={() => navigate('/bookings/new')}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-[10px] sm:text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 transition"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Create New Booking
          </button>
        }
      />

      {/* Filter Toolbar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs space-y-2.5 sm:space-y-3 w-full min-w-0">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-2 sm:gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search reference, PNR, passenger, phone, flight..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-[11px] sm:text-xs border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs border border-slate-200 rounded-lg sm:rounded-xl bg-white focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>

            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs border border-slate-200 rounded-lg sm:rounded-xl bg-white focus:outline-none"
            >
              <option value="">All Payments</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>

            <select
              value={airlineId}
              onChange={(e) => setAirlineId(e.target.value)}
              className="px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs border border-slate-200 rounded-lg sm:rounded-xl bg-white focus:outline-none max-w-[120px] sm:max-w-none"
            >
              <option value="">All Airlines</option>
              {airlines.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 text-[10px] sm:text-xs border border-slate-200 rounded-lg bg-white"
              title="Start Date"
            />
            <span className="text-slate-400 text-[10px] sm:text-xs">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 text-[10px] sm:text-xs border border-slate-200 rounded-lg bg-white"
              title="End Date"
            />

            <button
              type="submit"
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] sm:text-xs font-semibold rounded-lg sm:rounded-xl transition shadow-xs"
            >
              Filter
            </button>
            {(search || status || paymentStatus || airlineId || startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatus('');
                  setPaymentStatus('');
                  setAirlineId('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-2 py-1 text-[10px] sm:text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Bookings Data Table */}
      <DataTable
        columns={columns}
        data={bookings}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
        emptyTitle="No bookings found"
        emptyDescription="Try adjusting your search criteria or create a new booking."
        emptyAction={() => navigate('/bookings/new')}
        emptyActionLabel="Create New Booking"
      />

      {/* Invoice Modal */}
      {selectedBookingForInvoice && (
        <InvoiceModal
          isOpen={!!selectedBookingForInvoice}
          onClose={() => setSelectedBookingForInvoice(null)}
          booking={selectedBookingForInvoice}
        />
      )}

      {/* Add Payment Modal */}
      {selectedBookingForPayment && (
        <Modal
          isOpen={!!selectedBookingForPayment}
          onClose={() => setSelectedBookingForPayment(null)}
          title="Receive Customer Payment"
          subtitle={`Booking ${selectedBookingForPayment.referenceNo} &bull; Outstanding Balance: ₹${parseFloat(selectedBookingForPayment.balanceDue || 0).toLocaleString('en-IN')}`}
          footer={
            <>
              <button
                type="button"
                onClick={() => setSelectedBookingForPayment(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleSubmitPayment}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm disabled:opacity-50"
              >
                {actionLoading ? 'Recording...' : 'Confirm Payment'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                min="0.01"
                max={parseFloat(selectedBookingForPayment.balanceDue)}
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
              <label className="block font-semibold text-slate-700 mb-1">Transaction / Cheque Reference</label>
              <input
                type="text"
                placeholder="e.g. UPI-99881122 or CHQ-00123"
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Notes / Remarks</label>
              <textarea
                rows="2"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!cancelBookingId}
        onClose={() => setCancelBookingId(null)}
        onConfirm={handleCancelBooking}
        title="Cancel Flight Booking"
        message="Are you sure you want to cancel this booking? This will update the status to CANCELLED and log the activity."
        confirmText="Yes, Cancel Booking"
        type="warning"
        loading={actionLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteBookingId}
        onClose={() => setDeleteBookingId(null)}
        onConfirm={handleDeleteBooking}
        title="Permanently Delete Booking"
        message="Are you sure you want to delete this booking along with its passenger records and linked transactions? This action cannot be undone."
        confirmText="Delete Booking"
        type="danger"
        loading={actionLoading}
      />
    </div>
  );
};
