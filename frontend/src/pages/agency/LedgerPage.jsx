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

  // Companies
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [companyLedger, setCompanyLedger] = useState(null);

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
    
    const fetchCompanyList = async () => {
      try {
        const res = await api.get('/companies?limit=100');
        if (res.data.success) {
          const list = res.data.companies || [];
          setCompanies(list);
          if (list.length > 0) {
            setSelectedCompanyId(list[0].id || list[0]._id);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchCustomerList();
    fetchCompanyList();
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

  const fetchCompanyLedger = async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      const res = await api.get(`/companies/${selectedCompanyId}`);
      if (res.data.success) {
        let transactions = res.data.company?.transactions || [];
        // Filter by date if provided
        if (startDate) {
          transactions = transactions.filter(t => new Date(t.date) >= new Date(startDate));
        }
        if (endDate) {
          transactions = transactions.filter(t => new Date(t.date) <= new Date(endDate));
        }
        setCompanyLedger({
          company: res.data.company,
          entries: transactions
        });
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
    } else if (activeTab === 'general') {
      fetchGeneralLedger();
    } else if (activeTab === 'company') {
      fetchCompanyLedger();
    }
  }, [activeTab, selectedCustomerId, selectedCompanyId, startDate, endDate, txnType]);

  const formatCurrency = (val) => `₹${parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const formatRunningBalance = (val) => {
    const num = parseFloat(val || 0);
    if (Math.abs(num) < 0.01) {
      return <span className="text-slate-400 font-medium">₹0.00</span>;
    }
    if (num > 0) {
      return (
        <span className="text-rose-600 font-bold">
          ₹{num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}{' '}
          <span className="text-[10px] font-semibold text-rose-500">Dr</span>
        </span>
      );
    }
    return (
      <span className="text-emerald-600 font-bold">
        ₹{Math.abs(num).toLocaleString('en-IN', { minimumFractionDigits: 2 })}{' '}
        <span className="text-[10px] font-semibold text-emerald-600">Cr</span>
      </span>
    );
  };

  const displayedCustomerEntries = React.useMemo(() => {
    if (!customerLedger?.entries) return [];
    return customerLedger.entries.filter(
      (e) => e.type === 'customer_payment' || e.type === 'payment' || e.type === 'refund'
    );
  }, [customerLedger?.entries]);

  const customerPaymentTotals = React.useMemo(() => {
    const totalPaid = displayedCustomerEntries
      .filter((e) => e.type === 'customer_payment' || e.type === 'payment')
      .reduce((sum, e) => sum + parseFloat(e.credit || 0), 0);
    const totalRefunded = displayedCustomerEntries
      .filter((e) => e.type === 'refund')
      .reduce((sum, e) => sum + parseFloat(e.debit || 0), 0);
    return {
      totalPaid,
      totalRefunded,
      netReceived: totalPaid - totalRefunded
    };
  }, [displayedCustomerEntries]);

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
          onClick={() => setActiveTab('company')}
          className={`pb-3 sm:pb-4 transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'company'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Company Ledger Statement
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 sm:pb-4 transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'general'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Agency General Ledger
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
                <p className="text-[9px] sm:text-[10px] font-bold uppercase text-rose-500 truncate">Billed / Charged</p>
                <p className="text-xs sm:text-base font-bold font-mono text-rose-600 mt-0.5 sm:mt-1 truncate">
                  {formatCurrency(
                    customerLedger.summary.netCharged !== undefined
                      ? customerLedger.summary.netCharged
                      : customerLedger.summary.totalDebit
                  )}
                </p>
                {customerLedger.summary.netCharged !== undefined && customerLedger.summary.netCharged !== customerLedger.summary.totalDebit && (
                  <span className="text-[10px] text-slate-400 font-sans block truncate">
                    Net after cancellations
                  </span>
                )}
              </div>

              <div className="p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-emerald-50/50 border border-emerald-100 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase text-emerald-600 truncate">Paid / Received</p>
                <p className="text-xs sm:text-base font-bold font-mono text-emerald-600 mt-0.5 sm:mt-1 truncate">
                  {formatCurrency(
                    customerLedger.summary.netReceived !== undefined
                      ? customerLedger.summary.netReceived
                      : customerLedger.summary.totalCredit
                  )}
                </p>
                {customerLedger.summary.totalRefunded > 0 && (
                  <span className="text-[10px] text-slate-400 font-sans block truncate">
                    Paid {formatCurrency(customerLedger.summary.totalPaid)} − Ref {formatCurrency(customerLedger.summary.totalRefunded)}
                  </span>
                )}
              </div>

              <div className="p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-slate-900 text-white shadow-md min-w-0">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 truncate">Closing Due</p>
                <p className="text-xs sm:text-lg font-black font-mono text-brand-300 mt-0.5 sm:mt-1 truncate">
                  {formatCurrency(customerLedger.summary.closingBalance)}
                </p>
                <span className="text-[10px] text-slate-400 font-sans block truncate">
                  {parseFloat(customerLedger.summary.closingBalance || 0) === 0 ? 'Settled' : 'Balance Due'}
                </span>
              </div>
            </div>
          )}

          {/* Payments & Receipts Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold inline-block w-fit shadow-2xs">
              Payments & Receipts Only ({displayedCustomerEntries.length})
            </span>
            <span className="text-[11px] text-slate-500 font-sans">
              Showing only cash, bank & online payments received and refunds paid
            </span>
          </div>

          {/* Customer Ledger Table */}
          {loading ? (
            <LoadingSpinner size="md" text="Calculating running ledger statement..." />
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl font-mono text-xs shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-sans font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Reference & Type</th>
                    <th className="py-3 px-4 font-sans">Particulars / Description</th>
                    <th className="py-3 px-4 text-right">Debit / Refund (₹)</th>
                    <th className="py-3 px-4 text-right">Credit / Paid (₹)</th>
                    <th className="py-3 px-4 text-right">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {displayedCustomerEntries && displayedCustomerEntries.length > 0 ? (
                    displayedCustomerEntries.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-slate-500">{formatDate(item.date)}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-brand-700 block">{item.referenceNo}</span>
                          {item.type === 'refund' ? (
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase mt-0.5">
                              Refund
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase mt-0.5">
                              Payment
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-sans max-w-sm">
                          <span className="text-slate-800 font-medium block truncate">{item.description}</span>
                          {(item.bankName || item.paymentMethod) && (
                            <span className="text-[10px] text-slate-400 font-mono block">
                              via {item.paymentMethod?.toUpperCase()}{item.bankName ? ` (${item.bankName})` : ''}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-rose-600">
                          {item.debit > 0 ? formatCurrency(item.debit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">
                          {item.credit > 0 ? formatCurrency(item.credit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                          {item.type === 'refund' ? (
                            <span className="text-amber-600 text-xs font-sans font-bold flex items-center justify-end">
                              Refunded
                            </span>
                          ) : (
                            <span className="text-emerald-600 text-xs font-sans font-bold flex items-center justify-end">
                              Received
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-8 text-center font-sans text-slate-400">
                        No payment or refund activity recorded for this customer in the selected date period.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300">
                  <tr>
                    <td colSpan="3" className="py-3 px-4 font-sans text-right">
                      Total Payments Received:
                    </td>
                    <td className="py-3 px-4 text-right text-rose-700">
                      {formatCurrency(customerPaymentTotals.totalRefunded)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-700">
                      {formatCurrency(customerPaymentTotals.totalPaid)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-900 text-sm">
                      <span className="text-emerald-700 text-xs font-mono font-bold">
                        Net: {formatCurrency(customerPaymentTotals.netReceived)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Company Ledger Tab Content */}
      {activeTab === 'company' && (
        <div className="space-y-4 sm:space-y-6 bg-white p-3.5 sm:p-6 rounded-b-xl sm:rounded-b-2xl border border-slate-200 shadow-xs -mt-4 sm:-mt-6 w-full min-w-0">
          {/* Company Selection & Date Filter Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-slate-100 w-full min-w-0">
            <div className="w-full md:w-80">
              <label className="block text-[10px] sm:text-xs font-semibold text-slate-600 mb-1">Select Company Account</label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs border border-slate-200 rounded-lg sm:rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              >
                {companies.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.name} ({c.code})
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
          {companyLedger?.company && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div className="p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-slate-900 text-white shadow-md min-w-0">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 truncate">Current Wallet Balance</p>
                <p className="text-xs sm:text-lg font-black font-mono text-brand-300 mt-0.5 sm:mt-1 truncate">
                  {formatCurrency(companyLedger.company.walletBalance)}
                </p>
              </div>
            </div>
          )}

          {/* Company Ledger Table */}
          {loading ? (
            <LoadingSpinner size="md" text="Loading company ledger..." />
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl font-mono text-xs shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-sans font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4 font-sans">Type</th>
                    <th className="py-3 px-4 font-sans">Notes</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4 text-right">Running Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {companyLedger?.entries && companyLedger.entries.length > 0 ? (
                    companyLedger.entries.map((item, idx) => (
                      <tr key={item._id || idx} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-slate-500">{formatDate(item.date)}</td>
                        <td className="py-3 px-4 font-bold text-brand-700">{item.reference || '-'}</td>
                        <td className="py-3 px-4 font-sans capitalize">
                          {item.type === 'deposit' ? (
                            <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">Deposit</span>
                          ) : item.type === 'reward' ? (
                            <span className="text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full">Reward</span>
                          ) : (
                            <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full">Deduction</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-sans max-w-sm">{item.notes || '-'}</td>
                        <td className={`py-3 px-4 text-right font-bold ${item.type === 'deposit' || item.type === 'reward' ? (item.type === 'reward' ? 'text-purple-600' : 'text-emerald-600') : 'text-rose-600'}`}>
                          {item.type === 'deposit' || item.type === 'reward' ? '+' : '-'}{formatCurrency(item.amount)}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                          {formatCurrency(item.balanceAfter)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-8 text-center font-sans text-slate-400">
                        No financial activity recorded for this company in the selected date period.
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
