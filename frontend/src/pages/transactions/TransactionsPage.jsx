import React, { useState, useEffect } from 'react';
import {
  ReceiptText,
  Plus,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Trash2,
  Download
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const TransactionsPage = () => {
  const { success, error: toastError } = useToast();

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalDebit: 0, totalCredit: 0, netFlow: 0 });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
    paymentMethod: 'bank_transfer'
  });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = `page=${pagination.page}&limit=${pagination.limit}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (type) query += `&type=${type}`;
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;

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
    fetchTransactions();
  }, [pagination.page, pagination.limit, type, startDate, endDate]);

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
      const res = await api.post('/transactions', txnForm);
      if (res.data.success) {
        success('Transaction added successfully!');
        setIsAddModalOpen(false);
        setTxnForm({
          transactionDate: new Date().toISOString().split('T')[0],
          description: '',
          type: 'adjustment',
          debit: 0,
          credit: 0,
          paymentMethod: 'bank_transfer'
        });
        fetchTransactions();
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
          <p className="font-semibold text-slate-900 leading-tight truncate">{row.description}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {row.customer ? `Customer: ${row.customer.name}` : ''}
            {row.booking ? ` &bull; Ref: ${row.booking.referenceNo}` : ''}
          </p>
        </div>
      )
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
      header: 'Method',
      render: (row) => (
        <span className="font-mono text-[11px] text-slate-600 uppercase">
          {row.paymentMethod || '-'}
        </span>
      )
    },
    {
      header: 'Debit (Dr)',
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
      header: 'Credit (Cr)',
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
          onClick={() => setDeleteTxnId(row.id)}
          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
          title="Delete Transaction"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      <PageHeader
        title="Financial Transactions Ledger"
        subtitle="Complete record of all debits, credits, customer payments, bookings and expense postings"
        icon={ReceiptText}
        actions={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-[10px] sm:text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 transition"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Record Entry
          </button>
        }
      />

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white p-2.5 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 shadow-xs flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 truncate">Total Debits</p>
            <p className="text-xs sm:text-xl font-black font-mono text-rose-600 mt-0.5 sm:mt-1 truncate">{formatCurrency(summary.totalDebit)}</p>
          </div>
          <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-md sm:rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 ml-1">
            <ArrowDownRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white p-2.5 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 shadow-xs flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 truncate">Total Credits</p>
            <p className="text-xs sm:text-xl font-black font-mono text-emerald-600 mt-0.5 sm:mt-1 truncate">{formatCurrency(summary.totalCredit)}</p>
          </div>
          <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-md sm:rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 ml-1">
            <ArrowUpRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-2.5 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 shadow-xs flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 truncate">Net Flow (Cr - Dr)</p>
            <p className={`text-xs sm:text-xl font-black font-mono mt-0.5 sm:mt-1 truncate ${summary.netFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCurrency(summary.netFlow)}
            </p>
          </div>
          <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-md sm:rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0 ml-1">
            <ReceiptText className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs w-full min-w-0">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-2 sm:gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search reference, description, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-[11px] sm:text-xs border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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
            {(search || type || startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setType('');
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

      {/* Transactions Data Table */}
      <DataTable
        columns={columns}
        data={transactions}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
        emptyTitle="No transactions found"
        emptyDescription="There are no transaction records matching your current filter."
      />

      {/* Manual Entry Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Financial Transaction"
        subtitle="Post a manual adjustment, commission, or other income entry"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleCreateTransaction}
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : 'Post Transaction'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateTransaction} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Transaction Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. Incentive received from supplier/partner or account adjustment"
              value={txnForm.description}
              onChange={(e) => setTxnForm({ ...txnForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transaction Date</label>
              <input
                type="date"
                required
                value={txnForm.transactionDate}
                onChange={(e) => setTxnForm({ ...txnForm, transactionDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transaction Type</label>
              <select
                value={txnForm.type}
                onChange={(e) => setTxnForm({ ...txnForm, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="adjustment">Manual Adjustment</option>
                <option value="commission">Commission Revenue</option>
                <option value="other_income">Other Income</option>
                <option value="refund">Refund Posting</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-rose-700 mb-1">Debit Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={txnForm.debit}
                onChange={(e) => setTxnForm({ ...txnForm, debit: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-rose-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-emerald-700 mb-1">Credit Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={txnForm.credit}
                onChange={(e) => setTxnForm({ ...txnForm, credit: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
            <select
              value={txnForm.paymentMethod}
              onChange={(e) => setTxnForm({ ...txnForm, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
            >
              <option value="bank_transfer">Bank Transfer / NEFT</option>
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTxnId}
        onClose={() => setDeleteTxnId(null)}
        onConfirm={handleDeleteTransaction}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction record? This will alter financial audit calculations."
        confirmText="Delete Transaction"
        type="danger"
        loading={actionLoading}
      />
    </div>
  );
};
