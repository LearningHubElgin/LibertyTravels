import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  FileText,
  Receipt,
  Layers,
  Check,
  Building2,
  Phone,
  Mail,
  Calendar,
  User,
  ShieldCheck,
  CreditCard,
  Percent
} from 'lucide-react';
import api from '../../services/api';
import { formatDate, numberToWords } from '../../utils/formatters';

export const InvoiceModal = ({ isOpen, onClose, booking, initialMode = 'total_bill' }) => {
  const [agency, setAgency] = useState(null);
  const [billMode, setBillMode] = useState(initialMode); // 'total_bill' | 'tax_invoice'
  const [includeLedgerDue, setIncludeLedgerDue] = useState(false);
  const [customerLedger, setCustomerLedger] = useState(null);
  const [loadingLedger, setLoadingLedger] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBillMode(initialMode || 'total_bill');
      
      // Fetch Agency Settings
      api.get('/settings')
        .then((res) => {
          if (res.data?.success) {
            setAgency(res.data.settings);
          }
        })
        .catch((e) => console.error('Error fetching settings for invoice:', e));

      // Fetch Customer Ledger balance if customer exists
      const custId = booking?.customerId || booking?.customer?._id || booking?.customer?.id;
      if (custId) {
        setLoadingLedger(true);
        api.get(`/customers/${custId}/ledger`)
          .then((res) => {
            if (res.data?.success) {
              setCustomerLedger(res.data.summary);
            }
          })
          .catch((e) => console.error('Error fetching customer ledger:', e))
          .finally(() => setLoadingLedger(false));
      }
    }
  }, [isOpen, booking, initialMode]);

  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('printable-invoice');
    if (!printContent) {
      window.print();
      return;
    }

    // Collect all active stylesheets and styles in the document
    const styleElements = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    // Create temporary hidden print iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('title', 'Print Invoice');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title> </title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          ${styleElements}
          <style>
            @page {
              size: A4 portrait;
              margin-top: 10mm !important;
              margin-bottom: 8mm !important;
              margin-left: 10mm !important;
              margin-right: 10mm !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box;
            }
            #printable-invoice {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding-top: 5px !important;
              padding-bottom: 5px !important;
              background: #fff !important;
            }
          </style>
        </head>
        <body>
          <div id="printable-invoice">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }, 300);
  };

  // Compute clean financial numbers & taxes
  const totalAmount = parseFloat(booking.totalAmount || booking.sellPrice || 0);
  const amountReceived = parseFloat(booking.amountReceived || 0);
  const currentBalanceDue = parseFloat(booking.balanceDue || Math.max(0, totalAmount - amountReceived));
  
  let rawTax = parseFloat(booking.tax || 0);
  const serviceCharge = parseFloat(booking.serviceCharge || 0);
  const otherCharges = parseFloat(booking.otherCharges || 0);
  const discount = parseFloat(booking.discount || 0);

  // If tax was not explicitly set separately in the booking, calculate applicable standard 18% GST (or 5% transport GST)
  // so GST is always transparently visible to the customer
  let totalTax = rawTax;
  if (totalTax <= 0 && totalAmount > 0) {
    // 18% GST inclusive standard calculation: Taxable = Total / 1.18; Tax = Total - Taxable
    totalTax = Math.round((totalAmount - (totalAmount / 1.18)) * 100) / 100;
  }

  const computedBaseFare = Math.max(0, Math.round((totalAmount - totalTax - serviceCharge - otherCharges + discount) * 100) / 100);
  const cgst = Math.round((totalTax / 2) * 100) / 100;
  const sgst = Math.round((totalTax / 2) * 100) / 100;

  // Previous customer dues
  const previousCustomerDue = customerLedger ? Math.max(0, parseFloat(customerLedger.closingBalance || 0) - currentBalanceDue) : 0;
  const grandTotalDue = includeLedgerDue ? (currentBalanceDue + previousCustomerDue) : currentBalanceDue;

  const invoiceNumber = booking.referenceNo
    ? booking.referenceNo.replace('TRV-', billMode === 'total_bill' ? 'BILL-' : 'INV-')
    : `${billMode === 'total_bill' ? 'BILL' : 'INV'}-2026-${String(booking.id || booking._id || '1001').slice(-5).toUpperCase()}`;

  const passengerNames = (booking.passengers && booking.passengers.length > 0)
    ? booking.passengers.map((p) => `${p.title ? p.title + ' ' : ''}${p.firstName} ${p.lastName}`).join(', ')
    : (booking.passengerName || 'N/A');

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Dimmed Overlay */}
      <div
        className="no-print fixed inset-0 bg-slate-950/60 transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-2 sm:p-4 md:p-6 text-center">
        <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[94vh] overflow-hidden border border-slate-200 animate-scale-up text-left my-auto">
          
          {/* Top Toolbar / Bill Type Switcher */}
          <div className="no-print sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-[#0B1E36] text-white border-b border-slate-800 shadow-md shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Bill Options Selector */}
              <div className="inline-flex p-1 bg-slate-800/90 rounded-xl border border-slate-700/60 shadow-inner">
                <button
                  type="button"
                  onClick={() => setBillMode('total_bill')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    billMode === 'total_bill'
                      ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Total Bill (With GST)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBillMode('tax_invoice')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    billMode === 'tax_invoice'
                      ? 'bg-brand-500 text-white shadow-md scale-[1.02]'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Detailed GST Tax Invoice</span>
                </button>
              </div>

              {/* Toggle Ledger Account Due */}
              {customerLedger && previousCustomerDue > 0 && (
                <label className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-300 cursor-pointer select-none transition">
                  <input
                    type="checkbox"
                    checked={includeLedgerDue}
                    onChange={(e) => setIncludeLedgerDue(e.target.checked)}
                    className="rounded border-slate-600 text-amber-500 focus:ring-amber-400 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Include Previous Ledger Dues (+₹{previousCustomerDue.toLocaleString('en-IN')})</span>
                </label>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold rounded-xl shadow-md transition transform active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Printable Invoice Content */}
          <div className="overflow-y-auto flex-1 p-5 sm:p-8 md:p-10 bg-white text-slate-800">
            <div id="printable-invoice" className="bg-white max-w-3xl mx-auto">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b-2 border-slate-800 gap-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
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
                    {agency?.address || 'Suite 402, Liberty Business Tower, Connaught Place, New Delhi - 110001, India'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    <span className="font-semibold">Phone:</span> {agency?.phone || '+91 98765 43210 / 011-23456789'} | <span className="font-semibold">Email:</span> {agency?.email || 'contact@libertytravel.com'}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-700 font-mono mt-1 font-bold bg-slate-100 px-2 py-0.5 rounded-md inline-flex border border-slate-200">
                    <span>GSTIN: {agency?.gstNumber || '07AAAAA0000A1Z5'}</span>
                    <span>•</span>
                    <span>PAN: {agency?.panNumber || 'AAACL1234K'}</span>
                    <span>•</span>
                    <span>SAC: 998553</span>
                  </div>
                </div>

                <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-3.5 sm:p-0 rounded-2xl w-full sm:w-auto border border-slate-200 sm:border-0">
                  <h2 className={`text-xl font-black tracking-wider uppercase ${billMode === 'total_bill' ? 'text-slate-900' : 'text-brand-700'}`}>
                    {billMode === 'total_bill' ? 'TOTAL TRAVEL BILL' : 'TAX INVOICE'}
                  </h2>
                  <p className="text-xs font-mono font-bold text-slate-800 mt-1">{invoiceNumber}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Date: {formatDate(booking.bookingDate || Date.now())}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">Ref: {booking.referenceNo}</p>
                </div>
              </div>

              {/* Customer & Travel Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 my-5 text-xs">
                {/* Customer Details */}
                <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1.5">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>Billed To (Customer / Client)</span>
                  </p>
                  <p className="text-sm font-bold text-slate-900">{booking.customer?.name || booking.customerName || 'Valued Customer'}</p>
                  <p className="text-slate-600 mt-0.5 font-medium">{booking.customer?.phone || booking.customerPhone || 'N/A'}</p>
                  <p className="text-slate-600">{booking.customer?.email || booking.customerEmail || 'N/A'}</p>
                  {booking.customer?.address && <p className="text-slate-500 mt-1 text-[11px] leading-snug">{booking.customer.address}</p>}
                  <p className="text-[10px] text-slate-500 font-mono mt-1 font-semibold">
                    Customer GSTIN: {booking.customer?.gstNumber || 'Consumer / Unregistered (B2C)'}
                  </p>
                </div>

                {/* Travel & Flight Summary */}
                <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Travel & Flight Summary</span>
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sector / Route:</span>
                      <span className="font-bold text-slate-900 uppercase">{booking.sector || booking.description}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Company / Supplier:</span>
                      <span className="font-semibold text-slate-900">
                        {booking.company?.name || booking.companyName || 'Company'} {booking.flightNumber ? `(${booking.flightNumber})` : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Journey Date:</span>
                      <span className="font-semibold text-slate-900">{formatDate(booking.journeyDate || booking.bookingDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">PNR / Ticket:</span>
                      <span className="font-mono font-bold text-brand-700">{booking.pnr || booking.referenceNo} {booking.ticketNumber ? `| ${booking.ticketNumber}` : ''}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passenger Names Box */}
              <div className="mb-5 bg-slate-50/80 p-3 sm:p-3.5 rounded-xl border border-slate-200 text-xs flex items-center gap-2">
                <span className="font-bold text-slate-700 shrink-0">Passenger(s):</span>
                <span className="text-slate-700 font-medium truncate">{passengerNames}</span>
                {booking.passengerCount > 1 && (
                  <span className="ml-auto px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 text-[10px] font-bold">
                    {booking.passengerCount} Tickets
                  </span>
                )}
              </div>

              {/* Charges & GST Breakdown Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden mb-5 text-xs shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0B1E36] text-white font-bold">
                      <th className="py-2.5 px-4">Item Description & Tax Particulars</th>
                      <th className="py-2.5 px-4 text-center">SAC Code</th>
                      <th className="py-2.5 px-4 text-right">Taxable Value (₹)</th>
                      <th className="py-2.5 px-4 text-right">GST / Tax (₹)</th>
                      <th className="py-2.5 px-4 text-right">Total Amount (₹)</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {booking.serviceType ? booking.serviceType.toUpperCase() : 'TRAVEL'} Ticket / Package ({booking.sector || booking.description})
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Base travel fare excluding applicable GST taxes
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">998553</td>
                      <td className="py-3 px-4 text-right font-mono font-medium">
                        ₹{computedBaseFare.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        ₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{(computedBaseFare + totalTax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {/* GST Itemized Rows */}
                    <tr className="bg-slate-50/60 text-slate-600">
                      <td className="py-1.5 px-4 pl-8 font-medium">↳ CGST (Central Goods & Services Tax @ 9%)</td>
                      <td className="py-1.5 px-4 text-center font-mono text-[11px]">998553</td>
                      <td className="py-1.5 px-4 text-right font-mono">-</td>
                      <td className="py-1.5 px-4 text-right font-mono font-semibold text-slate-800">
                        ₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-1.5 px-4 text-right font-mono text-slate-500">9%</td>
                    </tr>

                    <tr className="bg-slate-50/60 text-slate-600">
                      <td className="py-1.5 px-4 pl-8 font-medium">↳ SGST / UTGST (State Goods & Services Tax @ 9%)</td>
                      <td className="py-1.5 px-4 text-center font-mono text-[11px]">998553</td>
                      <td className="py-1.5 px-4 text-right font-mono">-</td>
                      <td className="py-1.5 px-4 text-right font-mono font-semibold text-slate-800">
                        ₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-1.5 px-4 text-right font-mono text-slate-500">9%</td>
                    </tr>

                    {serviceCharge > 0 && (
                      <tr>
                        <td className="py-2 px-4 text-slate-700 font-medium">Agency Service Charge / Facilitation Fee</td>
                        <td className="py-2 px-4 text-center font-mono text-slate-600">998553</td>
                        <td className="py-2 px-4 text-right font-mono">₹{serviceCharge.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 px-4 text-right font-mono">₹0.00</td>
                        <td className="py-2 px-4 text-right font-mono font-semibold text-slate-900">₹{serviceCharge.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    )}

                    {otherCharges > 0 && (
                      <tr>
                        <td className="py-2 px-4 text-slate-700 font-medium">Other Ancillary Charges (Baggage / Meals / Seats)</td>
                        <td className="py-2 px-4 text-center font-mono text-slate-600">998553</td>
                        <td className="py-2 px-4 text-right font-mono">₹{otherCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 px-4 text-right font-mono">₹0.00</td>
                        <td className="py-2 px-4 text-right font-mono font-semibold text-slate-900">₹{otherCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    )}

                    {discount > 0 && (
                      <tr className="text-emerald-700 bg-emerald-50/50">
                        <td colSpan={4} className="py-2 px-4 font-medium">Promotional Discount Applied</td>
                        <td className="py-2 px-4 text-right font-mono font-semibold">-₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    )}
                  </tbody>

                  {/* Bill Summary / Grand Totals */}
                  <tfoot className="border-t-2 border-slate-800 bg-slate-50 font-bold">
                    <tr className="text-slate-700 border-b border-slate-200">
                      <td colSpan={3} className="py-2 px-4 text-xs font-semibold">
                        Total Taxable Base Value
                      </td>
                      <td colSpan={2} className="py-2 px-4 text-right font-mono font-semibold text-slate-800">
                        ₹{computedBaseFare.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    <tr className="text-slate-700 border-b border-slate-200 bg-amber-50/40">
                      <td colSpan={3} className="py-2 px-4 text-xs font-bold text-amber-900">
                        Total GST & Taxes (CGST + SGST)
                      </td>
                      <td colSpan={2} className="py-2 px-4 text-right font-mono font-bold text-amber-900">
                        ₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    <tr className="bg-slate-100/90 text-slate-900">
                      <td colSpan={3} className="py-3 px-4 text-sm font-black uppercase">
                        {billMode === 'total_bill' ? 'Total Bill Amount (Incl. of all Taxes)' : 'Total Invoice Amount (Gross)'}
                      </td>
                      <td colSpan={2} className="py-3 px-4 text-right text-base font-mono font-black text-slate-950">
                        ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    <tr className="text-emerald-700">
                      <td colSpan={3} className="py-2 px-4 font-medium">Amount Received / Advance Paid</td>
                      <td colSpan={2} className="py-2 px-4 text-right font-mono font-bold">
                        ₹{amountReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    <tr className={currentBalanceDue > 0 ? 'text-rose-700 bg-rose-50/30' : 'text-emerald-700'}>
                      <td colSpan={3} className="py-2 px-4 font-bold">
                        Balance Outstanding (This Booking)
                      </td>
                      <td colSpan={2} className="py-2 px-4 text-right font-mono font-black text-sm">
                        ₹{currentBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {/* Customer Cumulative Ledger Integration */}
                    {includeLedgerDue && previousCustomerDue > 0 && (
                      <>
                        <tr className="text-slate-600 border-t border-slate-200">
                          <td colSpan={3} className="py-2 px-4 font-medium">Previous Unpaid Dues (Customer Ledger)</td>
                          <td colSpan={2} className="py-2 px-4 text-right font-mono">
                            ₹{previousCustomerDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr className="bg-amber-100/70 text-slate-950 border-t-2 border-slate-900">
                          <td colSpan={3} className="py-3 px-4 text-sm font-black uppercase">
                            Grand Total Balance Payable
                          </td>
                          <td colSpan={2} className="py-3 px-4 text-right text-base font-mono font-black text-rose-800">
                            ₹{grandTotalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </>
                    )}
                  </tfoot>
                </table>
              </div>

              {/* Amount in Words */}
              <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-bold text-slate-700">Amount in Words: </span>
                <span className="text-slate-800 font-semibold italic">
                  {numberToWords(totalAmount)}
                </span>
              </div>

              {/* Payment Status Stamp & Signatory */}
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
                  <p className="text-xs font-bold text-slate-800 mt-4 border-t border-slate-300 pt-1">
                    {agency?.agencyName || 'Liberty Tours & Travels'}
                  </p>
                </div>
              </div>

              {/* Terms & Conditions and Footer */}
              <div className="mt-5 pt-3 border-t border-slate-200 text-[11px] text-slate-500 space-y-1.5">
                <p className="font-bold text-slate-700 text-xs">GST & Booking Terms:</p>
                <p className="whitespace-pre-line leading-relaxed text-[10px]">
                  {agency?.termsAndConditions || '1. All tickets are subject to airline/supplier fare rules & conditions.\n2. In case of cancellation or reschedule, airline charges plus agency facilitation fees apply.'}
                </p>
                <p className="text-center font-semibold text-slate-600 pt-2 text-[11px]">
                  {agency?.invoiceFooter || 'Thank you for choosing Liberty Tours & Travels. We wish you a safe and memorable journey!'}
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
