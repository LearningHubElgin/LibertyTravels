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
  Sparkles,
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
  Eye
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

  // Buy Tickets Modal
  const [isBuyTicketsModalOpen, setIsBuyTicketsModalOpen] = useState(false);
  const [buyTicketsForm, setBuyTicketsForm] = useState({
    ticketsCount: '',
    totalPrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    reference: '',
    notes: ''
  });

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

  const handleOpenBuyTickets = () => {
    if (!company) return;
    setBuyTicketsForm({
      ticketsCount: '',
      totalPrice: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      reference: `STOCK-${company.code}-${Date.now().toString().slice(-4)}`,
      notes: ''
    });
    setIsBuyTicketsModalOpen(true);
  };

  const handleSaveBuyTickets = async (e) => {
    e.preventDefault();
    const count = parseInt(buyTicketsForm.ticketsCount, 10);
    const price = parseFloat(buyTicketsForm.totalPrice);

    if (!count || count <= 0) {
      return toastError('Please enter a valid ticket count (greater than 0).');
    }
    if (isNaN(price) || price < 0) {
      return toastError('Please enter a valid total purchase price.');
    }

    setActionLoading(true);
    try {
      const res = await api.post(`/companies/${id}/buy-tickets`, buyTicketsForm);
      if (res.data.success) {
        success(`Successfully added ${count} tickets to ${company.name} stock!`);
        setIsBuyTicketsModalOpen(false);
        fetchCompanyDetails();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to buy tickets.');
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

  // Purchases History
  const purchaseHistory = useMemo(() => {
    return company?.purchases || [];
  }, [company]);

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
        const paxList = row.passengers && row.passengers.length > 0
          ? row.passengers.map((p) => `${p.firstName} ${p.lastName}`).join(', ')
          : row.passengerName || '1 Passenger';
        return (
          <div>
            <span className="font-bold text-slate-900 block">{row.sector}</span>
            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate max-w-xs">
              <Users className="w-3 h-3 text-slate-400 shrink-0" />
              {paxList}
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
      header: 'Total Price (₹)',
      render: (row) => (
        <span className="text-xs font-bold text-slate-900 font-mono">
          {formatCurrency(row.totalAmount)}
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

  // Columns for Batch Ticket Purchases History
  const purchaseColumns = [
    {
      header: 'Purchase Date',
      render: (row) => (
        <span className="font-mono font-semibold text-slate-900 text-xs">
          {formatDate(row.purchaseDate || row.createdAt)}
        </span>
      )
    },
    {
      header: 'Invoice / PO Reference',
      render: (row) => (
        <span className="font-mono font-bold text-brand-700 text-xs">
          {row.reference || '— Direct Top-up —'}
        </span>
      )
    },
    {
      header: 'Tickets Bought',
      render: (row) => (
        <span className="inline-flex items-center gap-1 font-mono font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs">
          <Ticket className="w-3.5 h-3.5" />
          {row.ticketsCount} Tickets
        </span>
      )
    },
    {
      header: 'Total Paid (₹)',
      render: (row) => (
        <span className="font-mono font-black text-slate-900 text-xs">
          {formatCurrency(row.totalPrice)}
        </span>
      )
    },
    {
      header: 'Unit Rate (₹/tkt)',
      render: (row) => (
        <span className="font-mono font-bold text-amber-600 text-xs">
          ₹{row.unitPrice || (row.ticketsCount > 0 ? (row.totalPrice / row.ticketsCount).toFixed(2) : '0.00')} / tkt
        </span>
      )
    },
    {
      header: 'Notes / Description',
      render: (row) => (
        <span className="text-slate-600 text-xs truncate max-w-sm block">
          {row.notes || '—'}
        </span>
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

  const stockPercentage =
    company.totalPurchasedTickets > 0
      ? Math.min(100, Math.round(((company.availableTickets ?? 0) / company.totalPurchasedTickets) * 100))
      : 0;

  return (
    <div className="space-y-4 sm:space-y-6 w-full pb-10 min-w-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs">
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
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={handleOpenEdit}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition shadow-xs"
          >
            <Edit className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={handleOpenBuyTickets}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition active:scale-95"
          >
            <Ticket className="w-4 h-4" /> Buy Tickets / Top-up
          </button>
        </div>
      </div>

      {/* 4 Top KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Tickets in Stock */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 border-l-4 border-l-emerald-500 shadow-xs flex flex-col justify-between hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Available Tickets</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
              {(company.availableTickets ?? 0).toLocaleString('en-IN')}
              <span className="text-xs text-slate-400 font-normal ml-1 font-sans">
                / {company.totalPurchasedTickets || 0} Stock
              </span>
            </p>
            {/* Progress indicator */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all"
                style={{ width: `${stockPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Wallet / Deposit */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 border-l-4 border-l-teal-500 shadow-xs flex flex-col justify-between hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Wallet / Deposit</p>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-teal-700 font-mono">
              {formatCurrency(company.walletBalance || 0)}
            </p>
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              Unit Rate: ₹{company.ticketUnitPrice || 0} / tkt
            </p>
          </div>
        </div>

        {/* Card 3: Total Customer Sales */}
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
              {summary?.totalBookings || 0} Bookings ({summary?.totalPassengersCount || 0} Pax)
            </p>
          </div>
        </div>

        {/* Card 4: Pending Tickets & Receivables */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 border-l-4 border-l-rose-500 shadow-xs flex flex-col justify-between hover:shadow-card-hover transition-all">
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
            Customer Bookings & Sold Tickets ({bookings.length})
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
            <Ticket className="w-4 h-4" />
            Stock / Bulk Purchase History ({purchaseHistory.length})
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

        {/* Tab 3: Stock / Batch Purchase History */}
        {activeTab === 'purchases' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Bulk Ticket Quota Purchase Log</h3>
                <p className="text-xs text-slate-500">History of all inventory stock batches bought for {company.name}</p>
              </div>
              <button
                onClick={handleOpenBuyTickets}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" /> Buy More Tickets
              </button>
            </div>

            <DataTable
              columns={purchaseColumns}
              data={purchaseHistory}
              emptyTitle="No batch purchases recorded"
              emptyDescription="Click 'Buy Tickets' to record your first bulk ticket inventory purchase for this company."
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

      {/* Buy Bulk Tickets Modal */}
      <Modal
        isOpen={isBuyTicketsModalOpen}
        onClose={() => setIsBuyTicketsModalOpen(false)}
        title={`Buy Tickets / Top-up Stock - ${company.name}`}
        size="md"
      >
        <form onSubmit={handleSaveBuyTickets} className="space-y-4 text-xs">
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
              <p className="text-[10px] text-slate-400 uppercase font-bold">Current Stock</p>
              <p className="font-mono font-black text-brand-700 text-sm">
                {company.availableTickets ?? 0} Tickets
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Number of Tickets to Buy *</label>
              <div className="relative">
                <Ticket className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 500"
                  value={buyTicketsForm.ticketsCount}
                  onWheel={(e) => e.target.blur()}
                  onChange={(e) => setBuyTicketsForm({ ...buyTicketsForm, ticketsCount: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Purchase Price (₹) *</label>
              <div className="relative">
                <span className="text-slate-400 font-bold absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="e.g. 20000"
                  value={buyTicketsForm.totalPrice}
                  onWheel={(e) => e.target.blur()}
                  onChange={(e) => setBuyTicketsForm({ ...buyTicketsForm, totalPrice: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Live Calculation Preview Card */}
          <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 font-sans">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Approx Rate / Unit Cost:
              </span>
              <span className="font-mono font-black text-amber-400 text-sm">
                ₹{buyTicketsForm.ticketsCount > 0 ? (parseFloat(buyTicketsForm.totalPrice || 0) / parseInt(buyTicketsForm.ticketsCount, 10)).toFixed(2) : '0.00'} / Ticket
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800">
              <span className="font-sans">New Total Ticket Stock:</span>
              <span className="font-mono text-white font-bold">
                {(company.totalPurchasedTickets || 0) + (parseInt(buyTicketsForm.ticketsCount, 10) || 0)} Tickets
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-sans">New Available Quota:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {(company.availableTickets || 0) + (parseInt(buyTicketsForm.ticketsCount, 10) || 0)} Tickets
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-sans">New Deposit / Wallet Balance:</span>
              <span className="font-mono text-teal-300 font-bold">
                ₹{((company.walletBalance || 0) + (parseFloat(buyTicketsForm.totalPrice) || 0)).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Purchase Date</label>
              <input
                type="date"
                required
                value={buyTicketsForm.purchaseDate}
                onChange={(e) => setBuyTicketsForm({ ...buyTicketsForm, purchaseDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Invoice / Reference No</label>
              <input
                type="text"
                placeholder="e.g. INV-IND-500 or PO-2026"
                value={buyTicketsForm.reference}
                onChange={(e) => setBuyTicketsForm({ ...buyTicketsForm, reference: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl uppercase font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes / Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 500 Promo tickets bought on special corporate quota"
              value={buyTicketsForm.notes}
              onChange={(e) => setBuyTicketsForm({ ...buyTicketsForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsBuyTicketsModalOpen(false)}
              className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition disabled:opacity-50 active:scale-95"
            >
              <Ticket className="w-4 h-4" />
              {actionLoading ? 'Processing...' : 'Confirm & Add Tickets'}
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
    </div>
  );
};
