import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plane,
  Users,
  UserPlus,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Compass,
  ArrowRight
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/common/PageHeader';
import { DateInput } from '../../components/common/DateInput';

export const NewBookingPage = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [airlines, setAirlines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingAirlines, setLoadingAirlines] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Customer Mode: 'existing' or 'new'
  const [customerMode, setCustomerMode] = useState('existing');

  // Form State
  const [formData, setFormData] = useState({
    bookingDate: new Date().toISOString().split('T')[0],
    bookingType: 'one_way',
    sector: '',
    journeyDate: '',
    returnDate: '',
    airlineId: '',
    flightNumber: '',
    pnr: '',
    ticketNumber: '',
    status: 'confirmed',

    // Customer info
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',

    // Financials
    baseFare: 0,
    tax: 0,
    serviceCharge: 0,
    otherCharges: 0,
    discount: 0,
    commission: 0,

    // Initial Payment
    initialPayment: 0,
    paymentMethod: 'cash',
    paymentReference: '',
    paymentNotes: ''
  });

  // Dynamic Passengers List
  const [passengers, setPassengers] = useState([
    {
      title: 'Mr',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      passportNumber: '',
      passportExpiry: '',
      nationality: 'Indian',
      phone: '',
      email: ''
    }
  ]);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [airlinesRes, customersRes] = await Promise.all([
          api.get('/airlines?status=active'),
          api.get('/customers?limit=100')
        ]);
        if (airlinesRes.data.success) setAirlines(airlinesRes.data.airlines || []);
        if (customersRes.data.success) setCustomers(customersRes.data.customers || []);
      } catch (e) {
        console.error('Failed to load master data:', e);
      } finally {
        setLoadingAirlines(false);
      }
    };
    loadMasterData();
  }, []);

  // Passenger management
  const addPassenger = () => {
    setPassengers((prev) => [
      ...prev,
      {
        title: 'Mr',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        passportNumber: '',
        passportExpiry: '',
        nationality: 'Indian',
        phone: '',
        email: ''
      }
    ]);
  };

  const removePassenger = (index) => {
    if (passengers.length === 1) {
      toastError('A booking must have at least one passenger.');
      return;
    }
    setPassengers((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePassenger = (index, field, value) => {
    setPassengers((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  // Live Financial Calculations
  const bf = parseFloat(formData.baseFare || 0);
  const tx = parseFloat(formData.tax || 0);
  const sc = parseFloat(formData.serviceCharge || 0);
  const oc = parseFloat(formData.otherCharges || 0);
  const dc = parseFloat(formData.discount || 0);
  const ip = parseFloat(formData.initialPayment || 0);

  const calculatedTotal = Math.max(0, Math.round((bf + tx + sc + oc - dc) * 100) / 100);
  const calculatedBalance = Math.max(0, Math.round((calculatedTotal - ip) * 100) / 100);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.sector || !formData.journeyDate || !formData.airlineId || !formData.flightNumber || !formData.pnr) {
      return toastError('Please fill in all mandatory flight information fields.');
    }

    if (customerMode === 'existing' && !formData.customerId) {
      return toastError('Please select a customer.');
    }

    if (customerMode === 'new' && (!formData.customerName || !formData.customerPhone)) {
      return toastError('Please enter the new customer name and phone number.');
    }

    // Validate passengers
    for (let i = 0; i < passengers.length; i++) {
      if (!passengers[i].firstName.trim() || !passengers[i].lastName.trim()) {
        return toastError(`Please provide First Name and Last Name for Passenger #${i + 1}.`);
      }
    }

    if (ip > calculatedTotal) {
      return toastError(`Initial payment (₹${ip}) cannot exceed total fare (₹${calculatedTotal}).`);
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        passengers
      };

      if (customerMode === 'existing') {
        payload.customerName = undefined;
        payload.customerPhone = undefined;
        payload.customerEmail = undefined;
        payload.customerAddress = undefined;
      } else {
        payload.customerId = undefined;
      }

      const res = await api.post('/bookings', payload);
      if (res.data.success) {
        success(`Booking ${res.data.booking.referenceNo} created successfully!`);
        navigate(`/bookings/${res.data.booking.id}`);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to create booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full pb-8 sm:pb-12 min-w-0">
      <PageHeader
        title="Create Flight Booking"
        subtitle="Generate reservations, attach passengers, calculate financials & issue transactions"
        icon={Plane}
        breadcrumbs={['Bookings', 'New Booking']}
      />

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 w-full min-w-0">
        {/* SECTION 1: Flight & Booking Information */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs overflow-hidden w-full min-w-0">
          <div className="px-3.5 py-2.5 sm:px-6 sm:py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-brand-600 text-white font-bold text-[10px] sm:text-xs flex items-center justify-center">1</span>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">Flight & Journey Details</h3>
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-slate-500">Step 1 of 4</span>
          </div>

          <div className="p-3.5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-[11px] sm:text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Booking Date *</label>
              <DateInput
                required
                value={formData.bookingDate}
                onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Booking Type *</label>
              <select
                value={formData.bookingType}
                onChange={(e) => setFormData({ ...formData, bookingType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none bg-white"
              >
                <option value="one_way">One Way</option>
                <option value="round_trip">Round Trip</option>
                <option value="multi_city">Multi City</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sector (e.g. DEL-DXB) *</label>
              <input
                type="text"
                required
                placeholder="e.g. DEL-DXB or BOM-LHR-BOM"
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date of Journey *</label>
              <DateInput
                required
                value={formData.journeyDate}
                onChange={(e) => setFormData({ ...formData, journeyDate: e.target.value })}
              />
            </div>

            {formData.bookingType !== 'one_way' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Return Date</label>
                <DateInput
                  value={formData.returnDate}
                  onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Airline Partner *</label>
              <select
                required
                value={formData.airlineId}
                onChange={(e) => setFormData({ ...formData, airlineId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none bg-white"
              >
                <option value="">Select Airline</option>
                {airlines.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Flight Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. EK-511 or 6E-208"
                value={formData.flightNumber}
                onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Airline PNR *</label>
              <input
                type="text"
                required
                placeholder="e.g. EK98XA"
                value={formData.pnr}
                onChange={(e) => setFormData({ ...formData, pnr: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none uppercase font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ticket Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 176-2451892110"
                value={formData.ticketNumber}
                onChange={(e) => setFormData({ ...formData, ticketNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Passenger Information (Multi-Passenger Support) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-600 text-white font-bold text-xs flex items-center justify-center">2</span>
              <h3 className="text-sm font-bold text-slate-800">Passenger Information</h3>
              <span className="ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-100 text-brand-800 border border-brand-200">
                Passenger Count: {passengers.length}
              </span>
            </div>
            <button
              type="button"
              onClick={addPassenger}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <Plus className="w-4 h-4" /> Add Passenger
            </button>
          </div>

          <div className="p-6 space-y-4">
            {passengers.map((p, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 relative space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    Passenger {idx + 1}
                  </span>
                  {passengers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePassenger(idx)}
                      className="text-rose-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Title</label>
                    <select
                      value={p.title}
                      onChange={(e) => updatePassenger(idx, 'title', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                      <option value="Master">Master</option>
                      <option value="Dr">Dr</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul"
                      value={p.firstName}
                      onChange={(e) => updatePassenger(idx, 'firstName', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sharma"
                      value={p.lastName}
                      onChange={(e) => updatePassenger(idx, 'lastName', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Date of Birth</label>
                    <DateInput
                      value={p.dateOfBirth}
                      onChange={(e) => updatePassenger(idx, 'dateOfBirth', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Passport Number</label>
                    <input
                      type="text"
                      placeholder="e.g. P1234567"
                      value={p.passportNumber}
                      onChange={(e) => updatePassenger(idx, 'passportNumber', e.target.value.toUpperCase())}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Passport Expiry</label>
                    <DateInput
                      value={p.passportExpiry}
                      onChange={(e) => updatePassenger(idx, 'passportExpiry', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Nationality</label>
                    <input
                      type="text"
                      value={p.nationality}
                      onChange={(e) => updatePassenger(idx, 'nationality', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Phone / Mobile</label>
                    <input
                      type="text"
                      placeholder="+91..."
                      value={p.phone}
                      onChange={(e) => updatePassenger(idx, 'phone', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: Customer Information */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-600 text-white font-bold text-xs flex items-center justify-center">3</span>
              <h3 className="text-sm font-bold text-slate-800">Billing Customer Information</h3>
            </div>
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCustomerMode('existing')}
                className={`px-3 py-1 rounded-md transition ${customerMode === 'existing' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
              >
                Select Existing Customer
              </button>
              <button
                type="button"
                onClick={() => setCustomerMode('new')}
                className={`px-3 py-1 rounded-md transition ${customerMode === 'new' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
              >
                + Create New Customer
              </button>
            </div>
          </div>

          <div className="p-6 text-xs">
            {customerMode === 'existing' ? (
              <div className="max-w-md">
                <label className="block font-semibold text-slate-700 mb-1.5">Select Registered Customer *</label>
                <select
                  required={customerMode === 'existing'}
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none bg-white"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerCode}) - {c.phone}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required={customerMode === 'new'}
                    placeholder="e.g. Vikram Singhania"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required={customerMode === 'new'}
                    placeholder="+91 98..."
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="customer@example.com"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Billing Address</label>
                  <input
                    type="text"
                    placeholder="City, State"
                    value={formData.customerAddress}
                    onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: Financial Breakdown & Payment */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-600 text-white font-bold text-xs flex items-center justify-center">4</span>
              <h3 className="text-sm font-bold text-slate-800">Financial Calculation & Initial Payment</h3>
            </div>
            <span className="text-xs font-medium text-slate-500">Step 4 of 4</span>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs">
            {/* Left: Line Item Charges */}
            <div className="space-y-3.5">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Customer Charges Breakdown</h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Base Fare (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.baseFare}
                    onChange={(e) => setFormData({ ...formData, baseFare: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Taxes & Airport Fees (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.tax}
                    onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Service / Markup Charge (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.serviceCharge}
                    onChange={(e) => setFormData({ ...formData, serviceCharge: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Other Ancillary Charges (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.otherCharges}
                    onChange={(e) => setFormData({ ...formData, otherCharges: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Promotional Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-semibold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Commission Earned (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.commission}
                    onChange={(e) => setFormData({ ...formData, commission: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Right: Payment & Summary Calculations */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">Live Booking Balance</h4>

                <div className="space-y-2 py-2 border-b border-slate-200 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Base Fare + Taxes:</span>
                    <span className="font-mono font-semibold text-slate-800">₹{(bf + tx).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Service Charges + Others:</span>
                    <span className="font-mono font-semibold text-slate-800">₹{(sc + oc).toLocaleString('en-IN')}</span>
                  </div>
                  {dc > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span className="font-mono font-semibold">-₹{dc.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Amount Charged:</span>
                    <span className="font-mono text-brand-700">₹{calculatedTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Initial Payment Received (₹)</label>
                    <input
                      type="number"
                      min="0"
                      max={calculatedTotal}
                      step="0.01"
                      value={formData.initialPayment}
                      onChange={(e) => setFormData({ ...formData, initialPayment: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-emerald-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>

                  {ip > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                        <select
                          value={formData.paymentMethod}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
                        >
                          <option value="cash">Cash</option>
                          <option value="upi">UPI</option>
                          <option value="bank_transfer">Bank Transfer / NEFT</option>
                          <option value="card">Credit / Debit Card</option>
                          <option value="cheque">Cheque</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Payment Reference</label>
                        <input
                          type="text"
                          placeholder="e.g. UPI-998811"
                          value={formData.paymentReference}
                          onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Balance Due</p>
                  <p className={`text-xl font-black font-mono ${calculatedBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{calculatedBalance.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    calculatedBalance === 0 ? 'bg-emerald-100 text-emerald-800' : ip > 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {calculatedBalance === 0 ? 'Paid in Full' : ip > 0 ? 'Partially Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/bookings')}
            className="px-6 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-600/30 flex items-center gap-2 transition disabled:opacity-50"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Confirm & Create Booking <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
