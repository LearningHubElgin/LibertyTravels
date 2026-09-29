import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Compass, ArrowRight, ArrowLeft } from 'lucide-react';
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


  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#071628] flex flex-col justify-center px-4 py-8 sm:py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back Button */}
      <Link
        to="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 text-slate-400 hover:text-white flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors z-20 py-1 px-2 rounded-lg hover:bg-slate-800/40"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <div className="w-full max-w-sm sm:max-w-md mx-auto text-center z-10 mt-6 sm:mt-0">
        <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-brand-600 via-sky-500 to-teal-400 text-white flex items-center justify-center shadow-xl shadow-brand-500/20 border border-white/20 mb-2.5 sm:mb-3">
          <Compass className="w-6 h-6 sm:w-8 sm:h-8 stroke-[2.25]" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Travel ERP Portal
        </h2>
        <p className="mt-1 text-xs font-semibold text-slate-400">
          Sign in to access your platform or agency workspace
        </p>
      </div>

      <div className="mt-5 sm:mt-8 w-full max-w-sm sm:max-w-md mx-auto z-10">
        <div className="bg-[#0B1E36] py-6 px-5 sm:py-8 sm:px-10 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-800">
          <h3 className="text-sm sm:text-base font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-400" />
            Account Authentication
          </h3>

          {errorMsg && (
            <div className="mb-4 sm:mb-5 p-3 sm:p-3.5 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0"></span>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Superadmin, Liberty, or email"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-2.5 bg-[#071628] border border-slate-700 text-white text-base sm:text-xs rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 sm:py-2.5 bg-[#071628] border border-slate-700 text-white text-base sm:text-xs rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-2 rounded-lg transition-colors flex items-center justify-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 sm:py-3 px-4 bg-brand-600 hover:bg-brand-500 active:scale-[0.98] text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50"
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

        </div>

        <div className="mt-5 sm:mt-6 text-center">
          <p className="text-xs text-slate-400">
            Are you a customer?{' '}
            <Link to="/customer-portal/login" className="text-brand-400 font-semibold hover:text-brand-300 transition-colors inline-block py-1">
              Access Customer Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
