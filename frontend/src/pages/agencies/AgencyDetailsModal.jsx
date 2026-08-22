import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Users,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  Hash,
  Crown
} from 'lucide-react';
import { agenciesService } from '../../services/agenciesService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AgencyDetailsModal = ({ isOpen, onClose, agencyId, onUpdated }) => {
  const [agency, setAgency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen && agencyId) {
      loadAgencyDetails();
    }
  }, [isOpen, agencyId]);

  const loadAgencyDetails = async () => {
    try {
      setLoading(true);
      const res = await agenciesService.getAgencyDetails(agencyId);
      if (res.success) {
        setAgency(res.data);
      }
    } catch (err) {
      console.error('Failed to load agency details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!agency) return;
    try {
      setUpdating(true);
      const newStatus = agency.status === 'active' ? 'suspended' : 'active';
      const res = await agenciesService.updateAgency(agency._id, { status: newStatus });
      if (res.success) {
        setAgency(prev => ({ ...prev, status: newStatus }));
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-[#0B1E36] via-[#102A4C] to-[#1E3A8A] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Building2 className="w-5 h-5 text-brand-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight">
                  {agency ? agency.name : 'Agency Details'}
                </h3>
                {agency && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-white/20 text-white uppercase">
                    {agency.code}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                {agency ? `Owner: ${agency.ownerName || 'N/A'} • ${agency.city || 'India'}` : 'Loading...'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" text="Loading agency profile..." />
          </div>
        ) : agency ? (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            
            {/* KPI Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Bookings</span>
                <span className="text-xl sm:text-2xl font-black text-slate-800 font-mono mt-1">
                  {agency.metrics?.totalBookings || 0}
                </span>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">Total Revenue</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1">
                  ₹{Number(agency.metrics?.totalRevenue || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-sky-50/50 border border-sky-200/60 rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[11px] font-medium text-sky-700 uppercase tracking-wider">Customers</span>
                <span className="text-xl sm:text-2xl font-black text-sky-800 font-mono mt-1">
                  {agency.metrics?.totalCustomers || 0}
                </span>
              </div>
              <div className="bg-purple-50/50 border border-purple-200/60 rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[11px] font-medium text-purple-700 uppercase tracking-wider">Staff Members</span>
                <span className="text-xl sm:text-2xl font-black text-purple-800 font-mono mt-1">
                  {agency.staff?.length || 0}
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-brand-50 text-brand-700 border border-brand-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Agency Profile & Details
              </button>
              <button
                onClick={() => setActiveTab('staff')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'staff'
                    ? 'bg-brand-50 text-brand-700 border border-brand-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Staff Users ({agency.staff?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'bookings'
                    ? 'bg-brand-50 text-brand-700 border border-brand-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Recent Bookings
              </button>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-brand-600" />
                    Agency Info
                  </h4>
                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Agency Name:</span>
                      <span className="font-bold">{agency.name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Agency Code:</span>
                      <span className="font-mono font-bold">{agency.code}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Owner / Principal:</span>
                      <span className="font-semibold">{agency.ownerName || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-medium text-brand-600">{agency.email}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Phone:</span>
                      <span className="font-medium">{agency.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    Subscription & Settings
                  </h4>
                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Status:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        agency.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : agency.status === 'trial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {agency.status}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">SaaS Plan:</span>
                      <span className="font-bold text-brand-700 uppercase">{agency.plan || 'pro'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Invoice Prefix:</span>
                      <span className="font-mono font-bold">{agency.settings?.invoicePrefix || `${agency.code}-INV-`}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">GST Number:</span>
                      <span className="font-mono">{agency.gstNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Address / City:</span>
                      <span className="font-medium text-right truncate max-w-[200px]">{agency.city || 'India'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Staff Users */}
            {activeTab === 'staff' && (
              <div className="space-y-3">
                {agency.staff && agency.staff.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="p-3">Staff Name</th>
                          <th className="p-3">Email</th>
                          <th className="p-3">Role</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Last Active</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {agency.staff.map((u) => (
                          <tr key={u._id} className="hover:bg-slate-50/60">
                            <td className="p-3 font-bold text-slate-800">{u.name}</td>
                            <td className="p-3 text-slate-600 font-mono">{u.email}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                u.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                                u.status === 'active' ? 'text-emerald-700' : 'text-slate-400'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                {u.status}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 text-[11px]">
                              {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN') : 'Never'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
                    No staff accounts created for this agency yet.
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Recent Bookings */}
            {activeTab === 'bookings' && (
              <div className="space-y-3">
                {agency.recentBookings && agency.recentBookings.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="p-3">Ref / PNR</th>
                          <th className="p-3">Service</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Sale Price</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {agency.recentBookings.map((b) => (
                          <tr key={b._id} className="hover:bg-slate-50/60">
                            <td className="p-3 font-mono font-bold text-brand-700">{b.referenceNo}</td>
                            <td className="p-3 uppercase text-[11px] font-semibold">{b.serviceType}</td>
                            <td className="p-3 font-medium text-slate-800">{b.customer?.name || b.passengerName || 'Client'}</td>
                            <td className="p-3 text-slate-500">{b.bookingDate}</td>
                            <td className="p-3 font-mono font-bold text-slate-900">₹{Number(b.sellPrice || b.totalAmount || 0).toLocaleString('en-IN')}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
                    No bookings recorded yet for this agency.
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {agency && agency.code !== 'LTT' && (
              <button
                onClick={handleToggleStatus}
                disabled={updating}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-xs ${
                  agency.status === 'active'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {updating ? 'Updating...' : agency.status === 'active' ? 'Suspend Agency' : 'Activate Agency'}
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
