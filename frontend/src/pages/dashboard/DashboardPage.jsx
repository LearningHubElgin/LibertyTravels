import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  DollarSign,
  CreditCard,
  AlertCircle,
  WalletCards,
  TrendingUp,
  Award,
  Calendar,
  Plane,
  ArrowUpRight,
  Filter,
  Users
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import api from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [upcomingAndRecent, setUpcomingAndRecent] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let query = `period=${period}`;
      if (period === 'custom' && customStart && customEnd) {
        query += `&startDate=${customStart}&endDate=${customEnd}`;
      }

      const [statsRes, chartsRes, recentRes] = await Promise.all([
        api.get(`/dashboard/stats?${query}`),
        api.get(`/dashboard/charts?${query}`),
        api.get('/dashboard/upcoming-and-recent')
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (chartsRes.data.success) setCharts(chartsRes.data);
      if (recentRes.data.success) setUpcomingAndRecent(recentRes.data);
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const handleApplyCustomDate = (e) => {
    e.preventDefault();
    if (customStart && customEnd) {
      fetchDashboardData();
    }
  };

  const formatCurrency = (val) => `₹${parseFloat(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      {/* Date Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 sm:p-2 bg-brand-50 rounded-lg sm:rounded-xl text-brand-600 border border-brand-100 shrink-0">
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <h3 className="text-[10px] sm:text-xs font-bold text-slate-800 uppercase tracking-wider">Dashboard Filter</h3>
            <p className="text-[9px] sm:text-[11px] text-slate-500">Live dynamic metrics from MongoDB database</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full md:w-auto">
          <div className="flex bg-slate-100 p-0.5 sm:p-1 rounded-lg sm:rounded-xl gap-0.5 sm:gap-1 text-[10px] sm:text-xs overflow-x-auto max-w-full">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'this_year', label: 'This Year' },
              { id: 'custom', label: 'Custom' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id)}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-semibold whitespace-nowrap transition ${
                  period === tab.id
                    ? 'bg-white text-brand-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <form onSubmit={handleApplyCustomDate} className="flex items-center gap-1.5 mt-2 md:mt-0 text-[10px] sm:text-xs">
              <input
                type="date"
                required
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                required
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 shadow-xs"
              >
                Apply
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 7 Core ERP Metric Cards - 2 Cards per row on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard
          title="Total Bookings"
          value={stats?.totalBookings?.period ?? 0}
          subValue={
            <span>
              Today: <strong className="text-slate-800">{stats?.totalBookings?.today ?? 0}</strong> &bull; Mo: <strong className="text-slate-800">{stats?.totalBookings?.thisMonth ?? 0}</strong>
            </span>
          }
          icon={BookOpen}
          color="blue"
          loading={loading}
        />

        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.revenue?.period)}
          subValue={
            <span>
              Today: <strong className="text-slate-800">{formatCurrency(stats?.revenue?.today)}</strong>
            </span>
          }
          icon={DollarSign}
          color="teal"
          loading={loading}
        />

        <StatCard
          title="Amount Received"
          value={formatCurrency(stats?.amountReceived?.period)}
          subValue={
            <span>
              Total: <strong className="text-emerald-700">{formatCurrency(stats?.amountReceived?.total)}</strong>
            </span>
          }
          icon={CreditCard}
          color="green"
          loading={loading}
        />

        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(stats?.outstandingAmount?.period)}
          subValue={
            <span>
              All-Time: <strong className="text-rose-700">{formatCurrency(stats?.outstandingAmount?.total)}</strong>
            </span>
          }
          icon={AlertCircle}
          color="red"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        <StatCard
          title="Total Expenses"
          value={formatCurrency(stats?.expenses?.period)}
          subValue={
            <span>
              This Month: <strong className="text-slate-800">{formatCurrency(stats?.expenses?.thisMonth)}</strong>
            </span>
          }
          icon={WalletCards}
          color="amber"
          loading={loading}
        />

        <StatCard
          title="Gross Revenue"
          value={formatCurrency(stats?.grossProfit?.period)}
          subValue={
            <span>
              Gross Volume
            </span>
          }
          icon={Award}
          color="purple"
          loading={loading}
        />

        <div className="col-span-2 lg:col-span-1">
          <StatCard
            title="Net Profit (Rev - Exp)"
            value={formatCurrency(stats?.netProfit?.period)}
            subValue={
              <span className={parseFloat(stats?.netProfit?.period || 0) >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                Net Agency Earnings
              </span>
            }
            icon={TrendingUp}
            color={parseFloat(stats?.netProfit?.period || 0) >= 0 ? 'green' : 'red'}
            loading={loading}
          />
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        {/* Sales & Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs min-w-0">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">Sales & Cash Flow Overview</h3>
              <p className="text-[10px] sm:text-xs text-slate-500">Revenue, Payments Received & Expenses Trend</p>
            </div>
          </div>

          <div className="h-56 sm:h-72 w-full min-w-0">
            {charts?.salesOverview && charts.salesOverview.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.salesOverview}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0e8ce9" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0e8ce9" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    formatter={(val) => formatCurrency(val)}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '10px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '6px' }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0e8ce9" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="received" name="Received" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRec)" />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No revenue trend data for the selected period
              </div>
            )}
          </div>
        </div>

        {/* Booking Status Donut */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between min-w-0">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">Booking Status Distribution</h3>
            <p className="text-[10px] sm:text-xs text-slate-500">Breakdown of bookings by operational status</p>
          </div>

          <div className="h-48 sm:h-56 w-full relative my-2 min-w-0">
            {charts?.statusDonut && charts.statusDonut.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.statusDonut}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="status"
                  >
                    {charts.statusDonut.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No status data available
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 text-[10px] sm:text-[11px]">
            {charts?.statusDonut?.map((s, idx) => (
              <div key={s.status} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-slate-600 truncate">{s.status}:</span>
                <span className="font-bold text-slate-900 ml-auto font-mono">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Company Bookings & Revenue Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-w-0">
        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-0.5">Company-wise Bookings</h3>
          <p className="text-[10px] sm:text-xs text-slate-500 mb-3">Number of bookings per company / supplier partner</p>
          <div className="h-48 sm:h-56 w-full min-w-0">
            {charts?.companyStats && charts.companyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.companyStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} />
                  <YAxis type="category" dataKey="company" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} width={90} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '10px' }}
                  />
                  <Bar dataKey="bookings" name="Bookings" fill="#0e8ce9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No company data</div>
            )}
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-0.5">Revenue by Company / Supplier</h3>
          <p className="text-[10px] sm:text-xs text-slate-500 mb-3">Gross sales volume generated per supplier company</p>
          <div className="h-48 sm:h-56 w-full min-w-0">
            {charts?.companyStats && charts.companyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.companyStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="company" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    formatter={(val) => formatCurrency(val)}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '10px' }}
                  />
                  <Bar dataKey="revenue" name="Gross Revenue" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No revenue data</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Bookings & Upcoming Journeys Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        {/* Recent Bookings (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs overflow-hidden min-w-0">
          <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-slate-100">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">Recent Bookings</h3>
              <p className="text-[10px] sm:text-xs text-slate-500">Latest ticket reservations in the system</p>
            </div>
            <button
              onClick={() => navigate('/bookings')}
              className="text-[10px] sm:text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-[11px] sm:text-xs border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="py-2.5 px-3 sm:py-3 sm:px-4">Ref No</th>
                  <th className="py-2.5 px-3 sm:py-3 sm:px-4">Passenger</th>
                  <th className="py-2.5 px-3 sm:py-3 sm:px-4">Sector</th>
                  <th className="py-2.5 px-3 sm:py-3 sm:px-4">Date</th>
                  <th className="py-2.5 px-3 sm:py-3 sm:px-4 text-right">Amount</th>
                  <th className="py-2.5 px-3 sm:py-3 sm:px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {upcomingAndRecent?.recentBookings?.map((b, idx) => (
                  <tr
                    key={b.id || b._id || b.referenceNo || `recent-booking-${idx}`}
                    onClick={() => navigate(`/bookings/${b.id || b._id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition"
                  >
                    <td className="py-2 px-3 sm:py-3 sm:px-4 font-mono font-bold text-brand-700">{b.referenceNo}</td>
                    <td className="py-2 px-3 sm:py-3 sm:px-4 font-medium text-slate-900 truncate max-w-[120px]">
                      {b.passengers?.[0]?.firstName} {b.passengers?.[0]?.lastName}
                      {b.passengers?.length > 1 && (
                        <span className="ml-1 text-[9px] sm:text-[10px] text-slate-400">+{b.passengers.length - 1}</span>
                      )}
                    </td>
                    <td className="py-2 px-3 sm:py-3 sm:px-4 font-semibold text-slate-800">{b.sector}</td>
                    <td className="py-2 px-3 sm:py-3 sm:px-4 text-slate-500 whitespace-nowrap">{formatDate(b.journeyDate)}</td>
                    <td className="py-2 px-3 sm:py-3 sm:px-4 font-mono font-semibold text-right">{formatCurrency(b.totalAmount)}</td>
                    <td className="py-2 px-3 sm:py-3 sm:px-4">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Outstanding Customers (1 Col) */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs overflow-hidden min-w-0">
          <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-slate-100">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">Pending Receivables</h3>
              <p className="text-[10px] sm:text-xs text-slate-500">Customers with balance</p>
            </div>
            <button
              onClick={() => navigate('/customers')}
              className="text-[10px] sm:text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              All <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {upcomingAndRecent?.outstandingCustomers?.length > 0 ? (
              upcomingAndRecent.outstandingCustomers.map((c, idx) => (
                <div
                  key={c.id || c._id || c.customerCode || `outstanding-cust-${idx}`}
                  onClick={() => navigate('/customers')}
                  className="p-3 sm:p-4 hover:bg-slate-50 cursor-pointer transition flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-bold text-slate-900 truncate">{c.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{c.phone}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono font-bold text-rose-600">
                      {formatCurrency(c.outstanding)}
                    </p>
                    <span className="text-[9px] text-slate-400">{c.bookingCount} bookings</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">All customer payments cleared!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
