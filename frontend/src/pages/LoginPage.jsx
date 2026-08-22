import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Compass, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const data = await login(email, password);
      const userRole = data?.user?.role;
      success(`Welcome back, ${data?.user?.name || 'User'}!`);

      if (userRole === 'super_admin') {
        navigate('/superadmin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#071628] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <img
          src="/Liberty.jpg"
          alt="Liberty Tours & Travels"
          className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-contain bg-white p-1 shadow-2xl border-2 border-slate-700/80 mb-4"
        />
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Liberty Tours & Travels
        </h2>
        <p className="mt-1 text-xs font-semibold text-brand-300 uppercase tracking-widest">
          Enterprise ERP & Booking Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 z-10">
        <div className="bg-[#0B1E36] py-8 px-6 sm:px-10 rounded-2xl shadow-2xl border border-slate-800">
          <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-400" />
            Account Authentication
          </h3>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0"></span>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@libertytravel.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#071628] border border-slate-700 text-white text-xs rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#071628] border border-slate-700 text-white text-xs rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In to ERP <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Fill Demo Credential Helpers */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              Quick Login Roles (Demo)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@libertytravel.com', 'admin123')}
                className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition group"
              >
                <div className="flex items-center gap-1 text-amber-400 font-bold text-[10px] mb-0.5 truncate">
                  <ShieldCheck className="w-3 h-3 shrink-0" /> Super Admin
                </div>
                <p className="text-[9px] text-slate-400 truncate">admin@liberty</p>
                <span className="text-[8px] text-amber-400 group-hover:underline">Fill &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@royalheritageholidays.com', 'agency123')}
                className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition group"
              >
                <div className="flex items-center gap-1 text-sky-400 font-bold text-[10px] mb-0.5 truncate">
                  <Building2 className="w-3 h-3 shrink-0" /> Agency Admin
                </div>
                <p className="text-[9px] text-slate-400 truncate">admin@royal</p>
                <span className="text-[8px] text-sky-400 group-hover:underline">Fill &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('staff@libertytravel.com', 'staff123')}
                className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition group"
              >
                <div className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] mb-0.5 truncate">
                  <UserCheck className="w-3 h-3 shrink-0" /> Staff
                </div>
                <p className="text-[9px] text-slate-400 truncate">staff@liberty</p>
                <span className="text-[8px] text-emerald-400 group-hover:underline">Fill &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
