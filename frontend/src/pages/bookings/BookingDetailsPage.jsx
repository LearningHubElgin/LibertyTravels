import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plane,
  Train,
  Bus,
  Hotel,
  Car,
  Building2,
  TrendingUp,
  User,
  Users,
  Calendar,
  CreditCard,
  Printer,
  Edit,
  Trash2,
  XCircle,
  CheckCircle,
  FileText,
  Clock,
  ArrowLeft,
  ChevronRight,
  Compass
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { InvoiceModal } from '../../components/invoice/InvoiceModal';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatDateTime } from '../../utils/formatters';

export const BookingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Payment Form
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    reference: '',
    notes: ''
  });

  const fetchBooking = async () => {
    if (!id || id === 'undefined' || id === 'null') {
      navigate('/bookings');
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/bookings/${id}`);
      if (res.data.success) {
        setBooking(res.data.booking);
        setPaymentForm((prev) => ({
          ...prev,
          amount: res.data.booking.balanceDue
        }));
      }
    } catch (err) {
      toastError('Failed to load booking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const handleReceivePayment = async (e) => {
    e.preventDefault();
    const payAmt = parseFloat(paymentForm.amount || 0);
    const balance = parseFloat(booking?.balanceDue || 0);

    if (payAmt <= 0) return toastError('Payment amount must be greater than zero.');
    if (payAmt > balance) return toastError(`Payment cannot exceed balance of ₹${balance}.`);

    setActionLoading(true);
    try {
      const res = await api.post(`/bookings/${id}/payments`, paymentForm);
      if (res.data.success) {
        success(`Payment of ₹${payAmt} recorded successfully!`);
        setIsPaymentModalOpen(false);
        fetchBooking();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/bookings/${id}/status`, { status: newStatus });
      if (res.data.success) {
        success(`Booking marked as ${newStatus}`);
        fetchBooking();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (val) => `₹${parseFloat(val || 0).toLocaleString('en-IN')}`;

  const getServiceIcon = (type) => {
    switch (type) {
      case 'flight':
        return <Plane className="w-4 h-4 text-sky-400" />;
      case 'train':
        return <Train className="w-4 h-4 text-emerald-400" />;
      case 'bus':
        return <Bus className="w-4 h-4 text-amber-400" />;
      case 'hotel':
        return <Hotel className="w-4 h-4 text-purple-400" />;
      case 'car':
        return <Car className="w-4 h-4 text-indigo-400" />;
      default:
        return <Plane className="w-4 h-4 text-sky-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading booking record..." />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-sm">Booking record not found.</p>
        <button
          onClick={() => navigate('/bookings')}
          className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold"
        >
          Return to Bookings
        </button>
      </div>
    );
  }

  const comp = booking.company || booking.airline;
  const sell = parseFloat(booking.sellPrice || booking.totalAmount || 0);

  return (
    <div className="space-y-4 sm:space-y-6 w-full pb-8 sm:pb-12 min-w-0">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 w-full min-w-0">
        <button
          onClick={() => navigate('/bookings')}
          className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-slate-600 hover:text-slate-900 transition w-fit cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to All Bookings
        </button>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {parseFloat(booking.balanceDue || 0) > 0 && booking.status !== 'cancelled' && (
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl shadow-xs transition cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" /> Receive Payment
            </button>
          )}

          <button
            onClick={() => setIsInvoiceOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl shadow-xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print Invoice
          </button>

          {booking.status === 'confirmed' && (
            <button
              onClick={() => handleStatusChange('completed')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] sm:text-xs font-semibold rounded-lg sm:rounded-xl shadow-xs transition cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Complete
            </button>
          )}

          {booking.status !== 'cancelled' && (
            <button
              onClick={() => setIsCancelConfirmOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[10px] sm:text-xs font-semibold rounded-lg sm:rounded-xl transition cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Main File Header Card */}
      <div className="bg-[#0B1E36] rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden w-full min-w-0">
        <div className="absolute right-0 top-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
              <span className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                {getServiceIcon(booking.serviceType || 'flight')}
              </span>
              <span className="font-mono text-base sm:text-2xl font-black text-brand-300 tracking-wider">
                {booking.referenceNo}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-brand-500/20 text-brand-300 border border-brand-500/30">
                {(booking.serviceType || 'flight').toUpperCase()}
              </span>
              <StatusBadge status={booking.status} />
              <StatusBadge status={booking.paymentStatus} />
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-slate-300 mt-1 sm:mt-2 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-brand-400" /> Booking Date: {formatDate(booking.bookingDate)}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-sky-400" /> Company: <strong className="text-white">{comp?.name || 'N/A'}</strong>
              </span>
              {booking.pnr && (
                <>
                  <span>&bull;</span>
                  <span className="font-mono">
                    Ref/PNR: <strong className="text-brand-300">{booking.pnr}</strong>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quick Financial Summary Pill */}
          <div className="bg-slate-800/80 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-slate-700 flex items-center gap-4 sm:gap-6">
            <div>
              <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">Sell Price</p>
              <p className="text-base sm:text-lg font-black font-mono text-white">{formatCurrency(sell)}</p>
            </div>
            <div className="h-7 sm:h-8 w-px bg-slate-700" />
            <div>
              <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">Balance Due</p>
              <p className={`text-base sm:text-lg font-black font-mono ${parseFloat(booking.balanceDue || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatCurrency(booking.balanceDue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Service Particulars, Passengers List, Payment History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service & Booking Details */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-600" /> Booking Particulars
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium block mb-0.5">Service Category</span>
                <span className="font-bold text-slate-900 capitalize text-sm">{booking.serviceType || 'Flight'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block mb-0.5">Company / Vendor</span>
                <span className="font-semibold text-slate-900">{comp?.name || 'N/A'} ({comp?.code || ''})</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block mb-0.5">Booking Date</span>
                <span className="font-semibold text-slate-900">{formatDate(booking.bookingDate)}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 font-medium block mb-0.5">Description / Route</span>
                <span className="font-bold text-slate-900">{booking.description || booking.sector}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block mb-0.5">Reference No / PNR</span>
                <span className="font-bold text-brand-700 font-mono text-sm">{booking.pnr || booking.referenceNo}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block mb-0.5">Passenger Name</span>
                <span className="font-semibold text-slate-900">{booking.passengerName || booking.passengers?.[0]?.firstName || 'N/A'}</span>
              </div>
              {booking.journeyDate && (
                <div>
                  <span className="text-slate-400 font-medium block mb-0.5">Date of Journey</span>
                  <span className="font-semibold text-slate-900">{formatDate(booking.journeyDate)}</span>
                </div>
              )}
              {booking.returnDate && (
                <div>
                  <span className="text-slate-400 font-medium block mb-0.5">Return Date</span>
                  <span className="font-semibold text-slate-900">{formatDate(booking.returnDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Passenger Cards List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-600" /> Manifest & Passenger List ({booking.passengers?.length || 0})
              </h3>
            </div>

            <div className="space-y-3">
              {booking.passengers?.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-800 font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {p.title ? p.title + ' ' : ''}{p.firstName} {p.lastName}
                      </span>
                      <span className="text-slate-400">({p.nationality || 'Indian'})</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-slate-500 mt-2 text-[11px]">
                      {p.passportNumber && (
                        <span>Passport: <strong className="text-slate-700 font-mono">{p.passportNumber}</strong></span>
                      )}
                      {p.passportExpiry && <span>Exp: {formatDate(p.passportExpiry)}</span>}
                      {p.dateOfBirth && <span>DOB: {formatDate(p.dateOfBirth)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment History Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" /> Payment Receipts Timeline
            </h3>

            {booking.payments?.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {booking.payments.map((pay) => (
                  <div key={pay.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-emerald-700 text-sm">
                          {formatCurrency(pay.amount)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                          {pay.paymentMethod}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Ref: <span className="font-mono text-slate-700">{pay.reference || 'N/A'}</span> &bull; {formatDate(pay.paymentDate)}
                      </p>
                    </div>
                    <div className="text-right text-[11px] text-slate-400">
                      Recv by: {pay.receiver?.name || 'System'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No payment transactions recorded yet.</p>
            )}
          </div>
        </div>

        {/* Right 1 Col: Customer Card & Financial Summary */}
        <div className="space-y-6">
          {/* Customer Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-600" /> Billed Customer
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-sm border border-brand-100">
                  {booking.customer?.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{booking.customer?.name}</p>
                  <p className="font-mono text-slate-400 text-[11px]">{booking.customer?.customerCode}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-semibold text-slate-800">{booking.customer?.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-slate-800">{booking.customer?.email || 'N/A'}</span>
                </div>
                {booking.customer?.address && (
                  <div>
                    <span className="text-slate-400 block mb-0.5">Address:</span>
                    <span className="text-slate-700">{booking.customer.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600" /> Financial Statement
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Cost Price (Buy):</span>
                <span className="font-mono font-semibold text-slate-900">{formatCurrency(cost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Sell Price:</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(sell)}</span>
              </div>

              {/* Profit Pill */}
              <div className={`p-2.5 rounded-xl border flex items-center justify-between font-mono font-bold text-xs ${
                profit >= 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Gross Margin / Profit:
                </span>
                <span>{profit >= 0 ? `+${formatCurrency(profit)}` : `-${formatCurrency(Math.abs(profit))}`}</span>
              </div>

              {parseFloat(booking.tax || 0) > 0 && (
                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>Taxes & Fees:</span>
                  <span className="font-mono">{formatCurrency(booking.tax)}</span>
                </div>
              )}
              {parseFloat(booking.discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-700 text-[11px]">
                  <span>Discount:</span>
                  <span className="font-mono">-{formatCurrency(booking.discount)}</span>
                </div>
              )}

              <div className="pt-2 border-t-2 border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Amount Charged:</span>
                <span className="font-mono text-brand-700">{formatCurrency(booking.totalAmount || sell)}</span>
              </div>

              <div className="flex justify-between text-emerald-700 pt-1">
                <span>Paid to Date:</span>
                <span className="font-mono font-bold">{formatCurrency(booking.amountReceived)}</span>
              </div>

              <div className="flex justify-between pt-1 border-t border-slate-100">
                <span className="font-semibold text-slate-700">Balance Due:</span>
                <span className={`font-mono font-black text-sm ${parseFloat(booking.balanceDue || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatCurrency(booking.balanceDue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        booking={booking}
      />

      {/* Add Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Receive Customer Payment"
        subtitle={`Booking ${booking.referenceNo} &bull; Outstanding Balance: ${formatCurrency(booking.balanceDue)}`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleReceivePayment}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm disabled:opacity-50"
            >
              {actionLoading ? 'Recording...' : 'Confirm Payment'}
            </button>
          </>
        }
      >
        <form onSubmit={handleReceivePayment} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Amount (₹) *</label>
            <input
              type="number"
              min="0.01"
              max={parseFloat(booking.balanceDue)}
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
            <label className="block font-semibold text-slate-700 mb-1">Payment Reference</label>
            <input
              type="text"
              placeholder="e.g. UPI-998811 or NEFT-441122"
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

      {/* Cancel Confirmation */}
      <ConfirmDialog
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={() => handleStatusChange('cancelled')}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This will update the status to Cancelled in the ledger and database."
        type="warning"
      />
    </div>
  );
};
