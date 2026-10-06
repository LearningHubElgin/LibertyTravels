import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const CancelBookingModal = ({ isOpen, onClose, booking, onSuccess }) => {
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [onlineMethods, setOnlineMethods] = useState([]);

  const [form, setForm] = useState({
    supplierRefundAmount: booking?.costPrice || 0,
    customerRefundAmount: booking?.amountReceived || 0,
    refundMethod: 'cash',
    onlineMethod: '',
    refundReference: '',
    cancellationReason: ''
  });

  useEffect(() => {
    if (isOpen) {
      api.get('/settings')
        .then((res) => {
          if (res.data?.success && res.data?.settings?.upiMethods?.length > 0) {
            setOnlineMethods(res.data.settings.upiMethods);
          } else {
            setOnlineMethods(['SBI', 'HDFC', 'ICICI', 'Axis Bank', 'PNB']);
          }
        })
        .catch(() => setOnlineMethods(['SBI', 'HDFC', 'ICICI', 'Axis Bank', 'PNB']));
    }
  }, [isOpen]);

  useEffect(() => {
    if (booking && isOpen) {
      setForm({
        supplierRefundAmount: booking.costPrice || 0,
        customerRefundAmount: booking.amountReceived || 0,
        refundMethod: 'cash',
        onlineMethod: '',
        refundReference: '',
        cancellationReason: ''
      });
    }
  }, [booking, isOpen]);

  if (!booking) return null;

  const cost = parseFloat(booking.costPrice || 0);
  const received = parseFloat(booking.amountReceived || 0);
  const sRefund = parseFloat(form.supplierRefundAmount || 0);
  const cRefund = parseFloat(form.customerRefundAmount || 0);

  // Agency kept = amountReceived - customerRefundAmount
  const moneyKept = received - cRefund;
  // Agency paid out = costPrice - supplierRefundAmount
  const moneyLost = cost - sRefund;
  // Net Profit/Loss on this cancellation
  const netProfit = moneyKept - moneyLost;

  const formatCurrency = (val) => `₹${parseFloat(val || 0).toLocaleString('en-IN')}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sRefund > cost) {
      return toastError('Supplier refund cannot exceed original cost price.');
    }
    if (cRefund > received) {
      return toastError('Customer refund cannot exceed amount received.');
    }

    const finalOnlineMethod = form.refundMethod === 'online' && cRefund > 0
      ? (form.onlineMethod || onlineMethods[0] || 'SBI')
      : '';

    setLoading(true);
    try {
      const res = await api.post(`/bookings/${booking.id || booking._id}/cancel`, {
        ...form,
        onlineMethod: finalOnlineMethod
      });
      if (res.data.success) {
        success('Booking cancelled successfully.');
        onSuccess();
        onClose();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Booking & Process Refund"
      subtitle={`Reference: ${booking.referenceNo}`}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Go Back
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Processing...' : 'Confirm Cancellation'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* Warning alert */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 text-amber-800">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
          <p className="leading-relaxed">
            Cancelling this booking is irreversible. Please verify the refund amounts carefully.
          </p>
        </div>

        {/* Financial Context */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <p className="text-slate-500 font-medium mb-1">Total Cost Paid to Supplier</p>
            <p className="text-base font-mono font-bold text-slate-900">{formatCurrency(cost)}</p>
          </div>
          <div>
            <p className="text-slate-500 font-medium mb-1">Total Received from Customer</p>
            <p className="text-base font-mono font-bold text-slate-900">{formatCurrency(received)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Supplier Refund Amount (₹)</label>
            <p className="text-[10px] text-slate-400 mb-1.5">Amount supplier returns to agency</p>
            <input
              type="number"
              min="0"
              max={cost}
              step="0.01"
              required
              value={form.supplierRefundAmount}
              onChange={(e) => setForm({ ...form, supplierRefundAmount: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Customer Refund Amount (₹)</label>
            <p className="text-[10px] text-slate-400 mb-1.5">Amount agency returns to customer</p>
            <input
              type="number"
              min="0"
              max={received}
              step="0.01"
              required
              value={form.customerRefundAmount}
              onChange={(e) => setForm({ ...form, customerRefundAmount: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer Refund Method</label>
              <select
                value={form.refundMethod}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({
                    ...form,
                    refundMethod: val,
                    onlineMethod: val === 'cash' ? '' : (form.onlineMethod || onlineMethods[0] || 'SBI')
                  });
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                disabled={cRefund <= 0}
              >
                <option value="cash">Cash</option>
                <option value="online">Online</option>
              </select>
            </div>

            {form.refundMethod === 'online' && cRefund > 0 && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Online Bank / Wallet *</label>
                <select
                  required
                  value={form.onlineMethod}
                  onChange={(e) => setForm({ ...form, onlineMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                >
                  <option value="">Select Bank / Wallet</option>
                  {onlineMethods.map((m, i) => (
                    <option key={i} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {form.refundMethod === 'online' && cRefund > 0 && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Refund Reference / UTR No (Optional)</label>
              <input
                type="text"
                value={form.refundReference}
                onChange={(e) => setForm({ ...form, refundReference: e.target.value })}
                placeholder="e.g. UTR-987654 / Transaction Ref"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl uppercase font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cancellation Reason / Notes</label>
            <textarea
              rows="2"
              value={form.cancellationReason}
              onChange={(e) => setForm({ ...form, cancellationReason: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="e.g., Customer requested cancellation due to medical emergency"
            />
          </div>
        </div>

        {/* Live Calculation Breakdown Box */}
        <div className={`p-4 rounded-xl border space-y-3 ${
          netProfit >= 0 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
        }`}>
          <div className="flex items-center justify-between border-b pb-2 border-slate-200/70">
            <p className={`font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 ${
              netProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'
            }`}>
              {netProfit >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-rose-600" />}
              Cancellation Profit & Loss Breakdown
            </p>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
              netProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {netProfit >= 0 ? 'Net Profit' : 'Net Loss'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Customer Side */}
            <div className="flex items-center justify-between text-slate-700">
              <div>
                <span className="font-semibold">Retained from Customer:</span>
                <span className="text-[10px] text-slate-500 font-mono block">
                  Received {formatCurrency(received)} − Refunded {formatCurrency(cRefund)}
                </span>
              </div>
              <span className="font-mono font-bold text-emerald-700 text-sm">
                +{formatCurrency(moneyKept)}
              </span>
            </div>

            {/* Supplier Side */}
            <div className="flex items-center justify-between text-slate-700">
              <div>
                <span className="font-semibold">Supplier Cancellation Penalty:</span>
                <span className="text-[10px] text-slate-500 font-mono block">
                  Original Cost {formatCurrency(cost)} − Supplier Refund {formatCurrency(sRefund)}
                </span>
              </div>
              <span className="font-mono font-bold text-rose-600 text-sm">
                -{formatCurrency(moneyLost)}
              </span>
            </div>
          </div>

          {/* Final Net Line */}
          <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
            <div>
              <p className={`font-bold text-sm ${netProfit >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
                Net Margin After Cancellation
              </p>
              <p className="text-[10px] text-slate-500">
                Formula: Retained ({formatCurrency(moneyKept)}) − Supplier Penalty ({formatCurrency(moneyLost)})
              </p>
            </div>
            <div className={`text-xl font-black font-mono ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {netProfit >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netProfit))}
            </div>
          </div>
        </div>

      </form>
    </Modal>
  );
};
