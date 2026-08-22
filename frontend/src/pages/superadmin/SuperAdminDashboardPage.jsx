import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  Plus,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const SuperAdminDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agencies, setAgencies] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, agenciesRes] = await Promise.all([
        api.get('/superadmin/agencies/dashboard-stats'),
        api.get('/superadmin/agencies')
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
      if (agenciesRes.data?.success) {
        setAgencies(agenciesRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load super admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToAgency = (agencyId) => {
    localStorage.setItem('liberty_active_agency', agencyId);
    api.defaults.headers.common['x-agency-id'] = agencyId;
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading Super Admin Platform Insights..." />
      </div>
    );
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B1E36] via-[#102A4C] to-[#1C3D6E] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SUPER ADMIN PLATFORM CONTROL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Super Admin'}!
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Manage all connected travel agencies, monitor gross platform sales, onboard new agency partners, and oversee global system health.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/superadmin/agencies?new=true')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Register New Agency</span>
            </button>
            <button
              onClick={() => navigate('/superadmin/agencies')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 transition"
            >
              <span>View All Agencies</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Global Platform KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Agencies */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Connected Agencies
            </span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800">
              {stats?.totalAgencies || agencies.length || 0}
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {stats?.activeAgencies || 0} Active
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Total registered travel agency accounts</p>
        </div>

        {/* Gross Platform Volume */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Platform Gross Sales
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-mono">
              {formatCurrency(stats?.totalGrossVolume)}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Total bookings volume across all agencies</p>
        </div>

        {/* Total Bookings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Platform Bookings
            </span>
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-800">
              {stats?.totalBookings || 0}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Tickets, flights, hotels & tour bookings</p>
        </div>

        {/* Total System Users */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Platform Users
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-800">
              {stats?.totalUsers || 0}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Super Admins, Agency Admins & Staff</p>
        </div>
      </div>

      {/* Connected Travel Agencies List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-600" />
              <span>Connected Travel Agencies</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any travel agency to view details or switch directly into its management workspace
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/superadmin/agencies')}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Manage Agencies Table
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {agencies.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No travel agencies found. Click "Register New Agency" to add your first partner.
            </div>
          ) : (
            agencies.map((agency) => {
              const aId = String(agency._id || agency.id);

              return (
                <div
                  key={aId}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0B1E36] to-[#1E3A5F] text-white flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm uppercase">
                      {agency.code ? agency.code.slice(0, 3) : 'TRV'}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-800">
                          {agency.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                          {agency.code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${
                            agency.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {agency.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-brand-50 text-brand-700 border border-brand-200">
                          {agency.plan || 'Professional'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>📧 {agency.email}</span>
                        <span>📞 {agency.phone}</span>
                        {agency.city && <span>📍 {agency.city}, {agency.country || 'India'}</span>}
                        {agency.adminUser && <span>👤 Admin: <strong>{agency.adminUser.name}</strong></span>}
                      </div>
                    </div>
                  </div>

                  {/* Financial & Action stats */}
                  <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">
                        Bookings & Sales
                      </span>
                      <div className="text-xs font-bold text-slate-700">
                        {agency.totalBookings || 0} Bookings • <span className="text-emerald-600 font-mono">{formatCurrency(agency.totalRevenue)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/superadmin/agencies/${aId}`)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition shadow-sm"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleSwitchToAgency(aId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-sm"
                        title="Switch view into this agency's ERP"
                      >
                        <span>Open ERP</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
