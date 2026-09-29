import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building, ArrowRight, User } from 'lucide-react';
import LibertyLogo from '../assets/Liberty.jpg';

export const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to appropriate dashboard
  if (isAuthenticated) {
    if (user?.role === 'super_admin') {
      return <Navigate to="/superadmin/dashboard" replace />;
    }
    if (user?.role === 'customer') {
      return <Navigate to="/customer-portal/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#071628] flex flex-col justify-between sm:justify-center items-center px-4 py-6 sm:py-12 sm:px-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] sm:w-[50%] h-[50%] bg-brand-600/15 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] sm:w-[50%] h-[50%] bg-teal-500/15 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none" />

      {/* Main Content Area */}
      <div className="w-full max-w-sm sm:max-w-xl md:max-w-4xl flex flex-col items-center z-10 my-auto">
        {/* Header / Logo */}
        <div className="text-center mb-5 sm:mb-8 md:mb-10">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl sm:rounded-3xl bg-white flex items-center justify-center shadow-xl shadow-brand-500/20 border border-white/20 mb-3 sm:mb-4 overflow-hidden p-1 sm:p-1.5 transition-transform duration-300 hover:scale-105">
            <img src={LibertyLogo} alt="Liberty Tours & Travels Logo" className="w-full h-full object-contain rounded-xl sm:rounded-2xl" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight mb-1.5 sm:mb-2.5">
            Liberty Tours & Travels
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm md:text-base max-w-xs sm:max-w-md mx-auto font-medium leading-relaxed">
            Welcome to the unified portal. Please select your workspace below to continue.
          </p>
        </div>

        {/* Cards Container */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6">

          {/* Customer Card */}
          <div
            onClick={() => navigate('/customer-portal/login')}
            className="group relative bg-[#0B1E36]/90 backdrop-blur-xl border border-slate-700/60 hover:border-brand-500/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-brand-500/20 active:scale-[0.98] sm:hover:-translate-y-1 overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-brand-600 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-5">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-brand-900/50 border border-brand-700/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <User className="w-5 h-5 sm:w-7 sm:h-7 text-brand-400" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-wider bg-brand-500/10 text-brand-300 border border-brand-500/20 uppercase">
                  Client Portal
                </span>
              </div>

              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">Customer Portal</h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
                Access your booking history, track upcoming journeys, view payment ledgers, and manage your profile.
              </p>
            </div>

            <div className="w-full py-2.5 sm:py-3 px-3.5 sm:px-4 rounded-xl bg-brand-500/10 group-hover:bg-brand-600 text-brand-300 group-hover:text-white font-semibold text-xs sm:text-sm flex items-center justify-between transition-all duration-300 border border-brand-500/20 group-hover:border-transparent group-hover:shadow-lg group-hover:shadow-brand-600/25">
              <span>Sign in as Customer</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Management Card */}
          <div
            onClick={() => navigate('/login')}
            className="group relative bg-[#0B1E36]/90 backdrop-blur-xl border border-slate-700/60 hover:border-teal-500/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/20 active:scale-[0.98] sm:hover:-translate-y-1 overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-5">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-teal-900/50 border border-teal-700/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <Building className="w-5 h-5 sm:w-7 sm:h-7 text-teal-400" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-wider bg-teal-500/10 text-teal-300 border border-teal-500/20 uppercase">
                  Staff & Admin
                </span>
              </div>

              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">Management Portal</h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
                Agency admins and staff login to manage bookings, accounts, companies, and system configurations.
              </p>
            </div>

            <div className="w-full py-2.5 sm:py-3 px-3.5 sm:px-4 rounded-xl bg-teal-500/10 group-hover:bg-teal-600 text-teal-300 group-hover:text-white font-semibold text-xs sm:text-sm flex items-center justify-between transition-all duration-300 border border-teal-500/20 group-hover:border-transparent group-hover:shadow-lg group-hover:shadow-teal-600/25">
              <span>Sign in to ERP</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </div>

      {/* Footer info */}
      <footer className="w-full text-center py-2 z-10">
        <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
          © {new Date().getFullYear()} Liberty Tours & Travels • Enterprise ERP Platform
        </p>
      </footer>
    </div>
  );
};
