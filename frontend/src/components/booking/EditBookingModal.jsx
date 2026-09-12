import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  Plane,
  Train,
  Bus,
  Hotel,
  Car,
  Building2,
  Calendar,
  User,
  Users,
  Hash,
  FileText,
  Percent,
  TrendingUp,
  CreditCard,
  Plus,
  Trash2,
  Sparkles,
  Ticket
} from 'lucide-react';
import api from '../../services/api';
import { Modal } from '../common/Modal';
import { DateInput } from '../common/DateInput';
import { useToast } from '../../context/ToastContext';

export const EditBookingModal = ({ isOpen, onClose, booking, onSuccess }) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    serviceType: 'flight',
    companyId: '',
    bookingDate: '',
    journeyDate: '',
    returnDate: '',
    referenceNo: '',
    pnr: '',
    flightNumber: '',
    ticketNumber: '',
    description: '',
    passengerName: '',
    status: 'confirmed',
    notes: '',
    costPrice: 0,
    sellPrice: 0,
    tax: 0,
    discount: 0
  });

  const [extraGuests, setExtraGuests] = useState(0);
  const totalPassengersCount = 1 + (parseInt(extraGuests, 10) || 0);

  // Passenger list state
  const [passengersList, setPassengersList] = useState([]);

  // Unit rates for live multiplier
  const [unitCost, setUnitCost] = useState('');
  const [unitSell, setUnitSell] = useState('');

  // GST State
  const [gstMode, setGstMode] = useState('profit');
  const [gstRate, setGstRate] = useState(18);
  const [customGstAmount, setCustomGstAmount] = useState('');

  // Load Companies
  useEffect(() => {
    if (isOpen) {
      api.get('/companies?status=active')
        .then((res) => {
          if (res.data?.success) {
            setCompanies(res.data.companies || []);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Populate form with existing booking data
  useEffect(() => {
    if (booking && isOpen) {
      const bPaxCount = booking.passengers?.length || booking.passengerCount || 1;
      const bExtra = Math.max(0, bPaxCount - 1);
      setExtraGuests(bExtra);

      const bCost = parseFloat(booking.costPrice || 0);
      const bSell = parseFloat(booking.sellPrice || booking.totalAmount || 0);
      const bTax = parseFloat(booking.tax || 0);

      setFormData({
        serviceType: booking.serviceType || 'flight',
        companyId: booking.companyId || (booking.company?._id || booking.company?.id) || '',
        bookingDate: booking.bookingDate || '',
        journeyDate: booking.journeyDate || '',
        returnDate: booking.returnDate || '',
        referenceNo: booking.referenceNo || '',
        pnr: booking.pnr || '',
        flightNumber: booking.flightNumber || '',
        ticketNumber: booking.ticketNumber || '',
        description: booking.description || booking.sector || '',
        passengerName: booking.passengerName || '',
        status: booking.status || 'confirmed',
        notes: booking.notes || '',
        costPrice: bCost,
        sellPrice: bSell,
        tax: bTax,
        discount: parseFloat(booking.discount || 0)
      });

      if (bPaxCount > 0) {
        setUnitCost(bCost > 0 ? String(Math.round((bCost / bPaxCount) * 100) / 100) : '');
        setUnitSell(bSell > 0 ? String(Math.round((bSell / bPaxCount) * 100) / 100) : '');
      }

      if (bTax > 0) {
        setCustomGstAmount(String(bTax));
      } else {
        setCustomGstAmount('');
      }

      // Populate passengers list
      if (booking.passengers && Array.isArray(booking.passengers) && booking.passengers.length > 0) {
        setPassengersList(
          booking.passengers.map((p, idx) => ({
            id: p._id || idx,
            title: p.title || 'Mr',
            firstName: p.firstName || '',
            lastName: p.lastName || '',
            phone: p.phone || '',
            passportNumber: p.passportNumber || '',
            nationality: p.nationality || 'Indian'
          }))
        );
      } else {
        const parts = (booking.passengerName || '').split(' ');
        const lead = {
          id: 'lead',
          title: 'Mr',
          firstName: parts[0] || booking.passengerName || 'Lead Passenger',
          lastName: parts.slice(1).join(' ') || '',
          phone: booking.customer?.phone || '',
          passportNumber: '',
          nationality: 'Indian'
        };
        const list = [lead];
        for (let g = 1; g <= bExtra; g++) {
          list.push({
            id: `guest-${g}`,
            title: 'Mr',
            firstName: `${parts[0] || 'Passenger'} (Guest ${g})`,
            lastName: parts.slice(1).join(' ') || '',
            phone: '',
            passportNumber: '',
            nationality: 'Indian'
          });
        }
        setPassengersList(list);
      }
    }
  }, [booking, isOpen]);

  // Synchronize passenger list when extra guests count changes
  const handleUpdateExtraGuests = (newVal) => {
    const validCount = Math.max(0, parseInt(newVal, 10) || 0);
    const newTotalTickets = 1 + validCount;
    setExtraGuests(validCount);

    // Update prices
    const uCost = parseFloat(unitCost);
    if (!isNaN(uCost) && uCost > 0) {
      setFormData((prev) => ({
        ...prev,
        costPrice: Math.round(uCost * newTotalTickets * 100) / 100
      }));
    } else if (formData.costPrice > 0 && totalPassengersCount > 0) {
      const implied = parseFloat(formData.costPrice) / totalPassengersCount;
      setFormData((prev) => ({
        ...prev,
        costPrice: Math.round(implied * newTotalTickets * 100) / 100
      }));
      setUnitCost(String(Math.round(implied * 100) / 100));
    }

    const uSell = parseFloat(unitSell);
    if (!isNaN(uSell) && uSell > 0) {
      setFormData((prev) => ({
        ...prev,
        sellPrice: Math.round(uSell * newTotalTickets * 100) / 100
      }));
    } else if (formData.sellPrice > 0 && totalPassengersCount > 0) {
      const implied = parseFloat(formData.sellPrice) / totalPassengersCount;
      setFormData((prev) => ({
        ...prev,
        sellPrice: Math.round(implied * newTotalTickets * 100) / 100
      }));
      setUnitSell(String(Math.round(implied * 100) / 100));
    }

    // Sync passengers list
    setPassengersList((prev) => {
      const updated = [...prev];
      if (updated.length < newTotalTickets) {
        const p1Name = formData.passengerName || 'Passenger';
        const pParts = p1Name.split(' ');
        for (let i = updated.length; i < newTotalTickets; i++) {
          updated.push({
            id: `guest-${i}`,
            title: 'Mr',
            firstName: `${pParts[0]} (Guest ${i})`,
            lastName: pParts.slice(1).join(' ') || '',
            phone: '',
            passportNumber: '',
            nationality: 'Indian'
          });
        }
      } else if (updated.length > newTotalTickets) {
        updated.splice(newTotalTickets);
      }
      return updated;
    });
  };

  const handleUnitCostChange = (val) => {
    setUnitCost(val);
    const u = parseFloat(val);
    if (!isNaN(u) && u >= 0) {
      setFormData((prev) => ({
        ...prev,
        costPrice: Math.round(u * totalPassengersCount * 100) / 100
      }));
    } else if (val === '') {
      setFormData((prev) => ({ ...prev, costPrice: 0 }));
    }
  };

  const handleTotalCostChange = (val) => {
    const total = parseFloat(val) || 0;
    setFormData((prev) => ({ ...prev, costPrice: total }));
    if (total > 0 && totalPassengersCount > 0) {
      setUnitCost(String(Math.round((total / totalPassengersCount) * 100) / 100));
    } else if (val === '' || total === 0) {
      setUnitCost('');
    }
  };

  const handleUnitSellChange = (val) => {
    setUnitSell(val);
    const u = parseFloat(val);
    if (!isNaN(u) && u >= 0) {
      setFormData((prev) => ({
        ...prev,
        sellPrice: Math.round(u * totalPassengersCount * 100) / 100
      }));
    } else if (val === '') {
      setFormData((prev) => ({ ...prev, sellPrice: 0 }));
    }
  };

  const handleTotalSellChange = (val) => {
    const total = parseFloat(val) || 0;
    setFormData((prev) => ({ ...prev, sellPrice: total }));
    if (total > 0 && totalPassengersCount > 0) {
      setUnitSell(String(Math.round((total / totalPassengersCount) * 100) / 100));
    } else if (val === '' || total === 0) {
      setUnitSell('');
    }
  };

  // Financial calculations
  const cost = parseFloat(formData.costPrice || 0);
  const sell = parseFloat(formData.sellPrice || 0);
  const grossProfit = Math.round((sell - cost) * 100) / 100;
  const profitMarginPercent = sell > 0 ? Math.round(((sell - cost) / sell) * 10000) / 100 : 0;

  let calculatedGst = 0;
  if (customGstAmount !== '' && !isNaN(parseFloat(customGstAmount))) {
    calculatedGst = Math.max(0, Math.round(parseFloat(customGstAmount) * 100) / 100);
  } else if (gstMode === 'profit') {
    calculatedGst = grossProfit > 0 ? Math.round(((grossProfit * gstRate) / 100) * 100) / 100 : 0;
  } else {
    calculatedGst = 0;
  }

  const netProfit = Math.round((grossProfit - calculatedGst) * 100) / 100;
  const amountReceived = parseFloat(booking?.amountReceived || 0);
  const balanceDue = Math.max(0, Math.round((sell - amountReceived) * 100) / 100);

  const relevantCompanies = useMemo(() => {
    return companies.filter(
      (c) => !c.type || c.type === formData.serviceType || c.type === 'general'
    );
  }, [companies, formData.serviceType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sellPrice || parseFloat(formData.sellPrice) < 0) {
      return toastError('Please enter a valid sale price.');
    }

    setSubmitting(true);
    try {
      const bId = booking.id || booking._id;
      const payload = {
        ...formData,
        extraGuests,
        passengerCount: totalPassengersCount,
        tax: calculatedGst,
        profit: netProfit,
        passengers: passengersList.map((p) => ({
          title: p.title || 'Mr',
          firstName: (p.firstName || '').trim(),
          lastName: (p.lastName || '').trim(),
          phone: p.phone || '',
          passportNumber: (p.passportNumber || '').trim().toUpperCase(),
          nationality: p.nationality || 'Indian'
        }))
      };

      const res = await api.put(`/bookings/${bId}`, payload);
      if (res.data?.success) {
        toastSuccess('Booking details updated successfully!');
        if (onSuccess) onSuccess(res.data.booking);
        onClose();
      }
    } catch (err) {
      console.error('Error updating booking:', err);
      toastError(err.response?.data?.message || 'Failed to update booking.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !booking) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Booking – ${booking.referenceNo}`}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        
        {/* Service Type Selection */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {[
            { key: 'flight', label: 'Flight', icon: Plane, color: 'text-sky-600 border-sky-300 bg-sky-50' },
            { key: 'train', label: 'Train', icon: Train, color: 'text-emerald-600 border-emerald-300 bg-emerald-50' },
            { key: 'bus', label: 'Bus', icon: Bus, color: 'text-amber-600 border-amber-300 bg-amber-50' },
            { key: 'hotel', label: 'Hotel', icon: Hotel, color: 'text-purple-600 border-purple-300 bg-purple-50' },
            { key: 'car', label: 'Car', icon: Car, color: 'text-indigo-600 border-indigo-300 bg-indigo-50' }
          ].map((item) => {
            const Icon = item.icon;
            const isSel = formData.serviceType === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFormData({ ...formData, serviceType: item.key })}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl border font-bold text-xs transition cursor-pointer ${
                  isSel
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Core Booking Particulars */}
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Company / Supplier */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Company / Supplier *</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="">-- Choose Company --</option>
                  {relevantCompanies.map((c) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Booking Date */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Booking Date *</label>
              <DateInput
                required
                value={formData.bookingDate}
                onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
              />
            </div>

            {/* Reference No / PNR */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Reference No / PNR</label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.pnr || formData.referenceNo}
                  onChange={(e) => setFormData({ ...formData, pnr: e.target.value.toUpperCase() })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl uppercase font-mono font-bold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Description / Sector / Route *</label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <textarea
                rows={2}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>
        </div>

        {/* Lead Passenger & Extra Guests */}
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Primary Passenger Name (Lead) *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.passengerName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, passengerName: val });
                    setPassengersList((prev) => {
                      const updated = [...prev];
                      if (updated.length > 0) {
                        const parts = val.split(' ');
                        updated[0] = {
                          ...updated[0],
                          firstName: parts[0] || val,
                          lastName: parts.slice(1).join(' ') || ''
                        };
                      }
                      return updated;
                    });
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700 text-xs">Extra Passengers / Guests</label>
                <span className="text-[10px] font-mono font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.2 rounded-full">
                  {totalPassengersCount} {totalPassengersCount === 1 ? 'Total Ticket' : 'Total Tickets'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-slate-200 rounded-xl bg-white p-0.5 shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleUpdateExtraGuests(extraGuests - 1)}
                    disabled={extraGuests <= 0}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center disabled:opacity-30 transition text-sm cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={extraGuests}
                    onWheel={(e) => e.target.blur()}
                    onChange={(e) => handleUpdateExtraGuests(e.target.value)}
                    className="w-10 text-center font-mono font-bold text-slate-900 text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateExtraGuests(extraGuests + 1)}
                    className="w-7 h-7 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold flex items-center justify-center transition text-sm cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center gap-1 flex-wrap">
                  {[0, 1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleUpdateExtraGuests(num)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                        extraGuests === num
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Passenger Names List Editor */}
          {passengersList.length > 0 && (
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <p className="font-bold text-slate-700 text-[11px] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brand-600" /> Passenger Details ({passengersList.length} Tickets)
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {passengersList.map((p, idx) => (
                  <div key={p.id || idx} className="grid grid-cols-12 gap-1.5 items-center p-1.5 rounded-lg bg-white border border-slate-200 text-[11px]">
                    <span className="col-span-1 text-slate-400 font-bold text-center">#{idx + 1}</span>
                    <select
                      value={p.title || 'Mr'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPassengersList((prev) => {
                          const updated = [...prev];
                          updated[idx] = { ...updated[idx], title: val };
                          return updated;
                        });
                      }}
                      className="col-span-2 px-1.5 py-1 border border-slate-200 rounded-md font-semibold text-xs bg-slate-50"
                    >
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                      <option value="Master">Mstr</option>
                    </select>
                    <input
                      type="text"
                      placeholder="First Name"
                      value={p.firstName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPassengersList((prev) => {
                          const updated = [...prev];
                          updated[idx] = { ...updated[idx], firstName: val };
                          return updated;
                        });
                      }}
                      className="col-span-4 px-2 py-1 border border-slate-200 rounded-md text-xs font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={p.lastName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPassengersList((prev) => {
                          const updated = [...prev];
                          updated[idx] = { ...updated[idx], lastName: val };
                          return updated;
                        });
                      }}
                      className="col-span-3 px-2 py-1 border border-slate-200 rounded-md text-xs font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="Phone / Passport"
                      value={p.passportNumber || p.phone}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPassengersList((prev) => {
                          const updated = [...prev];
                          updated[idx] = { ...updated[idx], passportNumber: val };
                          return updated;
                        });
                      }}
                      className="col-span-2 px-2 py-1 border border-slate-200 rounded-md text-xs font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pricing & Profit Columns with Live Multiplier */}
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Cost Price */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700">
                  Cost Price (₹) <span className="text-slate-400 font-normal">(Buy Rate)</span>
                </label>
                {totalPassengersCount > 1 && (
                  <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                    × {totalPassengersCount} Tickets
                  </span>
                )}
              </div>

              {totalPassengersCount > 1 ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Rate (₹ / Tkt)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={unitCost}
                      onWheel={(e) => e.target.blur()}
                      onChange={(e) => handleUnitCostChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono font-bold text-slate-800 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Total Cost (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.costPrice || ''}
                      onWheel={(e) => e.target.blur()}
                      onChange={(e) => handleTotalCostChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono font-bold text-slate-800 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>
              ) : (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.costPrice || ''}
                  onWheel={(e) => e.target.blur()}
                  onChange={(e) => handleTotalCostChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              )}
            </div>

            {/* Sell Price */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700">
                  Sell Price (₹) * <span className="text-slate-400 font-normal">(Customer Price)</span>
                </label>
                {totalPassengersCount > 1 && (
                  <span className="text-[10px] font-mono font-bold text-brand-700 bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded">
                    × {totalPassengersCount} Tickets
                  </span>
                )}
              </div>

              {totalPassengersCount > 1 ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-brand-700 font-semibold mb-0.5">Rate (₹ / Tkt) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={unitSell}
                      onWheel={(e) => e.target.blur()}
                      onChange={(e) => handleUnitSellChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-brand-300 rounded-lg font-mono font-black text-brand-900 text-xs bg-brand-50/10 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-brand-700 font-semibold mb-0.5">Total Sell (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={formData.sellPrice || ''}
                      onWheel={(e) => e.target.blur()}
                      onChange={(e) => handleTotalSellChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-brand-300 bg-brand-50/30 rounded-lg font-mono font-black text-brand-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>
              ) : (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formData.sellPrice || ''}
                  onWheel={(e) => e.target.blur()}
                  onChange={(e) => handleTotalSellChange(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-300 bg-brand-50/20 rounded-xl font-mono font-black text-brand-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              )}
            </div>
          </div>

          {/* Dark Financial Breakdown Summary */}
          <div className="p-3 rounded-xl bg-slate-900 text-white space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between text-slate-300">
              <span>Cost (Buy Rate):</span>
              <span>
                ₹{cost.toLocaleString('en-IN')}{' '}
                {totalPassengersCount > 1 && cost > 0 && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    (₹{(parseFloat(unitCost) || (cost / totalPassengersCount)).toLocaleString('en-IN')} × {totalPassengersCount} Tkts)
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Customer Sell Price:</span>
              <span>
                ₹{sell.toLocaleString('en-IN')}{' '}
                {totalPassengersCount > 1 && sell > 0 && (
                  <span className="text-[10px] text-amber-300 font-normal">
                    (₹{(parseFloat(unitSell) || (sell / totalPassengersCount)).toLocaleString('en-IN')} × {totalPassengersCount} Tkts)
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1">
              <span>Gross Margin / Profit:</span>
              <span>+₹{grossProfit.toLocaleString('en-IN')} ({profitMarginPercent}%)</span>
            </div>
            <div className="flex justify-between text-xs font-black text-white border-t border-slate-700 pt-1">
              <span>Total Bill (Balance Due: ₹{balanceDue.toLocaleString('en-IN')}):</span>
              <span className="text-amber-400">₹{sell.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Status & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Booking Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Notes / Remarks</label>
            <input
              type="text"
              placeholder="e.g. Special dietary requirement / Window seat requested"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md shadow-brand-600/20 transition disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Hi this is Shubham Jana 