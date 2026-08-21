import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users2,
  Plane,
  WalletCards,
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Building2
} from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';

export const ReportsPage = () => {
  const [activeReport, setActiveReport] = useState('sales'); // 'sales', 'bookings', 'revenue', 'profit', 'outstanding', 'expenses', 'companies'

  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Report Data States
  const [salesData, setSalesData] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [profitData, setProfitData] = useState(null);
  const [outstandingData, setOutstandingData] = useState(null);
  const [expenseData, setExpenseData] = useState(null);
  const [companyData, setCompanyData] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let query = '';
      if (startDate) query += `startDate=${startDate}&`;
      if (endDate) query += `endDate=${endDate}&`;

      if (activeReport === 'sales') {
        const res = await api.get(`/reports/sales?${query}`);
        if (res.data.success) setSalesData(res.data);
      } else if (activeReport === 'bookings') {
        const res = await api.get(`/reports/bookings?${query}`);
        if (res.data.success) setBookingData(res.data);
      } else if (activeReport === 'revenue') {
        const res = await api.get(`/reports/revenue?${query}`);
        if (res.data.success) setRevenueData(res.data);
      } else if (activeReport === 'profit') {
        const res = await api.get(`/reports/profit?${query}`);
        if (res.data.success) setProfitData(res.data);
      } else if (activeReport === 'outstanding') {
        const res = await api.get('/reports/outstanding');
        if (res.data.success) setOutstandingData(res.data);
      } else if (activeReport === 'expenses') {
        const res = await api.get(`/reports/expenses?${query}`);
        if (res.data.success) setExpenseData(res.data);
      } else if (activeReport === 'companies') {
        const res = await api.get(`/reports/companies?${query}`);
        if (res.data.success) setCompanyData(res.data);
      }
    } catch (e) {
      console.error('Error fetching report:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, startDate, endDate]);

  const formatCurrency = (val) => `₹${parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeReport === 'sales' && salesData?.bookings) {
      csvContent += 'Reference No,Customer,Sector,Journey Date,Company,Total Amount,Paid,Balance,Status\n';
      salesData.bookings.forEach((b) => {
        csvContent += `"${b.referenceNo}","${b.customer?.name}","${b.sector}","${b.journeyDate}","${b.company?.name || ''}",${b.totalAmount},${b.amountReceived},${b.balanceDue},"${b.status}"\n`;
      });
    } else if (activeReport === 'outstanding' && outstandingData?.customers) {
      csvContent += 'Customer Code,Name,Phone,Total Bookings,Total Charged,Paid Amount,Outstanding Balance\n';
      outstandingData.customers.forEach((c) => {
        csvContent += `"${c.customerCode}","${c.name}","${c.phone}",${c.totalBookings},${c.totalAmount},${c.paidAmount},${c.outstandingAmount}\n`;
      });
    } else if (activeReport === 'companies' && companyData?.companies) {
      csvContent += 'Company,Code,Country,Bookings,Revenue,Booking Share %,Revenue Share %\n';
      companyData.companies.forEach((a) => {
        csvContent += `"${a.name}","${a.code}","${a.country}",${a.bookingsCount},${a.revenue},${a.bookingShare},${a.revenueShare}\n`;
      });
    } else {
      csvContent += 'Report export ready.\n';
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `liberty_${activeReport}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reportTabs = [
    { id: 'sales', label: 'Sales Report', icon: DollarSign },
    { id: 'bookings', label: 'Booking Statistics', icon: BarChart3 },
    { id: 'revenue', label: 'Revenue Breakdown', icon: TrendingUp },
    { id: 'profit', label: 'Profit & Loss Statement', icon: TrendingUp },
    { id: 'outstanding', label: 'Customer Receivables', icon: Users2 },
    { id: 'expenses', label: 'Expenses Analysis', icon: WalletCards },
    { id: 'companies', label: 'Company Partner Share', icon: Building2 }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      <PageHeader
        title="Enterprise Reports & Analytics"
        subtitle="In-depth financial reports, revenue streams, profit margins, outstanding receivables and market shares"
        icon={BarChart3}
        actions={
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] sm:text-xs font-semibold rounded-lg sm:rounded-xl shadow-xs transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] sm:text-xs font-semibold rounded-lg sm:rounded-xl shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          </div>
        }
      />

      {/* Navigation Tabs Bar */}
      <div className="flex bg-white p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs overflow-x-auto gap-1 w-full min-w-0 pb-2 sm:pb-2">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold whitespace-nowrap transition ${
                isActive
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Date Filter Bar */}
      {activeReport !== 'outstanding' && (
        <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 text-[10px] sm:text-xs w-full min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-700">Filter Period:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 border border-slate-200 rounded-lg bg-slate-50 text-[10px] sm:text-xs"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 border border-slate-200 rounded-lg bg-slate-50 text-[10px] sm:text-xs"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="font-semibold text-brand-600 hover:underline"
            >
              Reset All Time
            </button>
          )}
        </div>
      )}

      {/* Report Content */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:p-6 w-full min-w-0">
        {loading ? (
          <LoadingSpinner size="md" text="Compiling report analytics..." />
        ) : (
          <>
            {/* 1. SALES REPORT */}
            {activeReport === 'sales' && salesData && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  <div className="p-2.5 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-slate-200 border-l-4 border-l-brand-600 shadow-xs min-w-0">
                    <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 truncate">Total Bookings</p>
                    <p className="text-xs sm:text-xl font-bold text-slate-900 mt-0.5 sm:mt-1 font-mono truncate">{salesData.summary?.totalBookings}</p>
                  </div>
                  <div className="p-2.5 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-slate-200 border-l-4 border-l-blue-500 shadow-xs min-w-0">
                    <p className="text-[9px] sm:text-[10px] uppercase font-bold text-blue-600 truncate">Gross Sales</p>
                    <p className="text-xs sm:text-xl font-bold text-brand-700 mt-0.5 sm:mt-1 font-mono truncate">{formatCurrency(salesData.summary?.totalRevenue)}</p>
                  </div>
                  <div className="p-2.5 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-slate-200 border-l-4 border-l-emerald-500 shadow-xs min-w-0">
                    <p className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-600 truncate">Collected</p>
                    <p className="text-xs sm:text-xl font-bold text-emerald-700 mt-0.5 sm:mt-1 font-mono truncate">{formatCurrency(salesData.summary?.totalReceived)}</p>
                  </div>
                  <div className="p-2.5 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-slate-200 border-l-4 border-l-rose-500 shadow-xs min-w-0">
                    <p className="text-[9px] sm:text-[10px] uppercase font-bold text-rose-600 truncate">Receivables</p>
                    <p className="text-xs sm:text-xl font-bold text-rose-700 mt-0.5 sm:mt-1 font-mono truncate">{formatCurrency(salesData.summary?.totalOutstanding)}</p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                        <th className="py-3 px-4">Ref No</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Sector</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Company</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4 text-right">Paid</th>
                        <th className="py-3 px-4 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                      {salesData.bookings?.map((b, idx) => (
                        <tr key={b.id || b._id || b.referenceNo || `sale-${idx}`} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-bold text-brand-700">{b.referenceNo}</td>
                          <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">{b.customer?.name}</td>
                          <td className="py-2.5 px-4 font-sans font-bold">{b.sector}</td>
                          <td className="py-2.5 px-4 text-slate-500">{formatDate(b.bookingDate)}</td>
                          <td className="py-2.5 px-4 font-sans">{b.company?.name || ''}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatCurrency(b.totalAmount)}</td>
                          <td className="py-2.5 px-4 text-right text-emerald-600 font-semibold">{formatCurrency(b.amountReceived)}</td>
                          <td className="py-2.5 px-4 text-right text-rose-600 font-semibold">{formatCurrency(b.balanceDue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. BOOKING REPORT */}
            {activeReport === 'bookings' && bookingData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50">
                    <h4 className="font-bold text-slate-900 mb-4 text-sm">Status Distribution</h4>
                    <div className="space-y-2">
                      {bookingData.statusBreakdown?.map((s) => (
                        <div key={s.status} className="flex justify-between items-center text-xs p-2 bg-white rounded-lg border border-slate-200">
                          <span className="font-semibold uppercase text-slate-700">{s.status}</span>
                          <span className="font-bold font-mono text-slate-900 text-sm">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50">
                    <h4 className="font-bold text-slate-900 mb-4 text-sm">Journey Type Distribution</h4>
                    <div className="space-y-2">
                      {bookingData.typeBreakdown?.map((t) => (
                        <div key={t.type} className="flex justify-between items-center text-xs p-2 bg-white rounded-lg border border-slate-200">
                          <span className="font-semibold uppercase text-slate-700">{t.type?.replace('_', ' ')}</span>
                          <span className="font-bold font-mono text-slate-900 text-sm">{t.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. REVENUE BREAKDOWN REPORT */}
            {activeReport === 'revenue' && revenueData?.revenueSummary && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-black text-slate-900 mb-4 text-base">Revenue Composition Breakdown</h4>
                  <div className="space-y-3 text-xs font-mono">
                    <div className="flex justify-between py-2 border-b border-slate-200">
                      <span className="font-sans font-semibold text-slate-600">Base Fare Revenue:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(revenueData.revenueSummary.baseFare)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200">
                      <span className="font-sans font-semibold text-slate-600">Supplier Taxes & Surcharges:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(revenueData.revenueSummary.tax)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200 text-brand-700">
                      <span className="font-sans font-bold">Agency Service Fee & Markup:</span>
                      <span className="font-bold text-sm">{formatCurrency(revenueData.revenueSummary.serviceCharge)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200 text-teal-700">
                      <span className="font-sans font-bold">Supplier Commissions:</span>
                      <span className="font-bold text-sm">{formatCurrency(revenueData.revenueSummary.commission)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200">
                      <span className="font-sans font-semibold text-slate-600">Ancillary & Other Charges:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(revenueData.revenueSummary.otherCharges)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200 text-emerald-600">
                      <span className="font-sans font-semibold">Discounts Given:</span>
                      <span className="font-bold">-{formatCurrency(revenueData.revenueSummary.discount)}</span>
                    </div>
                    <div className="flex justify-between pt-4 text-base font-black text-slate-900 border-t-2 border-slate-900">
                      <span className="font-sans">Total Gross Sales:</span>
                      <span className="text-brand-700">{formatCurrency(revenueData.revenueSummary.totalGrossRevenue)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. PROFIT & LOSS REPORT */}
            {activeReport === 'profit' && profitData?.profitSummary && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div className="p-8 bg-slate-900 text-white rounded-2xl shadow-xl space-y-4">
                  <h4 className="font-black text-lg text-brand-300">Profit & Loss Statement</h4>
                  <div className="space-y-3 text-xs font-mono pt-2 border-t border-slate-800">
                    <div className="flex justify-between py-1 text-slate-300">
                      <span className="font-sans">Total Gross Ticket Revenue:</span>
                      <span className="font-bold text-white">{formatCurrency(profitData.profitSummary.totalGrossRevenue)}</span>
                    </div>
                    <div className="flex justify-between py-1 text-slate-300">
                      <span className="font-sans">Agency Fee & Commission Revenue:</span>
                      <span className="font-bold text-brand-400">{formatCurrency(profitData.profitSummary.serviceRevenue)}</span>
                    </div>
                    <div className="flex justify-between py-1 text-rose-400">
                      <span className="font-sans">Total Operating Overhead Expenses:</span>
                      <span className="font-bold">-{formatCurrency(profitData.profitSummary.totalExpenses)}</span>
                    </div>
                    <div className="flex justify-between pt-4 border-t-2 border-slate-700 text-xl font-black">
                      <span className="font-sans text-white">Net Operating Profit:</span>
                      <span className={parseFloat(profitData.profitSummary.netProfit) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {formatCurrency(profitData.profitSummary.netProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-slate-400 pt-1">
                      <span className="font-sans">Net Profit Margin:</span>
                      <span>{profitData.profitSummary.profitMargin}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. CUSTOMER OUTSTANDING REPORT */}
            {activeReport === 'outstanding' && outstandingData && (
              <div className="space-y-6">
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Total Agency Outstanding Receivables</span>
                    <p className="text-2xl font-black font-mono text-rose-700 mt-1">{formatCurrency(outstandingData.grandOutstanding)}</p>
                  </div>
                  <span className="text-xs font-semibold text-rose-600 bg-white px-3 py-1.5 rounded-lg border border-rose-200">
                    {outstandingData.customers?.length || 0} Account(s) with pending balance
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Customer Name</th>
                        <th className="py-3 px-4">Phone Number</th>
                        <th className="py-3 px-4 text-center">Bookings</th>
                        <th className="py-3 px-4 text-right">Total Billed</th>
                        <th className="py-3 px-4 text-right">Total Paid</th>
                        <th className="py-3 px-4 text-right">Balance Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                      {outstandingData.customers?.map((c, idx) => (
                        <tr key={c.id || c._id || c.customerCode || `cust-${idx}`} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-bold text-brand-700">{c.customerCode}</td>
                          <td className="py-2.5 px-4 font-sans font-bold text-slate-900">{c.name}</td>
                          <td className="py-2.5 px-4 font-sans text-slate-600">{c.phone}</td>
                          <td className="py-2.5 px-4 text-center font-bold">{c.totalBookings}</td>
                          <td className="py-2.5 px-4 text-right font-semibold">{formatCurrency(c.totalAmount)}</td>
                          <td className="py-2.5 px-4 text-right text-emerald-600 font-semibold">{formatCurrency(c.paidAmount)}</td>
                          <td className="py-2.5 px-4 text-right font-black text-rose-600 text-sm">{formatCurrency(c.outstandingAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. EXPENSES ANALYSIS REPORT */}
            {activeReport === 'expenses' && expenseData && (
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Filtered Operating Expenses</span>
                    <p className="text-2xl font-black font-mono text-rose-600 mt-1">{formatCurrency(expenseData.totalExpenses)}</p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                        <th className="py-3 px-4">Expense Category</th>
                        <th className="py-3 px-4 text-right">Total Amount (₹)</th>
                        <th className="py-3 px-4 text-right">Share of Total Overhead</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {expenseData.categories?.map((cat, idx) => (
                        <tr key={cat.category || `cat-${idx}`} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-bold text-slate-900">{cat.category}</td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600">{formatCurrency(cat.amount)}</td>
                          <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-700">{cat.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 7. COMPANY PARTNER SHARE REPORT */}
            {activeReport === 'companies' && companyData && (
              <div className="space-y-6">
                <div className="overflow-x-auto border border-slate-200 rounded-xl text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                        <th className="py-3 px-4">Company / Supplier</th>
                        <th className="py-3 px-4 font-mono">Code</th>
                        <th className="py-3 px-4 text-center">Bookings Count</th>
                        <th className="py-3 px-4 text-right">Gross Revenue (₹)</th>
                        <th className="py-3 px-4 text-right">Booking Volume Share</th>
                        <th className="py-3 px-4 text-right">Revenue Market Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                      {companyData.companies?.map((a, idx) => (
                        <tr key={a.id || a._id || a.code || `comp-${idx}`} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-sans font-bold text-slate-900">{a.name}</td>
                          <td className="py-2.5 px-4 font-bold text-brand-700">{a.code}</td>
                          <td className="py-2.5 px-4 text-center font-bold">{a.bookingsCount}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-emerald-600">{formatCurrency(a.revenue)}</td>
                          <td className="py-2.5 px-4 text-right text-slate-700">{a.bookingShare}%</td>
                          <td className="py-2.5 px-4 text-right font-bold text-brand-700">{a.revenueShare}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
