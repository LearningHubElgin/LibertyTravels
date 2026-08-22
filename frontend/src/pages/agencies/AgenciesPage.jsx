import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Users,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  MoreVertical,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Mail,
  Phone,
  MapPin,
  FileText,
  Crown
} from 'lucide-react';
import { agenciesService } from '../../services/agenciesService';
import { AgencyDetailsModal } from './AgencyDetailsModal';
import { DataTable } from '../../components/common/DataTable';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const AgenciesPage = () => {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [platformStats, setPlatformStats] = useState(null);
  
  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Modals
  const [selectedAgencyId, setSelectedAgencyId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [agencyToDelete, setAgencyToDelete] = useState(null);

  // New Agency Form State
  const [newAgency, setNewAgency] = useState({
    name: '',
    code: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    plan: 'pro',
    gstNumber: '',
    invoicePrefix: '',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    loadPlatformStats();
  }, []);

  useEffect(() => {
    loadAgencies();
  }, [pagination.page, pagination.limit, statusFilter]);

  const loadPlatformStats = async () => {
    try {
      const res = await agenciesService.getPlatformStats();
      if (res.success) {
        setPlatformStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load platform stats:', err);
    }
  };

  const loadAgencies = async () => {
    try {
      setLoading(true);
      const res = await agenciesService.getAgencies({
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });

      if (res.success) {
        setAgencies(res.data);
        if (res.pagination) {
          setPagination(prev => ({
            ...prev,
            total: res.pagination.total,
            totalPages: res.pagination.totalPages
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load agencies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadAgencies();
  };

  const handleCreateAgency = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!newAgency.name || !newAgency.code || !newAgency.email) {
      setCreateError('Agency Name, Code, and Email are required.');
      return;
    }

    try {
      setCreating(true);
      const res = await agenciesService.createAgency(newAgency);
      if (res.success) {
        setIsCreateModalOpen(false);
        setNewAgency({
          name: '',
          code: '',
          ownerName: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          country: 'India',
          plan: 'pro',
          gstNumber: '',
          invoicePrefix: '',
          adminName: '',
          adminEmail: '',
          adminPassword: ''
        });
        loadAgencies();
        loadPlatformStats();
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create travel agency.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAgency = async () => {
    if (!agencyToDelete) return;
    try {
      const res = await agenciesService.deleteAgency(agencyToDelete._id);
      if (res.success) {
        setIsDeleteConfirmOpen(false);
        setAgencyToDelete(null);
        loadAgencies();
        loadPlatformStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete agency.');
    }
  };

  const columns = [
    {
      header: 'Travel Agency',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-200/80 flex items-center justify-center text-brand-700 font-bold text-xs uppercase shadow-xs shrink-0">
            {row.code ? row.code.slice(0, 3) : <Building2 className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-xs sm:text-sm truncate block">
                {row.name}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase shrink-0">
                {row.code}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 truncate block">
              {row.city ? `${row.city}, ` : ''}{row.country || 'India'}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Owner / Contact',
      accessor: 'ownerName',
      render: (row) => (
        <div>
          <span className="text-xs font-semibold text-slate-800 block">
            {row.ownerName || 'Not Assigned'}
          </span>
          <span className="text-[11px] text-slate-500 font-mono block">
            {row.phone || row.email}
          </span>
        </div>
      )
    },
    {
      header: 'SaaS Plan',
      accessor: 'plan',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Crown className={`w-3.5 h-3.5 ${row.plan === 'enterprise' ? 'text-amber-500' : 'text-slate-400'}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {row.plan || 'pro'}
          </span>
        </div>
      )
    },
    {
      header: 'Total Bookings',
      accessor: 'totalBookings',
      render: (row) => (
        <div className="text-left">
          <span className="text-xs font-mono font-black text-slate-900">
            {row.totalBookings || 0}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {row.staffCount || 0} Staff Users
          </span>
        </div>
      )
    },
    {
      header: 'Total Volume',
      accessor: 'totalRevenue',
      render: (row) => (
        <span className="text-xs font-mono font-bold text-emerald-700">
          ₹{Number(row.totalRevenue || 0).toLocaleString('en-IN')}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const isAct = row.status === 'active';
        const isTrial = row.status === 'trial';
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
            isAct
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : isTrial
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isAct ? 'bg-emerald-500' : isTrial ? 'bg-amber-500' : 'bg-rose-500'}`} />
            {row.status}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setSelectedAgencyId(row._id);
              setIsDetailsOpen(true);
            }}
            title="Inspect Agency Details"
            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-700 hover:bg-brand-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          {row.code !== 'LTT' && (
            <button
              onClick={() => {
                setAgencyToDelete(row);
                setIsDeleteConfirmOpen(true);
              }}
              title="Delete Agency"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5 animate-fadeIn">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-50 border border-brand-200/60 text-brand-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Travel Agencies Hub
              </h1>
              <p className="text-xs text-slate-500">
                Super Admin Master Control: Onboard & manage multi-tenant travel agencies
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard Travel Agency</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border-l-4 border-brand-600 border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Agencies</span>
            <Building2 className="w-4 h-4 text-brand-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 font-mono mt-2">
            {platformStats?.totalAgencies || agencies.length || 0}
          </span>
        </div>

        <div className="bg-white border-l-4 border-emerald-500 border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Active Agencies</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-emerald-700 font-mono mt-2">
            {platformStats?.activeAgencies || 0}
          </span>
        </div>

        <div className="bg-white border-l-4 border-sky-500 border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Platform Bookings</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <span className="text-2xl font-black text-sky-900 font-mono mt-2">
            {platformStats?.totalPlatformBookings || 0}
          </span>
        </div>

        <div className="bg-white border-l-4 border-purple-500 border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Platform Gross Volume</span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-black text-purple-900 font-mono mt-2">
            ₹{Number(platformStats?.totalPlatformRevenue || 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Agencies' },
            { id: 'active', label: 'Active' },
            { id: 'trial', label: 'Trial' },
            { id: 'suspended', label: 'Suspended' }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setStatusFilter(st.id);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                statusFilter === st.id
                  ? 'bg-brand-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agency name, code, email..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </form>
      </div>

      {/* Agencies Data Table */}
      <DataTable
        columns={columns}
        data={agencies}
        loading={loading}
        pagination={pagination}
        onRowClick={(row) => {
          setSelectedAgencyId(row._id);
          setIsDetailsOpen(true);
        }}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        onLimitChange={(limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))}
        emptyTitle="No travel agencies found"
        emptyDescription="Start onboarding partner travel agencies to scale your multi-tenant ERP platform."
        emptyAction={() => setIsCreateModalOpen(true)}
        emptyActionLabel="Onboard First Agency"
      />

      {/* Agency Details Modal */}
      {selectedAgencyId && (
        <AgencyDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedAgencyId(null);
          }}
          agencyId={selectedAgencyId}
          onUpdated={() => {
            loadAgencies();
            loadPlatformStats();
          }}
        />
      )}

      {/* Create New Travel Agency Wizard Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
            
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#0B1E36] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500/20 text-brand-300">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Onboard New Travel Agency</h3>
                  <p className="text-xs text-slate-300">Create agency tenant + setup primary Agency Admin credentials</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateAgency} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {createError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Section 1: Agency Identity */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-brand-600" />
                  1. Agency Profile
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Agency Name *</label>
                    <input
                      type="text"
                      required
                      value={newAgency.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        const code = name.replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase();
                        setNewAgency(prev => ({ ...prev, name, code: prev.code ? prev.code : code }));
                      }}
                      placeholder="e.g. Skyline Tours & Travels"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Agency Code *</label>
                    <input
                      type="text"
                      required
                      value={newAgency.code}
                      onChange={(e) => setNewAgency(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="e.g. SKY"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono uppercase font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Official Agency Email *</label>
                    <input
                      type="email"
                      required
                      value={newAgency.email}
                      onChange={(e) => setNewAgency(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="contact@skylinetravel.com"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={newAgency.phone}
                      onChange={(e) => setNewAgency(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Owner / Principal Name</label>
                    <input
                      type="text"
                      value={newAgency.ownerName}
                      onChange={(e) => setNewAgency(prev => ({ ...prev, ownerName: e.target.value }))}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City / Region</label>
                    <input
                      type="text"
                      value={newAgency.city}
                      onChange={(e) => setNewAgency(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="e.g. Mumbai"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">SaaS Plan</label>
                    <select
                      value={newAgency.plan}
                      onChange={(e) => setNewAgency(prev => ({ ...prev, plan: e.target.value }))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold"
                    >
                      <option value="trial">Free Trial (14 Days)</option>
                      <option value="basic">Basic Tier</option>
                      <option value="pro">Pro Agency Tier</option>
                      <option value="enterprise">Enterprise VIP</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Agency Admin Login Credentials */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  2. Initial Agency Admin Account
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Admin Email (Login)</label>
                    <input
                      type="email"
                      value={newAgency.adminEmail}
                      onChange={(e) => setNewAgency(prev => ({ ...prev, adminEmail: e.target.value }))}
                      placeholder="admin@skylinetravel.com"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password</label>
                    <input
                      type="password"
                      value={newAgency.adminPassword}
                      onChange={(e) => setNewAgency(prev => ({ ...prev, adminPassword: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Submit Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
                >
                  {creating ? 'Registering Agency...' : 'Complete Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <ConfirmDialog
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={handleDeleteAgency}
          title="Delete Travel Agency?"
          message={`Are you sure you want to remove ${agencyToDelete?.name} (${agencyToDelete?.code})? This will archive all access for this agency tenant.`}
          confirmText="Yes, Delete Agency"
          variant="danger"
        />
      )}
    </div>
  );
};
