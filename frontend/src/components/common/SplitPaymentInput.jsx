import React, { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import api from '../../services/api';

export const SplitPaymentInput = ({
  totalAmount = 0,
  initialPayment = 0,
  onChange,
  disabled = false
}) => {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [upiApps, setUpiApps] = useState(['PhonePe', 'Google Pay', 'Paytm', 'BHIM', 'Amazon Pay', 'PayPal']);
  
  // Single mode state
  const [singlePaymentMethod, setSinglePaymentMethod] = useState('cash'); // 'cash' | 'upi'
  const [singleUpiApp, setSingleUpiApp] = useState('PhonePe');
  const [singleReference, setSingleReference] = useState('');
  const [singleBankId, setSingleBankId] = useState('');

  // Fetch bank accounts and UPI settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data.success && res.data.settings) {
          const banks = res.data.settings.bankAccounts || [];
          setBankAccounts(banks);
          if (banks.length > 0) {
            const defaultBank = banks.find(b => b.isDefault) || banks[0];
            setSingleBankId(defaultBank.id);
          }
          if (res.data.settings.upiMethods && res.data.settings.upiMethods.length > 0) {
            setUpiApps(res.data.settings.upiMethods);
            setSingleUpiApp(res.data.settings.upiMethods[0]);
          }
        }
      } catch (e) {
        console.error('Failed to load bank settings for payment', e);
      }
    };
    fetchSettings();
  }, []);

  // Propagate state changes to parent form
  useEffect(() => {
    const isCash = singlePaymentMethod === 'cash';
    const selectedBank = bankAccounts.find(b => b.id === singleBankId);
    
    onChange({
      isSplit: false,
      accountType: isCash ? 'cash' : 'bank',
      bankId: isCash ? null : (singleBankId || bankAccounts[0]?.id || null),
      bankName: isCash ? null : (selectedBank?.bankName || bankAccounts[0]?.bankName || singleUpiApp || 'Bank'),
      paymentMethod: singlePaymentMethod,
      upiMethod: singlePaymentMethod === 'upi' ? singleUpiApp : null,
      upiApp: singlePaymentMethod === 'upi' ? singleUpiApp : null,
      paymentReference: singleReference,
      splits: []
    });
  }, [
    singlePaymentMethod,
    singleUpiApp,
    singleReference,
    singleBankId,
    bankAccounts,
    initialPayment
  ]);

  return (
    <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-brand-600" /> Payment Details
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono font-bold">
          Paid: ₹{parseFloat(initialPayment || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Payment Inputs */}
      <div className={`grid grid-cols-1 ${singlePaymentMethod === 'upi' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-2.5 pt-1`}>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Payment Method
          </label>
          <select
            disabled={disabled}
            value={singlePaymentMethod}
            onChange={(e) => setSinglePaymentMethod(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
          </select>
        </div>

        {singlePaymentMethod === 'upi' && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              UPI / Online App
            </label>
            <select
              disabled={disabled}
              value={singleUpiApp}
              onChange={(e) => setSingleUpiApp(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-brand-700"
            >
              {upiApps.map(app => (
                <option key={app} value={app}>{app}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Ref / Txn ID (Optional)
          </label>
          <input
            type="text"
            disabled={disabled}
            placeholder="e.g. UPI-987654 / Ref No"
            value={singleReference}
            onChange={(e) => setSingleReference(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
          />
        </div>
      </div>
    </div>
  );
};
