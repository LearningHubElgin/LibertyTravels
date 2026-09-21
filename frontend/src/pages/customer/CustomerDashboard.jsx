import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { CreditCard, Calendar, TrendingUp, DollarSign, Package, Plane, Receipt, User as UserIcon } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex items-center">
      <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 mr-4`}>
        <Icon className={`h-6 w-6 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  </div>
);

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    bookings: [],
    stats: {
      totalBookings: 0,
      totalAmount: 0,
      paidAmount: 0,
      outstandingAmount: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const res = await api.get(`/customers/${user.id}`);
        if (res.data.success) {
          const customer = res.data.customer;
          setData({
            bookings: customer.bookings || [],
            stats: {
              totalBookings: customer.totalBookings || 0,
              totalAmount: customer.totalAmount || 0,
              paidAmount: customer.paidAmount || 0,
              outstandingAmount: customer.outstandingAmount || 0
            }
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomerData();
  }, [user.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user.name}</h1>
        <p className="text-slate-500 mt-1">Here is an overview of your account.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Bookings"
          value={data.stats.totalBookings}
          icon={Calendar}
          colorClass="bg-blue-500"
        />
        <StatCard
          title="Total Amount"
          value={formatCurrency(data.stats.totalAmount)}
          icon={TrendingUp}
          colorClass="bg-indigo-500"
        />
        <StatCard
          title="Paid Amount"
          value={formatCurrency(data.stats.paidAmount)}
          icon={DollarSign}
          colorClass="bg-emerald-500"
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(data.stats.outstandingAmount)}
          icon={CreditCard}
          colorClass="bg-rose-500"
        />
      </div>

      {/* Recent Activity / Bookings */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800">Recent Bookings</h2>
        </div>
        <div className="p-0">
          {data.bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-3 font-medium">Booking ID</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium text-right">Amount</th>
                    <th className="px-6 py-3 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.bookings.slice(0, 5).map((booking) => (
                    <tr key={booking._id || booking.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {booking.bookingId || booking._id.substring(0,8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(booking.bookingDate || booking.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 text-right">
                        {formatCurrency(booking.totalAmount || booking.sellPrice || 0)}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p>No bookings found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
