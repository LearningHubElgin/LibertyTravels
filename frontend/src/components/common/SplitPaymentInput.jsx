import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Split, CreditCard, Banknote, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export const SplitPaymentInput = ({
  totalAmount = 0,
  initialPayment = 0,
  onChange,
  disabled = false
}) => {
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [upiApps, setUpiApps] = useState(['PhonePe', 'Google Pay', 'Paytm', 'BHIM', 'Amazon Pay', 'PayPal']);
  
  // Single mode state
  const [singleAccountType, setSingleAccountType] = useState('cash'); // 'cash' or 'bank'
  const [singleBankId, setSingleBankId] = useState('');
  const [singlePaymentMethod, setSinglePaymentMethod] = useState('cash');
  const [singleUpiApp, setSingleUpiApp] = useState('PhonePe');
  const [singleReference, setSingleReference] = useState('');

  // Split mode rows
  const [splitRows, setSplitRows] = useState([
    {
      id: 'split-1',
      accountType: 'cash',
      bankId: '',
      bankName: '',
      paymentMethod: 'cash',
      upiApp: '',
      amount: '',
      reference: ''
    }
  ]);

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
        console.error('Failed to load bank settings for split payment', e);
      }
    };
    fetchSettings();
  }, []);

  // Calculate sum of split rows
  const allocatedSum = splitRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const remainingToAllocate = Math.max(0, parseFloat(initialPayment || 0) - allocatedSum);
  const isPerfectSplit = Math.abs(allocatedSum - parseFloat(initialPayment || 0)) < 0.01;

  // Propagate state changes to parent form
  useEffect(() => {
    if (!isSplitMode) {
      const selectedBank = bankAccounts.find(b => b.id === singleBankId);
      onChange({
        isSplit: false,
        accountType: singleAccountType,
        bankId: singleAccountType === 'bank' ? singleBankId : null,
        bankName: singleAccountType === 'bank' ? (selectedBank?.bankName || null) : null,
        paymentMethod: singlePaymentMethod,
        upiMethod: singlePaymentMethod === 'upi' ? singleUpiApp : null,
        upiApp: singlePaymentMethod === 'upi' ? singleUpiApp : null,
        paymentReference: singleReference,
        splits: []
      });
    } else {
      const formattedSplits = splitRows.map(r => {
        const selectedBank = bankAccounts.find(b => b.id === r.bankId);
        return {
          accountType: r.accountType,
          bankId: r.accountType === 'bank' ? r.bankId : null,
          bankName: r.accountType === 'bank' ? (selectedBank?.bankName || r.bankName || 'Bank') : null,
          paymentMethod: r.paymentMethod,
          upiApp: r.paymentMethod === 'upi' ? r.upiApp : null,
          amount: parseFloat(r.amount) || 0,
          reference: r.reference || ''
        };
      });

      onChange({
        isSplit: true,
        accountType: 'cash',
        bankId: null,
        bankName: null,
        paymentMethod: 'other',
        upiMethod: null,
        upiApp: null,
        paymentReference: '',
        splits: formattedSplits,
        isPerfectSplit
      });
    }
  }, [
    isSplitMode,
    singleAccountType,
    singleBankId,
    singlePaymentMethod,
    singleUpiApp,
    singleReference,
    splitRows,
    bankAccounts,
    initialPayment,
    isPerfectSplit
  ]);

  const handleAddSplitRow = () => {
    const defaultBank = bankAccounts[0];
    setSplitRows(prev => [
      ...prev,
      {
        id: `split-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        accountType: 'bank',
        bankId: defaultBank?.id || '',
        bankName: defaultBank?.bankName || '',
        paymentMethod: 'upi',
        upiApp: upiApps[0] || 'PhonePe',
        amount: remainingToAllocate > 0 ? remainingToAllocate : '',
        reference: ''
      }
    ]);
  };

  const handleRemoveSplitRow = (index) => {
    if (splitRows.length <= 1) return;
    setSplitRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleSplitRowChange = (index, field, value) => {
    setSplitRows(prev => {
      const updated = [...prev];
      const row = { ...updated[index], [field]: value };

      if (field === 'accountType') {
        if (value === 'cash') {
          row.paymentMethod = 'cash';
          row.bankId = '';
          row.bankName = '';
          row.upiApp = '';
        } else {
          row.paymentMethod = 'upi';
          if (!row.bankId && bankAccounts.length > 0) {
            row.bankId = bankAccounts[0].id;
            row.bankName = bankAccounts[0].bankName;
          }
          if (!row.upiApp && upiApps.length > 0) {
            row.upiApp = upiApps[0];
          }
        }
      }

      if (field === 'bankId') {
        const found = bankAccounts.find(b => b.id === value);
        row.bankName = found ? found.bankName : '';
      }

      if (field === 'paymentMethod') {
        if (value === 'upi' && !row.upiApp && upiApps.length > 0) {
          row.upiApp = upiApps[0];
        }
      }

      updated[index] = row;
      return updated;
    });
  };

  const handleAutoFillRemaining = (index) => {
    const currentVal = parseFloat(splitRows[index].amount) || 0;
    const newRemaining = parseFloat(initialPayment || 0) - (allocatedSum - currentVal);
    if (newRemaining > 0) {
      handleSplitRowChange(index, 'amount', newRemaining);
    }
  };

  return (
    <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200 space-y-3">
      {/* Header with Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-brand-600" /> Payment Allocation
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            (Total Paid: ₹{parseFloat(initialPayment || 0).toLocaleString('en-IN')})
          </span>
        </div>

        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsSplitMode(false)}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
              !isSplitMode
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Single Destination
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setIsSplitMode(true);
              if (splitRows.length === 1 && (!splitRows[0].amount || splitRows[0].amount === 0)) {
                // Initialize split with current payment
                setSplitRows([
                  {
                    id: 'split-1',
                    accountType: singleAccountType,
                    bankId: singleBankId,
                    bankName: bankAccounts.find(b => b.id === singleBankId)?.bankName || '',
                    paymentMethod: singlePaymentMethod,
                    upiApp: singleUpiApp,
                    amount: initialPayment || '',
                    reference: singleReference
                  }
                ]);
              }
            }}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition flex items-center gap-1 ${
              isSplitMode
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Split className="w-3 h-3" /> Split Payment
          </button>
        </div>
      </div>

      {/* SINGLE DESTINATION MODE */}
      {!isSplitMode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Destination Account
            </label>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  setSingleAccountType('cash');
                  setSinglePaymentMethod('cash');
                }}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition ${
                  singleAccountType === 'cash'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-1 ring-emerald-400/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Cash Counter
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  setSingleAccountType('bank');
                  setSinglePaymentMethod('upi');
                  if (!singleBankId && bankAccounts.length > 0) setSingleBankId(bankAccounts[0].id);
                }}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition ${
                  singleAccountType === 'bank'
                    ? 'bg-blue-50 border-blue-300 text-blue-700 ring-1 ring-blue-400/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-blue-600" /> Bank Account
              </button>
            </div>
          </div>

          {singleAccountType === 'bank' && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Select Bank Account
              </label>
              <select
                disabled={disabled}
                value={singleBankId}
                onChange={(e) => setSingleBankId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              >
                {bankAccounts.length > 0 ? (
                  bankAccounts.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} {b.accountNumber ? `(${b.accountNumber.slice(-4)})` : ''}
                    </option>
                  ))
                ) : (
                  <option value="">Default Agency Bank</option>
                )}
              </select>
            </div>
          )}

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
              <option value="upi">UPI (PhonePe, GPay, etc.)</option>
              <option value="bank_transfer">Net Banking / NEFT / IMPS</option>
              <option value="card">Debit / Credit Card</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>

          {singlePaymentMethod === 'upi' && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                UPI App
              </label>
              <select
                disabled={disabled}
                value={singleUpiApp}
                onChange={(e) => setSingleUpiApp(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
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
              placeholder="e.g. UPI-987654 / Cheque No"
              value={singleReference}
              onChange={(e) => setSingleReference(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>
        </div>
      )}

      {/* MULTI SPLIT MODE */}
      {isSplitMode && (
        <div className="space-y-2.5 pt-1">
          {/* Split Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Total Expected</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{parseFloat(initialPayment || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Allocated</span>
                <span className={`font-mono font-bold ${isPerfectSplit ? 'text-emerald-600' : 'text-amber-600'}`}>
                  ₹{allocatedSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Remaining</span>
                <span className={`font-mono font-bold ${remainingToAllocate === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ₹{remainingToAllocate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {isPerfectSplit ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Perfectly Balanced
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Difference: ₹{Math.abs(allocatedSum - parseFloat(initialPayment || 0)).toFixed(2)}
              </span>
            )}
          </div>

          {/* Dynamic Split Rows */}
          <div className="space-y-2">
            {splitRows.map((row, idx) => (
              <div
                key={row.id || idx}
                className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
              >
                {/* Account Type Selector */}
                <div className="sm:col-span-2">
                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">Account</label>
                  <select
                    disabled={disabled}
                    value={row.accountType}
                    onChange={(e) => handleSplitRowChange(idx, 'accountType', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md bg-white focus:outline-none font-semibold text-slate-800"
                  >
                    <option value="cash">💵 Cash Counter</option>
                    <option value="bank">🏦 Bank Account</option>
                  </select>
                </div>

                {/* Bank Account Selection (if bank) */}
                <div className="sm:col-span-3">
                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">
                    {row.accountType === 'bank' ? 'Target Bank' : 'Register'}
                  </label>
                  {row.accountType === 'bank' ? (
                    <select
                      disabled={disabled}
                      value={row.bankId}
                      onChange={(e) => handleSplitRowChange(idx, 'bankId', e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md bg-white focus:outline-none font-medium"
                    >
                      {bankAccounts.length > 0 ? (
                        bankAccounts.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.bankName} {b.accountNumber ? `(${b.accountNumber.slice(-4)})` : ''}
                          </option>
                        ))
                      ) : (
                        <option value="">Primary Agency Bank</option>
                      )}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value="Main Cash Register"
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-500 font-medium"
                    />
                  )}
                </div>

                {/* Method / UPI App */}
                <div className="sm:col-span-2">
                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">Method</label>
                  <select
                    disabled={disabled}
                    value={row.paymentMethod}
                    onChange={(e) => handleSplitRowChange(idx, 'paymentMethod', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md bg-white focus:outline-none font-medium"
                  >
                    {row.accountType === 'cash' ? (
                      <option value="cash">Cash</option>
                    ) : (
                      <>
                        <option value="upi">UPI App</option>
                        <option value="bank_transfer">Net Banking</option>
                        <option value="card">Card</option>
                        <option value="cheque">Cheque</option>
                      </>
                    )}
                  </select>
                </div>

                {/* UPI App picker if UPI */}
                <div className="sm:col-span-2">
                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">
                    {row.paymentMethod === 'upi' ? 'UPI Provider' : 'Txn / Note'}
                  </label>
                  {row.paymentMethod === 'upi' ? (
                    <select
                      disabled={disabled}
                      value={row.upiApp}
                      onChange={(e) => handleSplitRowChange(idx, 'upiApp', e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md bg-white focus:outline-none font-medium text-brand-700"
                    >
                      {upiApps.map(app => (
                        <option key={app} value={app}>{app}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled={disabled}
                      placeholder="Ref / Chq #"
                      value={row.reference}
                      onChange={(e) => handleSplitRowChange(idx, 'reference', e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md font-mono"
                    />
                  )}
                </div>

                {/* Split Amount */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[9px] font-bold uppercase text-slate-400">Amount (₹)</label>
                    {remainingToAllocate > 0 && (!row.amount || row.amount === 0) && (
                      <button
                        type="button"
                        onClick={() => handleAutoFillRemaining(idx)}
                        className="text-[9px] font-bold text-brand-600 hover:text-brand-800"
                        title="Auto-fill remaining balance"
                      >
                        Fill Rem
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={disabled}
                    placeholder="0.00"
                    value={row.amount}
                    onChange={(e) => handleSplitRowChange(idx, 'amount', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md font-mono font-bold text-slate-900 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                {/* Delete row action */}
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    disabled={disabled || splitRows.length <= 1}
                    onClick={() => handleRemoveSplitRow(idx)}
                    className="p-1 text-slate-300 hover:text-rose-600 disabled:opacity-30 transition rounded"
                    title="Remove split line"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Split Line Button */}
          <div className="flex justify-between items-center pt-1">
            <button
              type="button"
              disabled={disabled}
              onClick={handleAddSplitRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-brand-600" /> Add Another Payment Split
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
