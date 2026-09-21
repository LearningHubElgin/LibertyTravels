import React, { Suspense } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, Calendar, FileText, User } from 'lucide-react';

const ModuleLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[45vh] w-full animate-pulse text-blue-500">
    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    <span className="mt-4 font-medium">Loading module...</span>
  </div>
);

export const CustomerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/customer-login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/customer/dashboard', icon: Home },
    { name: 'Profile', path: '/customer/profile', icon: User },
    { name: 'Bookings', path: '/customer/bookings', icon: Calendar },
    { name: 'Ledger', path: '/customer/ledger', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="bg-gradient-to-r from-blue-700 to-indigo-800 shadow-lg border-b border-indigo-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center text-white font-bold text-xl tracking-tight">
                <span className="bg-white/20 p-1.5 rounded-lg mr-2 backdrop-blur-sm">LT</span>
                LibertyTravels
              </div>
              
              {/* Desktop Nav */}
              <div className="hidden md:ml-10 md:flex md:space-x-4">
                {navItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-white/20 text-white shadow-sm backdrop-blur-md'
                          : 'text-blue-100 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <item.icon className={`mr-2 h-4 w-4 ${isActive ? 'text-blue-200' : 'text-blue-300'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center bg-black/20 rounded-full py-1 px-3 border border-white/10">
                <User className="h-4 w-4 text-blue-200 mr-2" />
                <span className="text-sm font-medium text-white truncate max-w-[150px]">
                  {user?.name || 'Customer'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center p-2 rounded-md text-blue-100 hover:bg-red-500/20 hover:text-red-100 transition-colors focus:outline-none"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<ModuleLoader />}>
          <Outlet />
        </Suspense>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-blue-600' : 'text-slate-500 hover:text-blue-500'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : ''}`} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default CustomerLayout;
