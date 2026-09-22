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
    <div className="min-h-screen bg-[#071628] flex flex-col items-center justify-center relative overflow-hidden p-6">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-500/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header / Logo */}
      <div className="text-center mb-16 z-10 mt-[-5vh]">
        <div className="mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white flex items-center justify-center shadow-xl shadow-brand-500/20 border border-white/20 mb-6 overflow-hidden p-1">
          <img src={LibertyLogo} alt="Liberty Tours & Travels Logo" className="w-full h-full object-contain rounded-2xl" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
          Liberty Tours & Travels
        </h1>
        <p className="text-slate-400 text-lg max-w-lg mx-auto font-medium">
          Welcome to the unified portal. Please select your login type below to continue.
        </p>
      </div>

      {/* Cards Container */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 z-10">
        
        {/* Customer Card */}
        <div 
          onClick={() => navigate('/customer-portal/login')}
          className="group relative bg-[#0B1E36]/80 backdrop-blur-xl border border-slate-700/50 hover:border-brand-500/50 rounded-3xl p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-brand-500/20 hover:-translate-y-1 overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-brand-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="w-16 h-16 rounded-2xl bg-brand-900/50 border border-brand-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <User className="w-8 h-8 text-brand-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">Customer Portal</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Access your booking history, track upcoming journeys, view payment ledgers, and manage your profile.
          </p>
          
          <div className="flex items-center text-brand-400 font-semibold text-sm group-hover:text-brand-300 transition-colors mt-auto">
            Log in as Customer <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Management Card */}
        <div 
          onClick={() => navigate('/login')}
          className="group relative bg-[#0B1E36]/80 backdrop-blur-xl border border-slate-700/50 hover:border-teal-500/50 rounded-3xl p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/20 hover:-translate-y-1 overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="w-16 h-16 rounded-2xl bg-teal-900/50 border border-teal-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Building className="w-8 h-8 text-teal-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">Management Portal</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Agency admins and staff login to manage bookings, accounts, companies, and system configurations.
          </p>
          
          <div className="flex items-center text-teal-400 font-semibold text-sm group-hover:text-teal-300 transition-colors mt-auto">
            Log in as Management <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

    </div>
  );
};
