import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpenCheck,
  Plus,
  Users2,
  Menu,
  ReceiptText
} from 'lucide-react';

export const MobileBottomNav = ({ onOpenMenu }) => {
  const location = useLocation();

  const isCurrent = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 safe-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* 1. Dashboard */}
        <NavLink
          to="/dashboard"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
            isCurrent('/dashboard')
              ? 'text-brand-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <LayoutDashboard className={`w-5 h-5 ${isCurrent('/dashboard') ? 'stroke-[2.25]' : 'stroke-[1.75]'}`} />
            {isCurrent('/dashboard') && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-600 rounded-full" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Dashboard</span>
        </NavLink>

        {/* 2. All Bookings */}
        <NavLink
          to="/bookings"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
            isCurrent('/bookings') && location.pathname !== '/bookings/new'
              ? 'text-brand-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <BookOpenCheck className={`w-5 h-5 ${isCurrent('/bookings') && location.pathname !== '/bookings/new' ? 'stroke-[2.25]' : 'stroke-[1.75]'}`} />
            {isCurrent('/bookings') && location.pathname !== '/bookings/new' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-600 rounded-full" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Bookings</span>
        </NavLink>

        {/* 3. Center Highlight: New Booking Quick Action */}
        <NavLink
          to="/bookings/new"
          className="flex flex-col items-center justify-center -mt-5 active:scale-95 transition-transform duration-200"
          aria-label="Create New Booking"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-600 to-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-600/30 border-2 border-white ring-2 ring-brand-100/60">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-brand-700 tracking-tight mt-0.5">New</span>
        </NavLink>

        {/* 4. Customers */}
        <NavLink
          to="/customers"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
            isCurrent('/customers')
              ? 'text-brand-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Users2 className={`w-5 h-5 ${isCurrent('/customers') ? 'stroke-[2.25]' : 'stroke-[1.75]'}`} />
            {isCurrent('/customers') && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-600 rounded-full" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Customers</span>
        </NavLink>

        {/* 5. Menu / All Modules Drawer */}
        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-800 active:scale-95 transition-all duration-200"
          aria-label="Open Full Navigation Menu"
        >
          <div className="relative">
            <Menu className="w-5 h-5 stroke-[1.75]" />
          </div>
          <span className="text-[10px] tracking-tight mt-1">Menu</span>
        </button>
      </div>
    </nav>
  );
};
