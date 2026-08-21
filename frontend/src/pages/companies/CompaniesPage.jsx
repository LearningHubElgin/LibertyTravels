import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  Globe2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Plane,
  Train,
  Bus,
  Hotel,
  Car,
  Layers,
  Filter
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const CompaniesPage = () => {
  const { success, error: toastError } = useToast();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [deleteCompanyId, setDeleteCompanyId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [companyForm, setCompanyForm] = useState({
    name: '',
    code: '',
    type: 'flight',
    country: 'India',
    contact: '',
    email: '',
    status: 'active'
  });

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      let query = '';
      if (search) query += `search=${encodeURIComponent(search)}&`;
      if (statusFilter) query += `status=${statusFilter}&`;
      if (typeFilter && typeFilter !== 'all') query += `type=${typeFilter}&`;

      const res = await api.get(`/companies?${query}`);
      if (res.data.success) {
        setCompanies(res.data.companies || []);
      }
    } catch (e) {
      console.error('Failed to load companies:', e);
      toastError('Could not load companies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCompanies();
  };

  const handleOpenCreate = () => {
    setEditingCompany(null);
    setCompanyForm({
      name: '',
      code: '',
      type: typeFilter !== 'all' ? typeFilter : 'flight',
      country: 'India',
      contact: '',
      email: '',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCompany(c);
    setCompanyForm({
      name: c.name,
      code: c.code,
      type: c.type || 'flight',
      country: c.country || 'India',
      contact: c.contact || '',
      email: c.email || '',
      status: c.status || 'active'
    });
    setIsModalOpen(true);
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    if (!companyForm.name || !companyForm.code) {
      return toastError('Company Name and Code are required.');
    }

    setActionLoading(true);
    try {
      if (editingCompany) {
        const id = editingCompany.id || editingCompany._id;
        const res = await api.put(`/companies/${id}`, companyForm);
        if (res.data.success) {
          success(`Company ${companyForm.name} updated successfully!`);
          setIsModalOpen(false);
          fetchCompanies();
        }
      } else {
        const res = await api.post('/companies', companyForm);
        if (res.data.success) {
          success(`Company ${companyForm.name} added successfully!`);
          setIsModalOpen(false);
          fetchCompanies();
        }
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save company.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!deleteCompanyId) return;
    setActionLoading(true);
    try {
      const res = await api.delete(`/companies/${deleteCompanyId}`);
      if (res.data.success) {
        success('Company deleted successfully.');
        setDeleteCompanyId(null);
        fetchCompanies();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Cannot delete company with active bookings.');
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

  const columns = [
    {
      header: 'Company Name & Code',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center border border-brand-100 uppercase shrink-0">
            {row.code?.slice(0, 3) || 'CMP'}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-xs sm:text-sm">{row.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-md font-bold">
                {row.code}
              </span>
              <span className="text-[10px] text-slate-400">• {row.country || 'India'}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Category / Service',
      render: (row) => (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
          {getTypeIcon(row.type)}
          <span>{row.type || 'Flight'}</span>
        </div>
      )
    },
    {
      header: 'Contact Info',
      render: (row) => (
        <div className="text-xs text-slate-600 space-y-0.5">
          {row.contact ? (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{row.contact}</span>
            </div>
          ) : (
            <span className="text-slate-400 text-[11px]">—</span>
          )}
          {row.email && (
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Mail className="w-3 h-3 text-slate-400" />
              <span>{row.email}</span>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Total Bookings',
      render: (row) => (
        <span className="text-xs font-bold text-slate-800 font-mono">
          {row.totalBookings || 0}
        </span>
      )
    },
    {
      header: 'Total Volume (₹)',
      render: (row) => (
        <span className="text-xs font-bold text-slate-900 font-mono">
          ₹{(row.totalRevenue || 0).toLocaleString('en-IN')}
        </span>
      )
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status || 'active'} />
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEdit(row)}
            title="Edit Company"
            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteCompanyId(row.id || row._id)}
            title="Delete Company"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  // Quick stats
  const totalVolume = companies.reduce((acc, c) => acc + (c.totalRevenue || 0), 0);
  const totalBookingsCount = companies.reduce((acc, c) => acc + (c.totalBookings || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6 w-full pb-8 min-w-0">
      <PageHeader
        title="Companies & Suppliers"
        subtitle="Manage flight operators, railway networks, bus lines, hotel chains, and car rental vendors"
        icon={Building2}
        breadcrumbs={['Master', 'Companies']}
        actions={
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Add Company
          </button>
        }
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Total Companies</p>
            <p className="text-xl sm:text-2xl font-black text-slate-800 font-mono mt-0.5">{companies.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Linked Bookings</p>
            <p className="text-xl sm:text-2xl font-black text-slate-800 font-mono mt-0.5">{totalBookingsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Total Sales Volume</p>
            <p className="text-xl sm:text-2xl font-black text-brand-700 font-mono mt-0.5">₹{totalVolume.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs space-y-3">
        {/* Service Type Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold no-scrollbar">
          {[
            { id: 'all', label: 'All Categories', icon: Layers },
            { id: 'flight', label: 'Flight', icon: Plane },
            { id: 'train', label: 'Train', icon: Train },
            { id: 'bus', label: 'Bus', icon: Bus },
            { id: 'hotel', label: 'Hotel', icon: Hotel },
            { id: 'car', label: 'Car', icon: Car }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = typeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                  active
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company by name, code or country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
            />
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-36 px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={companies}
        loading={loading}
        emptyMessage="No companies found matching your filters."
      />

      {/* Add / Edit Company Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCompany ? 'Edit Company' : 'Add New Company'}
        size="md"
      >
        <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Company Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Indigo, Air India, IRCTC, Taj Hotels, RedBus, Uber"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Code / Short ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. 6E, IRCTC, TAJ, RDB, UBR"
                value={companyForm.code}
                onChange={(e) => setCompanyForm({ ...companyForm, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none uppercase font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Service Category *</label>
              <select
                value={companyForm.type}
                onChange={(e) => setCompanyForm({ ...companyForm, type: e.target.value })}
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
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone / Support</label>
              <input
                type="text"
                placeholder="e.g. +91 98..."
                value={companyForm.contact}
                onChange={(e) => setCompanyForm({ ...companyForm, contact: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Support Email</label>
              <input
                type="email"
                placeholder="e.g. support@company.com"
                value={companyForm.email}
                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Country / Region</label>
              <input
                type="text"
                value={companyForm.country}
                onChange={(e) => setCompanyForm({ ...companyForm, country: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={companyForm.status}
                onChange={(e) => setCompanyForm({ ...companyForm, status: e.target.value })}
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
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : editingCompany ? 'Update Company' : 'Create Company'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteCompanyId}
        onClose={() => setDeleteCompanyId(null)}
        onConfirm={handleDeleteCompany}
        title="Delete Company"
        message="Are you sure you want to delete this company? If it has linked bookings, it cannot be deleted."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};
