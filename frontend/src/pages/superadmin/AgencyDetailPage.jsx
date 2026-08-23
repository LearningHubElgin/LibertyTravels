import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  ArrowLeft,
  Plus,
  Edit2,
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

  // Add Admin User Modal
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [submittingUser, setSubmittingUser] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'admin'
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

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      setSubmittingUser(true);
      const res = await api.post('/superadmin/agencies/users', {
        ...userFormData,
        agencyId: id
      });
      if (res.data?.success) {
        toastSuccess('Agency user added successfully!');
        setIsAddUserModalOpen(false);
        setUserFormData({
          name: '',
          email: '',
          password: '',
          phone: '',
          role: 'admin'
        });
        fetchAgencyDetails();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to add user');
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
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" text="Loading Agency profile..." />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-700">Agency Not Found</h3>
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
    <div className="space-y-3.5 sm:space-y-5 pb-8">
      {/* Back button & Action Header */}
      <div className="flex flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => navigate('/superadmin/agencies')}
            className="p-1.5 sm:p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-xl font-black text-slate-800 tracking-tight truncate">
                {agency.name}
              </h1>
              <span className="font-mono font-bold text-[10px] uppercase px-1.5 py-0.2 rounded-md bg-brand-50 text-brand-700 border border-brand-200 shrink-0">
                {agency.code}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 truncate">
              {agency.city ? `${agency.city}, ` : ''}{agency.country || 'India'} • {agency.plan || 'Professional'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate(`/superadmin/agencies/${id}/edit`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition active:scale-95"
          >
            <Edit2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Edit Agency</span>
          </button>

          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm shadow-brand-600/20 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Admin</span>
          </button>
        </div>
      </div>

      {/* Agency KPI Cards: High-Density Extra-Compact 2x2 on Mobile, 4x1 on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5">
        {/* Bookings (Sky Blue) */}
        <div className="bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-white p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-sky-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">Bookings</span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-2xs">
              <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="mt-1 sm:mt-2 text-base sm:text-2xl font-black text-slate-900 leading-tight">
            {agency.stats?.totalBookings || 0}
          </div>
          <span className="text-[9px] sm:text-[10px] text-slate-400 truncate block mt-0.5">Total trips booked</span>
        </div>

        {/* Sales Revenue (Emerald Green) */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">Gross Sales</span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="mt-1 sm:mt-2 text-sm sm:text-xl font-black text-slate-900 font-mono truncate leading-tight">
            {formatCurrency(agency.stats?.totalSales)}
          </div>
          <span className="text-[9px] sm:text-[10px] text-slate-400 truncate block mt-0.5">Total gross volume</span>
        </div>

        {/* Collected (Purple) */}
        <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-white p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-purple-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[11px] font-extrabold text-purple-800 uppercase tracking-wider">Collected</span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-2xs">
              <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="mt-1 sm:mt-2 text-sm sm:text-xl font-black text-slate-900 font-mono truncate leading-tight">
            {formatCurrency(agency.stats?.totalCollected)}
          </div>
          <span className="text-[9px] sm:text-[10px] text-slate-400 truncate block mt-0.5">Customer payments</span>
        </div>

        {/* Users (Amber) */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[11px] font-extrabold text-amber-900 uppercase tracking-wider">Team</span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shadow-2xs font-bold">
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="mt-1 sm:mt-2 text-base sm:text-2xl font-black text-slate-900 leading-tight">
            {agency.users?.length || 0}
          </div>
          <span className="text-[9px] sm:text-[10px] text-slate-400 truncate block mt-0.5">Agency admins</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="border-b border-slate-100 px-3 sm:px-5 flex items-center gap-3 sm:gap-6 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2.5 sm:py-3.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap text-[11px] sm:text-xs ${
              activeTab === 'users'
                ? 'border-brand-600 text-brand-700 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Admins ({agency.users?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-2.5 sm:py-3.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap text-[11px] sm:text-xs ${
              activeTab === 'bookings'
                ? 'border-brand-600 text-brand-700 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
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
                <h3 className="text-sm font-bold text-slate-800">Assigned Agency Admins</h3>
                <button
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Admin User</span>
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
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                          Agency Admin
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
              <input
                type="text"
                readOnly
                value="Agency Admin"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700"
              />
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
