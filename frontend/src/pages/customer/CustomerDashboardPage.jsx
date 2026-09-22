import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Briefcase, Calendar, CreditCard, Activity, ArrowRight, Plane, Building2, MapPin, Phone } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

export const CustomerDashboardPage = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [ledger, setLedger] = useState({ ledger: [], closingBalance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, bookingsRes, ledgerRes] = await Promise.all([
          api.get('/customer-portal/profile'),
          api.get('/customer-portal/bookings'),
          api.get('/customer-portal/ledger')
        ]);
        setProfile(profileRes.data.customer);
        setBookings(bookingsRes.data.bookings);
        setLedger({ ledger: ledgerRes.data.ledger, closingBalance: ledgerRes.data.closingBalance });
      } catch (error) {
        console.error('Error fetching customer portal data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const agencyName = profile?.agencyId?.name || 'Your Travel Agency';
  const totalBookings = bookings.length;
  
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-sm">
                <Plane className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight text-slate-800">{agencyName}</h1>
                <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Customer Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-sm font-semibold text-slate-700">{user.name}</span>
                <span className="text-xs text-slate-500">{user.email || 'Customer'}</span>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome & Stats Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                <User className="w-8 h-8 text-brand-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Welcome, {profile?.name}</h2>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                  <Briefcase className="w-3.5 h-3.5" /> ID: {profile?.customerCode}
                </p>
              </div>
            </div>
            <div className="space-y-3 border-t border-slate-100 pt-5">
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                <span className="text-sm text-slate-600">{profile?.phone}</span>
              </div>
              {profile?.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <span className="text-sm text-slate-600">{profile?.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8"></div>
              <div>
                <p className="text-brand-100 text-sm font-medium flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Total Bookings
                </p>
                <h3 className="text-4xl font-extrabold mt-2">{totalBookings}</h3>
              </div>
              <p className="text-brand-100 text-sm mt-4">Active trips and past history</p>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400" /> Current Balance Due
                </p>
                <h3 className={`text-3xl font-bold mt-2 ${ledger.closingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatCurrency(ledger.closingBalance)}
                </h3>
              </div>
              <p className="text-slate-500 text-sm mt-4">
                {ledger.closingBalance > 0 ? 'Please settle the outstanding balance.' : 'Your account is settled.'}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-600" /> Recent Bookings
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {bookings.length > 0 ? (
              bookings.slice(0, 5).map(booking => (
                <div key={booking._id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Plane className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{booking.sector || booking.serviceType.toUpperCase()}</h4>
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                          {booking.referenceNo}
                        </span>
                        • {booking.bookingDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/3">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-slate-500 font-medium">Total Amount</p>
                      <p className="font-bold text-slate-900">{formatCurrency(booking.totalAmount)}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      booking.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                      booking.paymentStatus === 'partially_paid' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {booking.paymentStatus?.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">
                <Plane className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p>No bookings found yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Ledger Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-600" /> Recent Ledger Activity
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-right">Debit</th>
                  <th className="px-6 py-4 text-right">Credit</th>
                  <th className="px-6 py-4 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.ledger.length > 0 ? (
                  ledger.ledger.slice(-5).reverse().map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-600">{new Date(entry.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{entry.referenceNo}</td>
                      <td className="px-6 py-4 text-slate-800">{entry.description}</td>
                      <td className="px-6 py-4 text-right text-rose-600 font-medium">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-emerald-600 font-medium">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        {formatCurrency(entry.runningBalance)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                      No recent activity found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};
