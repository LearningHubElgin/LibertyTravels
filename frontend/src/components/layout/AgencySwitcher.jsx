import React, { useState, useEffect, useRef } from 'react';
import { Building2, ChevronDown, Check, Globe, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export const AgencySwitcher = () => {
  const { user } = useAuth();
  const [agencies, setAgencies] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeAgencyId, setActiveAgencyId] = useState(
    localStorage.getItem('liberty_active_agency') || 'all'
  );
  const dropdownRef = useRef(null);

  // Only Super Admin can switch between agencies
  if (user?.role !== 'super_admin') {
    return null;
  }

  useEffect(() => {
    fetchAgencies();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAgencies = async () => {
    try {
      setLoading(true);
      const res = await api.get('/superadmin/agencies');
      if (res.data?.success) {
        setAgencies(res.data.data || []);
      }
    } catch (err) {
      console.warn('Failed to load agencies in switcher:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAgency = (agencyId) => {
    setActiveAgencyId(agencyId);
    if (agencyId === 'all') {
      localStorage.removeItem('liberty_active_agency');
      delete api.defaults.headers.common['x-agency-id'];
    } else {
      localStorage.setItem('liberty_active_agency', agencyId);
      api.defaults.headers.common['x-agency-id'] = agencyId;
    }
    setIsOpen(false);
    // Reload active ERP view to reflect tenant switch
    window.location.reload();
  };

  const currentAgency = agencies.find((a) => String(a._id || a.id) === String(activeAgencyId));

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm text-xs font-semibold transition"
        title="Super Admin: Switch Travel Agency Context"
      >
        <div className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center">
          {activeAgencyId === 'all' ? (
            <Globe className="w-3.5 h-3.5" />
          ) : (
            <Building2 className="w-3.5 h-3.5" />
          )}
        </div>
        <div className="text-left hidden sm:block max-w-[130px] truncate">
          <span className="block text-[10px] text-slate-400 uppercase font-bold leading-tight">
            Agency Scope
          </span>
          <span className="text-slate-800 font-bold leading-tight">
            {activeAgencyId === 'all' ? 'All Agencies (Global)' : currentAgency?.name || 'Agency'}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Switch Travel Agency</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Filter ERP views by specific Travel Agency
            </p>
          </div>

          <div className="py-1 max-h-60 overflow-y-auto">
            {/* Global All Agencies option */}
            <button
              onClick={() => handleSelectAgency('all')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-left transition hover:bg-slate-50 ${
                activeAgencyId === 'all' ? 'bg-amber-50/60 text-amber-900 font-bold' : 'text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px]">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold">All Agencies (Global View)</div>
                  <div className="text-[10px] text-slate-400 font-normal">Super Admin Platform Mode</div>
                </div>
              </div>
              {activeAgencyId === 'all' && <Check className="w-4 h-4 text-amber-600" />}
            </button>

            {agencies.map((agency) => {
              const aId = String(agency._id || agency.id);
              const isSelected = String(activeAgencyId) === aId;

              return (
                <button
                  key={aId}
                  onClick={() => handleSelectAgency(aId)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition hover:bg-slate-50 ${
                    isSelected ? 'bg-brand-50 text-brand-900 font-bold' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 uppercase">
                      {agency.code ? agency.code.slice(0, 3) : 'TRV'}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-slate-800 truncate">{agency.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {agency.city ? `${agency.city} • ` : ''}Code: {agency.code}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-brand-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
