import React, { useState, useEffect } from 'react';
import {
  ReceiptText,
  Plus,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Trash2,
  Download,
  Banknote,
  Building2,
  Wallet,
  CheckCircle2,
  Layers,
  ArrowRight,
  X
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const TransactionsPage = () => {
  const { success, error: toastError } = useToast();

  const [transactions, setTransactions] = useState([]);
  const [upiMethods, setUpiMethods] = useState([]);
  const [summary, setSummary] = useState({ totalDebit: 0, totalCredit: 0, netFlow: 0 });
  const [accountBalances, setAccountBalances] = useState({
    cashAccount: null,
    bankAccounts: [],
    summary: null,
    upiApps: []
  });
  const [loading, setLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState({ type: 'all', bankName: '' });

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTxnId, setDeleteTxnId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Manual Transaction Form
  const [txnForm, setTxnForm] = useState({
    transactionDate: new Date().toISOString().split('T')[0],
    description: '',
    type: 'adjustment',
    debit: 0,
    credit: 0,
    accountType: 'cash',
    bankId: '',
    bankName: '',
    paymentMethod: 'cash',
    upiMethod: '',
    upiApp: ''
  });

  const fetchBalances = async () => {
    setBalanceLoading(true);
    try {
      const res = await api.get('/transactions/account-balances');
      if (res.data.success) {
        setAccountBalances(res.data);
        if (res.data.upiApps) {
          setUpiMethods(res.data.upiApps);
        }
      }
    } catch (e) {
      console.error('Failed to fetch account balances:', e);
    } finally {
      setBalanceLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = `page=${pagination.page}&limit=${pagination.limit}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (type) query += `&type=${type}`;
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;
      if (selectedAccountFilter.type !== 'all') {
        query += `&accountType=${selectedAccountFilter.type}`;
      }
      if (selectedAccountFilter.bankName) {
        query += `&bankName=${encodeURIComponent(selectedAccountFilter.bankName)}`;
      }

      const res = await api.get(`/transactions?${query}`);
      if (res.data.success) {
        setTransactions(res.data.transactions || []);
        setSummary(res.data.summary || { totalDebit: 0, totalCredit: 0, netFlow: 0 });
        setPagination(res.data.pagination);
      }
    } catch (e) {
      console.error('Failed to fetch transactions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [
    pagination.page,
    pagination.limit,
    type,
    startDate,
    endDate,
    selectedAccountFilter.type,
    selectedAccountFilter.bankName
  ]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchTransactions();
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    if (!txnForm.description) return toastError('Description is required.');
    if (parseFloat(txnForm.debit || 0) === 0 && parseFloat(txnForm.credit || 0) === 0) {
      return toastError('Please enter either a debit or credit amount.');
    }

    setActionLoading(true);
    try {
      const payload = { ...txnForm };
      if (payload.accountType === 'bank' && payload.bankId) {
        const found = accountBalances.bankAccounts.find(b => b.id === payload.bankId);
        if (found) payload.bankName = found.bankName;
      }
      const res = await api.post('/transactions', payload);
      if (res.data.success) {
        success('Transaction recorded successfully!');
        setIsAddModalOpen(false);
        setTxnForm({
          transactionDate: new Date().toISOString().split('T')[0],
          description: '',
          type: 'adjustment',
          debit: 0,
          credit: 0,
          accountType: 'cash',
          bankId: '',
          bankName: '',
          paymentMethod: 'cash',
          upiMethod: '',
          upiApp: ''
        });
        fetchTransactions();
        fetchBalances();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to add transaction');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!deleteTxnId) return;
    setActionLoading(true);
    try {
      const res = await api.delete(`/transactions/${deleteTxnId}`);
      if (res.data.success) {
        success('Transaction deleted.');
        setDeleteTxnId(null);
        fetchTransactions();
        fetchBalances();
      }
    } catch (err) {
      toastError('Failed to delete transaction.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (val) => `₹${parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const columns = [
    {
      header: 'Date & Reference',
      accessor: 'referenceNo',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 block text-xs">{row.referenceNo}</span>
          <span className="text-[10px] text-slate-400 font-mono">{formatDate(row.transactionDate)}</span>
        </div>
      )
    },
    {
      header: 'Description',
      render: (row) => (
        <div className="max-w-md">
          <p className="font-semibold text-slate-900 leading-tight">{row.description}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {row.customer ? `Customer: ${row.customer.name}` : ''}
            {row.booking ? ` • Booking Ref: ${row.booking.referenceNo}` : ''}
          </p>
        </div>
      )
    },
    {
      header: 'Account / Destination',
      render: (row) => {
        const isCash = row.accountType === 'cash' || row.paymentMethod === 'cash';
        return (
          <div className="flex flex-col gap-0.5">
            {isCash ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-max">
                <Banknote className="w-3 h-3" /> Cash Counter
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 w-max">
                <Building2 className="w-3 h-3" /> {row.bankName || 'Bank Account'}
              </span>
            )}
            {row.upiApp && (
              <span className="text-[10px] font-mono text-purple-700 font-semibold pl-0.5">
                via {row.upiApp}
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Type',
      render: (row) => {
        const typeBadges = {
          booking: 'bg-blue-50 text-blue-700 border-blue-200',
          customer_payment: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          expense: 'bg-rose-50 text-rose-700 border-rose-200',
          refund: 'bg-purple-50 text-purple-700 border-purple-200',
          adjustment: 'bg-amber-50 text-amber-700 border-amber-200',
          commission: 'bg-teal-50 text-teal-700 border-teal-200',
          other_income: 'bg-cyan-50 text-cyan-700 border-cyan-200'
        };
        const badge = typeBadges[row.type] || 'bg-slate-100 text-slate-700 border-slate-200';
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${badge}`}>
            {row.type?.replace('_', ' ')}
          </span>
        );
      }
    },
    {
      header: 'Debit (Out / Dr)',
      className: 'text-right',
      cellClassName: 'text-right font-mono',
      render: (row) =>
        parseFloat(row.debit || 0) > 0 ? (
          <span className="font-bold text-rose-600">{formatCurrency(row.debit)}</span>
        ) : (
          <span className="text-slate-300">-</span>
        )
    },
    {
      header: 'Credit (In / Cr)',
      className: 'text-right',
      cellClassName: 'text-right font-mono',
      render: (row) =>
        parseFloat(row.credit || 0) > 0 ? (
          <span className="font-bold text-emerald-600">{formatCurrency(row.credit)}</span>
        ) : (
          <span className="text-slate-300">-</span>
        )
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <button
          onClick={() => setDeleteTxnId(row.id || row._id)}
          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
          title="Delete Transaction"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  const cash = accountBalances.cashAccount;
  const banks = accountBalances.bankAccounts || [];
  const totalBank = accountBalances.totalBankSummary;
  const totalSummary = accountBalances.summary;

  // Bank brand color mapping for visual richness
  const getBankStyle = (name = '') => {
    const n = name.toLowerCase();
    if (n.includes('hdfc')) return { iconBg: 'bg-blue-600', badge: 'bg-blue-100 text-blue-800 border-blue-200', border: 'border-blue-200/80 hover:border-blue-400', activeRing: 'ring-2 ring-blue-500 border-blue-400', gradient: 'from-blue-50/70 via-white to-blue-50/20' };
    if (n.includes('icici')) return { iconBg: 'bg-amber-600', badge: 'bg-amber-100 text-amber-900 border-amber-200', border: 'border-amber-200/80 hover:border-amber-400', activeRing: 'ring-2 ring-amber-500 border-amber-400', gradient: 'from-amber-50/70 via-white to-orange-50/20' };
    if (n.includes('sbi') || n.includes('state bank')) return { iconBg: 'bg-sky-600', badge: 'bg-sky-100 text-sky-800 border-sky-200', border: 'border-sky-200/80 hover:border-sky-400', activeRing: 'ring-2 ring-sky-500 border-sky-400', gradient: 'from-sky-50/70 via-white to-cyan-50/20' };
    if (n.includes('pnb') || n.includes('punjab')) return { iconBg: 'bg-rose-600', badge: 'bg-rose-100 text-rose-800 border-rose-200', border: 'border-rose-200/80 hover:border-rose-400', activeRing: 'ring-2 ring-rose-500 border-rose-400', gradient: 'from-rose-50/70 via-white to-red-50/20' };
    if (n.includes('axis')) return { iconBg: 'bg-purple-600', badge: 'bg-purple-100 text-purple-800 border-purple-200', border: 'border-purple-200/80 hover:border-purple-400', activeRing: 'ring-2 ring-purple-500 border-purple-400', gradient: 'from-purple-50/70 via-white to-pink-50/20' };
    return { iconBg: 'bg-indigo-600', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200', border: 'border-indigo-200/80 hover:border-indigo-400', activeRing: 'ring-2 ring-indigo-500 border-indigo-400', gradient: 'from-indigo-50/70 via-white to-indigo-50/20' };
  };

  const formatAccountDisplay = (bank) => {
    if (bank.accountNumber && bank.accountNumber !== 'Configured in Settings') {
      const numOnly = bank.accountNumber.replace(/\D/g, '');
      if (numOnly.length >= 4) {
        return `A/C: •••• ${numOnly.slice(-4)}`;
      }
      return `A/C: ${bank.accountNumber}`;
    }
    if (bank.upiId) return bank.upiId;
    return 'Bank Account';
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0 pb-12">
      <PageHeader
        title="Financial Transactions & Multi-Account Balances"
        subtitle="Real-time balances for Cash Counter and individual Bank Accounts (ICICI, HDFC, SBI, PNB, Axis, etc.) with instant filtering"
        icon={ReceiptText}
        actions={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-[10px] sm:text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 transition"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Record Manual Entry
          </button>
        }
      />

      {/* TOP SECTION: ACCOUNT BALANCE CARDS (CONSOLIDATED BANK DEPOSITS, CASH & INDIVIDUAL BANKS) */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-brand-600" /> Account Balances & Bank Deposit Registers
          </h3>
          {selectedAccountFilter.type !== 'all' && (
            <button
              onClick={() => setSelectedAccountFilter({ type: 'all', bankName: '' })}
              className="text-[11px] font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200 transition shadow-2xs"
            >
              <X className="w-3.5 h-3.5" /> Showing:{' '}
              {selectedAccountFilter.type === 'cash'
                ? 'Cash Counter'
                : selectedAccountFilter.bankName
                ? selectedAccountFilter.bankName
                : 'All Banks'}
              {' '}(Click to Show All)
            </button>
          )}
        </div>

        {/* PRIMARY HIGHLIGHT CARDS: ALL BANKS CONSOLIDATED + CASH COUNTER + TOTAL LIQUIDITY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* CARD 1: ALL BANK DEPOSITS (CONSOLIDATED TOTAL) */}
          <div
            onClick={() => setSelectedAccountFilter({ type: 'bank', bankName: '' })}
            className={`p-4 rounded-xl border transition cursor-pointer relative bg-gradient-to-br from-blue-600 via-brand-600 to-indigo-700 text-white shadow-md hover:shadow-lg ${
              selectedAccountFilter.type === 'bank' && !selectedAccountFilter.bankName
                ? 'ring-4 ring-blue-300 shadow-blue-500/30'
                : 'hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md text-white flex items-center justify-center shadow-xs border border-white/20">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-100 block">
                    Total Bank Deposits
                  </span>
                  <span className="text-xs font-bold text-white">All Banks Consolidated</span>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                {banks.length} Banks Active
              </span>
            </div>

            <div className="mt-3">
              <span className="text-[10px] text-blue-100 uppercase font-semibold block">Total Live Bank Balance</span>
              <p className="text-xl sm:text-2xl font-black font-mono text-white mt-0.5 tracking-tight">
                {formatCurrency(totalBank?.currentBalance ?? totalSummary?.totalBankBalance ?? 0)}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/20 grid grid-cols-3 gap-1 text-[10px] font-mono">
              <div>
                <span className="text-blue-100 block text-[9px] uppercase">Opening</span>
                <span className="font-bold text-white">{formatCurrency(totalBank?.openingBalance ?? totalSummary?.totalBankOpening ?? 0)}</span>
              </div>
              <div>
                <span className="text-blue-100 block text-[9px] uppercase">In (Cr) Total Deposited</span>
                <span className="font-bold text-emerald-300">+{formatCurrency(totalBank?.totalCredits ?? totalSummary?.totalBankDeposits ?? 0)}</span>
              </div>
              <div>
                <span className="text-blue-100 block text-[9px] uppercase">Out (Dr) Total Paid</span>
                <span className="font-bold text-rose-200">-{formatCurrency(totalBank?.totalDebits ?? 0)}</span>
              </div>
            </div>
          </div>

          {/* CARD 2: CASH COUNTER (CASH IN HAND) */}
          <div
            onClick={() => setSelectedAccountFilter({ type: 'cash', bankName: '' })}
            className={`p-4 rounded-xl border transition cursor-pointer relative bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/30 shadow-2xs hover:shadow-sm ${
              selectedAccountFilter.type === 'cash'
                ? 'ring-2 ring-emerald-500 border-emerald-400'
                : 'border-emerald-200/80 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Cash Register
                  </span>
                  <span className="text-xs font-bold text-slate-900">Cash in Hand</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                Counter
              </span>
            </div>

            <div className="mt-3">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Current Live Balance</span>
              <p className="text-xl sm:text-2xl font-black font-mono text-emerald-700 mt-0.5">
                {formatCurrency(cash?.currentBalance || 0)}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-emerald-100 grid grid-cols-3 gap-1 text-[10px] font-mono">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase">Opening</span>
                <span className="font-bold text-slate-700">{formatCurrency(cash?.openingBalance || 0)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase">In (Cr) Deposited</span>
                <span className="font-bold text-emerald-600">+{formatCurrency(cash?.totalCredits || 0)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase">Out (Dr) Paid</span>
                <span className="font-bold text-rose-600">-{formatCurrency(cash?.totalDebits || 0)}</span>
              </div>
            </div>
          </div>

          {/* CARD 3: TOTAL LIQUID AGENCY BALANCE */}
          <div
            onClick={() => setSelectedAccountFilter({ type: 'all', bankName: '' })}
            className={`p-4 rounded-xl border transition cursor-pointer relative bg-gradient-to-br from-purple-50/90 via-white to-brand-50/30 shadow-2xs hover:shadow-sm ${
              selectedAccountFilter.type === 'all'
                ? 'ring-2 ring-brand-500 border-brand-300'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-xs">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-800 block">
                    Agency Liquidity
                  </span>
                  <span className="text-xs font-bold text-slate-900">Total Liquid Funds</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                Cash + Banks
              </span>
            </div>

            <div className="mt-3">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Consolidated Net Balance</span>
              <p className="text-xl sm:text-2xl font-black font-mono text-brand-700 mt-0.5">
                {formatCurrency(totalSummary?.totalLiquidBalance || 0)}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-purple-100 flex items-center justify-between text-[10px]">
              <span className="text-slate-500">
                Cash: <strong className="font-mono text-emerald-700">{formatCurrency(totalSummary?.totalCashBalance || 0)}</strong>
              </span>
              <span className="text-slate-500">
                Banks: <strong className="font-mono text-blue-700">{formatCurrency(totalSummary?.totalBankBalance || 0)}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK BANK & ACCOUNT FILTER BUTTONS / CHIPS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 pr-1 flex items-center gap-1">
          <Filter className="w-3 h-3 text-slate-400" /> Filter by:
        </span>
        <button
          onClick={() => setSelectedAccountFilter({ type: 'all', bankName: '' })}
          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition shrink-0 ${
            selectedAccountFilter.type === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Accounts
        </button>
        <button
          onClick={() => setSelectedAccountFilter({ type: 'cash', bankName: '' })}
          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition shrink-0 flex items-center gap-1 ${
            selectedAccountFilter.type === 'cash'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
              : 'bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <Banknote className="w-3 h-3" /> Cash Counter ({formatCurrency(cash?.currentBalance || 0)})
        </button>
        <button
          onClick={() => setSelectedAccountFilter({ type: 'bank', bankName: '' })}
          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition shrink-0 flex items-center gap-1 ${
            selectedAccountFilter.type === 'bank'
              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
              : 'bg-blue-50/70 text-blue-800 border-blue-200 hover:bg-blue-100'
          }`}
        >
          <Building2 className="w-3 h-3" /> Bank / Online Deposits ({formatCurrency(totalBank?.currentBalance ?? totalSummary?.totalBankBalance ?? 0)})
        </button>
      </div>

      {/* FILTER BAR & SEARCH */}
      <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs w-full min-w-0">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-2 sm:gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search reference, description, bank, UPI app, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-[11px] sm:text-xs border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <select
              value={selectedAccountFilter.type}
              onChange={(e) => setSelectedAccountFilter({ type: e.target.value, bankName: '' })}
              className="px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs border border-slate-200 rounded-lg sm:rounded-xl bg-white focus:outline-none font-semibold text-slate-700"
            >
              <option value="all">All Accounts (Cash + Bank)</option>
              <option value="cash">💵 Cash Counter</option>
              <option value="bank">🏦 Bank / Online Deposits</option>
            </select>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs border border-slate-200 rounded-lg sm:rounded-xl bg-white focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="booking">Booking (Dr)</option>
              <option value="customer_payment">Payment (Cr)</option>
              <option value="expense">Expense (Dr)</option>
              <option value="refund">Refund</option>
              <option value="adjustment">Adjustment</option>
              <option value="commission">Commission</option>
              <option value="other_income">Other Income</option>
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 text-[10px] sm:text-xs border border-slate-200 rounded-lg bg-white"
            />
            <span className="text-slate-400 text-[10px] sm:text-xs">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 text-[10px] sm:text-xs border border-slate-200 rounded-lg bg-white"
            />

            <button
              type="submit"
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] sm:text-xs font-semibold rounded-lg sm:rounded-xl transition shadow-xs"
            >
              Filter
            </button>
            {(search || type || startDate || endDate || selectedAccountFilter.type !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setType('');
                  setStartDate('');
                  setEndDate('');
                  setSelectedAccountFilter({ type: 'all', bankName: '' });
                }}
                className="px-2 py-1 text-[10px] sm:text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* TRANSACTIONS DATA TABLE */}
      <DataTable
        columns={columns}
        data={transactions}
        loading={loading}
        pagination={pagination}
        onPageChange={(newPage) => setPagination((prev) => ({ ...prev, page: newPage }))}
        emptyMessage="No financial ledger entries found matching current criteria."
      />

      {/* RECORD TRANSACTION MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Financial Transaction Entry"
      >
        <form onSubmit={handleCreateTransaction} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transaction Date *</label>
              <input
                type="date"
                required
                value={txnForm.transactionDate}
                onChange={(e) => setTxnForm({ ...txnForm, transactionDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transaction Type *</label>
              <select
                value={txnForm.type}
                onChange={(e) => setTxnForm({ ...txnForm, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="adjustment">General Adjustment</option>
                <option value="customer_payment">Customer Payment</option>
                <option value="expense">Operational Expense</option>
                <option value="other_income">Other Income / Inflow</option>
                <option value="refund">Customer Refund</option>
                <option value="commission">Commission Earned</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description / Narration *</label>
            <input
              type="text"
              required
              placeholder="e.g. Bank interest credit / Cash register top-up"
              value={txnForm.description}
              onChange={(e) => setTxnForm({ ...txnForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Account Destination */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-[11px] font-bold text-slate-800">Target Account / Destination</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTxnForm({ ...txnForm, accountType: 'cash', paymentMethod: 'cash', bankId: '', bankName: '' })}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition ${
                  txnForm.accountType === 'cash'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-1 ring-emerald-400/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Cash Counter
              </button>
              <button
                type="button"
                onClick={() => setTxnForm({
                  ...txnForm,
                  accountType: 'bank',
                  paymentMethod: 'upi',
                  bankId: banks.length > 0 ? banks[0].id : '',
                  bankName: banks.length > 0 ? banks[0].bankName : ''
                })}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition ${
                  txnForm.accountType === 'bank'
                    ? 'bg-blue-50 border-blue-300 text-blue-700 ring-1 ring-blue-400/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-blue-600" /> Bank Account
              </button>
            </div>

            {txnForm.accountType === 'bank' && (
              <div className="pt-1">
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Payment Method / App</label>
                <select
                  value={txnForm.paymentMethod}
                  onChange={(e) => setTxnForm({ ...txnForm, paymentMethod: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                >
                  <option value="upi">UPI / Online App</option>
                  <option value="bank_transfer">Net Banking / NEFT</option>
                  <option value="card">Debit / Credit Card</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-rose-600 mb-1">Debit Amount (Outflow) (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={txnForm.debit}
                onChange={(e) => setTxnForm({ ...txnForm, debit: e.target.value, credit: 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono font-bold text-rose-700"
              />
            </div>
            <div>
              <label className="block font-semibold text-emerald-600 mb-1">Credit Amount (Inflow) (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={txnForm.credit}
                onChange={(e) => setTxnForm({ ...txnForm, credit: e.target.value, debit: 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-emerald-700"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : 'Post Entry'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteTxnId)}
        title="Delete Transaction Entry"
        message="Are you sure you want to delete this financial transaction? This action directly impacts your ledger balances."
        confirmText="Yes, Delete Entry"
        type="danger"
        loading={actionLoading}
        onConfirm={handleDeleteTransaction}
        onCancel={() => setDeleteTxnId(null)}
      />
    </div>
  );
};
