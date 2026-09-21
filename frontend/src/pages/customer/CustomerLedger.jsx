import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FileText } from 'lucide-react';

const CustomerLedger = () => {
  const { user } = useAuth();
  const [ledger, setLedger] = useState([]);
  const [summary, setSummary] = useState({ totalDebit: 0, totalCredit: 0, closingBalance: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await api.get(`/customers/${user.id}/ledger`);
        if (res.data.success) {
          setLedger(res.data.ledger || []);
          setSummary(res.data.summary || { totalDebit: 0, totalCredit: 0, closingBalance: 0 });
        }
      } catch (error) {
        console.error('Failed to fetch ledger', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLedger();
  }, [user.id]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account Ledger</h1>
        <p className="text-slate-500 mt-1">Detailed history of your transactions and payments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500">Total Billed</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(summary.totalDebit)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500">Total Paid</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(summary.totalCredit)}</p>
        </div>
        <div className={`bg-gradient-to-br ${summary.closingBalance > 0 ? 'from-rose-50 to-orange-50 border-rose-100' : 'from-emerald-50 to-teal-50 border-emerald-100'} rounded-2xl p-5 shadow-sm border`}>
          <p className={`text-sm font-medium ${summary.closingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            Outstanding Balance
          </p>
          <p className={`text-2xl font-bold mt-1 ${summary.closingBalance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
            {formatCurrency(summary.closingBalance)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-0">
          {ledger.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Description</th>
                    <th className="px-6 py-4 font-medium text-right text-rose-600">Debit</th>
                    <th className="px-6 py-4 font-medium text-right text-emerald-600">Credit</th>
                    <th className="px-6 py-4 font-medium text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledger.map((entry, index) => (
                    <tr key={entry.id || index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(entry.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">{entry.description}</div>
                        {entry.referenceNo && (
                          <div className="text-xs text-slate-500 mt-0.5">Ref: {entry.referenceNo}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-rose-600">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-emerald-600">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 text-right">
                        {formatCurrency(entry.runningBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <FileText className="mx-auto h-16 w-16 text-slate-200 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No transactions found</h3>
              <p>Your ledger is currently empty.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerLedger;
