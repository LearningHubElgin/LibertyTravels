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
  Compass,
  Plus,
  X,
  Banknote,
  CreditCard,
  Trash2,
  Edit2,
  Star
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';

export const SettingsPage = () => {
  const { user, isSuperAdmin, isAdmin, updateUserProfile } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState('agency'); // 'agency', 'accounts', 'invoice', 'profile'
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
    invoiceFooter: '',
    cashOpeningBalance: 0,
    bankOpeningBalance: 0,
    bankAccounts: [],
    upiMethods: []
  });
  const [upiMethodsInput, setUpiMethodsInput] = useState('');

  // Bank Account Modal State
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBankIndex, setEditingBankIndex] = useState(-1);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    openingBalance: 0,
    isDefault: false
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
          setUpiMethodsInput((res.data.settings.upiMethods || []).join(', '));
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleOpenAddBankModal = () => {
    setEditingBankIndex(-1);
    setBankForm({
      bankName: '',
      accountName: settings.agencyName || '',
      accountNumber: '',
      ifscCode: '',
      upiId: '',
      openingBalance: 0,
      isDefault: (settings.bankAccounts || []).length === 0
    });
    setIsBankModalOpen(true);
  };

  const handleOpenEditBankModal = (index) => {
    setEditingBankIndex(index);
    const bank = settings.bankAccounts[index];
    setBankForm({
      bankName: bank.bankName || '',
      accountName: bank.accountName || '',
      accountNumber: bank.accountNumber || '',
      ifscCode: bank.ifscCode || '',
      upiId: bank.upiId || '',
      openingBalance: bank.openingBalance || 0,
      isDefault: bank.isDefault || false
    });
    setIsBankModalOpen(true);
  };

  const handleSaveBankModal = (e) => {
    e.preventDefault();
    if (!bankForm.bankName.trim()) return toastError('Bank name is required');

    const updatedBanks = [...(settings.bankAccounts || [])];
    const newBankObj = {
      id: editingBankIndex >= 0 ? updatedBanks[editingBankIndex].id : Date.now().toString(),
      ...bankForm,
      openingBalance: parseFloat(bankForm.openingBalance) || 0
    };

    if (bankForm.isDefault) {
      updatedBanks.forEach(b => b.isDefault = false);
    }

    if (editingBankIndex >= 0) {
      updatedBanks[editingBankIndex] = newBankObj;
    } else {
      updatedBanks.push(newBankObj);
    }

    setSettings(prev => ({
      ...prev,
      bankAccounts: updatedBanks,
      bankOpeningBalance: updatedBanks.reduce((sum, b) => sum + (parseFloat(b.openingBalance) || 0), 0)
    }));

    setIsBankModalOpen(false);
    success(editingBankIndex >= 0 ? 'Bank account updated.' : 'Bank account added to list.');
  };

  const handleDeleteBank = (index) => {
    const updatedBanks = settings.bankAccounts.filter((_, i) => i !== index);
    setSettings(prev => ({
      ...prev,
      bankAccounts: updatedBanks,
      bankOpeningBalance: updatedBanks.reduce((sum, b) => sum + (parseFloat(b.openingBalance) || 0), 0)
    }));
    success('Bank account removed.');
  };

  const handleSetDefaultBank = (index) => {
    const updatedBanks = settings.bankAccounts.map((b, i) => ({
      ...b,
      isDefault: i === index
    }));
    setSettings(prev => ({
      ...prev,
      bankAccounts: updatedBanks
    }));
  };

  const handleSaveAgencySettings = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      return toastError('Only Admins can modify agency settings.');
    }

    setSaving(true);
    try {
      const methodsArray = upiMethodsInput.split(',').map(m => m.trim()).filter(m => m !== '');
      const payload = { ...settings, upiMethods: methodsArray };
      const res = await api.put('/settings', payload);
      if (res.data.success) {
        setSettings(res.data.settings);
        success('Agency & financial settings saved successfully!');
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
        setProfileForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleUpiMethodsChange = (e) => {
    setUpiMethodsInput(e.target.value);
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading agency settings..." />;

  return (
    <div className="space-y-4 sm:space-y-6 w-full pb-8 sm:pb-12 min-w-0">
      <PageHeader
        title="Agency & Financial Settings"
        subtitle="Manage agency profile, bank accounts & opening balances, invoice headers, GST credentials and security"
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
          onClick={() => setActiveTab('accounts')}
          className={`pb-3 sm:pb-4 transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'accounts'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Bank & Cash Accounts
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
                  disabled={!isAdmin}
                  value={settings.agencyName}
                  onChange={(e) => setSettings({ ...settings, agencyName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tagline / Brand Slogan</label>
                <input
                  type="text"
                  disabled={!isAdmin}
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
                disabled={!isAdmin}
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
                  disabled={!isAdmin}
                  value={settings.phone || ''}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Email Address</label>
                <input
                  type="email"
                  disabled={!isAdmin}
                  value={settings.email || ''}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
                <input
                  type="text"
                  disabled={!isAdmin}
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
                  disabled={!isAdmin}
                  value={settings.gstNumber || ''}
                  onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">PAN Number</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={settings.panNumber || ''}
                  onChange={(e) => setSettings({ ...settings, panNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 font-mono uppercase"
                />
              </div>
            </div>

            {isAdmin && (
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-600/20 flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Agency Profile'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab 2: Bank & Cash Accounts Manager */}
      {activeTab === 'accounts' && (
        <div className="bg-white p-3.5 sm:p-8 rounded-b-xl sm:rounded-b-2xl border border-slate-200 shadow-xs -mt-4 sm:-mt-6 w-full min-w-0 space-y-6 text-xs">
          <form onSubmit={handleSaveAgencySettings} className="space-y-6">
            {/* Cash Counter Section */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 rounded-xl border border-emerald-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Cash Counter / Register Opening Balance</h3>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Starting cash in hand at the agency counter before recorded operations.
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-64 shrink-0">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Cash Opening Balance (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={!isAdmin}
                    value={settings.cashOpeningBalance || 0}
                    onChange={(e) => setSettings({ ...settings, cashOpeningBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Bank Accounts Section */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-brand-600" /> Agency Bank Accounts
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Configure your agency bank accounts (e.g. HDFC, PNB, SBI) with opening balances.
                  </p>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleOpenAddBankModal}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition shadow-xs self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Bank Account
                  </button>
                )}
              </div>

              {/* Bank Accounts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(settings.bankAccounts || []).length > 0 ? (
                  settings.bankAccounts.map((bank, idx) => (
                    <div
                      key={bank.id || idx}
                      className={`p-4 rounded-xl border transition relative bg-white ${
                        bank.isDefault
                          ? 'border-brand-300 bg-brand-50/20 ring-1 ring-brand-400/30'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              {bank.bankName}
                              {bank.isDefault && (
                                <span className="px-1.5 py-0.5 bg-brand-50 text-brand-700 border border-brand-200 rounded text-[9px] font-bold">
                                  Default
                                </span>
                              )}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-mono">
                              A/C: {bank.accountNumber || 'Not specified'}
                            </p>
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSetDefaultBank(idx)}
                              className={`p-1.5 rounded-lg transition ${
                                bank.isDefault
                                  ? 'text-amber-500'
                                  : 'text-slate-300 hover:text-amber-500'
                              }`}
                              title={bank.isDefault ? 'Default Account' : 'Set as Default'}
                            >
                              <Star className={`w-3.5 h-3.5 ${bank.isDefault ? 'fill-amber-500' : ''}`} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditBankModal(idx)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
                              title="Edit Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBank(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 text-[9px] block uppercase font-bold">IFSC / UPI ID</span>
                          <span className="font-mono text-slate-700 font-semibold truncate block">
                            {bank.upiId || bank.ifscCode || '-'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 text-[9px] block uppercase font-bold">Opening Balance</span>
                          <span className="font-mono text-slate-900 font-black">
                            ₹{parseFloat(bank.openingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-6 rounded-xl border border-dashed border-slate-200 text-center bg-slate-50/50">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">No specific bank accounts added yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Add accounts like HDFC, PNB, SBI to split customer payments and track per-bank balances.
                    </p>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={handleOpenAddBankModal}
                        className="mt-3 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg transition shadow-2xs inline-flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add First Bank Account
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Supported UPI Methods Section */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="block font-bold text-slate-800 text-xs">
                Supported UPI & Payment Apps (Comma Separated)
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                placeholder="e.g. PhonePe, Google Pay, Paytm, BHIM, Amazon Pay, PayPal, Cred"
                value={upiMethodsInput}
                onChange={handleUpiMethodsChange}
                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-xs"
              />
              <p className="text-[10px] text-slate-500">
                These apps will appear in POS split payment dropdowns when receiving UPI payments.
              </p>
            </div>

            {isAdmin && (
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-600/20 flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Bank & Cash Settings'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab 3: Invoice & Terms Settings */}
      {activeTab === 'invoice' && (
        <div className="bg-white p-6 sm:p-8 rounded-b-2xl border border-slate-200 shadow-xs -mt-6">
          <form onSubmit={handleSaveAgencySettings} className="space-y-6 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Invoice Prefix *</label>
                <input
                  type="text"
                  required
                  disabled={!isAdmin}
                  value={settings.invoicePrefix}
                  onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Next Sequence Number</label>
                <input
                  type="number"
                  disabled={!isAdmin}
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
                disabled={!isAdmin}
                value={settings.termsAndConditions || ''}
                onChange={(e) => setSettings({ ...settings, termsAndConditions: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Invoice Footer Greeting</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.invoiceFooter || ''}
                onChange={(e) => setSettings({ ...settings, invoiceFooter: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100"
              />
            </div>

            {isAdmin && (
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-600/20 flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Invoice Settings'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab 4: My Profile & Password */}
      {activeTab === 'profile' && (
        <div className="bg-white p-6 sm:p-8 rounded-b-2xl border border-slate-200 shadow-xs -mt-6 space-y-8">
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

      {/* Add / Edit Bank Modal */}
      <Modal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        title={editingBankIndex >= 0 ? 'Edit Bank Account' : 'Add New Bank Account'}
      >
        <form onSubmit={handleSaveBankModal} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Bank Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. HDFC Bank, Punjab National Bank (PNB), SBI"
              value={bankForm.bankName}
              onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Account Holder Name</label>
              <input
                type="text"
                placeholder="e.g. Liberty Tours & Travels"
                value={bankForm.accountName}
                onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
              <input
                type="text"
                placeholder="e.g. 50200012345678"
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                placeholder="e.g. HDFC0001234"
                value={bankForm.ifscCode}
                onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">UPI ID / VPA</label>
              <input
                type="text"
                placeholder="e.g. libertytravels@hdfcbank"
                value={bankForm.upiId}
                onChange={(e) => setBankForm({ ...bankForm, upiId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Opening Balance (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={bankForm.openingBalance}
              onChange={(e) => setBankForm({ ...bankForm, openingBalance: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono font-bold"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Initial ledger balance for this bank before incoming/outgoing transactions.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isDefault"
              checked={bankForm.isDefault}
              onChange={(e) => setBankForm({ ...bankForm, isDefault: e.target.checked })}
              className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
            />
            <label htmlFor="isDefault" className="text-xs text-slate-700 font-medium cursor-pointer">
              Set as Default Bank Account for transactions
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsBankModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              {editingBankIndex >= 0 ? 'Update Account' : 'Add Bank Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
