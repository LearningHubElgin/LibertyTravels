import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  ArrowLeft,
  ExternalLink,
  Plus,
  Mail,
  Phone,
  MapPin,
  FileText,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Settings,
  Calendar,
  Lock
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';

export const AgencyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const [agency, setAgency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'bookings' | 'settings'

  // Add Staff Modal
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [submittingUser, setSubmittingUser] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'staff'
  });

  useEffect(() => {
    fetchAgencyDetails();
  }, [id]);

  const fetchAgencyDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/superadmin/agencies/${id}`);
      if (res.data?.success) {
        setAgency(res.data.data);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to fetch agency details');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToAgency = () => {
    localStorage.setItem('liberty_active_agency', id);
    api.defaults.headers.common['x-agency-id'] = id;
    toastSuccess(`Switched workspace to ${agency?.name}!`);
    navigate('/dashboard');
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      setSubmittingUser(true);
      const res = await api.post('/superadmin/agencies/users', {
        ...userFormData,
        agencyId: id
      });
      if (res.data?.success) {
        toastSuccess('User account created for agency!');
        setIsAddUserModalOpen(false);
        setUserFormData({ name: '', email: '', password: '', phone: '', role: 'staff' });
        fetchAgencyDetails();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to create agency user');
    } finally {
      setSubmittingUser(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading Travel Agency Profile..." />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800">Agency Not Found</h2>
        <button
          onClick={() => navigate('/superadmin/agencies')}
          className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Agencies
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/superadmin/agencies')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                {agency.name}
              </h1>
              <span className="font-mono font-bold text-xs uppercase px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200">
                {agency.code}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {agency.city ? `${agency.city}, ` : ''}{agency.country || 'India'} • Joined on {new Date(agency.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSwitchToAgency}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition active:scale-95"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open ERP Workspace</span>
          </button>
        </div>
      </div>

      {/* Agency KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Bookings</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-800">
            {agency.stats?.totalBookings || 0}
          </div>
          <span className="text-xs text-slate-400">Total flight & travel bookings</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Sales Revenue</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-800 font-mono text-emerald-600">
            {formatCurrency(agency.stats?.totalSales)}
          </div>
          <span className="text-xs text-slate-400">Gross booking value</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Payments Collected</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-800 font-mono text-brand-600">
            {formatCurrency(agency.stats?.totalCollected)}
          </div>
          <span className="text-xs text-slate-400">Received customer payments</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Team Members</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-800">
            {agency.users?.length || 0}
          </div>
          <span className="text-xs text-slate-400">Admins and staff users</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 flex items-center gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-brand-600 text-brand-700 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff & Admin Accounts ({agency.users?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-4 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'bookings'
                ? 'border-brand-600 text-brand-700 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Recent Bookings</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-4 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'border-brand-600 text-brand-700 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Agency Profile & Settings</span>
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {/* TAB 1: USERS */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Assigned Team Members</h3>
                <button
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Staff User</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                {(!agency.users || agency.users.length === 0) ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No users assigned yet. Click "Add Staff User" to create an account.
                  </div>
                ) : (
                  agency.users.map((u) => (
                    <div key={u._id || u.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
                          {u.name ? u.name.slice(0, 2) : 'US'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-xs">{u.name}</div>
                          <div className="text-[11px] text-slate-400">{u.email} • {u.phone || 'No phone'}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {u.role === 'admin' ? 'Agency Admin' : 'Staff'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${
                          u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {u.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Recent Agency Bookings</h3>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                {(!agency.recentBookings || agency.recentBookings.length === 0) ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No bookings created by this agency yet.
                  </div>
                ) : (
                  agency.recentBookings.map((b) => (
                    <div key={b._id || b.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition text-xs">
                      <div>
                        <div className="font-mono font-bold text-slate-800">{b.referenceNo}</div>
                        <div className="text-slate-400 text-[11px]">
                          {b.passengerName} • {b.sector || b.description || 'Travel Booking'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-800">{formatCurrency(b.totalAmount)}</div>
                        <span className={`text-[10px] font-bold capitalize px-1.5 py-0.2 rounded ${
                          b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PROFILE & INVOICE SETTINGS */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-800 text-sm">Business Contact Info</h4>
                <div><strong>Email:</strong> {agency.email}</div>
                <div><strong>Phone:</strong> {agency.phone}</div>
                <div><strong>Address:</strong> {agency.address || 'Not specified'}</div>
                <div><strong>GST Number:</strong> {agency.gstNumber || 'N/A'}</div>
                <div><strong>PAN Number:</strong> {agency.panNumber || 'N/A'}</div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-800 text-sm">Invoice Configuration</h4>
                <div><strong>Invoice Prefix:</strong> {agency.invoiceSettings?.prefix || 'INV-2026-'}</div>
                <div><strong>Next Number:</strong> {agency.invoiceSettings?.nextNumber || 1001}</div>
                <div><strong>Terms:</strong> {agency.invoiceSettings?.terms || 'Standard agency terms'}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Add Staff for this Agency */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title={`Add User for ${agency.name}`}
        size="md"
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">User Full Name *</label>
            <input
              type="text"
              required
              value={userFormData.name}
              onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
              placeholder="e.g. Ramesh Kumar"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={userFormData.email}
              onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
              placeholder="ramesh@agency.com"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Role *</label>
              <select
                value={userFormData.role}
                onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              >
                <option value="staff">Staff Operator</option>
                <option value="admin">Agency Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                value={userFormData.phone}
                onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password * (Min 6 chars)</label>
            <input
              type="password"
              required
              minLength={6}
              value={userFormData.password}
              onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
              placeholder="Password123"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-semibold"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddUserModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingUser}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              {submittingUser ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
