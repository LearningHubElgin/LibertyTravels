import React, { useState, useEffect } from 'react';
import {
  Plane,
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Globe2,
  CheckCircle2,
  XCircle,
  TrendingUp
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const AirlinesPage = () => {
  const { success, error: toastError } = useToast();

  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAirline, setEditingAirline] = useState(null);
  const [deleteAirlineId, setDeleteAirlineId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [airlineForm, setAirlineForm] = useState({
    name: '',
    code: '',
    country: 'India',
    contact: '',
    status: 'active'
  });

  const fetchAirlines = async () => {
    setLoading(true);
    try {
      let query = '';
      if (search) query += `search=${encodeURIComponent(search)}&`;
      if (statusFilter) query += `status=${statusFilter}&`;

      const res = await api.get(`/airlines?${query}`);
      if (res.data.success) {
        setAirlines(res.data.airlines || []);
      }
    } catch (e) {
      console.error('Failed to load airlines:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAirlines();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAirlines();
  };

  const handleOpenCreate = () => {
    setEditingAirline(null);
    setAirlineForm({
      name: '',
      code: '',
      country: 'India',
      contact: '',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a) => {
    setEditingAirline(a);
    setAirlineForm({
      name: a.name,
      code: a.code,
      country: a.country || 'India',
      contact: a.contact || '',
      status: a.status || 'active'
    });
    setIsModalOpen(true);
  };

  const handleSaveAirline = async (e) => {
    e.preventDefault();
    if (!airlineForm.name || !airlineForm.code) {
      return toastError('Airline Name and Code are required.');
    }

    setActionLoading(true);
    try {
      if (editingAirline) {
        const res = await api.put(`/airlines/${editingAirline.id}`, airlineForm);
        if (res.data.success) {
          success(`Airline ${airlineForm.name} updated.`);
          setIsModalOpen(false);
          fetchAirlines();
        }
      } else {
        const res = await api.post('/airlines', airlineForm);
        if (res.data.success) {
          success(`Airline ${airlineForm.name} created.`);
          setIsModalOpen(false);
          fetchAirlines();
        }
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save airline');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAirline = async () => {
    if (!deleteAirlineId) return;
    setActionLoading(true);
    try {
      const res = await api.delete(`/airlines/${deleteAirlineId}`);
      if (res.data.success) {
        success('Airline deleted successfully.');
        setDeleteAirlineId(null);
        fetchAirlines();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Cannot delete airline with bookings.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (val) => `₹${parseFloat(val || 0).toLocaleString('en-IN')}`;

  const columns = [
    {
      header: 'Code',
      accessor: 'code',
      render: (row) => (
        <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 border border-brand-200">
          {row.code}
        </span>
      )
    },
    {
      header: 'Airline Partner',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 leading-tight text-sm">{row.name}</p>
          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
            <Globe2 className="w-3 h-3 text-slate-400" /> {row.country || 'Global'}
          </p>
        </div>
      )
    },
    {
      header: 'Contact Support',
      render: (row) => (
        <span className="text-slate-600 font-mono text-xs flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-slate-400" /> {row.contact || 'N/A'}
        </span>
      )
    },
    {
      header: 'Total Bookings',
      accessor: 'totalBookings',
      className: 'text-center',
      cellClassName: 'text-center font-bold font-mono text-slate-900',
      render: (row) => row.totalBookings || 0
    },
    {
      header: 'Total Revenue',
      className: 'text-right',
      cellClassName: 'text-right font-mono font-bold text-emerald-600',
      render: (row) => formatCurrency(row.totalRevenue)
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEdit(row)}
            title="Edit Airline"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteAirlineId(row.id)}
            title="Delete Airline"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
        title="Airlines Directory"
        subtitle="Manage GDS airline partners, booking volume and commercial codes"
        icon={Plane}
        actions={
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-[10px] sm:text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 transition"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Add Airline
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs w-full min-w-0">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search airline by name, IATA code (e.g. 6E, AI, EK)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-[11px] sm:text-xs border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs border border-slate-200 rounded-lg sm:rounded-xl bg-white focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            type="submit"
            className="px-3 py-1.5 sm:px-5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] sm:text-xs font-semibold rounded-lg sm:rounded-xl transition shrink-0"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                fetchAirlines();
              }}
              className="px-2 py-1 text-[10px] sm:text-xs font-semibold text-slate-500 hover:text-slate-800 shrink-0"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Airlines Data Table */}
      <DataTable
        columns={columns}
        data={airlines}
        loading={loading}
        emptyTitle="No airlines found"
        emptyDescription="Add airline partners to allow flight booking reservations."
        emptyAction={handleOpenCreate}
        emptyActionLabel="Add Airline"
      />

      {/* Create / Edit Airline Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAirline ? 'Edit Airline' : 'Add Airline Partner'}
        subtitle="Specify IATA code, country and customer care details"
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
              onClick={handleSaveAirline}
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : editingAirline ? 'Update Airline' : 'Add Airline'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveAirline} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Airline Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. IndiGo Airlines"
                value={airlineForm.name}
                onChange={(e) => setAirlineForm({ ...airlineForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Airline IATA Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. 6E, AI, EK"
                value={airlineForm.code}
                onChange={(e) => setAirlineForm({ ...airlineForm, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none uppercase font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Base Country</label>
              <input
                type="text"
                placeholder="e.g. India, UAE"
                value={airlineForm.country}
                onChange={(e) => setAirlineForm({ ...airlineForm, country: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={airlineForm.status}
                onChange={(e) => setAirlineForm({ ...airlineForm, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Customer / Agency Helpdesk Contact</label>
            <input
              type="text"
              placeholder="+91..."
              value={airlineForm.contact}
              onChange={(e) => setAirlineForm({ ...airlineForm, contact: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none font-mono"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteAirlineId}
        onClose={() => setDeleteAirlineId(null)}
        onConfirm={handleDeleteAirline}
        title="Delete Airline"
        message="Are you sure you want to delete this airline partner? Deletion will be rejected if existing bookings depend on this airline."
        type="danger"
        loading={actionLoading}
      />
    </div>
  );
};
