import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  FileText,
  User,
  Save,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  Compass
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const SettingsPage = () => {
  const { user, isSuperAdmin, updateUserProfile } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState('agency'); // 'agency', 'invoice', 'profile'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Agency & Invoice Settings
  const [settings, setSettings] = useState({
    agencyName: 'Liberty Tours & Travels',
    tagline: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    gstNumber: '',
    panNumber: '',
    invoicePrefix: 'INV-2026-',
    invoiceNextNumber: 1001,
    termsAndConditions: '',
    invoiceFooter: ''
  });

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await api.get('/settings');
        if (res.data.success && res.data.settings) {
          setSettings(res.data.settings);
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveAgencySettings = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      return toastError('Only Super Admin can modify agency and invoice settings.');
    }

    setSaving(true);
    try {
      const res = await api.put('/settings', settings);
      if (res.data.success) {
        success('Agency & invoice settings saved successfully.');
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', {
        name: profileForm.name,
        email: profileForm.email
      });
      if (res.data.success) {
        updateUserProfile(res.data.user);
        success('Personal profile updated successfully.');
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (profileForm.newPassword !== profileForm.confirmPassword) {
      return toastError('New passwords do not match.');
    }
    if (profileForm.newPassword.length < 6) {
      return toastError('New password must be at least 6 characters long.');
    }

    setSaving(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: profileForm.currentPassword,
        newPassword: profileForm.newPassword
      });
      if (res.data.success) {
        success('Password changed successfully.');
        setProfileForm((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading agency settings..." />;

  return (
    <div className="space-y-4 sm:space-y-6 w-full pb-8 sm:pb-12 min-w-0">
      <PageHeader
        title="Agency & System Settings"
        subtitle="Configure agency master profile, invoice headers, GST credentials, terms and personal account"
        icon={Settings}
      />

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-3 sm:gap-8 text-xs sm:text-sm font-bold bg-white px-3 sm:px-6 pt-3 sm:pt-4 rounded-t-xl sm:rounded-t-2xl border border-b-0 border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('agency')}
          className={`pb-3 sm:pb-4 transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'agency'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Agency Information
        </button>

        <button
          onClick={() => setActiveTab('invoice')}
          className={`pb-3 sm:pb-4 transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'invoice'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Invoice & Terms
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 sm:pb-4 transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Profile & Security
        </button>
      </div>

      {/* Tab 1: Agency Information */}
      {activeTab === 'agency' && (
        <div className="bg-white p-3.5 sm:p-8 rounded-b-xl sm:rounded-b-2xl border border-slate-200 shadow-xs -mt-4 sm:-mt-6 w-full min-w-0">
          <form onSubmit={handleSaveAgencySettings} className="space-y-4 sm:space-y-6 text-[11px] sm:text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Agency Legal Name *</label>
                <input
                  type="text"
                  required
                  disabled={!isSuperAdmin}
                  value={settings.agencyName}
                  onChange={(e) => setSettings({ ...settings, agencyName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tagline / Brand Slogan</label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  placeholder="e.g. Your Trusted Travel Partner"
                  value={settings.tagline || ''}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Registered Address *</label>
              <textarea
                rows="2"
                required
                disabled={!isSuperAdmin}
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Phone Numbers</label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings.phone || ''}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Email Address</label>
                <input
                  type="email"
                  disabled={!isSuperAdmin}
                  value={settings.email || ''}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings.website || ''}
                  onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">GSTIN Number (Tax Identifier)</label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings.gstNumber || ''}
                  onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">PAN Number</label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings.panNumber || ''}
                  onChange={(e) => setSettings({ ...settings, panNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 font-mono uppercase"
                />
              </div>
            </div>

            {isSuperAdmin && (
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-600/20 flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Agency Information'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab 2: Invoice & Terms Settings */}
      {activeTab === 'invoice' && (
        <div className="bg-white p-6 sm:p-8 rounded-b-2xl border border-slate-200 shadow-xs -mt-6">
          <form onSubmit={handleSaveAgencySettings} className="space-y-6 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Invoice Prefix *</label>
                <input
                  type="text"
                  required
                  disabled={!isSuperAdmin}
                  value={settings.invoicePrefix}
                  onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Next Sequence Number</label>
                <input
                  type="number"
                  disabled={!isSuperAdmin}
                  value={settings.invoiceNextNumber}
                  onChange={(e) => setSettings({ ...settings, invoiceNextNumber: parseInt(e.target.value, 10) || 1001 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Terms & Conditions (Appears on Invoices)</label>
              <textarea
                rows="4"
                disabled={!isSuperAdmin}
                value={settings.termsAndConditions || ''}
                onChange={(e) => setSettings({ ...settings, termsAndConditions: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Invoice Footer Greeting</label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings.invoiceFooter || ''}
                onChange={(e) => setSettings({ ...settings, invoiceFooter: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100"
              />
            </div>

            {isSuperAdmin && (
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-600/20 flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Invoice Configuration'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab 3: My Profile & Password */}
      {activeTab === 'profile' && (
        <div className="bg-white p-6 sm:p-8 rounded-b-2xl border border-slate-200 shadow-xs -mt-6 space-y-8">
          {/* Profile Details */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-600" /> Account Profile Details
            </h3>
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Role Assignment</label>
                <input
                  type="text"
                  disabled
                  value={user?.role === 'super_admin' ? 'Super Admin (Full Unrestricted Access)' : 'Admin (Operational Access)'}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-100 text-slate-600 rounded-xl cursor-not-allowed font-medium"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                >
                  Update Profile Details
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-brand-600" /> Change Security Password
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4 text-xs max-w-md">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  value={profileForm.currentPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password (min 6 characters) *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={profileForm.newPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={profileForm.confirmPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
