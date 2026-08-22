import React, { useState, useEffect, useRef } from 'react';
import { Building2, ChevronDown, Check, Globe, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { agenciesService } from '../../services/agenciesService';

export const AgencySwitcher = () => {
  const { isSuperAdmin, activeAgencyId, setActiveAgencyId } = useAuth();
  const [agencies, setAgencies] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isSuperAdmin) {
      loadAgencies();
    }
  }, [isSuperAdmin]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadAgencies = async () => {
    try {
      const res = await agenciesService.getAgencies({ limit: 100 });
      if (res.success) {
        setAgencies(res.data);
      }
    } catch (err) {
      console.error('Failed to load agencies in switcher:', err);
    }
  };

  if (!isSuperAdmin) return null;

  const currentAgency = agencies.find((a) => a._id === activeAgencyId);
  const filteredAgencies = agencies.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectAgency = (id) => {
    setActiveAgencyId(id);
    setIsOpen(false);
    // Reload page data to reflect new agency scope seamlessly
    window.location.reload();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/90 text-slate-800 text-xs font-bold transition-all border border-slate-200 shadow-xs"
        title="Switch Agency View (Super Admin)"
      >
        {activeAgencyId === 'all' || !currentAgency ? (
          <>
            <Globe className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span className="truncate max-w-[130px] sm:max-w-[160px]">All Agencies</span>
          </>
        ) : (
          <>
            <Building2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span className="truncate max-w-[130px] sm:max-w-[160px]">{currentAgency.name}</span>
            <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-brand-700 uppercase">
              {currentAgency.code}
            </span>
          </>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn">
          <div className="px-3 py-1.5 border-b border-slate-100">
            <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block mb-1.5">
              Super Admin Agency Scope
            </span>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search agency..."
                className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {/* Global View Option */}
            <button
              onClick={() => handleSelectAgency('all')}
              className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                activeAgencyId === 'all' ? 'bg-brand-50/70 text-brand-700 font-bold' : 'text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand-600" />
                <span>All Agencies (Global View)</span>
              </div>
              {activeAgencyId === 'all' && <Check className="w-4 h-4 text-brand-600" />}
            </button>

            {/* List of Agencies */}
            {filteredAgencies.map((agency) => {
              const isSelected = activeAgencyId === agency._id;
              return (
                <button
                  key={agency._id}
                  onClick={() => handleSelectAgency(agency._id)}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    isSelected ? 'bg-brand-50/70 text-brand-700 font-bold' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="truncate">
                      <span className="block truncate font-medium">{agency.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono uppercase">{agency.code} • {agency.city || 'India'}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-brand-600 shrink-0" />}
                </button>
              );
            })}

            {filteredAgencies.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                No matching agencies found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
