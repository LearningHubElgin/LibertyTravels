import React, { useState, useEffect } from 'react';
import { CreditCard, Building2, Smartphone } from 'lucide-react';
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
  const [singlePaymentMethod, setSinglePaymentMethod] = useState('cash'); // 'cash' | 'upi' | 'bank' | 'cheque' | 'card'
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
            const defaultId = defaultBank.id || defaultBank._id;
            setSingleBankId(defaultId);
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

  // Propagate state changes to parent form whenever payment inputs change
  useEffect(() => {
    const isCash = singlePaymentMethod === 'cash';
    const selectedBank = bankAccounts.find(b => String(b.id || b._id) === String(singleBankId)) || bankAccounts[0];
    const effectiveBankId = isCash ? null : (selectedBank ? (selectedBank.id || selectedBank._id) : null);
    const effectiveBankName = isCash ? null : (selectedBank ? selectedBank.bankName : (singlePaymentMethod === 'upi' ? singleUpiApp : 'Bank'));

    if (typeof onChange === 'function') {
      onChange({
        isSplit: false,
        accountType: isCash ? 'cash' : 'bank',
        bankId: effectiveBankId,
        bankName: effectiveBankName,
        paymentMethod: singlePaymentMethod,
        upiMethod: singlePaymentMethod === 'upi' ? singleUpiApp : null,
        upiApp: singlePaymentMethod === 'upi' ? singleUpiApp : null,
        paymentReference: singleReference,
        splits: []
      });
    }
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

      {/* Payment Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Payment Mode
          </label>
          <select
            disabled={disabled}
            value={singlePaymentMethod}
            onChange={(e) => {
              const val = e.target.value;
              setSinglePaymentMethod(val);
              if (val === 'bank' && !singleBankId && bankAccounts.length > 0) {
                setSingleBankId(bankAccounts[0].id || bankAccounts[0]._id);
              }
            }}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium cursor-pointer"
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI / Online App</option>
            <option value="bank">Bank Transfer (NEFT / RTGS / IMPS)</option>
            <option value="cheque">Cheque</option>
            <option value="card">Debit / Credit Card</option>
          </select>
        </div>

        {/* UPI Application Selector */}
        {singlePaymentMethod === 'upi' && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              UPI App
            </label>
            <select
              disabled={disabled}
              value={singleUpiApp}
              onChange={(e) => setSingleUpiApp(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-brand-700 cursor-pointer"
            >
              {upiApps.map(app => (
                <option key={app} value={app}>{app}</option>
              ))}
            </select>
          </div>
        )}

        {/* Bank Account Selector */}
        {(singlePaymentMethod === 'bank' || singlePaymentMethod === 'cheque' || singlePaymentMethod === 'card' || singlePaymentMethod === 'upi') && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Deposit Bank Account
            </label>
            {bankAccounts.length > 0 ? (
              <select
                disabled={disabled}
                value={singleBankId}
                onChange={(e) => setSingleBankId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-brand-700 cursor-pointer"
              >
                {bankAccounts.map((b) => (
                  <option key={b.id || b._id} value={b.id || b._id}>
                    {b.bankName} {b.accountNumber ? `(..${String(b.accountNumber).slice(-4)})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-2.5 py-1.5 text-xs bg-amber-50 text-amber-800 rounded-lg border border-amber-200 font-medium">
                Agency Bank Account
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Ref / Txn ID / Cheque No
          </label>
          <input
            type="text"
            disabled={disabled}
            placeholder="e.g. UTR / UPI-12345 / Cheque#"
            value={singleReference}
            onChange={(e) => setSingleReference(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
          />
        </div>
      </div>
    </div>
  );
};