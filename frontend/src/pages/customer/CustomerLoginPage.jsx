import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, User, Phone, Loader2, Plane, ArrowRight, ArrowLeft } from 'lucide-react';

export const CustomerLoginPage = () => {
  const navigate = useNavigate();
  const { customerLogin, isAuthenticated, isCustomer } = useAuth();

  const [customerCode, setCustomerCode] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && isCustomer) {
    return <Navigate to="/customer-portal/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!customerCode || !phone) {
      setError('Please enter both User ID and Phone Number.');
      return;
    }

    setLoading(true);
    try {
      await customerLogin(customerCode, phone);
      navigate('/customer-portal/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid User ID or Phone Number');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#071628] flex flex-col justify-center px-4 py-8 sm:py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-600/10 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[100px]"></div>
      </div>

      {/* Back Button */}
      <Link
        to="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 text-slate-400 hover:text-white flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors z-20 py-1 px-2 rounded-lg hover:bg-slate-800/40"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <div className="w-full max-w-sm sm:max-w-md mx-auto relative z-10 text-center mt-6 sm:mt-0">
        <div className="flex justify-center mb-3 sm:mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-tr from-brand-600 via-sky-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30 border border-white/20">
            <Plane className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
        </div>
        <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
          Customer Portal
        </h2>
        <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-medium text-slate-400">
          Sign in to view your bookings and history
        </p>
      </div>

      <div className="mt-5 sm:mt-8 w-full max-w-sm sm:max-w-md mx-auto relative z-10">
        <div className="bg-[#0B1E36] py-6 px-5 sm:py-8 sm:px-10 shadow-2xl rounded-2xl sm:rounded-3xl border border-slate-800">
          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0"></span>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="customerCode" className="block text-xs font-semibold text-slate-300 mb-1.5">
                User ID (Customer Code)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="customerCode"
                  name="customerCode"
                  type="text"
                  required
                  autoComplete="username"
                  value={customerCode}
                  onChange={(e) => setCustomerCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#071628] border border-slate-700 text-white text-base sm:text-xs rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                  placeholder="e.g. CUST-12345"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Phone Number (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  autoComplete="current-password"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#071628] border border-slate-700 text-white text-base sm:text-xs rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                  placeholder="Enter your registered phone number"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-brand-600 hover:bg-brand-500 active:scale-[0.98] text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In to Portal <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-5 sm:mt-6 border-t border-slate-800 pt-5 sm:pt-6">
            <div className="text-center text-xs text-slate-400">
              Need help finding your User ID? Please contact your travel agency.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
