import React, { useState, useEffect } from 'react';
import {
  WalletCards,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  PieChart as PieIcon,
  DollarSign
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';

const EXPENSE_CATEGORIES = [
  'Office Rent',
  'Salary',
  'Electricity',
  'Internet',
  'Telephone',
  'Marketing',
  'Transport',
  'Software',
  'Maintenance',
  'Travel',
  'Miscellaneous'
];

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#64748b'
];

export const ExpensesPage = () => {
  const { success, error: toastError } = useToast();

  const [expenses, setExpenses] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [expenseForm, setExpenseForm] = useState({
    expenseDate: new Date().toISOString().split('T')[0],
    category: 'Office Rent',
    description: '',
    amount: '',
    paymentMethod: 'bank_transfer',
    paidTo: '',
    reference: '',
    notes: ''
  });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      let query = `page=${pagination.page}&limit=${pagination.limit}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (category) query += `&category=${encodeURIComponent(category)}`;
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;

      const [listRes, summaryRes] = await Promise.all([
        api.get(`/expenses?${query}`),
        api.get(`/expenses/summary?startDate=${startDate}&endDate=${endDate}`)
      ]);

      if (listRes.data.success) {
        setExpenses(listRes.data.expenses || []);
        setTotalAmount(listRes.data.totalAmount || 0);
        setPagination(listRes.data.pagination);
      }

      if (summaryRes.data.success) {
        setSummary(summaryRes.data);
      }
    } catch (e) {
      console.error('Failed to load expenses:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [pagination.page, pagination.limit, category, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchExpenses();
  };

  const handleOpenCreate = () => {
    setEditingExpense(null);
    setExpenseForm({
      expenseDate: new Date().toISOString().split('T')[0],
      category: 'Office Rent',
      description: '',
      amount: '',
      paymentMethod: 'bank_transfer',
      paidTo: '',
      reference: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp) => {
    setEditingExpense(exp);
    setExpenseForm({
      expenseDate: exp.expenseDate,
      category: exp.category,
      description: exp.description,
      amount: exp.amount,
      paymentMethod: exp.paymentMethod,
      paidTo: exp.paidTo,
      reference: exp.reference || '',
      notes: exp.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.category || !expenseForm.description || !expenseForm.amount || !expenseForm.paidTo) {
      return toastError('Please fill in all mandatory expense details.');
    }

    setActionLoading(true);
    try {
      if (editingExpense) {
        const res = await api.put(`/expenses/${editingExpense.id}`, expenseForm);
        if (res.data.success) {
          success('Expense updated successfully.');
          setIsModalOpen(false);
          fetchExpenses();
        }
      } else {
        const res = await api.post('/expenses', expenseForm);
        if (res.data.success) {
          success('Expense posted successfully.');
          setIsModalOpen(false);
          fetchExpenses();
        }
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!deleteExpenseId) return;
    setActionLoading(true);
    try {
      const res = await api.delete(`/expenses/${deleteExpenseId}`);
      if (res.data.success) {
        success('Expense deleted successfully.');
        setDeleteExpenseId(null);
        fetchExpenses();
      }
    } catch (err) {
      toastError('Failed to delete expense.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (val) => `₹${parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const columns = [
    {
      header: 'Date',
      accessor: 'expenseDate',
      render: (row) => <span className="font-mono text-xs text-slate-800 font-semibold">{formatDate(row.expenseDate)}</span>
    },
    {
      header: 'Category',
      render: (row) => (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
          {row.category}
        </span>
      )
    },
    {
      header: 'Description & Recipient',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 leading-tight">{row.description}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Paid to: <strong className="text-slate-700">{row.paidTo}</strong>
            {row.reference && <span className="font-mono ml-2">({row.reference})</span>}
          </p>
        </div>
      )
    },
    {
      header: 'Amount',
      className: 'text-right',
      cellClassName: 'text-right font-mono font-black text-rose-600 text-sm',
      render: (row) => formatCurrency(row.amount)
    },
    {
      header: 'Payment Method',
      render: (row) => (
        <span className="font-mono text-[11px] text-slate-600 uppercase">
          {row.paymentMethod?.replace('_', ' ')}
        </span>
      )
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg transition"
            title="Edit Expense"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteExpenseId(row.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
            title="Delete Expense"
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
        title="Agency Expenses"
        subtitle="Track overhead, salaries, marketing, terminal subscriptions and office expenditures"
        icon={WalletCards}
        actions={
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] sm:text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 transition"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Log Expense
          </button>
        }
      />

      {/* Expense Summary & Category Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 w-full min-w-0">
        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400">Total Filtered Expenses</p>
            <h2 className="text-xl sm:text-3xl font-black font-mono text-rose-600 mt-1 sm:mt-2">{formatCurrency(totalAmount)}</h2>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">Deducted from agency gross profit</p>
          </div>

          <div className="pt-3 sm:pt-4 border-t border-slate-100 mt-3 sm:mt-4 space-y-1 text-[10px] sm:text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Top Category:</span>
              <span className="font-bold text-slate-900">{summary?.breakdown?.[0]?.category || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Entries:</span>
              <span className="font-bold font-mono text-slate-900">{pagination.total}</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="lg:col-span-2 bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-0.5 sm:mb-1">Expense Breakdown by Category</h3>
          <p className="text-[10px] sm:text-xs text-slate-500 mb-2 sm:mb-3">Distribution of operational spending</p>

          <div className="h-36 sm:h-44 w-full min-w-0">
            {summary?.breakdown && summary.breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.breakdown.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    formatter={(val) => formatCurrency(val)}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '10px' }}
                  />
                  <Bar dataKey="amount" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[10px] sm:text-xs text-slate-400">No data</div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs w-full min-w-0">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search description, recipient (paid to)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-[11px] sm:text-xs border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs border border-slate-200 rounded-lg sm:rounded-xl bg-white focus:outline-none"
          >
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
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

      {/* Expenses Table */}
      <DataTable
        columns={columns}
        data={expenses}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
        emptyTitle="No expenses recorded"
        emptyDescription="Log your operational expenses to keep net profit calculations accurate."
        emptyAction={handleOpenCreate}
        emptyActionLabel="Log Expense"
      />

      {/* Create / Edit Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Edit Expense Record' : 'Record New Expense'}
        subtitle="Log operational overheads and expenditures"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleSaveExpense}
              className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : editingExpense ? 'Update Expense' : 'Post Expense'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Expense Date *</label>
              <input
                type="date"
                required
                value={expenseForm.expenseDate}
                onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                required
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Expense Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. Office electricity bill for July or Amadeus GDS access"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Amount (₹) *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="0.00"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Paid To (Beneficiary) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Landlord, BSES, Google"
                value={expenseForm.paidTo}
                onChange={(e) => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={expenseForm.paymentMethod}
                onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="bank_transfer">Bank Transfer / NEFT</option>
                <option value="upi">UPI</option>
                <option value="card">Credit / Debit Card</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Invoice / Receipt Reference</label>
              <input
                type="text"
                placeholder="e.g. BILL-998811"
                value={expenseForm.reference}
                onChange={(e) => setExpenseForm({ ...expenseForm, reference: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              rows="2"
              value={expenseForm.notes}
              onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteExpenseId}
        onClose={() => setDeleteExpenseId(null)}
        onConfirm={handleDeleteExpense}
        title="Delete Expense Record"
        message="Are you sure you want to delete this expense record? This will adjust the net profit calculation."
        type="danger"
        loading={actionLoading}
      />
    </div>
  );
};
