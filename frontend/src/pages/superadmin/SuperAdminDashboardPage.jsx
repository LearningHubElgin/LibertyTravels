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
  XCircle,
  Eye,
  History,
  UserCheck,
  ChevronRight,
  Zap,
  Globe,
  BarChart3
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <LoadingSpinner size="lg" text="Loading Super Admin Insights..." />
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
    <div className="space-y-3.5 sm:space-y-5 pb-8">
      {/* 1. Compact Super Admin Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B1E36] via-[#102A4C] to-[#1E3A5F] p-4 sm:p-6 text-white shadow-lg border border-slate-800">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] sm:text-xs font-extrabold uppercase tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Super Admin Platform Hub</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white">
              Welcome, {user?.name || 'Super Admin'}!
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-300 max-w-xl leading-relaxed">
              Global dashboard for managing all connected travel agencies, platform sales metrics, and system accounts.
            </p>
          </div>

          {/* Action Buttons: 2 columns on small screens, flex on desktop */}
          <div className="grid grid-cols-2 sm:flex items-center gap-2 pt-1 sm:pt-0">
            <button
              onClick={() => navigate('/superadmin/agencies/new')}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Agency</span>
            </button>
            <button
              onClick={() => navigate('/superadmin/agencies')}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 active:scale-95 transition"
            >
              <span>All Agencies</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. High-Density Extra-Compact 2x2 on Mobile, 4x1 on Desktop KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5">
        {/* KPI 1: Connected Agencies (Sky Blue) */}
        <div className="bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-sky-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">
              Agencies
            </span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-2xs">
              <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="mt-1 sm:mt-2 flex items-baseline gap-1">
            <span className="text-base sm:text-2xl font-black text-slate-900 leading-tight">
              {stats?.totalAgencies || agencies.length || 0}
            </span>
            <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100/90 px-1 py-0.2 rounded">
              {stats?.activeAgencies || 0} Active
            </span>
          </div>
          <p className="mt-0.5 text-[9px] sm:text-[10px] text-slate-400 truncate">Connected partner agencies</p>
        </div>

        {/* KPI 2: Platform Gross Sales (Emerald Green) */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">
              Gross Sales
            </span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="mt-1 sm:mt-2">
            <span className="text-sm sm:text-xl font-black text-slate-900 font-mono tracking-tight block truncate leading-tight">
              {formatCurrency(stats?.totalGrossVolume)}
            </span>
          </div>
          <p className="mt-0.5 text-[9px] sm:text-[10px] text-slate-400 truncate">Total volume across agencies</p>
        </div>

        {/* KPI 3: Total Bookings (Purple / Violet) */}
        <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-purple-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[11px] font-extrabold text-purple-800 uppercase tracking-wider">
              Bookings
            </span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-2xs">
              <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="mt-1 sm:mt-2">
            <span className="text-base sm:text-2xl font-black text-slate-900 leading-tight">
              {stats?.totalBookings || 0}
            </span>
          </div>
          <p className="mt-0.5 text-[9px] sm:text-[10px] text-slate-400 truncate">Flights, trains & hotels</p>
        </div>

        {/* KPI 4: Platform Users (Amber / Gold) */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[11px] font-extrabold text-amber-900 uppercase tracking-wider">
              Users
            </span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shadow-2xs font-bold">
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="mt-1 sm:mt-2">
            <span className="text-base sm:text-2xl font-black text-slate-900 leading-tight">
              {stats?.totalUsers || 0}
            </span>
          </div>
          <p className="mt-0.5 text-[9px] sm:text-[10px] text-slate-400 truncate">Admins & managers</p>
        </div>
      </div>

      {/* 3. Quick Platform Shortcuts (Compact 2 or 4 cols) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <button
          onClick={() => navigate('/superadmin/agencies/new')}
          className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition flex items-center gap-2.5 group shadow-xs active:scale-98"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs font-bold text-slate-800 truncate">Register Agency</div>
            <div className="text-[9px] text-slate-400">Onboard partner</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/superadmin/agencies')}
          className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 text-left transition flex items-center gap-2.5 group shadow-xs active:scale-98"
        >
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs font-bold text-slate-800 truncate">Manage Agencies</div>
            <div className="text-[9px] text-slate-400">Plans & status</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/superadmin/users')}
          className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200 hover:border-purple-400 hover:bg-purple-50/40 text-left transition flex items-center gap-2.5 group shadow-xs active:scale-98"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs font-bold text-slate-800 truncate">Platform Users</div>
            <div className="text-[9px] text-slate-400">Admins & roles</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/activity-logs')}
          className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-left transition flex items-center gap-2.5 group shadow-xs active:scale-98"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <History className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs font-bold text-slate-800 truncate">Activity Logs</div>
            <div className="text-[9px] text-slate-400">Audit trail</div>
          </div>
        </button>
      </div>

      {/* 4. Connected Travel Agencies List (High-Density Mobile Cards + Desktop Layout) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-brand-600" />
              <span>Connected Travel Agencies</span>
            </h2>
            <p className="text-[10px] sm:text-[11px] text-slate-400">
              Overview of all registered travel agency partners
            </p>
          </div>

          <button
            onClick={() => navigate('/superadmin/agencies')}
            className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 shadow-2xs transition"
          >
            Manage &rarr;
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {agencies.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No travel agencies registered yet. Click "Add Agency" above to register the first one.
            </div>
          ) : (
            agencies.map((agency) => {
              const aId = String(agency._id || agency.id);

              return (
                <div
                  key={aId}
                  onClick={() => navigate(`/superadmin/agencies/${aId}`)}
                  className="p-3 sm:p-4 hover:bg-slate-50/80 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    {/* Agency Avatar / Logo */}
                    {agency.logo ? (
                      <img
                        src={agency.logo}
                        alt={agency.name}
                        className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 border border-slate-200 shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B1E36] to-[#1E3A5F] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs uppercase">
                        {agency.code ? agency.code.slice(0, 3) : 'TRV'}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                          {agency.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[9px] bg-brand-50 text-brand-700 border border-brand-200">
                          {agency.code}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold capitalize ${
                            agency.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {agency.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                        {agency.email && <span>{agency.email}</span>}
                        {agency.phone && <span>• {agency.phone}</span>}
                        {agency.city && <span>• {agency.city}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Financial & Action button */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <div className="text-[11px] font-extrabold text-slate-700">
                        {agency.totalBookings || 0} Bookings
                      </div>
                      <div className="text-[10px] font-mono font-bold text-emerald-600">
                        {formatCurrency(agency.totalRevenue)}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/superadmin/agencies/${aId}`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-[10px] sm:text-xs transition flex items-center gap-1 shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Profile</span>
                    </button>
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
