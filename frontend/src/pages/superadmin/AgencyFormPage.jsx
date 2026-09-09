import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Save,
  Upload,
  Image as ImageIcon,
  Camera,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  FileText,
  CreditCard,
  Mail,
  Phone,
  Globe,
  MapPin,
  Sparkles,
  Receipt,
  UserCheck,
  KeyRound,
  Eye,
  EyeOff,
  Plus
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const AgencyFormPage = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    tagline: '',
    logo: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'India',
    website: '',
    gstNumber: '',
    panNumber: '',
    plan: 'professional',
    status: 'active',
    notes: '',
    // Initial Admin fields (for Create mode)
    adminName: '',
    adminEmail: '',
    adminPassword: 'agency123',
    adminPhone: '',
    // Contact Person fields (for Edit mode)
    contactPerson: {
      name: '',
      phone: '',
      email: '',
      designation: ''
    },
    // Invoice Settings
    invoiceSettings: {
      prefix: '',
      nextNumber: 1001,
      terms: '1. Service cancellation and date change charges apply as per company policy.\n2. Please carry valid Govt ID / Passport for travel.',
      footer: 'Thank you for traveling with us. Have a pleasant and safe journey!'
    }
  });

  useEffect(() => {
    if (isEditMode) {
      fetchAgencyDetails();
    }
  }, [id]);

  const fetchAgencyDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/superadmin/agencies/${id}`);
      if (res.data?.success) {
        const a = res.data.data;
        const primaryAdmin = a.adminUser || (a.users && a.users.find(u => u.role === 'admin')) || a.users?.[0];
        setFormData({
          name: a.name || '',
          code: a.code || '',
          tagline: a.tagline || '',
          logo: a.logo || '',
          email: a.email || '',
          phone: a.phone || '',
          address: a.address || '',
          city: a.city || '',
          country: a.country || 'India',
          website: a.website || '',
          gstNumber: a.gstNumber || '',
          panNumber: a.panNumber || '',
          status: a.status || 'active',
          plan: a.plan || 'professional',
          notes: a.notes || '',
          adminName: primaryAdmin?.name || a.contactPerson?.name || '',
          adminEmail: primaryAdmin?.email || a.contactPerson?.email || a.email || '',
          adminPassword: '',
          adminPhone: primaryAdmin?.phone || a.contactPerson?.phone || a.phone || '',
          contactPerson: {
            name: a.contactPerson?.name || '',
            phone: a.contactPerson?.phone || '',
            email: a.contactPerson?.email || '',
            designation: a.contactPerson?.designation || ''
          },
          invoiceSettings: {
            prefix: a.invoiceSettings?.prefix || `${a.code || 'TRV'}-INV-`,
            nextNumber: a.invoiceSettings?.nextNumber || 1001,
            terms: a.invoiceSettings?.terms || '',
            footer: a.invoiceSettings?.footer || ''
          }
        });
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load travel agency');
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (nameVal) => {
    const updated = { name: nameVal };
    if (!isEditMode && (!formData.code || formData.code.length <= 4)) {
      const generatedCode = nameVal
        .replace(/[^a-zA-Z]/g, '')
        .slice(0, 5)
        .toUpperCase();
      if (generatedCode) {
        updated.code = generatedCode;
        updated.invoiceSettings = {
          ...formData.invoiceSettings,
          prefix: `${generatedCode}-INV-`
        };
      }
    }
    setFormData((prev) => ({ ...prev, ...updated }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toastError('Image size exceeds 2MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, logo: reader.result }));
      toastSuccess('Agency logo loaded successfully');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logo: '' }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim()) {
      toastError('Please enter the Travel Agency Name.');
      return;
    }
    if (!formData.code.trim()) {
      toastError('Please enter a unique 3-6 letter Agency Code.');
      return;
    }
    if (!formData.email.trim()) {
      toastError('Please enter the official Agency Email.');
      return;
    }
    if (!formData.phone.trim()) {
      toastError('Please enter the official Agency Phone.');
      return;
    }
    if (!isEditMode && (!formData.adminPassword || formData.adminPassword.trim().length < 6)) {
      toastError('Initial admin password must be at least 6 characters.');
      return;
    }
    if (isEditMode && formData.adminPassword && formData.adminPassword.trim().length > 0 && formData.adminPassword.trim().length < 6) {
      toastError('Admin password must be at least 6 characters.');
      return;
    }

    try {
      setSubmitting(true);
      let res;
      if (isEditMode) {
        res = await api.put(`/superadmin/agencies/${id}`, formData);
      } else {
        res = await api.post('/superadmin/agencies', formData);
      }

      if (res.data?.success) {
        toastSuccess(
          isEditMode
            ? `Agency "${formData.name}" updated successfully!`
            : `Travel Agency "${formData.name}" onboarded successfully!`
        );
        navigate('/superadmin/agencies');
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save travel agency');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAgency = async () => {
    try {
      setSubmitting(true);
      const res = await api.delete(`/superadmin/agencies/${id}`);
      if (res.data?.success) {
        toastSuccess('Travel Agency deleted successfully');
        navigate('/superadmin/agencies');
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to delete travel agency');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" text="Loading Agency workspace configuration..." />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-24">
      {/* 1. Header Banner with Deep Navy Gradient */}
      <div className="flex flex-row items-center justify-between gap-3 bg-gradient-to-r from-[#0B1E36] via-[#102A4C] to-[#1E3A5F] p-4 sm:p-5 rounded-2xl text-white shadow-md border border-slate-800">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/superadmin/agencies')}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition shrink-0 border border-white/20"
            title="Back to Agencies"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl font-black tracking-tight truncate text-white">
                {isEditMode ? `Edit ${formData.name || 'Agency'}` : 'Register New Travel Agency'}
              </h1>
              <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-amber-400 text-slate-950 shrink-0 uppercase shadow-2xs">
                {formData.code || (isEditMode ? 'TRV' : 'NEW')}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-300 truncate mt-0.5">
              {isEditMode
                ? 'Configure branding, official address, tax settings & invoice customizations'
                : 'Initialize a dedicated multi-tenant workspace, upload logo & create initial Administrator'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isEditMode && formData.code?.toUpperCase() !== 'LIBERTY' && (
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/30 transition inline-flex items-center gap-1.5"
              title="Delete Agency"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete Agency</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/superadmin/agencies')}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition hidden sm:inline-flex"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition"
          >
            {isEditMode ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 stroke-[3]" />}
            <span>
              {submitting
                ? isEditMode
                  ? 'Saving...'
                  : 'Registering...'
                : isEditMode
                ? 'Save Changes'
                : 'Register Agency'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Structured Continuous Form Sections */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        
        {/* ========================================================================= */}
        {/* SECTION 1: Agency Brand & Identity (Brand Blue Theme)                     */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border-2 border-brand-200/90 shadow-sm overflow-hidden transition hover:shadow-md">
          <div className="bg-gradient-to-r from-brand-600/10 via-brand-500/5 to-transparent px-4 sm:px-6 py-3.5 border-b border-brand-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                1
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-brand-950 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-brand-600" />
                  <span>Agency Information & Branding</span>
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-500">
                  Official travel agency name, unique code, slogan, and workspace logo
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-100/80 px-2 py-0.5 rounded-md hidden sm:inline-block">
              Core Identity
            </span>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Logo Upload Card with High Contrast */}
            <div className="p-3.5 sm:p-4 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/40">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-2">
                Agency Logo Photo
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative group shrink-0">
                  {formData.logo ? (
                    <div className="relative w-20 h-20 rounded-2xl bg-white p-1 border-2 border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                      <img
                        src={formData.logo}
                        alt="Agency Preview"
                        className="w-full h-full object-contain rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute inset-0 bg-rose-950/80 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-2xl"
                        title="Remove Logo"
                      >
                        <Trash2 className="w-5 h-5 text-rose-300 mb-0.5" />
                        <span className="text-[9px] font-bold">Remove</span>
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0B1E36] to-[#1E3A5F] text-white flex flex-col items-center justify-center font-black text-sm uppercase shadow-sm border border-slate-700">
                      <ImageIcon className="w-6 h-6 text-slate-300 mb-1" />
                      <span className="text-[9px] text-slate-300 font-bold">No Logo</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-xs">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{formData.logo ? 'Change Photo' : 'Upload Logo'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/jpg"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    {formData.logo && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-3 py-1.5 rounded-xl border border-rose-300 bg-white text-rose-600 hover:bg-rose-50 text-xs font-bold transition shadow-2xs"
                      >
                        Delete Photo
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    PNG, JPG, or WEBP up to 2MB. Displayed across headers, invoices, and login workspaces.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                  Agency Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Royal Heritage Holidays"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs font-bold focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                  Agency Code (3-6 Letters) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={formData.code}
                  onChange={(e) => {
                    const c = e.target.value.toUpperCase();
                    setFormData({
                      ...formData,
                      code: c,
                      invoiceSettings: { ...formData.invoiceSettings, prefix: `${c}-INV-` }
                    });
                  }}
                  placeholder="e.g. ROYAL"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs font-mono font-black uppercase focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 transition"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                  Tagline / Slogan
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. Luxury Holiday Packages & Corporate Travel"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs font-semibold focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: Admin Account Credentials & Primary Representative            */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border-2 border-amber-200/90 shadow-sm overflow-hidden transition hover:shadow-md">
          <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent px-4 sm:px-6 py-3.5 border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                2
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-amber-950 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  <span>{isEditMode ? 'Agency Administrator Account & Representative' : 'Initial Agency Admin Account'}</span>
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-500">
                  {isEditMode
                    ? 'Portal login credentials (Login ID & Password) and executive representative contact'
                    : 'Primary administrator credentials to log into this travel agency workspace'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md hidden sm:inline-block">
              {isEditMode ? 'Admin Credentials & Contact' : 'Admin Login'}
            </span>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {/* Administrator Login Credentials Card */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-700" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-950">
                    Administrator Login Credentials
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded">
                  ERP Portal Login Access
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                    Admin Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-xs font-bold focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                    Login ID / Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    placeholder="admin@agency.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-xs font-bold focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 transition"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    This email/ID is used by the Agency Admin to sign into the ERP portal.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                    {isEditMode ? 'Change Password (Min 6 Chars)' : 'Initial Password (Min 6 Chars)'}{' '}
                    {!isEditMode && <span className="text-rose-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      placeholder={isEditMode ? 'Enter new password to change (leave blank to keep current)' : 'agency123'}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-xs font-mono font-bold focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {isEditMode
                      ? 'Click eye button to view password. Leave blank to keep existing password unchanged.'
                      : 'Initial password given to the Agency Admin. Click eye icon to view.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                    Admin Mobile / Phone
                  </label>
                  <input
                    type="text"
                    value={formData.adminPhone}
                    onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                    placeholder="+91 98111 22334"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-xs font-bold focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 transition"
                  />
                </div>
              </div>
            </div>

            {/* Representative Details in Edit Mode */}
            {isEditMode && (
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Primary Representative / Escalation Contact Person
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson?.name || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactPerson: { ...formData.contactPerson, name: e.target.value }
                        })
                      }
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs font-bold focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                      Designation / Position
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson?.designation || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactPerson: { ...formData.contactPerson, designation: e.target.value }
                        })
                      }
                      placeholder="e.g. Managing Director / Operations Head"
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs font-semibold focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                      Direct Email
                    </label>
                    <input
                      type="email"
                      value={formData.contactPerson?.email || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactPerson: { ...formData.contactPerson, email: e.target.value }
                        })
                      }
                      placeholder="rajesh@agency.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs font-bold focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                      Direct Phone
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson?.phone || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactPerson: { ...formData.contactPerson, phone: e.target.value }
                        })
                      }
                      placeholder="+91 98111 22334"
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs font-bold focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 transition"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: Contact & Office Location (Sky Blue Theme)                    */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border-2 border-sky-200/90 shadow-sm overflow-hidden transition hover:shadow-md">
          <div className="bg-gradient-to-r from-sky-500/15 via-sky-500/5 to-transparent px-4 sm:px-6 py-3.5 border-b border-sky-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                3
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-sky-950 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-sky-600" />
                  <span>Contact Details & Office Location</span>
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-500">
                  Primary email, phone channels, website, and physical office location
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md hidden sm:inline-block">
              Location & Phone
            </span>
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                Official Agency Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="info@agency.com"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs font-bold focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                Official Agency Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98111 22334"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs font-bold focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Mumbai, New Delhi, Kolkata"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs font-semibold focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="India"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs font-semibold focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                Official Website
              </label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="www.royalheritageholidays.com"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs font-semibold focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                Street Address
              </label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Suite, building, street, area..."
                className="w-full px-3.5 py-2 rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs font-semibold focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 transition"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: Tax & Legal Compliance (Purple Theme)                         */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border-2 border-purple-200/90 shadow-sm overflow-hidden transition hover:shadow-md">
          <div className="bg-gradient-to-r from-purple-500/15 via-purple-500/5 to-transparent px-4 sm:px-6 py-3.5 border-b border-purple-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                4
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-purple-950 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>Tax & Business Compliance</span>
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-500">
                  GSTIN and PAN registration numbers for tax invoices & reports
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md hidden sm:inline-block">
              Tax ID & Legal
            </span>
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                GST Number
              </label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. 27AABCR9999Z1Z8"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs font-mono font-bold uppercase focus:border-purple-500 focus:ring-4 focus:ring-purple-500/15 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                PAN Number
              </label>
              <input
                type="text"
                value={formData.panNumber}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. AABCR9999Z"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs font-mono font-bold uppercase focus:border-purple-500 focus:ring-4 focus:ring-purple-500/15 transition"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5: Subscription Plan Tier (Indigo / Amber Theme)                 */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border-2 border-indigo-200/90 shadow-sm overflow-hidden transition hover:shadow-md">
          <div className="bg-gradient-to-r from-indigo-500/15 via-indigo-500/5 to-transparent px-4 sm:px-6 py-3.5 border-b border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                5
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-indigo-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Subscription Plan & Operational Settings</span>
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-500">
                  Select SaaS subscription tier & Super Admin remarks
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-md hidden sm:inline-block">
              SaaS Tier
            </span>
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                Subscription Plan Tier
              </label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs font-black focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 transition"
              >
                <option value="starter">Starter Plan (Basic Operations)</option>
                <option value="professional">Professional Plan (Multi-User & Full ERP)</option>
                <option value="enterprise">Enterprise Plan (Custom Limits & Priority)</option>
                <option value="unlimited">Unlimited VIP Partner</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                Account Operational Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs font-black focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 transition"
              >
                <option value="active">Active (Full ERP Workspace Access)</option>
                <option value="inactive">Inactive (Access Suspended)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                Super Admin Internal Notes
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Internal platform notes regarding billing arrangements, contract terms, or account manager..."
                className="w-full px-3.5 py-2 rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 transition"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 6: Invoice Customization & Starting Sequence (Emerald Green)      */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border-2 border-emerald-200/90 shadow-sm overflow-hidden transition hover:shadow-md">
          <div className="bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent px-4 sm:px-6 py-3.5 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                6
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Invoice Customization & Sequence</span>
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-500">
                  Configure customized invoice prefix, starting sequence, terms, and footer
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md hidden sm:inline-block">
              PDF Invoices
            </span>
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                Invoice Prefix
              </label>
              <input
                type="text"
                value={formData.invoiceSettings.prefix}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    invoiceSettings: { ...formData.invoiceSettings, prefix: e.target.value }
                  })
                }
                placeholder="e.g. ROYAL-INV-"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs font-mono font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                {isEditMode ? 'Next Invoice Sequence Number' : 'Starting Invoice Sequence Number'}
              </label>
              <input
                type="number"
                value={formData.invoiceSettings.nextNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    invoiceSettings: { ...formData.invoiceSettings, nextNumber: Number(e.target.value) }
                  })
                }
                placeholder="1001"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                Invoice Terms & Conditions
              </label>
              <textarea
                rows={2}
                value={formData.invoiceSettings.terms}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    invoiceSettings: { ...formData.invoiceSettings, terms: e.target.value }
                  })
                }
                placeholder="1. Service cancellation terms apply.\n2. Please carry valid Govt ID for travel."
                className="w-full px-3.5 py-2 rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs font-semibold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wide mb-1.5">
                Invoice Footer Note
              </label>
              <input
                type="text"
                value={formData.invoiceSettings.footer}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    invoiceSettings: { ...formData.invoiceSettings, footer: e.target.value }
                  })
                }
                placeholder="Thank you for traveling with us. Have a safe journey!"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 text-xs font-semibold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition"
              />
            </div>
          </div>
        </div>

        {/* 3. High-Contrast Sticky Bottom Action Bar */}
        <div className="sticky bottom-16 lg:bottom-4 z-30 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border-2 border-slate-200 shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/superadmin/agencies')}
              className="px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-black transition active:scale-95 shadow-2xs"
            >
              Cancel & Back
            </button>
            {isEditMode && formData.code?.toUpperCase() !== 'LIBERTY' && (
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="px-4 py-2.5 rounded-xl border-2 border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-black transition active:scale-95 shadow-2xs inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Delete Agency</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition"
          >
            {isEditMode ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4 stroke-[3]" />}
            <span>
              {submitting
                ? isEditMode
                  ? 'Saving Updates...'
                  : 'Registering Agency...'
                : isEditMode
                ? 'Save All Changes'
                : 'Register Travel Agency'}
            </span>
          </button>
        </div>
      </form>

      {/* CONFIRM: Delete Agency */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteAgency}
        title={`Delete "${formData.name || 'Agency'}"?`}
        message={`Are you sure you want to permanently delete "${formData.name}" (${formData.code})? This will permanently remove the agency, its linked users, and all associated workspace records. This action cannot be undone.`}
        confirmText="Delete Agency"
        type="danger"
        loading={submitting}
      />
    </div>
  );
};
