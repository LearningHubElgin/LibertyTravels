import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Edit2,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  KeyRound,
  UserCheck
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DataTable } from '../../components/common/DataTable';

export const ManageAgenciesPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success: toastSuccess, error: toastError } = useToast();

  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State for Add Agency
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    tagline: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'India',
    website: '',
    gstNumber: '',
    panNumber: '',
    plan: 'professional',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    adminPhone: '',
    invoicePrefix: ''
  });

  useEffect(() => {
    fetchAgencies();
    if (searchParams.get('new') === 'true') {
      setIsAddModalOpen(true);
    }
  }, [statusFilter]);

  const fetchAgencies = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;

      const res = await api.get('/superadmin/agencies', { params });
      if (res.data?.success) {
        setAgencies(res.data.data || []);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to fetch travel agencies');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAgencies();
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    const autoCode = val
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 6)
      .toUpperCase();

    setFormData((prev) => ({
      ...prev,
      name: val,
      code: prev.code ? prev.code : autoCode,
      invoicePrefix: prev.invoicePrefix ? prev.invoicePrefix : `${autoCode ? autoCode + '-INV-' : ''}`
    }));
  };

  const handleCreateAgency = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post('/superadmin/agencies', formData);
      if (res.data?.success) {
        toastSuccess(res.data.message || 'Travel Agency registered successfully!');
        setIsAddModalOpen(false);
        setFormData({
          name: '',
          code: '',
          tagline: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          country: 'India',
          website: '',
          gstNumber: '',
          panNumber: '',
          plan: 'professional',
          adminName: '',
          adminEmail: '',
          adminPassword: '',
          adminPhone: '',
          invoicePrefix: ''
        });
        fetchAgencies();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to create travel agency');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAgency = async (e) => {
    e.preventDefault();
    if (!selectedAgency) return;
    try {
      setSubmitting(true);
      const aId = selectedAgency._id || selectedAgency.id;
      const res = await api.put(`/superadmin/agencies/${aId}`, selectedAgency);
      if (res.data?.success) {
        toastSuccess('Agency updated successfully!');
        setIsEditModalOpen(false);
        setSelectedAgency(null);
        fetchAgencies();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update agency');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedAgency) return;
    try {
      const aId = selectedAgency._id || selectedAgency.id;
      const res = await api.delete(`/superadmin/agencies/${aId}`);
      if (res.data?.success) {
        toastSuccess(res.data.message || 'Status updated successfully');
        setIsStatusConfirmOpen(false);
        setSelectedAgency(null);
        fetchAgencies();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update agency status');
    }
  };

  const handleSwitchToAgency = (agencyId) => {
    localStorage.setItem('liberty_active_agency', agencyId);
    api.defaults.headers.common['x-agency-id'] = agencyId;
    toastSuccess('Switched to Travel Agency ERP workspace!');
    navigate('/dashboard');
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const columns = [
    {
      header: 'Agency / Tours & Travels',
      accessor: 'name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B1E36] to-[#1E3A5F] text-white flex items-center justify-center font-black text-xs shrink-0 uppercase shadow-sm">
            {row.code ? row.code.slice(0, 3) : 'TRV'}
          </div>
          <div>
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <span>{row.name}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="font-mono font-bold text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded border border-brand-200">
                {row.code}
              </span>
              {row.city && <span>• {row.city}</span>}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Contact & Admin',
      accessor: 'email',
      cell: (row) => (
        <div className="text-xs space-y-0.5">
          <div className="font-semibold text-slate-700">{row.email}</div>
          <div className="text-slate-400">{row.phone}</div>
          {row.adminUser && (
            <div className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-amber-600" />
              <span>Admin: {row.adminUser.name}</span>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Plan',
      accessor: 'plan',
      cell: (row) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase bg-brand-50 text-brand-700 border border-brand-200">
          {row.plan || 'Professional'}
        </span>
      )
    },
    {
      header: 'Bookings & Volume',
      accessor: 'totalBookings',
      cell: (row) => (
        <div>
          <div className="font-extrabold text-slate-800 text-xs">
            {row.totalBookings || 0} Bookings
          </div>
          <div className="text-[11px] text-emerald-600 font-mono font-bold">
            {formatCurrency(row.totalRevenue)}
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize ${
            row.status === 'active'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {row.status === 'active' ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <XCircle className="w-3 h-3" />
          )}
          <span>{row.status}</span>
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => {
        const aId = String(row._id || row.id);
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleSwitchToAgency(aId)}
              className="p-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 transition"
              title="Open ERP Workspace as this Agency"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate(`/superadmin/agencies/${aId}`)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="View Agency Profile & Staff"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSelectedAgency(row);
                setIsEditModalOpen(true);
              }}
              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition"
              title="Edit Agency"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSelectedAgency(row);
                setIsStatusConfirmOpen(true);
              }}
              className={`p-1.5 rounded-lg transition ${
                row.status === 'active'
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
              }`}
              title={row.status === 'active' ? 'Deactivate Agency' : 'Activate Agency'}
            >
              {row.status === 'active' ? (
                <XCircle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Registration CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Travel Agencies Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-brand-100 text-brand-700">
              {agencies.length} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create, configure, and manage all multi-tenant travel agencies on the platform
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Travel Agency</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'active', 'inactive'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {st === 'all' ? 'All Agencies' : `${st} Agencies`}
            </button>
          ))}
        </div>

        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, email, city..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </form>
      </div>

      {/* Agencies Data Table */}
      <DataTable
        columns={columns}
        data={agencies}
        loading={loading}
        onRowClick={(row) => navigate(`/superadmin/agencies/${row._id || row.id}`)}
        emptyTitle="No Travel Agencies Found"
        emptyDescription="Get started by registering your first travel agency partner."
        emptyAction={() => setIsAddModalOpen(true)}
        emptyActionLabel="Add Travel Agency"
      />

      {/* MODAL: Add New Travel Agency */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Travel Agency & Admin"
        size="lg"
      >
        <form onSubmit={handleCreateAgency} className="space-y-4">
          <div className="p-3 bg-brand-50/60 rounded-xl border border-brand-100 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <p className="text-xs text-brand-900">
              Creating a Travel Agency will automatically initialize its multi-tenant workspace and generate the initial <strong>Agency Admin</strong> account.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Agency Details */}
            <div className="md:col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
              1. Agency Business Profile
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Agency Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleNameChange}
                placeholder="e.g. Royal Travels & Tours"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Agency Code / Slug <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. ROYAL"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Agency Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@royaltravels.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City / Region</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Mumbai"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subscription Plan</label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="starter">Starter Plan</option>
                <option value="professional">Professional Plan</option>
                <option value="enterprise">Enterprise Plan</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Office Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Suite 101, Business Hub, MG Road..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Initial Agency Admin Setup */}
            <div className="md:col-span-2 text-xs font-bold text-amber-600 uppercase tracking-wider border-b border-amber-100 pb-1 mt-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>2. Initial Agency Admin Credentials</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Full Name
              </label>
              <input
                type="text"
                value={formData.adminName}
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                placeholder="e.g. Rajesh Sharma"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Login Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.adminEmail || formData.email}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                placeholder="admin@royaltravels.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Initial Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                minLength={6}
                value={formData.adminPassword}
                onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                placeholder="Set password (min 6 chars, e.g. agency123)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20 transition disabled:opacity-50"
            >
              {submitting ? 'Creating Agency...' : 'Create Travel Agency'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Edit Travel Agency */}
      {selectedAgency && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedAgency(null);
          }}
          title={`Edit Agency: ${selectedAgency.name}`}
          size="md"
        >
          <form onSubmit={handleUpdateAgency} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Agency Name</label>
              <input
                type="text"
                required
                value={selectedAgency.name || ''}
                onChange={(e) => setSelectedAgency({ ...selectedAgency, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={selectedAgency.email || ''}
                  onChange={(e) => setSelectedAgency({ ...selectedAgency, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={selectedAgency.phone || ''}
                  onChange={(e) => setSelectedAgency({ ...selectedAgency, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={selectedAgency.status || 'active'}
                  onChange={(e) => setSelectedAgency({ ...selectedAgency, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Plan</label>
                <select
                  value={selectedAgency.plan || 'professional'}
                  onChange={(e) => setSelectedAgency({ ...selectedAgency, plan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={selectedAgency.city || ''}
                onChange={(e) => setSelectedAgency({ ...selectedAgency, city: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedAgency(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* CONFIRM: Toggle Status */}
      <ConfirmDialog
        isOpen={isStatusConfirmOpen}
        onClose={() => {
          setIsStatusConfirmOpen(false);
          setSelectedAgency(null);
        }}
        onConfirm={handleToggleStatus}
        title={selectedAgency?.status === 'active' ? 'Deactivate Travel Agency?' : 'Activate Travel Agency?'}
        message={`Are you sure you want to ${
          selectedAgency?.status === 'active' ? 'deactivate' : 'activate'
        } "${selectedAgency?.name}"? All users linked to this agency will also be ${
          selectedAgency?.status === 'active' ? 'disabled' : 'enabled'
        }.`}
        confirmText={selectedAgency?.status === 'active' ? 'Deactivate Agency' : 'Activate Agency'}
        confirmVariant={selectedAgency?.status === 'active' ? 'danger' : 'primary'}
      />
    </div>
  );
};
