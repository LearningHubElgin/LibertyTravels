import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Ticket,
  Wallet,
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  Phone,
  Mail,
  Globe2,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Gift,
  Sparkles,
  RotateCcw,
  Filter,
  ChevronRight,
  Hash,
  DollarSign,
  Layers,
  ArrowUpRight,
  Plane,
  Train,
  Bus,
  Hotel,
  Car,
  Eye,
  ArrowDownUp,
  ArrowUpDown
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/formatters';

export const CompanyDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [company, setCompany] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings', 'pending', 'purchases', 'info'

  // Filter & Search inside bookings
  const [bookingSearch, setBookingSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Deposit Funds Modal
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositForm, setDepositForm] = useState({
    amount: '',
    reference: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    time: ''
  });

  // Reward Modal
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [rewardForm, setRewardForm] = useState({
    amount: '',
    reference: '',
    notes: 'Received reward/cashback',
    date: new Date().toISOString().split('T')[0],
    time: ''
  });

  // Manual Transaction (Refund / Deduction) Modal
  const [isManualTxModalOpen, setIsManualTxModalOpen] = useState(false);
  const [manualTxForm, setManualTxForm] = useState({
    type: 'deduction', // 'deduction' or 'refund'
    amount: '',
    reference: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    time: ''
  });

  // Edit Transaction Modal
  const [isEditTxModalOpen, setIsEditTxModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [editTxForm, setEditTxForm] = useState({
    type: 'deposit',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    reference: '',
    notes: ''
  });
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [ledgerSortOrder, setLedgerSortOrder] = useState('desc'); // 'desc' = Newest First (3, 2, 1...), 'asc' = Oldest First (1, 2, 3...)

  // Edit Company Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCompanyForm, setEditCompanyForm] = useState({
    name: '',
    code: '',
    type: 'flight',
    country: 'India',
    contact: '',
    email: '',
    status: 'active'
  });

  const [actionLoading, setActionLoading] = useState(false);

  const fetchCompanyDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/companies/${id}`);
      if (res.data.success) {
        setCompany(res.data.company);
        setBookings(res.data.bookings || []);
        setSummary(res.data.summary || {});
      }
    } catch (err) {
      console.error('Failed to load company details:', err);
      toastError(err.response?.data?.message || 'Could not load company details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCompanyDetails();
    }
  }, [id]);

  const handleOpenDeposit = () => {
    if (!company) return;
    setDepositForm({
      amount: '',
      reference: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
      time: ''
    });
    setIsDepositModalOpen(true);
  };

  const handleSaveDeposit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(depositForm.amount);

    if (isNaN(amount) || amount <= 0) {
      return toastError('Please enter a valid deposit amount (greater than 0).');
    }

    setActionLoading(true);
    try {
      const res = await api.post(`/companies/${id}/deposit`, depositForm);
      if (res.data.success) {
        success(`Successfully deposited ₹${amount} to ${company.name}'s wallet!`);
        setIsDepositModalOpen(false);
        fetchCompanyDetails();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to deposit funds.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReward = () => {
    if (!company) return;
    setRewardForm({
      amount: '',
      reference: '',
      notes: 'Received reward/cashback',
      date: new Date().toISOString().split('T')[0],
      time: ''
    });
    setIsRewardModalOpen(true);
  };

  const handleSaveReward = async (e) => {
    e.preventDefault();
    const amount = parseFloat(rewardForm.amount);

    if (isNaN(amount) || amount <= 0) {
      return toastError('Please enter a valid reward amount (greater than 0).');
    }

    setActionLoading(true);
    try {
      const res = await api.post(`/companies/${id}/reward`, rewardForm);
      if (res.data.success) {
        success(`Successfully received reward of ₹${amount} from ${company.name}!`);
        setIsRewardModalOpen(false);
        fetchCompanyDetails();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to receive reward.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDeduction = () => {
    if (!company) return;
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setManualTxForm({
      type: 'deduction',
      amount: '',
      reference: '',
      notes: '',
      date: now.toISOString().split('T')[0],
      time: currentTime
    });
    setIsManualTxModalOpen(true);
  };

  const handleOpenRefund = () => {
    if (!company) return;
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setManualTxForm({
      type: 'refund',
      amount: '',
      reference: '',
      notes: 'Supplier cancellation refund',
      date: now.toISOString().split('T')[0],
      time: currentTime
    });
    setIsManualTxModalOpen(true);
  };

  const handleSaveManualTx = async (e) => {
    e.preventDefault();
    const amount = parseFloat(manualTxForm.amount);
    if (isNaN(amount) || amount <= 0) {
      return toastError(`Please enter a valid ${manualTxForm.type} amount (greater than 0).`);
    }

    setActionLoading(true);
    try {
      const res = await api.post(`/companies/${id}/manual-transaction`, manualTxForm);
      if (res.data.success) {
        const typeLabel = manualTxForm.type === 'refund' ? 'Refund' : 'Deduction';
        success(`Successfully recorded ${typeLabel} of ₹${amount} for ${company.name}!`);
        setIsManualTxModalOpen(false);
        fetchCompanyDetails();
      }
    } catch (err) {
      toastError(err.response?.data?.message || `Failed to record ${manualTxForm.type}.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = () => {
    if (!company) return;
    setEditCompanyForm({
      name: company.name,
      code: company.code,
      type: company.type || 'flight',
      country: company.country || 'India',
      contact: company.contact || '',
      email: company.email || '',
      status: company.status || 'active'
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editCompanyForm.name || !editCompanyForm.code) {
      return toastError('Company Name and Code are required.');
    }

    setActionLoading(true);
    try {
      const res = await api.put(`/companies/${id}`, editCompanyForm);
      if (res.data.success) {
        success(`Company ${editCompanyForm.name} updated successfully!`);
        setIsEditModalOpen(false);
        fetchCompanyDetails();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update company.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditTransaction = (tx) => {
    setSelectedTx(tx);
    let initialTime = tx.time || '';
    if (!initialTime && tx.createdAt) {
      const d = new Date(tx.createdAt);
      if (!isNaN(d.getTime())) {
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        initialTime = `${hh}:${mm}`;
      }
    }
    setEditTxForm({
      type: tx.type || 'deposit',
      amount: tx.amount || '',
      date: tx.date || (tx.createdAt ? new Date(tx.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      time: initialTime,
      reference: tx.reference || '',
      notes: tx.notes || ''
    });
    setIsEditTxModalOpen(true);
  };

  const handleSaveEditTransaction = async (e) => {
    e.preventDefault();
    if (!selectedTx) return;

    const amount = parseFloat(editTxForm.amount);
    if (isNaN(amount) || amount <= 0) {
      return toastError('Please enter a valid amount (greater than 0).');
    }

    setActionLoading(true);
    try {
      const txId = selectedTx._id || selectedTx.id;
      const res = await api.put(`/companies/${id}/transactions/${txId}`, editTxForm);
      if (res.data.success) {
        success('Wallet transaction updated successfully!');
        setIsEditTxModalOpen(false);
        fetchCompanyDetails();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update transaction.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    setActionLoading(true);
    try {
      const txId = transactionToDelete._id || transactionToDelete.id;
      const res = await api.delete(`/companies/${id}/transactions/${txId}`);
      if (res.data.success) {
        success('Wallet transaction deleted successfully!');
        setTransactionToDelete(null);
        fetchCompanyDetails();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to delete transaction.');
    } finally {
      setActionLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'flight':
        return <Plane className="w-3.5 h-3.5 text-sky-600" />;
      case 'train':
        return <Train className="w-3.5 h-3.5 text-emerald-600" />;
      case 'bus':
        return <Bus className="w-3.5 h-3.5 text-amber-600" />;
      case 'hotel':
        return <Hotel className="w-3.5 h-3.5 text-purple-600" />;
      case 'car':
        return <Car className="w-3.5 h-3.5 text-indigo-600" />;
      default:
        return <Building2 className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  // Filtered Customer Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Status filter
      if (statusFilter !== 'all' && b.status !== statusFilter) {
        return false;
      }
      // Search query
      if (bookingSearch.trim()) {
        const q = bookingSearch.toLowerCase();
        const refMatch = b.referenceNo?.toLowerCase().includes(q);
        const pnrMatch = b.pnr?.toLowerCase().includes(q);
        const sectorMatch = b.sector?.toLowerCase().includes(q);
        const custNameMatch = b.customer?.name?.toLowerCase().includes(q);
        const custPhoneMatch = b.customer?.phone?.includes(q);
        const paxMatch = (b.passengers || []).some((p) =>
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
        );
        return refMatch || pnrMatch || sectorMatch || custNameMatch || custPhoneMatch || paxMatch;
      }
      return true;
    });
  }, [bookings, statusFilter, bookingSearch]);

  // Specifically Pending Bookings
  const pendingBookings = useMemo(() => {
    return bookings.filter(
      (b) => b.status === 'pending' || parseFloat(b.balanceDue || 0) > 0
    );
  }, [bookings]);

  // Ledger Transactions
  const ledgerTransactions = useMemo(() => {
    const rawList = company?.transactions || [];

    const getTxTime = (t) => {
      if (!t) return 0;
      if (t.date) {
        const rawDate = String(t.date).trim();
        let dateStr = rawDate;
        if (rawDate.includes('/')) {
          const parts = rawDate.split('/');
          if (parts.length === 3 && parts[2].length === 4) {
            dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        } else if (rawDate.includes('T')) {
          dateStr = rawDate.split('T')[0];
        }

        let timeStr = '00:00:00';
        if (t.time && String(t.time).trim()) {
          const parts = String(t.time).trim().split(':');
          if (parts.length === 2) {
            timeStr = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
          } else if (parts.length >= 3) {
            timeStr = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].slice(0, 2).padStart(2, '0')}`;
          }
        }

        const isoStr = `${dateStr}T${timeStr}`;
        const ms = new Date(isoStr).getTime();
        if (!isNaN(ms) && ms > 0) return ms;

        const fallbackMs = new Date(rawDate).getTime();
        if (!isNaN(fallbackMs) && fallbackMs > 0) return fallbackMs;
      }

      if (t.createdAt) {
        const ms = new Date(t.createdAt).getTime();
        if (!isNaN(ms) && ms > 0) return ms;
      }
      return 0;
    };

    // 1. Sort chronologically date-wise (oldest to newest) to assign permanent serial numbers #1, #2, #3...
    const chronologicalList = [...rawList].sort((a, b) => {
      const timeA = getTxTime(a);
      const timeB = getTxTime(b);
      if (timeA !== timeB) return timeA - timeB;
      const typeRank = { deposit: 1, reward: 2, refund: 2.5, deduction: 3 };
      const rankA = typeRank[a.type] || 4;
      const rankB = typeRank[b.type] || 4;
      if (rankA !== rankB) return rankA - rankB;
      const cA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const cB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return cA - cB;
    });

    let running = 0;
    const computedList = chronologicalList.map((tx, index) => {
      const effect = tx.type === 'deduction' ? -parseFloat(tx.amount || 0) : parseFloat(tx.amount || 0);
      const balBefore = running;
      running = Math.round((running + effect) * 100) / 100;
      return {
        ...tx,
        balanceBefore: balBefore,
        balanceAfter: running,
        serialNo: index + 1
      };
    });

    // 2. Sort according to ledgerSortOrder (desc: 3, 2, 1... or asc: 1, 2, 3...)
    if (ledgerSortOrder === 'desc') {
      return [...computedList].reverse();
    }

    return computedList;
  }, [company?.transactions, ledgerSortOrder]);

  // Total amount deducted from company's wallet across all bookings/transactions
  const totalDeducted = useMemo(() => {
    if (summary?.totalDeductions !== undefined && summary?.totalDeductions > 0) {
      return summary.totalDeductions;
    }
    const txDeductions = (company?.transactions || [])
      .filter((t) => t.type === 'deduction')
      .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
    if (txDeductions > 0) return txDeductions;
    return bookings.reduce((acc, b) => acc + parseFloat(b.costPrice || 0), 0);
  }, [summary, company?.transactions, bookings]);

  // Columns for Customer Bookings Table
  const bookingColumns = [
    {
      header: 'Ref / PNR No',
      render: (row) => (
        <div>
          <Link
            to={`/bookings/${row.id || row._id}`}
            className="font-mono font-bold text-brand-700 hover:underline flex items-center gap-1"
          >
            {row.referenceNo}
            <ArrowUpRight className="w-3 h-3 text-brand-400" />
          </Link>
          {row.pnr && (
            <span className="text-[10px] font-mono text-slate-500 block">
              PNR: {row.pnr}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Customer Details',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-xs sm:text-sm">
            {row.customer ? row.customer.name : 'Walk-in Customer'}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
            {row.customer?.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-2.5 h-2.5 text-slate-400" />
                {row.customer.phone}
              </span>
            )}
            {row.customer?.customerCode && (
              <span className="bg-slate-100 px-1 py-0.2 rounded text-[10px] text-slate-600 font-bold">
                {row.customer.customerCode}
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Passenger & Sector',
      render: (row) => {
        const totalPax = row.passengerCount || (row.passengers ? row.passengers.length : 1);
        const extraPax = Math.max(0, totalPax - 1);
        let leadPax = '';
        if (row.passengers && row.passengers.length > 0) {
          const p1 = row.passengers[0];
          leadPax = `${p1.title ? p1.title + ' ' : ''}${p1.firstName || ''} ${p1.lastName || ''}`.trim();
        }
        if (!leadPax) {
          leadPax = row.passengerName || 'Passenger';
        }
        const paxSummary = extraPax > 0 ? `${leadPax} +${extraPax}` : leadPax;

        return (
          <div>
            <span className="font-bold text-slate-900 block">{row.sector}</span>
            <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1 mt-0.5 truncate max-w-xs">
              <Users className="w-3 h-3 text-slate-400 shrink-0" />
              {paxSummary}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Booking / Journey Date',
      render: (row) => (
        <div className="text-xs">
          <p className="text-slate-900 font-medium">{formatDate(row.journeyDate || row.bookingDate)}</p>
          <span className="text-[10px] text-slate-400 block font-mono">
            Booked: {formatDate(row.bookingDate)}
          </span>
        </div>
      )
    },
    {
      header: 'Sell Price (₹)',
      render: (row) => (
        <span className="text-xs font-bold text-slate-900 font-mono">
          {formatCurrency(row.totalAmount)}
        </span>
      )
    },
    {
      header: 'Wallet Deducted (₹)',
      render: (row) => (
        <span className="text-xs font-bold text-rose-600 font-mono">
          {formatCurrency(row.costPrice || 0)}
        </span>
      )
    },
    {
      header: 'Paid / Balance',
      render: (row) => {
        const bal = parseFloat(row.balanceDue || 0);
        return (
          <div className="text-xs font-mono">
            <p className="text-emerald-600 font-semibold">{formatCurrency(row.amountReceived)}</p>
            {bal > 0 ? (
              <p className="text-[10px] text-rose-600 font-bold">Due: {formatCurrency(bal)}</p>
            ) : (
              <p className="text-[10px] text-slate-400">Paid in Full</p>
            )}
          </div>
        );
      }
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status || 'confirmed'} />
    },
    {
      header: 'Action',
      align: 'right',
      render: (row) => (
        <Link
          to={`/bookings/${row.id || row._id}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-brand-700 bg-slate-100 hover:bg-brand-50 rounded-lg text-xs font-semibold transition"
        >
          <Eye className="w-3.5 h-3.5" /> View
        </Link>
      )
    }
  ];

  // Columns for Ledger Transactions
  const ledgerColumns = [
    {
      header: 'SL NO',
      render: (row) => (
        <span className="font-mono font-bold text-slate-500 text-xs">
          #{row.serialNo}
        </span>
      ),
      className: 'w-16 text-center',
      cellClassName: 'text-center'
    },
    {
      header: 'Date & Time',
      render: (row) => {
        let timeStr = '';
        if (row.time && String(row.time).trim()) {
          const trimmed = String(row.time).trim();
          if (trimmed.includes('AM') || trimmed.includes('PM') || trimmed.includes('am') || trimmed.includes('pm')) {
            timeStr = trimmed;
          } else {
            const parts = trimmed.split(':');
            if (parts.length >= 2) {
              const h = parseInt(parts[0], 10);
              const m = parts[1].slice(0, 2);
              if (!isNaN(h)) {
                const ampm = h >= 12 ? 'PM' : 'AM';
                const hour12 = h % 12 || 12;
                timeStr = `${String(hour12).padStart(2, '0')}:${m} ${ampm}`;
              }
            }
          }
        }
        if (!timeStr && row.createdAt) {
          const d = new Date(row.createdAt);
          if (!isNaN(d.getTime())) {
            timeStr = d.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });
          }
        }

        return (
          <div className="font-mono text-xs flex flex-col justify-center">
            <span className="font-bold text-slate-900">
              {formatDate(row.date || row.createdAt)}
            </span>
            {timeStr ? (
              <span className="text-[11px] text-slate-500 font-semibold mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                {timeStr}
              </span>
            ) : null}
          </div>
        );
      }
    },
    {
      header: 'Transaction Type',
      render: (row) => {
        const isDeposit = row.type === 'deposit';
        const isReward = row.type === 'reward';
        const isRefund = row.type === 'refund' || (row.reference && row.reference.toUpperCase().startsWith('REFUND')) || (row.notes && row.notes.toLowerCase().includes('refund'));

        let badgeClass = 'bg-rose-50 text-rose-700 border border-rose-200';
        let Icon = TrendingDown;
        let label = row.type || 'deduction';

        if (isRefund) {
          badgeClass = 'bg-amber-50 text-amber-700 border border-amber-300 shadow-xs';
          Icon = RotateCcw;
          label = 'refund';
        } else if (isDeposit) {
          badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
          Icon = TrendingUp;
        } else if (isReward) {
          badgeClass = 'bg-purple-50 text-purple-700 border border-purple-200';
          Icon = Sparkles;
        }

        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${badgeClass}`}>
            <Icon className="w-3 h-3" />
            {label}
          </span>
        );
      }
    },
    {
      header: 'Amount (₹)',
      render: (row) => {
        const isRefund = row.type === 'refund' || (row.reference && row.reference.toUpperCase().startsWith('REFUND')) || (row.notes && row.notes.toLowerCase().includes('refund'));
        const isCredit = row.type === 'deposit' || row.type === 'reward' || isRefund;
        const textColor = isRefund
          ? 'text-amber-600'
          : row.type === 'reward'
            ? 'text-purple-600'
            : row.type === 'deposit'
              ? 'text-emerald-600'
              : 'text-rose-600';

        return (
          <span className={`font-mono font-black text-xs ${textColor}`}>
            {isCredit ? '+' : '-'}{formatCurrency(Math.abs(row.amount || 0))}
          </span>
        );
      }
    },
    {
      header: 'Balance After',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {formatCurrency(row.balanceAfter)}
        </span>
      )
    },
    {
      header: 'Reference',
      render: (row) => {
        const isRefund = row.type === 'refund' || (row.reference && row.reference.toUpperCase().startsWith('REFUND'));
        return (
          <span className={`font-mono font-bold text-xs ${isRefund ? 'text-amber-700 font-extrabold' : 'text-brand-700'}`}>
            {row.reference || '—'}
          </span>
        );
      }
    },
    {
      header: 'Notes',
      render: (row) => (
        <span className="text-slate-600 text-xs truncate max-w-sm block">
          {row.notes || '—'}
        </span>
      )
    },
    {
      header: 'Action',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleOpenEditTransaction(row)}
            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
            title="Edit Transaction"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTransactionToDelete(row)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Delete Transaction"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading company profile & ticket history..." />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="py-20 text-center space-y-4">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-base font-bold text-slate-700">Company Not Found</h3>
        <Link
          to="/companies"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white font-bold rounded-xl text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Companies
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full pb-10 min-w-0">
      {/* Top Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <Link
            to="/companies"
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition shrink-0"
            title="Back to Companies"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-12 h-12 rounded-xl bg-brand-600 text-white font-black text-sm flex items-center justify-center font-mono uppercase shadow-md shadow-brand-600/20 shrink-0">
            {company.code?.slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900">{company.name}</h1>
              <span className="font-mono text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                {company.code}
              </span>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 capitalize">
                {getTypeIcon(company.type)}
                <span>{company.type} Provider</span>
              </div>
              <StatusBadge status={company.status || 'active'} />
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
              {company.contact && (
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-slate-400" /> {company.contact}
                </span>
              )}
              {company.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" /> {company.email}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Globe2 className="w-3 h-3 text-slate-400" /> {company.country || 'India'}
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full xl:w-auto pt-3 xl:pt-0 border-t border-slate-100 xl:border-0 grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2">
          <button
            type="button"
            onClick={handleOpenEdit}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-[11px] min-[380px]:text-xs font-bold rounded-xl transition shadow-2xs active:scale-[0.98]"
          >
            <Edit className="w-3.5 h-3.5 shrink-0 text-slate-500" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={handleOpenReward}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-[11px] min-[380px]:text-xs font-bold rounded-xl shadow-sm shadow-purple-600/20 transition active:scale-[0.98]"
            title="Receive reward / cashback from supplier"
          >
            <Gift className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Receive Reward</span>
          </button>
          <button
            type="button"
            onClick={handleOpenRefund}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-[11px] min-[380px]:text-xs font-bold rounded-xl shadow-sm shadow-amber-500/20 transition active:scale-[0.98]"
            title="Record refund from supplier"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Record Refund</span>
          </button>
          <button
            type="button"
            onClick={handleOpenDeduction}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-[11px] min-[380px]:text-xs font-bold rounded-xl shadow-sm shadow-rose-600/20 transition active:scale-[0.98]"
            title="Deduct funds / adjustment"
          >
            <TrendingDown className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Deduct Funds</span>
          </button>
          <button
            type="button"
            onClick={handleOpenDeposit}
            className="col-span-2 sm:col-span-1 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/25 transition active:scale-[0.98]"
            title="Deposit funds into company wallet"
          >
            <Wallet className="w-4 h-4 shrink-0" />
            <span>Deposit Funds</span>
          </button>
        </div>
      </div>

      {/* 5 Top KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Total Bookings & Tickets */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 border-l-4 border-l-emerald-500 shadow-xs flex flex-col justify-between hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Total Bookings & Tickets</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-2 divide-x divide-slate-100">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
                  {(summary?.totalBookings || bookings.length || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {(summary?.totalBookings || bookings.length || 0) === 1 ? 'Booking' : 'Bookings'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Total Bookings</p>
            </div>
            <div className="pl-3">
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-blue-600 font-mono">
                  {(summary?.totalPassengersCount || company?.usedTickets || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {(summary?.totalPassengersCount || company?.usedTickets || 0) === 1 ? 'Ticket' : 'Tickets'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Tickets Booked</p>
            </div>
          </div>
        </div>

        {/* Card 2: Wallet / Deposit Float */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 border-l-4 border-l-teal-500 shadow-xs flex flex-col justify-between hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Deposit Float Balance</p>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-teal-700 font-mono">
              {formatCurrency(company.walletBalance || 0)}
            </p>
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              Commission Rate: {company.commissionRate || 0}%
            </p>
          </div>
        </div>

        {/* Card 3: Total Deducted from Company Wallet */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 border-l-4 border-l-rose-500 shadow-xs flex flex-col justify-between hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Total Wallet Deduction</p>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-rose-600 font-mono">
              {formatCurrency(totalDeducted || 0)}
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              Deducted from Float Wallet
            </p>
          </div>
        </div>

        {/* Card 4: Total Customer Sales */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 border-l-4 border-l-brand-600 shadow-xs flex flex-col justify-between hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Total Customer Sales</p>
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-brand-700 font-mono">
              {formatCurrency(summary?.totalRevenue || 0)}
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              {summary?.totalBookings || bookings.length || 0} Bookings ({summary?.totalPassengersCount || company?.usedTickets || 0} Pax)
            </p>
          </div>
        </div>

        {/* Card 5: Pending Tickets & Receivables */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 border-l-4 border-l-amber-500 shadow-xs flex flex-col justify-between hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Pending & Receivables</p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-rose-600 font-mono">
              {formatCurrency(summary?.totalBalanceDue || 0)}
            </p>
            <p className="text-[10px] text-amber-700 font-semibold mt-1">
              {summary?.pendingTicketsCount || 0} Ticket(s) Pending/Due
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 px-4 sm:px-6 pt-3 gap-4 sm:gap-8 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 font-bold text-xs transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'bookings'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Customer Bookings & Tickets ({bookings.length} Bookings • {summary?.totalPassengersCount || company?.usedTickets || bookings.length} Tickets)
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 font-bold text-xs transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'pending'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            Pending Tickets ({pendingBookings.length})
          </button>

          <button
            onClick={() => setActiveTab('purchases')}
            className={`pb-3 font-bold text-xs transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'purchases'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wallet className="w-4 h-4" />
            Wallet Ledger ({ledgerTransactions.length})
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 font-bold text-xs transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'info'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Company Info & Settings
          </button>
        </div>

        {/* Tab 1: Customer Bookings Table */}
        {activeTab === 'bookings' && (
          <div className="p-4 sm:p-6 space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by customer name, phone, passenger, PNR, sector..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-40 px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <DataTable
              columns={bookingColumns}
              data={filteredBookings}
              emptyTitle="No customer bookings found"
              emptyDescription="No tickets or bookings have been issued for this company matching your filter criteria."
            />
          </div>
        )}

        {/* Tab 2: Pending Tickets */}
        {activeTab === 'pending' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Showing <strong>{pendingBookings.length}</strong> tickets / bookings with pending status or balance due.
                </span>
              </div>
            </div>

            <DataTable
              columns={bookingColumns}
              data={pendingBookings}
              emptyTitle="No pending tickets"
              emptyDescription="All bookings and tickets for this company are confirmed and cleared!"
            />
          </div>
        )}

        {/* Tab 3: Ledger Transactions */}
        {activeTab === 'purchases' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <span>Wallet Ledger</span>
                  <span className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-bold border border-brand-200">
                    {ledgerTransactions.length} Record{ledgerTransactions.length === 1 ? '' : 's'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">History of deposits, rewards, and deductions for {company.name}</p>
              </div>

              <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Sort Order toggle */}
                <div className="w-full sm:w-auto grid grid-cols-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setLedgerSortOrder('desc')}
                    className={`py-1.5 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 text-[11px] min-[380px]:text-xs whitespace-nowrap ${
                      ledgerSortOrder === 'desc'
                        ? 'bg-white text-brand-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 active:bg-slate-200/50'
                    }`}
                    title="Newest transactions first (3, 2, 1...)"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 shrink-0" />
                    <span>Newest First</span>
                    <span className="hidden md:inline text-[10px] font-normal opacity-75">(3, 2, 1...)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerSortOrder('asc')}
                    className={`py-1.5 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 text-[11px] min-[380px]:text-xs whitespace-nowrap ${
                      ledgerSortOrder === 'asc'
                        ? 'bg-white text-brand-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 active:bg-slate-200/50'
                    }`}
                    title="Oldest transactions first (1, 2, 3...)"
                  >
                    <ArrowDownUp className="w-3.5 h-3.5 shrink-0" />
                    <span>Oldest First</span>
                    <span className="hidden md:inline text-[10px] font-normal opacity-75">(1, 2, 3...)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleOpenDeposit}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl sm:rounded-lg text-xs shadow-xs transition active:scale-[0.98]"
                  title="Deposit funds into wallet"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>Deposit Funds</span>
                </button>
              </div>
            </div>

            <DataTable
              columns={ledgerColumns}
              data={ledgerTransactions}
              emptyTitle="No transactions recorded"
              emptyDescription="Click 'Deposit Funds' to add money to the company wallet."
            />
          </div>
        )}

        {/* Tab 4: Company Profile & Info */}
        {activeTab === 'info' && (
          <div className="p-4 sm:p-6 max-w-2xl space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="font-semibold text-slate-500">Company Name:</span>
                <span className="font-bold text-slate-900">{company.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="font-semibold text-slate-500">Company Code:</span>
                <span className="font-mono font-bold text-brand-700">{company.code}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="font-semibold text-slate-500">Service Category:</span>
                <span className="capitalize font-bold text-slate-800">{company.type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="font-semibold text-slate-500">Country / Region:</span>
                <span className="font-medium text-slate-800">{company.country || 'India'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="font-semibold text-slate-500">Contact Number:</span>
                <span className="font-mono font-medium text-slate-800">{company.contact || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="font-semibold text-slate-500">Support Email:</span>
                <span className="font-medium text-slate-800">{company.email || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="font-semibold text-slate-500">Account Status:</span>
                <StatusBadge status={company.status || 'active'} />
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-semibold text-slate-500">Registered Date:</span>
                <span className="font-medium text-slate-800">{formatDate(company.createdAt)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deposit Funds Modal */}
      <Modal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        title={`Deposit Funds - ${company.name}`}
        size="md"
      >
        <form onSubmit={handleSaveDeposit} className="space-y-4 text-xs">
          {/* Header info badge */}
          <div className="p-3 bg-brand-50/70 rounded-xl border border-brand-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-brand-600 text-white font-bold flex items-center justify-center font-mono uppercase">
                {company.code?.slice(0, 3)}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{company.name}</h4>
                <p className="text-[10px] text-slate-500 capitalize">{company.type} Provider • {company.country}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Current Balance</p>
              <p className="font-mono font-black text-brand-700 text-sm">
                {formatCurrency(company.walletBalance || 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Deposit Amount (₹) *</label>
              <div className="relative">
                <span className="text-slate-400 font-bold absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  placeholder="e.g. 50000"
                  value={depositForm.amount}
                  onWheel={(e) => e.target.blur()}
                  onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Deposit Date *</label>
              <input
                type="date"
                required
                value={depositForm.date}
                onChange={(e) => setDepositForm({ ...depositForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Deposit Time <span className="text-slate-400 font-normal">(Optional)</span></label>
              <input
                type="time"
                value={depositForm.time}
                onChange={(e) => setDepositForm({ ...depositForm, time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reference No</label>
              <input
                type="text"
                placeholder="e.g. TRF-12345"
                value={depositForm.reference}
                onChange={(e) => setDepositForm({ ...depositForm, reference: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl uppercase font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes / Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Bank transfer for wallet top-up"
              value={depositForm.notes}
              onChange={(e) => setDepositForm({ ...depositForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsDepositModalOpen(false)}
              className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition disabled:opacity-50 active:scale-95"
            >
              <Wallet className="w-4 h-4" />
              {actionLoading ? 'Processing...' : 'Confirm Deposit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Receive Reward Modal */}
      <Modal
        isOpen={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        title={`Receive Reward / Cashback - ${company.name}`}
        size="md"
      >
        <form onSubmit={handleSaveReward} className="space-y-4 text-xs">
          {/* Header info badge */}
          <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center font-mono uppercase">
                {company.code?.slice(0, 3)}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{company.name}</h4>
                <p className="text-[10px] text-slate-500 capitalize">{company.type} Provider • {company.country}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Current Balance</p>
              <p className="font-mono font-black text-purple-700 text-sm">
                {formatCurrency(company.walletBalance || 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reward Amount (₹) *</label>
              <div className="relative">
                <span className="text-slate-400 font-bold absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  placeholder="e.g. 1500"
                  value={rewardForm.amount}
                  onWheel={(e) => e.target.blur()}
                  onChange={(e) => setRewardForm({ ...rewardForm, amount: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={rewardForm.date}
                onChange={(e) => setRewardForm({ ...rewardForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Time <span className="text-slate-400 font-normal">(Optional)</span></label>
              <input
                type="time"
                value={rewardForm.time}
                onChange={(e) => setRewardForm({ ...rewardForm, time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reference No</label>
              <input
                type="text"
                placeholder="e.g. RWD-12345"
                value={rewardForm.reference}
                onChange={(e) => setRewardForm({ ...rewardForm, reference: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl uppercase font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes / Description</label>
            <input
              type="text"
              placeholder="e.g. Festival cashback"
              value={rewardForm.notes}
              onChange={(e) => setRewardForm({ ...rewardForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsRewardModalOpen(false)}
              className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/20 transition disabled:opacity-50 active:scale-95"
            >
              <Gift className="w-4 h-4" />
              {actionLoading ? 'Processing...' : 'Confirm Reward'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manual Refund / Deduction Modal */}
      <Modal
        isOpen={isManualTxModalOpen}
        onClose={() => setIsManualTxModalOpen(false)}
        title={manualTxForm.type === 'refund' ? `Record Manual Refund - ${company.name}` : `Record Manual Deduction - ${company.name}`}
        size="md"
      >
        <form onSubmit={handleSaveManualTx} className="space-y-4 text-xs">
          {/* Header info badge */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            manualTxForm.type === 'refund' 
              ? 'bg-amber-50/70 border-amber-200' 
              : 'bg-rose-50/70 border-rose-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-lg text-white font-bold flex items-center justify-center font-mono uppercase shadow-xs ${
                manualTxForm.type === 'refund' ? 'bg-amber-500' : 'bg-rose-600'
              }`}>
                {manualTxForm.type === 'refund' ? <RotateCcw className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {manualTxForm.type === 'refund' ? 'Refund / Return from Supplier' : 'Manual Cost / Adjustment Deduction'}
                </h4>
                <p className="text-[10px] text-slate-500">
                  {manualTxForm.type === 'refund'
                    ? 'Increases company float wallet balance (+)'
                    : 'Decreases company float wallet balance (-)'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Current Balance</p>
              <p className="font-mono font-black text-slate-800 text-sm">
                {formatCurrency(company.walletBalance || 0)}
              </p>
            </div>
          </div>

          {/* Type Toggle: Deduction vs Refund */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Select Transaction Type *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setManualTxForm({ ...manualTxForm, type: 'deduction' })}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border font-bold text-xs transition ${
                  manualTxForm.type === 'deduction'
                    ? 'bg-rose-50 border-rose-400 text-rose-700 ring-2 ring-rose-400/20 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                <span>Deduction (-)</span>
              </button>
              <button
                type="button"
                onClick={() => setManualTxForm({ ...manualTxForm, type: 'refund' })}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border font-bold text-xs transition ${
                  manualTxForm.type === 'refund'
                    ? 'bg-amber-50 border-amber-400 text-amber-700 ring-2 ring-amber-400/20 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>Refund (+)</span>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {manualTxForm.type === 'refund' ? 'Refund Amount (₹) *' : 'Deduction Amount (₹) *'}
            </label>
            <div className="relative">
              <span className="text-slate-400 font-bold absolute left-3 top-1/2 -translate-y-1/2">₹</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="e.g. 5000"
                value={manualTxForm.amount}
                onWheel={(e) => e.target.blur()}
                onChange={(e) => setManualTxForm({ ...manualTxForm, amount: e.target.value })}
                className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Date, Time (Optional), Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={manualTxForm.date}
                onChange={(e) => setManualTxForm({ ...manualTxForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Time <span className="text-slate-400 font-normal">(Optional)</span></label>
              <input
                type="time"
                value={manualTxForm.time}
                onChange={(e) => setManualTxForm({ ...manualTxForm, time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reference No</label>
              <input
                type="text"
                placeholder={manualTxForm.type === 'refund' ? 'e.g. REF-12345' : 'e.g. DED-12345'}
                value={manualTxForm.reference}
                onChange={(e) => setManualTxForm({ ...manualTxForm, reference: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl uppercase font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes / Reason (Optional)</label>
            <input
              type="text"
              placeholder={manualTxForm.type === 'refund' ? 'e.g. Cancellation refund from airline' : 'e.g. Penalty or manual cost adjustment'}
              value={manualTxForm.notes}
              onChange={(e) => setManualTxForm({ ...manualTxForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsManualTxModalOpen(false)}
              className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className={`inline-flex items-center gap-1.5 px-5 py-2 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 active:scale-95 ${
                manualTxForm.type === 'refund'
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
              }`}
            >
              {manualTxForm.type === 'refund' ? <RotateCcw className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {actionLoading ? 'Recording...' : (manualTxForm.type === 'refund' ? 'Confirm Refund' : 'Confirm Deduction')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Company Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Company Profile - ${company.name}`}
        size="md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={editCompanyForm.name}
                onChange={(e) => setEditCompanyForm({ ...editCompanyForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Code *</label>
              <input
                type="text"
                required
                value={editCompanyForm.code}
                onChange={(e) => setEditCompanyForm({ ...editCompanyForm, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none uppercase font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Service Category *</label>
              <select
                value={editCompanyForm.type}
                onChange={(e) => setEditCompanyForm({ ...editCompanyForm, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="flight">Flight</option>
                <option value="train">Train</option>
                <option value="bus">Bus</option>
                <option value="hotel">Hotel</option>
                <option value="car">Car</option>
                <option value="general">General / Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={editCompanyForm.contact}
                onChange={(e) => setEditCompanyForm({ ...editCompanyForm, contact: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Support Email</label>
              <input
                type="email"
                value={editCompanyForm.email}
                onChange={(e) => setEditCompanyForm({ ...editCompanyForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Country</label>
              <input
                type="text"
                value={editCompanyForm.country}
                onChange={(e) => setEditCompanyForm({ ...editCompanyForm, country: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={editCompanyForm.status}
                onChange={(e) => setEditCompanyForm({ ...editCompanyForm, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : 'Update Company'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal
        isOpen={isEditTxModalOpen}
        onClose={() => setIsEditTxModalOpen(false)}
        title={`Edit Wallet Transaction - ${company.name}`}
        size="md"
      >
        <form onSubmit={handleSaveEditTransaction} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-brand-600 text-white font-bold flex items-center justify-center font-mono uppercase">
                {company.code?.slice(0, 3)}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{company.name}</h4>
                <p className="text-[10px] text-slate-500 capitalize">{company.type} Provider</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Current Balance</p>
              <p className="font-mono font-black text-brand-700 text-sm">
                {formatCurrency(company.walletBalance || 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transaction Type *</label>
              <select
                value={editTxForm.type}
                onChange={(e) => setEditTxForm({ ...editTxForm, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="deposit">Deposit (+)</option>
                <option value="reward">Reward / Cashback (+)</option>
                <option value="refund">Refund (+)</option>
                <option value="deduction">Deduction (-)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Amount (₹) *</label>
              <div className="relative">
                <span className="text-slate-400 font-bold absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={editTxForm.amount}
                  onChange={(e) => setEditTxForm({ ...editTxForm, amount: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={editTxForm.date}
                onChange={(e) => setEditTxForm({ ...editTxForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Time <span className="text-slate-400 font-normal">(Optional)</span></label>
              <input
                type="time"
                value={editTxForm.time}
                onChange={(e) => setEditTxForm({ ...editTxForm, time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reference No</label>
              <input
                type="text"
                value={editTxForm.reference}
                onChange={(e) => setEditTxForm({ ...editTxForm, reference: e.target.value })}
                placeholder="e.g. TRF-12345"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl uppercase font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes / Description</label>
            <input
              type="text"
              value={editTxForm.notes}
              onChange={(e) => setEditTxForm({ ...editTxForm, notes: e.target.value })}
              placeholder="e.g. Adjusted top-up"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsEditTxModalOpen(false)}
              className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md shadow-brand-600/20 transition disabled:opacity-50 active:scale-95"
            >
              <Edit className="w-4 h-4" />
              {actionLoading ? 'Updating...' : 'Update Transaction'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Transaction Dialog */}
      <ConfirmDialog
        isOpen={!!transactionToDelete}
        onClose={() => setTransactionToDelete(null)}
        onConfirm={handleConfirmDeleteTransaction}
        title="Delete Wallet Transaction"
        message={`Are you sure you want to delete this ${transactionToDelete?.type || ''} transaction of ${formatCurrency(transactionToDelete?.amount || 0)}? The wallet balance will be recalculated automatically.`}
        confirmText="Delete Transaction"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
};
