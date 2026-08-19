import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  User,
  KeyRound,
  LogOut,
  ChevronDown,
  CheckCheck,
  Plane,
  AlertCircle,
  CreditCard,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const Navbar = ({ onOpenMobile }) => {
  const { user, logout, updateUserProfile } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Profile Dropdown state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const profileRef = useRef(null);

  // Notifications State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);

  // Profile & Password Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Silent background polling handling during cold starts or disconnects
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 4 * 60 * 1000); // 4 minutes poll (240,000ms)
    return () => clearInterval(interval);
  }, []);

  // Global search debounced
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [bookingsRes, customersRes] = await Promise.all([
          api.get(`/bookings?search=${encodeURIComponent(searchQuery)}&limit=4`),
          api.get(`/customers?search=${encodeURIComponent(searchQuery)}&limit=4`)
        ]);

        const bList = (bookingsRes.data.bookings || []).map((b) => ({
          type: 'booking',
          id: b.id,
          title: `${b.referenceNo} - ${b.sector}`,
          subtitle: `Passenger: ${b.passengers?.[0]?.firstName || ''} ${b.passengers?.[0]?.lastName || ''} (${b.pnr})`,
          link: `/bookings/${b.id}`
        }));

        const cList = (customersRes.data.customers || []).map((c) => ({
          type: 'customer',
          id: c.id,
          title: c.name,
          subtitle: `${c.customerCode} &bull; ${c.phone}`,
          link: `/customers`
        }));

        setSearchResults([...bList, ...cList]);
        setShowSearchDropdown(true);
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      success('All notifications marked as read');
    } catch (e) {
      toastError('Failed to mark notifications as read');
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await api.put(`/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      if (notif.link) {
        setIsNotifOpen(false);
        navigate(notif.link);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await api.put('/auth/profile', profileForm);
      if (res.data.success) {
        updateUserProfile(res.data.user);
        success('Profile updated successfully');
        setIsProfileModalOpen(false);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setModalLoading(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toastError('New passwords do not match');
    }
    if (passwordForm.newPassword.length < 6) {
      return toastError('Password must be at least 6 characters long');
    }

    setModalLoading(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (res.data.success) {
        success('Password changed successfully');
        setIsPasswordModalOpen(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setModalLoading(false);
    }
  };

  // Extract page title from route
  const getPageTitle = () => {
    const p = location.pathname;
    if (p === '/dashboard') return 'Dashboard';
    if (p === '/bookings/new') return 'New Flight Booking';
    if (p === '/bookings') return 'All Bookings';
    if (p.startsWith('/bookings/')) return 'Booking Details';
    if (p === '/transactions') return 'Financial Transactions';
    if (p === '/customers') return 'Customer Management';
    if (p === '/airlines') return 'Airlines';
    if (p === '/payments') return 'Payments Received';
    if (p === '/ledger') return 'Ledger & Accounts';
    if (p === '/expenses') return 'Expenses Management';
    if (p === '/upcoming-journeys') return 'Upcoming Journeys';
    if (p === '/calendar') return 'Bookings Calendar';
    if (p === '/reports') return 'Reports & Analytics';
    if (p === '/users') return 'User Management';
    if (p === '/activity-logs') return 'System Activity Logs';
    if (p === '/settings') return 'Agency & Invoice Settings';
    return 'Liberty Tours & Travels';
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs w-full">
        {/* Left Side: Mobile Menu Button & Page Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onOpenMobile}
            className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden shrink-0 border border-slate-200/60"
            aria-label="Open Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h2 className="text-xs sm:text-base font-bold text-slate-900 tracking-tight truncate">
              {getPageTitle()}
            </h2>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-6 relative" ref={searchRef}>
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search reference, PNR, passenger, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {/* Search Dropdown Results */}
          {showSearchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 divide-y divide-slate-100">
              {searchResults.length > 0 ? (
                searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setShowSearchDropdown(false);
                      setSearchQuery('');
                      navigate(item.link);
                    }}
                    className="p-3 hover:bg-brand-50/60 cursor-pointer transition flex items-center gap-3"
                  >
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                      {item.type === 'booking' ? <Plane className="w-4 h-4 text-brand-600" /> : <User className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                      <p className="text-[11px] text-slate-500 truncate" dangerouslySetInnerHTML={{ __html: item.subtitle }} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">No results found for "{searchQuery}"</div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Notifications & User Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                const nextState = !isNotifOpen;
                setIsNotifOpen(nextState);
                if (nextState) fetchNotifications();
              }}
              className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 transition cursor-pointer flex items-start gap-3 hover:bg-slate-50 ${
                          !notif.isRead ? 'bg-brand-50/30' : ''
                        }`}
                      >
                        <div className="mt-0.5 p-1.5 rounded-lg bg-brand-100/80 text-brand-600 shrink-0">
                          {notif.type === 'booking' && <Plane className="w-3.5 h-3.5" />}
                          {notif.type === 'payment' && <CreditCard className="w-3.5 h-3.5" />}
                          {notif.type === 'journey' && <CalendarDays className="w-3.5 h-3.5" />}
                          {notif.type === 'alert' && <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
                          {notif.type === 'system' && <Bell className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800">{notif.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400">No notifications yet</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded-lg bg-[#0B1E36] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                  {user?.name || 'User'}
                </p>
                <span className="text-[10px] font-semibold text-brand-600 capitalize block">
                  {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden py-1 divide-y divide-slate-100">
                <div className="px-4 py-3 bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-100 text-brand-800 capitalize">
                    {user?.role === 'super_admin' ? 'Super Admin (Full Access)' : 'Admin (Operational)'}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 text-left"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsPasswordModalOpen(true);
                    }}
                    className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 text-left"
                  >
                    <KeyRound className="w-4 h-4 text-slate-400" />
                    Change Password
                  </button>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsLogoutConfirmOpen(true);
                    }}
                    className="w-full px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="My Profile"
        subtitle="Manage your personal account details"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={modalLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {modalLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
            <input
              type="text"
              disabled
              value={user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-100 text-slate-500 rounded-lg cursor-not-allowed"
            />
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Password"
        subtitle="Update your security credentials"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSavePassword}
              disabled={modalLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {modalLoading ? 'Updating...' : 'Update Password'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSavePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </form>
      </Modal>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={() => {
          setIsLogoutConfirmOpen(false);
          logout();
          navigate('/login');
        }}
        title="Confirm Logout"
        message="Are you sure you want to sign out of Liberty Tours & Travels ERP?"
        confirmText="Yes, Logout"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
};
