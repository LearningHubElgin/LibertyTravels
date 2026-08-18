import React, { useEffect, useState } from 'react';
import { Printer, Download, X, Compass, CheckCircle2, FileText } from 'lucide-react';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';

export const InvoiceModal = ({ isOpen, onClose, booking }) => {
  const [agency, setAgency] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const fetchSettings = async () => {
        try {
          const res = await api.get('/settings');
          if (res.data.success) {
            setAgency(res.data.settings);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchSettings();
    }
  }, [isOpen]);

  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  // Generate clean invoice number from referenceNo or sequence
  const getInvoiceNumber = () => {
    if (booking.referenceNo) {
      return booking.referenceNo.replace('TRV-', 'INV-');
    }
    const cleanId = String(booking.id || booking._id || '1001').slice(-5);
    return `INV-2026-${cleanId.toUpperCase()}`;
  };

  const invoiceNo = getInvoiceNumber();
  const passengerNames = (booking.passengers || []).map((p) => `${p.title ? p.title + ' ' : ''}${p.firstName} ${p.lastName}`).join(', ');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden border border-slate-200 animate-scale-up">
        
        {/* Sticky Action Header (hidden on print) */}
        <div className="no-print sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900 text-white border-b border-slate-800 shadow-md shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0 border border-brand-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-white block truncate">Tax Invoice Preview</span>
              <span className="text-[10px] font-mono text-brand-300 font-semibold">{invoiceNo}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-brand-600 to-sky-600 hover:from-brand-500 hover:to-sky-500 text-white text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl shadow-md transition transform active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg sm:rounded-xl transition"
              title="Close Preview"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Container */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-8 md:p-10 bg-white text-slate-800">
          <div id="printable-invoice" className="bg-white">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-slate-800 gap-4">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <img
                    src="/Liberty.jpg"
                    alt="Liberty Logo"
                    className="w-10 h-10 rounded-lg object-contain bg-white border border-slate-200 p-0.5 shadow-xs"
                  />
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#0B1E36] uppercase">
                    {agency?.agencyName || 'Liberty Tours & Travels'}
                  </h1>
                </div>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                  {agency?.address || 'Suite 402, Liberty Business Tower, Connaught Place, New Delhi - 110001'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  <span className="font-semibold">Phone:</span> {agency?.phone || '+91 98765 43210'} | <span className="font-semibold">Email:</span> {agency?.email || 'contact@libertytravel.com'}
                </p>
                {agency?.gstNumber && (
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    <span className="font-semibold">GSTIN:</span> {agency.gstNumber} | <span className="font-semibold">PAN:</span> {agency.panNumber}
                  </p>
                )}
              </div>

              <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl w-full sm:w-auto border border-slate-200 sm:border-0">
                <h2 className="text-xl font-black text-brand-700 tracking-wider">TAX INVOICE</h2>
                <p className="text-xs font-mono font-bold text-slate-800 mt-1">{invoiceNo}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Date: {formatDate(booking.bookingDate || Date.now())}
                </p>
                <p className="text-xs text-slate-500 font-mono">Ref: {booking.referenceNo}</p>
              </div>
            </div>

            {/* Billed To & Flight Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 my-6 text-xs">
              {/* Customer Details */}
              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1.5">Billed To (Customer)</p>
                <p className="text-sm font-bold text-slate-900">{booking.customer?.name || 'Customer'}</p>
                <p className="text-slate-600 mt-0.5">{booking.customer?.phone}</p>
                <p className="text-slate-600">{booking.customer?.email || 'N/A'}</p>
                {booking.customer?.address && <p className="text-slate-500 mt-1 text-[11px]">{booking.customer.address}</p>}
              </div>

              {/* Flight / Booking Details */}
              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1.5">Travel & Flight Summary</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sector / Route:</span>
                    <span className="font-bold text-slate-900">{booking.sector}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Airline / Flight:</span>
                    <span className="font-semibold text-slate-900">{booking.airline?.name || 'Airline'} ({booking.flightNumber})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Journey Date:</span>
                    <span className="font-semibold text-slate-900">{formatDate(booking.journeyDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">PNR / Ticket:</span>
                    <span className="font-mono font-bold text-brand-700">{booking.pnr} {booking.ticketNumber ? `| ${booking.ticketNumber}` : ''}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Passenger Names Box */}
            <div className="mb-6 bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Passenger(s): </span>
              <span className="text-slate-600 font-medium">{passengerNames || 'N/A'}</span>
            </div>

            {/* Charges Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0B1E36] text-white font-bold">
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-2.5 px-4 font-medium">Base Airfare ({booking.sector})</td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold">₹{parseFloat(booking.baseFare || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-slate-600">Airline Fuel & Airport Taxes</td>
                    <td className="py-2 px-4 text-right font-mono">₹{parseFloat(booking.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-slate-600">Agency Service Charge / Facilitation Fee</td>
                    <td className="py-2 px-4 text-right font-mono">₹{parseFloat(booking.serviceCharge || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  {parseFloat(booking.otherCharges || 0) > 0 && (
                    <tr>
                      <td className="py-2 px-4 text-slate-600">Other Ancillary Charges (Seat/Meal/Baggage)</td>
                      <td className="py-2 px-4 text-right font-mono">₹{parseFloat(booking.otherCharges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  )}
                  {parseFloat(booking.discount || 0) > 0 && (
                    <tr className="text-emerald-700 bg-emerald-50/50">
                      <td className="py-2 px-4 font-medium">Promotional Discount Applied</td>
                      <td className="py-2 px-4 text-right font-mono font-semibold">-₹{parseFloat(booking.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="border-t-2 border-slate-800 bg-slate-50 font-bold">
                  <tr>
                    <td className="py-3 px-4 text-sm text-slate-900">Total Invoice Amount</td>
                    <td className="py-3 px-4 text-right text-base font-mono text-slate-900">₹{parseFloat(booking.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="text-emerald-700">
                    <td className="py-2 px-4">Amount Received</td>
                    <td className="py-2 px-4 text-right font-mono">₹{parseFloat(booking.amountReceived || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className={parseFloat(booking.balanceDue || 0) > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                    <td className="py-2 px-4">Balance Outstanding</td>
                    <td className="py-2 px-4 text-right font-mono">₹{parseFloat(booking.balanceDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payment Status Stamp */}
            <div className="flex items-center justify-between my-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600">Payment Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  booking.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                  booking.paymentStatus === 'partially_paid' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                  'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {booking.paymentStatus?.replace('_', ' ')}
                </span>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400">Authorized Signatory</p>
                <p className="text-xs font-bold text-slate-800 mt-4 border-t border-slate-300 pt-1">Liberty Tours & Travels</p>
              </div>
            </div>

            {/* Terms & Conditions and Footer */}
            <div className="mt-6 pt-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-2">
              <p className="font-bold text-slate-700 text-xs">Terms & Conditions:</p>
              <p className="whitespace-pre-line leading-relaxed">{agency?.termsAndConditions}</p>
              <p className="text-center font-semibold text-slate-600 pt-3">{agency?.invoiceFooter}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
