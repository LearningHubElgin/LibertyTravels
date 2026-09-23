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
    <div className="min-h-screen bg-[#071628] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-600/10 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-500/10 blur-[100px]"></div>
      </div>

      {/* Back Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 text-sm font-semibold transition-colors z-20"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-tr from-brand-600 via-sky-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30 border border-white/20">
            <Plane className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">
          Customer Portal
        </h2>
        <p className="mt-2 text-sm font-medium text-slate-400">
          Sign in to view your bookings and history
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-[#0B1E36] py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
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
                  value={customerCode}
                  onChange={(e) => setCustomerCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#071628] border border-slate-700 text-white text-xs rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
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
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#071628] border border-slate-700 text-white text-xs rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                  placeholder="Enter your registered phone number"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50"
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

          <div className="mt-6 border-t border-slate-800 pt-6">
            <div className="text-center text-xs text-slate-400">
              Need help finding your User ID? Please contact your travel agency.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
