import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  ShieldCheck,
  Building2,
  CheckCircle2,
  XCircle,
  KeyRound,
  UserCheck,
  User
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { DataTable } from '../../components/common/DataTable';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const SuperAdminUsersPage = () => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [users, setUsers] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    agencyId: '',
    phone: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchAgencies();
  }, [agencyFilter, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (agencyFilter !== 'all') params.agencyId = agencyFilter;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (search) params.search = search;

      const res = await api.get('/superadmin/agencies/users', { params });
      if (res.data?.success) {
        setUsers(res.data.data || []);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgencies = async () => {
    try {
      const res = await api.get('/superadmin/agencies');
      if (res.data?.success) {
        setAgencies(res.data.data || []);
      }
    } catch (err) {}
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post('/superadmin/agencies/users', formData);
      if (res.data?.success) {
        toastSuccess(res.data.message || 'User created successfully!');
        setIsAddModalOpen(false);
        setFormData({ name: '', email: '', password: '', role: 'staff', agencyId: '', phone: '' });
        fetchUsers();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setSubmitting(true);
      const uId = selectedUser._id || selectedUser.id;
      const res = await api.post(`/users/${uId}/reset-password`, { newPassword });
      if (res.data?.success) {
        toastSuccess('Password reset successfully!');
        setIsResetPasswordModalOpen(false);
        setNewPassword('');
        setSelectedUser(null);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    try {
      const uId = selectedUser._id || selectedUser.id;
      const res = await api.patch(`/users/${uId}/status`);
      if (res.data?.success) {
        toastSuccess(res.data.message || 'Status updated');
        setIsStatusConfirmOpen(false);
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const columns = [
    {
      header: 'User Name & Email',
      accessor: 'name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
            {row.name ? row.name.slice(0, 2) : 'US'}
          </div>
          <div>
            <div className="font-bold text-slate-800 text-xs">{row.name}</div>
            <div className="text-[11px] text-slate-400">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Travel Agency',
      accessor: 'agencyId',
      cell: (row) => {
        if (row.role === 'super_admin') {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <ShieldCheck className="w-3 h-3" />
              <span>Global Platform</span>
            </span>
          );
        }
        return (
          <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{row.agencyId?.name || 'Unassigned'}</span>
          </div>
        );
      }
    },
    {
      header: 'Role',
      accessor: 'role',
      cell: (row) => {
        let badgeStyle = 'bg-slate-100 text-slate-700';
        let label = 'Staff';
        if (row.role === 'super_admin') {
          badgeStyle = 'bg-purple-50 text-purple-700 border border-purple-200 font-extrabold';
          label = 'Super Admin';
        } else if (row.role === 'admin') {
          badgeStyle = 'bg-amber-50 text-amber-700 border border-amber-200 font-bold';
          label = 'Agency Admin';
        }
        return (
          <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase ${badgeStyle}`}>
            {label}
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${
            row.status === 'active'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {row.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          <span>{row.status}</span>
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setSelectedUser(row);
              setIsResetPasswordModalOpen(true);
            }}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Reset Password"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </button>
          {row.role !== 'super_admin' && (
            <button
              onClick={() => {
                setSelectedUser(row);
                setIsStatusConfirmOpen(true);
              }}
              className={`p-1.5 rounded-lg transition ${
                row.status === 'active'
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
              }`}
              title={row.status === 'active' ? 'Disable Account' : 'Enable Account'}
            >
              {row.status === 'active' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Platform User Accounts
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-100 text-purple-700">
              {users.length} Users
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage Super Admins, Travel Agency Admins, and Agency Staff across the platform
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create User</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Agency Filter */}
          <select
            value={agencyFilter}
            onChange={(e) => setAgencyFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold"
          >
            <option value="all">All Travel Agencies</option>
            {agencies.map((a) => (
              <option key={a._id || a.id} value={a._id || a.id}>
                {a.name} ({a.code})
              </option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Agency Admin</option>
            <option value="staff">Staff Operator</option>
          </select>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); fetchUsers(); }} className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold"
          />
        </form>
      </div>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        emptyTitle="No Users Found"
        emptyDescription="Create a user account to grant portal access."
      />

      {/* MODAL: Create User */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Platform User"
        size="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Ramesh Kumar"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ramesh@libertytravel.com"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              >
                <option value="staff">Agency Staff</option>
                <option value="admin">Agency Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
              />
            </div>
          </div>

          {formData.role !== 'super_admin' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assigned Travel Agency <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.agencyId}
                onChange={(e) => setFormData({ ...formData, agencyId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              >
                <option value="">-- Select Travel Agency --</option>
                {agencies.map((a) => (
                  <option key={a._id || a.id} value={a._id || a.id}>
                    {a.name} ({a.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password *</label>
            <input
              type="text"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Min 6 chars"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-semibold"
            />
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
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Reset Password */}
      {selectedUser && (
        <Modal
          isOpen={isResetPasswordModalOpen}
          onClose={() => {
            setIsResetPasswordModalOpen(false);
            setSelectedUser(null);
          }}
          title={`Reset Password: ${selectedUser.name}`}
          size="sm"
        >
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">New Password * (Min 6 chars)</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-semibold"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsResetPasswordModalOpen(false);
                  setSelectedUser(null);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-bold"
              >
                {submitting ? 'Saving...' : 'Reset Password'}
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
          setSelectedUser(null);
        }}
        onConfirm={handleToggleStatus}
        title={selectedUser?.status === 'active' ? 'Disable User Account?' : 'Enable User Account?'}
        message={`Are you sure you want to ${
          selectedUser?.status === 'active' ? 'disable' : 'enable'
        } account for "${selectedUser?.name}"?`}
        confirmText={selectedUser?.status === 'active' ? 'Disable User' : 'Enable User'}
        confirmVariant={selectedUser?.status === 'active' ? 'danger' : 'primary'}
      />
    </div>
  );
};
