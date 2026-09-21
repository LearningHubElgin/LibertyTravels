import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, Compass, MapPin, CheckCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export const LandingPage = () => {
  const { isAuthenticated, user, loading } = useAuth();

  // If already authenticated, redirect them to their respective dashboards
  if (!loading && isAuthenticated) {
    if (user?.role === 'super_admin') return <Navigate to="/superadmin/dashboard" replace />;
    if (user?.role === 'customer') return <Navigate to="/customer/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#071628] font-sans text-slate-200 selection:bg-brand-500 selection:text-white">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/20 blur-[150px]" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation Bar */}
        <nav className="w-full px-6 py-6 md:px-12 flex justify-between items-center bg-[#071628]/50 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Compass className="w-6 h-6 text-white stroke-[2]" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">Liberty Travels</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Features</a>
            <a href="#destinations" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Destinations</a>
            <a href="#about" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">About Us</a>
          </div>

          <div className="flex gap-4">
            <Link 
              to="/customer-login" 
              className="hidden sm:flex px-5 py-2.5 rounded-xl border border-white/10 text-sm font-semibold text-white hover:bg-white/5 transition-all items-center gap-2"
            >
              Customer Portal
            </Link>
            <Link 
              to="/login" 
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-all items-center flex gap-2"
            >
              Agency Login <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-20 pb-32">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold uppercase tracking-widest mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            Your Ultimate Travel ERP
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 leading-tight tracking-tighter max-w-4xl mb-6">
            Explore the World with Seamless Management
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 font-medium leading-relaxed">
            Manage bookings, track finances, and view your travel history all in one beautifully crafted platform. Designed for both agencies and customers.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
            <Link 
              to="/customer-login" 
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 text-base font-bold shadow-xl shadow-white/10 transition-all flex justify-center items-center gap-3 transform hover:-translate-y-1"
            >
              <Plane className="w-5 h-5" />
              I am a Customer
            </Link>
            <Link 
              to="/login" 
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-800 border border-slate-700 hover:border-slate-600 hover:bg-slate-700 text-base font-bold text-white shadow-xl transition-all flex justify-center items-center gap-3 transform hover:-translate-y-1"
            >
              <MapPin className="w-5 h-5" />
              Agency Access
            </Link>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full text-left">
            <div className="bg-[#0B1E36] p-6 rounded-3xl border border-slate-800 shadow-xl">
              <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center mb-4 text-teal-400">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Instant Booking Tracking</h3>
              <p className="text-sm text-slate-400">Customers can view real-time updates on flights, hotels, and travel itineraries directly from their portal.</p>
            </div>
            <div className="bg-[#0B1E36] p-6 rounded-3xl border border-slate-800 shadow-xl">
              <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center mb-4 text-brand-400">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Transparent Ledgers</h3>
              <p className="text-sm text-slate-400">Keep track of your payments and outstanding balances with beautiful, easy-to-read financial ledgers.</p>
            </div>
            <div className="bg-[#0B1E36] p-6 rounded-3xl border border-slate-800 shadow-xl">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4 text-indigo-400">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Agency Management</h3>
              <p className="text-sm text-slate-400">Powerful ERP tools for travel agencies to manage their customers, transactions, and analytics efficiently.</p>
            </div>
          </div>
        </main>
        
        <footer className="w-full py-8 text-center border-t border-white/5 text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Liberty Travels. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
