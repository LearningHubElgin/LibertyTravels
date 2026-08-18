import React, { useState, useEffect } from 'react';
import {
  Scale,
  Search,
  Filter,
  User,
  BookOpen,
  ArrowDownRight,
  ArrowUpRight,
  Printer,
  Download,
  Calendar
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export const LedgerPage = () => {
  const { error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' or 'general'

  // Customers
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerLedger, setCustomerLedger] = useState(null);

  // General Ledger
  const [generalLedger, setGeneralLedger] = useState(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [txnType, setTxnType] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCustomerList = async () => {
      try {
        const res = await api.get('/customers?limit=100');
        if (res.data.success) {
          const list = res.data.customers || [];
          setCustomers(list);
          if (list.length > 0) {
            setSelectedCustomerId(list[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchCustomerList();
  }, []);

  const fetchCustomerLedger = async () => {
    if (!selectedCustomerId) return;
    setLoading(true);
    try {
      let query = '';
      if (startDate) query += `startDate=${startDate}&`;
      if (endDate) query += `endDate=${endDate}&`;

      const res = await api.get(`/ledger/customer/${selectedCustomerId}?${query}`);
      if (res.data.success) {
        setCustomerLedger(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchGeneralLedger = async () => {
    setLoading(true);
    try {
      let query = '';
      if (startDate) query += `startDate=${startDate}&`;
      if (endDate) query += `endDate=${endDate}&`;
      if (txnType) query += `type=${txnType}&`;

      const res = await api.get(`/ledger/general?${query}`);
      if (res.data.success) {
        setGeneralLedger(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'customer') {
      fetchCustomerLedger();
    } else {
      fetchGeneralLedger();
    }
  }, [activeTab, selectedCustomerId, startDate, endDate, txnType]);

  const formatCurrency = (val) => `₹${parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      <PageHeader
        title="Accounting & General Ledger"
        subtitle="Double-entry accounting, customer running statements and agency financial flow"
        icon={Scale}
        actions={
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" /> Print Statement
          </button>
        }
      />

      {/* Main Tabs */}
      <div className="flex border-b border-slate-200 gap-3 sm:gap-8 text-xs sm:text-sm font-bold bg-white px-3 sm:px-6 pt-3 sm:pt-4 rounded-t-xl sm:rounded-t-2xl border border-b-0 border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('customer')}
          className={`pb-3 sm:pb-4 transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'customer'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Customer Ledger Statement
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 sm:pb-4 transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'general'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Agency General Ledger
        </button>
      </div>

      {/* Customer Ledger Tab Content */}
      {activeTab === 'customer' && (
        <div className="space-y-4 sm:space-y-6 bg-white p-3.5 sm:p-6 rounded-b-xl sm:rounded-b-2xl border border-slate-200 shadow-xs -mt-4 sm:-mt-6 w-full min-w-0">
          {/* Customer Selection & Date Filter Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-slate-100 w-full min-w-0">
            <div className="w-full md:w-80">
              <label className="block text-[10px] sm:text-xs font-semibold text-slate-600 mb-1">Select Customer Account</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs border border-slate-200 rounded-lg sm:rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customerCode}) - {c.phone}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 text-[10px] sm:text-xs border border-slate-200 rounded-lg bg-slate-50"
                  title="From Date"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 text-[10px] sm:text-xs border border-slate-200 rounded-lg bg-slate-50"
                  title="To Date"
                />
              </div>

              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1"
                >
                  Clear Dates
                </button>
              )}
            </div>
          </div>

          {/* Account Summary Banner */}
          {customerLedger?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <div className="p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-200 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 truncate">Opening</p>
                <p className="text-xs sm:text-base font-bold font-mono text-slate-900 mt-0.5 sm:mt-1 truncate">
                  {formatCurrency(customerLedger.summary.openingBalance)}
                </p>
              </div>

              <div className="p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-rose-50/50 border border-rose-100 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase text-rose-500 truncate">Billed (Dr)</p>
                <p className="text-xs sm:text-base font-bold font-mono text-rose-600 mt-0.5 sm:mt-1 truncate">
                  {formatCurrency(customerLedger.summary.totalDebit)}
                </p>
              </div>

              <div className="p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-emerald-50/50 border border-emerald-100 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase text-emerald-600 truncate">Paid (Cr)</p>
                <p className="text-xs sm:text-base font-bold font-mono text-emerald-600 mt-0.5 sm:mt-1 truncate">
                  {formatCurrency(customerLedger.summary.totalCredit)}
                </p>
              </div>

              <div className="p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-slate-900 text-white shadow-md min-w-0">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 truncate">Closing Due</p>
                <p className="text-xs sm:text-lg font-black font-mono text-brand-300 mt-0.5 sm:mt-1 truncate">
                  {formatCurrency(customerLedger.summary.closingBalance)}
                </p>
              </div>
            </div>
          )}

          {/* Customer Ledger Table */}
          {loading ? (
            <LoadingSpinner size="md" text="Calculating running ledger statement..." />
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl font-mono text-xs shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-sans font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4 font-sans">Particulars / Description</th>
                    <th className="py-3 px-4 text-right">Debit (₹)</th>
                    <th className="py-3 px-4 text-right">Credit (₹)</th>
                    <th className="py-3 px-4 text-right">Running Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {customerLedger?.entries && customerLedger.entries.length > 0 ? (
                    customerLedger.entries.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-slate-500">{formatDate(item.date)}</td>
                        <td className="py-3 px-4 font-bold text-brand-700">{item.referenceNo}</td>
                        <td className="py-3 px-4 font-sans max-w-sm">{item.description}</td>
                        <td className="py-3 px-4 text-right font-bold text-rose-600">
                          {item.debit > 0 ? formatCurrency(item.debit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">
                          {item.credit > 0 ? formatCurrency(item.credit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                          {formatCurrency(item.runningBalance)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-8 text-center font-sans text-slate-400">
                        No financial activity recorded for this customer in the selected date period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* General Ledger Tab Content */}
      {activeTab === 'general' && (
        <div className="space-y-6 bg-white p-6 rounded-b-2xl border border-slate-200 shadow-xs -mt-6">
          {/* General Ledger Filters */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={txnType}
                onChange={(e) => setTxnType(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
              >
                <option value="">All Journal Types</option>
                <option value="booking">Bookings</option>
                <option value="customer_payment">Customer Payments</option>
                <option value="expense">Expenses</option>
                <option value="refund">Refunds</option>
                <option value="adjustment">Adjustments</option>
              </select>

              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50"
                  title="From Date"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50"
                  title="To Date"
                />
              </div>
            </div>
          </div>

          {/* General Summary */}
          {generalLedger?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              <div className="p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-rose-50/50 border border-rose-100 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase text-rose-500 truncate">Total Debits</p>
                <p className="text-xs sm:text-base font-bold font-mono text-rose-600 mt-0.5 sm:mt-1 truncate">
                  {formatCurrency(generalLedger.summary.totalDebit)}
                </p>
              </div>

              <div className="p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-emerald-50/50 border border-emerald-100 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase text-emerald-600 truncate">Total Credits</p>
                <p className="text-xs sm:text-base font-bold font-mono text-emerald-600 mt-0.5 sm:mt-1 truncate">
                  {formatCurrency(generalLedger.summary.totalCredit)}
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1 p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-slate-900 text-white min-w-0">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 truncate">Net Flow</p>
                <p className="text-xs sm:text-lg font-black font-mono text-brand-300 mt-0.5 sm:mt-1 truncate">
                  {formatCurrency(generalLedger.summary.netBalance)}
                </p>
              </div>
            </div>
          )}

          {/* General Ledger Table */}
          {loading ? (
            <LoadingSpinner size="md" text="Loading agency general ledger..." />
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl font-mono text-xs shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-sans font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4 font-sans">Description</th>
                    <th className="py-3 px-4 font-sans">Account Link</th>
                    <th className="py-3 px-4 text-right">Debit (₹)</th>
                    <th className="py-3 px-4 text-right">Credit (₹)</th>
                    <th className="py-3 px-4 text-right">Running Cash Flow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {generalLedger?.entries && generalLedger.entries.length > 0 ? (
                    generalLedger.entries.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-slate-500">{formatDate(item.date)}</td>
                        <td className="py-3 px-4 font-bold text-brand-700">{item.referenceNo}</td>
                        <td className="py-3 px-4 font-sans max-w-xs">{item.description}</td>
                        <td className="py-3 px-4 font-sans text-slate-500 text-[11px]">
                          {item.customer ? item.customer.name : 'General'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-rose-600">
                          {item.debit > 0 ? formatCurrency(item.debit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">
                          {item.credit > 0 ? formatCurrency(item.credit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                          {formatCurrency(item.runningCashFlow)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-8 text-center font-sans text-slate-400">
                        No general ledger postings found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
