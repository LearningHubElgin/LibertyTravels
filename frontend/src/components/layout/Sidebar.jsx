import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlaneTakeoff,
  BookOpenCheck,
  ReceiptText,
  Users2,
  Building2,
  Plane,
  CreditCard,
  Scale,
  WalletCards,
  CalendarDays,
  Calendar,
  BarChart3,
  UserCheck,
  History,
  Settings,
  ShieldCheck,
  Globe,
  Sparkles,
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isSuperAdmin, logout } = useAuth();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const isUserSuperAdmin = user?.role === 'super_admin';
  const isUserAdmin = user?.role === 'admin' || isUserSuperAdmin;

  // Super Admin Specific Management Links
  const superAdminNav = [
    { name: 'Super Admin Hub', path: '/superadmin/dashboard', icon: ShieldCheck },
    { name: 'Travel Agencies', path: '/superadmin/agencies', icon: Building2 },
    { name: 'Platform Users', path: '/superadmin/users', icon: UserCheck }
  ];

  // Agency ERP Links
  const agencyNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'New Booking', path: '/bookings/new', icon: PlaneTakeoff },
    { name: 'All Bookings', path: '/bookings', icon: BookOpenCheck },
    { name: 'Companies', path: '/companies', icon: Building2 },
    { name: 'Customers', path: '/customers', icon: Users2 },
    { name: 'Transactions', path: '/transactions', icon: ReceiptText },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Ledger', path: '/ledger', icon: Scale, adminOnly: true },
    { name: 'Expenses', path: '/expenses', icon: WalletCards, adminOnly: true },
    { name: 'Upcoming Journeys', path: '/upcoming-journeys', icon: CalendarDays },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Reports', path: '/reports', icon: BarChart3, adminOnly: true },
    { name: 'Agency Users', path: '/users', icon: UserCheck, adminOnly: true },
    { name: 'Activity Logs', path: '/activity-logs', icon: History, adminOnly: true },
    { name: 'Settings', path: '/settings', icon: Settings, adminOnly: true }
  ];

  const filteredAgencyNav = agencyNav.filter((item) => !item.adminOnly || isUserAdmin);

  const handleConfirmLogout = () => {
    setIsLogoutConfirmOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-[#0B1E36] text-white transition-transform duration-300 ease-in-out border-r border-slate-800 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-5 border-b border-slate-800 bg-[#071628]">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <img
              src="/Liberty.jpg"
              alt="Liberty Travels Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl object-contain bg-white p-0.5 shadow-md shrink-0 border border-slate-700/60"
            />
            <div>
              <span className="text-xs sm:text-sm font-black tracking-tight text-white block uppercase">
                Liberty Travels
              </span>
              <span className="text-[9px] sm:text-[10px] font-medium text-brand-300/80 block tracking-wider uppercase">
                Agency ERP
              </span>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-2.5 sm:px-3 py-3 sm:py-4 space-y-3 sm:space-y-4">
          {/* SUPER ADMIN PLATFORM SECTION (Super Admin Only) */}
          {isUserSuperAdmin && (
            <div className="space-y-0.5 sm:space-y-1">
              <div className="px-2.5 sm:px-3 pb-1.5 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Super Admin Control</span>
              </div>
              {superAdminNav.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path !== '/superadmin/dashboard' && location.pathname.startsWith(`${item.path}/`));

                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={`flex items-center gap-2.5 sm:gap-3 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-150 group ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'text-amber-200/80 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          )}

          {/* AGENCY ERP MAIN OPERATIONS */}
          <div className="space-y-0.5 sm:space-y-1">
            <div className="px-2.5 sm:px-3 pb-1.5 sm:pb-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400/80">
              {isUserSuperAdmin ? 'Agency Workspace' : 'Main Menu'}
            </div>
            {filteredAgencyNav.map((item) => {
              const Icon = item.icon;
              
              let isActive = false;
              if (item.path === '/bookings/new') {
                isActive = location.pathname === '/bookings/new';
              } else if (item.path === '/bookings') {
                isActive = location.pathname === '/bookings' || (location.pathname.startsWith('/bookings/') && location.pathname !== '/bookings/new');
              } else if (item.path === '/dashboard') {
                isActive = location.pathname === '/dashboard' || (!isUserSuperAdmin && location.pathname === '/');
              } else {
                isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
              }

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2.5 sm:gap-3 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold transition-all duration-150 group ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span className="truncate">{item.name}</span>
                  {item.name === 'New Booking' && (
                    <span className="ml-auto text-[9px] sm:text-[10px] bg-brand-500/30 text-brand-300 border border-brand-400/30 px-1.5 py-0.2 rounded-md font-bold">
                      +
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* User Card & Logout in Sidebar Footer */}
        <div className="p-2.5 sm:p-3 border-t border-slate-800 bg-[#071628]">
          <div className="flex items-center justify-between gap-2 p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-[10px] sm:text-xs border border-brand-500/30 shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-white truncate">{user?.name || 'User'}</p>
                <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 truncate capitalize">
                  {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLogoutConfirmOpen(true)}
              title="Logout from ERP"
              aria-label="Logout from ERP"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 active:scale-90 transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to sign out of Liberty Tours & Travels ERP?"
        confirmText="Yes, Logout"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
};
