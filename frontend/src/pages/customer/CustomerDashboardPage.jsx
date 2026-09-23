import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Plane,
  Calendar,
  CreditCard,
  User,
  LogOut,
  Phone,
  Mail,
  MapPin,
  Search,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Receipt,
  FileText,
  Sparkles,
  Building2,
  RefreshCw,
  X,
  ShieldCheck,
  Wallet,
  Compass,
  Train,
  Bus,
  Hotel,
  Ticket
} from 'lucide-react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

export const CustomerDashboardPage = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [ledger, setLedger] = useState({ ledger: [], closingBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Navigation tabs: 'home' | 'bookings' | 'ledger' | 'profile'
  const [activeTab, setActiveTab] = useState('home');
  
  // Search and filter states
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchData = async () => {
    try {
      const [profileRes, bookingsRes, ledgerRes] = await Promise.all([
        api.get('/customer-portal/profile'),
        api.get('/customer-portal/bookings'),
        api.get('/customer-portal/ledger')
      ]);
      setProfile(profileRes.data.customer);
      setBookings(bookingsRes.data.bookings || []);
      setLedger({ 
        ledger: ledgerRes.data.ledger || [], 
        closingBalance: ledgerRes.data.closingBalance || 0 
      });
    } catch (error) {
      console.error('Error fetching customer portal data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071628] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-sky-500 to-teal-400 flex items-center justify-center shadow-xl shadow-brand-500/20 mb-4 animate-pulse">
          <Plane className="w-7 h-7 text-white" />
        </div>
        <div className="text-white font-bold text-base tracking-wide">Loading Customer Portal...</div>
        <p className="text-slate-400 text-xs mt-1">Retrieving your bookings and ledger</p>
      </div>
    );
  }

  const agency = profile?.agencyId || {};
  const agencyName = agency.name || 'Liberty Tours & Travels';
  const totalBookings = bookings.length;
  const isBalanceDue = ledger.closingBalance > 0;

  // Filter bookings
  const filteredBookings = bookings.filter(b => {
    const matchSearch = 
      (b.sector && b.sector.toLowerCase().includes(bookingSearch.toLowerCase())) ||
      (b.referenceNo && b.referenceNo.toLowerCase().includes(bookingSearch.toLowerCase())) ||
      (b.companyId?.name && b.companyId.name.toLowerCase().includes(bookingSearch.toLowerCase())) ||
      (b.serviceType && b.serviceType.toLowerCase().includes(bookingSearch.toLowerCase()));

    if (!matchSearch) return false;
    if (bookingFilter === 'all') return true;
    if (bookingFilter === 'flight') return b.serviceType === 'flight';
    if (bookingFilter === 'train') return b.serviceType === 'train';
    if (bookingFilter === 'hotel') return b.serviceType === 'hotel';
    if (bookingFilter === 'bus') return b.serviceType === 'bus';
    return true;
  });

  const getServiceIcon = (type) => {
    switch (type) {
      case 'flight': return <Plane className="w-4 h-4 text-sky-400" />;
      case 'train': return <Train className="w-4 h-4 text-indigo-400" />;
      case 'bus': return <Bus className="w-4 h-4 text-amber-400" />;
      case 'hotel': return <Hotel className="w-4 h-4 text-emerald-400" />;
      default: return <Ticket className="w-4 h-4 text-brand-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#071628] text-slate-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white font-sans">
      
      {/* ============================================================ */}
      {/* 1. TOP HEADER (STICKY)                                       */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-30 bg-[#0B1E36]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-3.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Brand & Agency Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base text-white tracking-tight leading-tight line-clamp-1">
                  {agencyName}
                </h1>
                <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  Client Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium line-clamp-1">
                Welcome, {profile?.name || user?.name || 'Customer'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#071628]/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'home'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'bookings'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              My Bookings
              {totalBookings > 0 && (
                <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center">
                  {totalBookings}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ledger'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Account Ledger
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Profile & Agency
            </button>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              title="Refresh Data"
              className={`p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all ${
                refreshing ? 'animate-spin text-brand-400' : ''
              }`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 sm:px-3 sm:py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/30 rounded-xl transition-all flex items-center gap-1.5 text-xs font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. MAIN CONTENT AREA (PADDED FOR BOTTOM NAVBAR ON MOBILE)    */}
      {/* ============================================================ */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24 md:pb-8 space-y-6">
        
        {/* TAB 1: HOME OVERVIEW */}
        {activeTab === 'home' && (
          <div className="space-y-5">
            
            {/* Customer Welcome Card with Ambient Glow */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0E2849] via-[#0B1E36] to-[#071628] rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-700/60 shadow-xl shadow-black/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-lg shadow-brand-600/30 border border-white/20 shrink-0">
                    {profile?.name ? profile.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                        {profile?.name}
                      </h2>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>
                    
                    {/* Customer Code Badge with Copy Action */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400 font-medium">User ID:</span>
                      <button
                        onClick={() => handleCopyCode(profile?.customerCode)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-brand-500 text-brand-300 font-mono text-xs font-semibold transition-all active:scale-95"
                      >
                        <span>{profile?.customerCode}</span>
                        {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Outstanding Balance Pill */}
                <div className="bg-[#071628]/80 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-slate-800 flex items-center justify-between sm:justify-end gap-4">
                  <div>
                    <p className="text-[11px] text-slate-400 font-medium">Closing Balance Due</p>
                    <p className={`text-base sm:text-xl font-black ${isBalanceDue ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {formatCurrency(ledger.closingBalance)}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('ledger')}
                    className="px-3 py-1.5 rounded-xl bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white border border-brand-500/30 text-xs font-bold transition-all flex items-center gap-1"
                  >
                    Ledger <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Buttons (Commercial App Style) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setActiveTab('bookings')}
                className="bg-[#0B1E36] hover:bg-[#0F2744] active:scale-[0.98] border border-slate-800 hover:border-brand-500/50 rounded-2xl p-4 flex flex-col items-start transition-all shadow-sm text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Plane className="w-5 h-5" />
                </div>
                <div className="text-white font-bold text-sm">My Bookings</div>
                <div className="text-slate-400 text-xs mt-0.5">{totalBookings} Total Trips</div>
              </button>

              <button
                onClick={() => setActiveTab('ledger')}
                className="bg-[#0B1E36] hover:bg-[#0F2744] active:scale-[0.98] border border-slate-800 hover:border-teal-500/50 rounded-2xl p-4 flex flex-col items-start transition-all shadow-sm text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="text-white font-bold text-sm">Statements</div>
                <div className="text-slate-400 text-xs mt-0.5">{ledger.ledger.length} Transactions</div>
              </button>

              {agency.phone ? (
                <a
                  href={`tel:${agency.phone}`}
                  className="bg-[#0B1E36] hover:bg-[#0F2744] active:scale-[0.98] border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 flex flex-col items-start transition-all shadow-sm text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="text-white font-bold text-sm">Contact Agency</div>
                  <div className="text-slate-400 text-xs mt-0.5">Quick Direct Call</div>
                </a>
              ) : (
                <button
                  onClick={() => setActiveTab('profile')}
                  className="bg-[#0B1E36] hover:bg-[#0F2744] active:scale-[0.98] border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 flex flex-col items-start transition-all shadow-sm text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="text-white font-bold text-sm">Agency Details</div>
                  <div className="text-slate-400 text-xs mt-0.5">Contact & Info</div>
                </button>
              )}

              <button
                onClick={() => setActiveTab('profile')}
                className="bg-[#0B1E36] hover:bg-[#0F2744] active:scale-[0.98] border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 flex flex-col items-start transition-all shadow-sm text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <User className="w-5 h-5" />
                </div>
                <div className="text-white font-bold text-sm">My Profile</div>
                <div className="text-slate-400 text-xs mt-0.5">ID, Phone & Data</div>
              </button>
            </div>

            {/* Recent Trips / Bookings Preview */}
            <div className="bg-[#0B1E36] rounded-2xl sm:rounded-3xl border border-slate-800 overflow-hidden shadow-sm">
              <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-400" />
                  <h3 className="font-bold text-sm sm:text-base text-white">Recent Trips & Bookings</h3>
                </div>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
                >
                  View All ({totalBookings}) <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-800/60">
                {bookings.length > 0 ? (
                  bookings.slice(0, 3).map(booking => (
                    <div
                      key={booking._id}
                      onClick={() => setSelectedBooking(booking)}
                      className="p-4 hover:bg-slate-800/40 active:bg-slate-800/70 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#071628] border border-slate-700/60 flex items-center justify-center shrink-0">
                          {getServiceIcon(booking.serviceType)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white flex items-center gap-2">
                            {booking.sector || (booking.serviceType ? booking.serviceType.toUpperCase() : 'Trip Booking')}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                            <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 text-[11px]">
                              {booking.referenceNo}
                            </span>
                            <span>•</span>
                            <span>{booking.bookingDate || 'Recent'}</span>
                            {booking.companyId?.name && (
                              <>
                                <span>•</span>
                                <span className="text-slate-300 font-medium">{booking.companyId.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                        <div>
                          <div className="text-[10px] text-slate-400 sm:text-right">Total Fare</div>
                          <div className="font-bold text-sm text-white sm:text-right">
                            {formatCurrency(booking.totalAmount)}
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${
                          booking.paymentStatus === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : booking.paymentStatus === 'partially_paid'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {booking.paymentStatus?.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <Plane className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-60" />
                    <p className="text-sm font-medium">No bookings found yet.</p>
                    <p className="text-xs text-slate-600 mt-0.5">Your bookings will appear here once registered.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: MY BOOKINGS EXPLORER */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            
            {/* Header & Search Bar */}
            <div className="bg-[#0B1E36] rounded-2xl p-4 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plane className="w-5 h-5 text-brand-400" />
                  <h2 className="font-bold text-base text-white">My Trips & Bookings</h2>
                </div>
                <span className="text-xs text-slate-400 font-semibold">
                  {filteredBookings.length} {filteredBookings.length === 1 ? 'Trip' : 'Trips'}
                </span>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  placeholder="Search by sector, reference code, airline..."
                  className="w-full pl-10 pr-4 py-2 bg-[#071628] border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                />
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {['all', 'flight', 'train', 'bus', 'hotel'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setBookingFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl font-semibold capitalize whitespace-nowrap transition-all ${
                      bookingFilter === cat
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-[#071628] text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Bookings Card List */}
            <div className="space-y-3">
              {filteredBookings.length > 0 ? (
                filteredBookings.map(booking => (
                  <div
                    key={booking._id}
                    onClick={() => setSelectedBooking(booking)}
                    className="bg-[#0B1E36] hover:bg-[#0F2744] active:scale-[0.99] border border-slate-800 hover:border-brand-500/50 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer shadow-sm relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-[#071628] border border-slate-700/60 flex items-center justify-center shrink-0">
                          {getServiceIcon(booking.serviceType)}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm sm:text-base text-white">
                            {booking.sector || booking.serviceType?.toUpperCase()}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span className="font-mono text-brand-300 font-semibold">{booking.referenceNo}</span>
                            {booking.companyId?.name && (
                              <>
                                <span>•</span>
                                <span className="text-slate-300">{booking.companyId.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide shrink-0 ${
                        booking.paymentStatus === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : booking.paymentStatus === 'partially_paid'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {booking.paymentStatus?.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Booking Details Pill Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-500 text-[11px]">Booking Date</span>
                        <p className="font-medium text-slate-200">{booking.bookingDate || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px]">Travel Date</span>
                        <p className="font-medium text-slate-200">{booking.travelDate || booking.bookingDate || 'Confirmed'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px]">Total Price</span>
                        <p className="font-bold text-white">{formatCurrency(booking.totalAmount)}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px]">Balance Due</span>
                        <p className={`font-bold ${parseFloat(booking.balanceDue || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {formatCurrency(booking.balanceDue || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3.5 pt-2 flex items-center justify-between text-xs text-brand-400 font-semibold">
                      <span>Tap to view itinerary & voucher</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-[#0B1E36] rounded-2xl p-8 text-center border border-slate-800">
                  <Plane className="w-12 h-12 mx-auto text-slate-600 mb-2 opacity-50" />
                  <p className="text-white font-bold text-sm">No bookings matched your search</p>
                  <p className="text-xs text-slate-400 mt-1">Try changing your search terms or filters.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: ACCOUNT LEDGER & TRANSACTIONS */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            
            {/* Financial Overview Card */}
            <div className="bg-gradient-to-br from-[#0E2849] via-[#0B1E36] to-[#071628] rounded-2xl p-5 sm:p-6 border border-slate-700/60 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-brand-400" /> Outstanding Statement
                  </span>
                  <h3 className={`text-2xl sm:text-3xl font-black mt-1 ${isBalanceDue ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {formatCurrency(ledger.closingBalance)}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isBalanceDue
                      ? 'Please settle your outstanding balance with the agency.'
                      : 'All accounts are settled. No balance is currently due.'}
                  </p>
                </div>

                <div className="bg-[#071628]/80 rounded-xl p-3 border border-slate-800 text-xs space-y-1 sm:text-right">
                  <div className="text-slate-400">Total Transactions: <span className="font-bold text-white">{ledger.ledger.length}</span></div>
                  <div className="text-slate-400">Agency: <span className="font-medium text-brand-300">{agencyName}</span></div>
                </div>
              </div>
            </div>

            {/* Transactions Card List (Mobile-Optimized) */}
            <div className="bg-[#0B1E36] rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-teal-400" /> Transaction Ledger
                </h3>
                <span className="text-xs text-slate-400">{ledger.ledger.length} entries</span>
              </div>

              {/* Mobile View: Cards */}
              <div className="divide-y divide-slate-800/60 md:hidden">
                {ledger.ledger.length > 0 ? (
                  ledger.ledger.slice().reverse().map(entry => (
                    <div key={entry.id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-sm text-white">{entry.description || 'Transaction'}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span className="font-mono text-slate-300 text-[11px]">{entry.referenceNo || '-'}</span>
                            <span>•</span>
                            <span>{new Date(entry.date).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {entry.debit > 0 ? (
                          <div className="text-right">
                            <span className="text-[10px] text-rose-400 uppercase font-semibold">Debit (Charge)</span>
                            <p className="font-bold text-sm text-rose-400">-{formatCurrency(entry.debit)}</p>
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="text-[10px] text-emerald-400 uppercase font-semibold">Credit (Payment)</span>
                            <p className="font-bold text-sm text-emerald-400">+{formatCurrency(entry.credit)}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/40 text-slate-400">
                        <span>Running Balance</span>
                        <span className="font-bold text-slate-200">{formatCurrency(entry.runningBalance)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <Receipt className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
                    <p className="text-sm">No ledger entries recorded yet.</p>
                  </div>
                )}
              </div>

              {/* Desktop View: Sleek Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#071628] text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5">Reference</th>
                      <th className="px-5 py-3.5">Description</th>
                      <th className="px-5 py-3.5 text-right">Debit</th>
                      <th className="px-5 py-3.5 text-right">Credit</th>
                      <th className="px-5 py-3.5 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {ledger.ledger.length > 0 ? (
                      ledger.ledger.slice().reverse().map(entry => (
                        <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-3 text-slate-300">{new Date(entry.date).toLocaleDateString()}</td>
                          <td className="px-5 py-3 font-mono text-slate-400">{entry.referenceNo || '-'}</td>
                          <td className="px-5 py-3 text-white font-medium">{entry.description}</td>
                          <td className="px-5 py-3 text-right text-rose-400 font-semibold">
                            {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                          </td>
                          <td className="px-5 py-3 text-right text-emerald-400 font-semibold">
                            {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-slate-100">
                            {formatCurrency(entry.runningBalance)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-5 py-8 text-center text-slate-500">
                          No ledger transactions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

        {/* TAB 4: PROFILE & AGENCY INFORMATION */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            
            {/* Customer Personal Details Card */}
            <div className="bg-[#0B1E36] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-800">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-500 text-white flex items-center justify-center font-bold text-xl border border-white/20 shadow-md">
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-white">{profile?.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">User ID:</span>
                    <button
                      onClick={() => handleCopyCode(profile?.customerCode)}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-brand-300 font-mono text-xs font-semibold"
                    >
                      <span>{profile?.customerCode}</span>
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-[#071628] p-3.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 flex items-center gap-1.5 mb-1">
                    <Phone className="w-3.5 h-3.5 text-brand-400" /> Registered Phone
                  </span>
                  <p className="font-semibold text-slate-200 text-sm">{profile?.phone || 'Not provided'}</p>
                </div>

                <div className="bg-[#071628] p-3.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 flex items-center gap-1.5 mb-1">
                    <Mail className="w-3.5 h-3.5 text-teal-400" /> Email Address
                  </span>
                  <p className="font-semibold text-slate-200 text-sm">{profile?.email || 'N/A'}</p>
                </div>

                {profile?.address && (
                  <div className="bg-[#071628] p-3.5 rounded-xl border border-slate-800/80 sm:col-span-2">
                    <span className="text-slate-500 flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" /> Postal Address
                    </span>
                    <p className="font-medium text-slate-200 text-xs sm:text-sm">{profile.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Travel Agency Card */}
            <div className="bg-[#0B1E36] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <Building2 className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">{agencyName}</h3>
                  <p className="text-xs text-slate-400">Your Booking & Servicing Travel Agency</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                {agency.address && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <span>{agency.address}</span>
                  </div>
                )}
                {agency.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                    <a href={`tel:${agency.phone}`} className="text-brand-400 hover:underline">
                      {agency.phone}
                    </a>
                  </div>
                )}
                {agency.email && (
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                    <a href={`mailto:${agency.email}`} className="text-teal-400 hover:underline">
                      {agency.email}
                    </a>
                  </div>
                )}
              </div>

              {/* Direct Action Assistance */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                {agency.phone && (
                  <a
                    href={`tel:${agency.phone}`}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Phone className="w-4 h-4" /> Call Agency Support
                  </a>
                )}
                {agency.email && (
                  <a
                    href={`mailto:${agency.email}`}
                    className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition border border-slate-700"
                  >
                    <Mail className="w-4 h-4" /> Email Query
                  </a>
                )}
              </div>
            </div>

            {/* Logout & Security Section */}
            <div className="bg-[#0B1E36] rounded-2xl p-4 sm:p-5 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Protected by 256-Bit Session Token</span>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>

          </div>
        )}

      </main>

      {/* ============================================================ */}
      {/* 3. MOBILE BOTTOM NAVIGATION BAR ("DOWN NAVBAR")               */}
      {/* ============================================================ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B1E36]/95 backdrop-blur-xl border-t border-slate-800/90 shadow-[0_-4px_25px_rgba(0,0,0,0.3)] md:hidden safe-area-bottom">
        <div className="grid grid-cols-4 max-w-md mx-auto py-2 px-1">
          
          {/* 1. Home Menu */}
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'home'
                ? 'text-brand-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Home className="w-5 h-5 mb-1" />
              {activeTab === 'home' && (
                <span className="absolute -top-1 right-0 w-1.5 h-1.5 bg-brand-400 rounded-full" />
              )}
            </div>
            <span className="text-[10px] tracking-tight">Home</span>
          </button>

          {/* 2. Bookings Menu */}
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'bookings'
                ? 'text-brand-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Plane className="w-5 h-5 mb-1" />
              {totalBookings > 0 && (
                <span className="absolute -top-1 -right-2 bg-brand-500 text-white text-[9px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {totalBookings}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">Bookings</span>
          </button>

          {/* 3. Ledger Menu */}
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'ledger'
                ? 'text-brand-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Receipt className="w-5 h-5 mb-1" />
              {isBalanceDue && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              )}
            </div>
            <span className="text-[10px] tracking-tight">Ledger</span>
          </button>

          {/* 4. Profile Menu */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'profile'
                ? 'text-brand-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <User className="w-5 h-5 mb-1" />
              {activeTab === 'profile' && (
                <span className="absolute -top-1 right-0 w-1.5 h-1.5 bg-brand-400 rounded-full" />
              )}
            </div>
            <span className="text-[10px] tracking-tight">Profile</span>
          </button>

        </div>
      </nav>

      {/* ============================================================ */}
      {/* 4. MODAL DRAWER: BOOKING DETAILS & VOUCHER BREAKDOWN        */}
      {/* ============================================================ */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div 
            className="bg-[#0B1E36] border border-slate-700 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[88vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-base text-white">Trip Voucher Details</h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 pt-4 text-xs">
              
              {/* Route & Service */}
              <div className="bg-[#071628] p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-brand-400 tracking-wider">
                    {selectedBooking.serviceType}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedBooking.paymentStatus === 'paid'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {selectedBooking.paymentStatus?.toUpperCase()}
                  </span>
                </div>
                <h4 className="text-lg font-black text-white">
                  {selectedBooking.sector || selectedBooking.serviceType?.toUpperCase()}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-slate-400 font-mono">
                  <span>Ref: {selectedBooking.referenceNo}</span>
                  {selectedBooking.pnr && <span>• PNR: {selectedBooking.pnr}</span>}
                </div>
              </div>

              {/* Dates & Carrier */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#071628] p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[11px]">Booking Date</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{selectedBooking.bookingDate || 'N/A'}</p>
                </div>
                <div className="bg-[#071628] p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[11px]">Travel Date</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{selectedBooking.travelDate || selectedBooking.bookingDate || 'Confirmed'}</p>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-[#071628] p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>Total Booking Cost</span>
                  <span className="font-bold text-white">{formatCurrency(selectedBooking.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Amount Paid</span>
                  <span className="font-semibold text-emerald-400">{formatCurrency(selectedBooking.amountReceived || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-800 font-bold">
                  <span>Remaining Due</span>
                  <span className={parseFloat(selectedBooking.balanceDue || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    {formatCurrency(selectedBooking.balanceDue || 0)}
                  </span>
                </div>
              </div>

              {/* Remarks or Notes */}
              {selectedBooking.notes && (
                <div className="bg-[#071628] p-3 rounded-xl border border-slate-800 text-slate-300">
                  <span className="text-slate-500 text-[11px] block mb-1">Notes / Instructions:</span>
                  <p>{selectedBooking.notes}</p>
                </div>
              )}

              {/* Agency Assistance footer */}
              <div className="pt-2">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition"
                >
                  Close Voucher
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
