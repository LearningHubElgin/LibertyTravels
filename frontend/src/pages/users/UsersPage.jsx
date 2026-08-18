import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Edit,
  Trash2,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Power,
  Lock,
  Mail,
  User as UserIcon
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/formatters';

export const UsersPage = () => {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Create/Edit Form
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    status: 'active'
  });

  // Password reset form
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      if (res.data.success) {
        setUsers(res.data.users || []);
      }
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'admin',
      status: 'active'
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setSelectedUser(u);
    setUserForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      status: u.status
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email) {
      return toastError('Name and email are required.');
    }
    if (!selectedUser && (!userForm.password || userForm.password.length < 6)) {
      return toastError('Password must be at least 6 characters.');
    }

    setActionLoading(true);
    try {
      if (selectedUser) {
        const res = await api.put(`/users/${selectedUser.id}`, {
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
          status: userForm.status
        });
        if (res.data.success) {
          success(`User ${userForm.name} updated successfully.`);
          setIsCreateModalOpen(false);
          fetchUsers();
        }
      } else {
        const res = await api.post('/users', userForm);
        if (res.data.success) {
          success(`User account ${userForm.name} created.`);
          setIsCreateModalOpen(false);
          fetchUsers();
        }
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (u) => {
    if (u.role === 'super_admin') {
      return toastError('Super Admin accounts cannot be disabled.');
    }
    if (u.id === currentUser?.id) {
      return toastError('You cannot disable your own active session.');
    }

    try {
      const res = await api.put(`/users/${u.id}/status`);
      if (res.data.success) {
        success(`User status changed to ${res.data.user.status}`);
        fetchUsers();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      return toastError('Password must be at least 6 characters.');
    }

    setActionLoading(true);
    try {
      const res = await api.put(`/users/${selectedUser.id}/reset-password`, { newPassword });
      if (res.data.success) {
        success(`Password reset successfully for ${selectedUser.name}!`);
        setIsResetModalOpen(false);
        setNewPassword('');
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    setActionLoading(true);
    try {
      const res = await api.delete(`/users/${deleteUserId}`);
      if (res.data.success) {
        success('User account deleted.');
        setDeleteUserId(null);
        fetchUsers();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Super Admin Access Required</h3>
        <p className="text-xs text-slate-500 mt-1">
          Only Super Administrators have permission to manage ERP user credentials.
        </p>
      </div>
    );
  }

  const columns = [
    {
      header: 'Staff Member',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-tight">{row.name}</p>
            <p className="text-[11px] text-slate-500 font-mono">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Role Level',
      render: (row) => <StatusBadge status={row.role} />
    },
    {
      header: 'Account Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Last Login',
      render: (row) => (
        <span className="text-xs text-slate-700 font-mono font-semibold">
          {row.lastLogin ? formatDateTime(row.lastLogin) : 'Never'}
        </span>
      )
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.role !== 'super_admin' && (
            <button
              onClick={() => handleToggleStatus(row)}
              title={row.status === 'active' ? 'Deactivate User' : 'Activate User'}
              className={`p-1.5 rounded-lg transition ${row.status === 'active' ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
            >
              <Power className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              setSelectedUser(row);
              setIsResetModalOpen(true);
            }}
            title="Reset Password"
            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
          >
            <KeyRound className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleOpenEdit(row)}
            title="Edit User"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          >
            <Edit className="w-4 h-4" />
          </button>

          {row.role !== 'super_admin' && row.id !== currentUser?.id && (
            <button
              onClick={() => setDeleteUserId(row.id)}
              title="Delete User"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      <PageHeader
        title="User & Staff Access"
        subtitle="Manage agency staff logins, Super Admin roles and access privileges"
        icon={ShieldCheck}
        actions={
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-[10px] sm:text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 transition"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Add User
          </button>
        }
      />

      {/* Role Notice Card */}
      <div className="p-4 bg-brand-50/60 border border-brand-200/80 rounded-2xl flex items-start gap-3 text-xs text-brand-900">
        <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Strict 2-Role Security Architecture:</span>
          <p className="text-[11px] text-brand-700/90 mt-0.5">
            <strong>Super Admin:</strong> Full unrestricted system access &bull; <strong>Admin:</strong> Operational access to bookings, customers, ledger and reports.
          </p>
        </div>
      </div>

      {/* Users Data Table */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        emptyTitle="No users found"
        emptyDescription="Create Admin accounts to grant staff members access to the ERP."
        emptyAction={handleOpenCreate}
        emptyActionLabel="Add Admin User"
      />

      {/* Create / Edit User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={selectedUser ? 'Edit User Credentials' : 'Add New Admin Account'}
        subtitle="Configure name, email and role assignment"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleSaveUser}
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : selectedUser ? 'Update Account' : 'Create User'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Staff Member Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              placeholder="staff@libertytravel.com"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {!selectedUser && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Password *</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Role Permission *</label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="admin">Admin (Operational Access)</option>
                <option value="super_admin">Super Admin (Full System Access)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={userForm.status}
                onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title={`Reset Password for ${selectedUser?.name}`}
        subtitle="Set a new password for this staff member"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleResetPassword}
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {actionLoading ? 'Updating...' : 'Confirm Reset Password'}
            </button>
          </>
        }
      >
        <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Password (min. 6 chars) *</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        onConfirm={handleDeleteUser}
        title="Delete User Account"
        message="Are you sure you want to permanently remove this user account?"
        type="danger"
        loading={actionLoading}
      />
    </div>
  );
};
