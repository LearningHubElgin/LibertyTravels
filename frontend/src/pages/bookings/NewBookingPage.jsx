import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plane,
  Train,
  Bus,
  Hotel,
  Car,
  Building2,
  Calendar,
  Hash,
  FileText,
  User,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  CreditCard,
  ChevronDown,
  Search,
  Percent,
  Layers
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/common/PageHeader';
import { DateInput } from '../../components/common/DateInput';
import { Modal } from '../../components/common/Modal';

export const NewBookingPage = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [companies, setCompanies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Quick Add Company Modal
  const [isQuickCompanyModalOpen, setIsQuickCompanyModalOpen] = useState(false);
  const [quickCompanyForm, setQuickCompanyForm] = useState({
    name: '',
    code: '',
    type: 'flight',
    contact: '',
    status: 'active'
  });
  const [savingQuickCompany, setSavingQuickCompany] = useState(false);

  // Customer Mode: 'existing' or 'new'
  const [customerMode, setCustomerMode] = useState('existing');
  const [customerSearch, setCustomerSearch] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    serviceType: 'flight', // flight, train, bus, hotel, car
    companyId: '',
    bookingDate: new Date().toISOString().split('T')[0],
    referenceNo: '',
    description: '',
    passengerName: '',

    // Customer
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',

    // Pricing & Financials
    costPrice: 0,
    sellPrice: 0,

    // Initial Payment
    initialPayment: 0,
    paymentMethod: 'cash',
    paymentReference: '',
    paymentNotes: '',

    // Optional detailed fields
    journeyDate: new Date().toISOString().split('T')[0],
    returnDate: '',
    bookingType: 'one_way',
    status: 'confirmed',
    notes: ''
  });

  // Additional passengers list (for multi-pax)
  const [additionalPassengers, setAdditionalPassengers] = useState([]);
  const [showAdditionalPax, setShowAdditionalPax] = useState(false);

  // Load Companies & Customers
  const loadMasterData = async () => {
    try {
      const [companiesRes, customersRes] = await Promise.all([
        api.get('/companies?status=active').catch(() => api.get('/airlines?status=active')),
        api.get('/customers?limit=200')
      ]);

      if (companiesRes.data.success) {
        setCompanies(companiesRes.data.companies || companiesRes.data.airlines || []);
      }
      if (customersRes.data.success) {
        setCustomers(customersRes.data.customers || []);
      }
    } catch (e) {
      console.error('Failed to load master data:', e);
      toastError('Could not load company or customer records.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  // Filtered companies based on selected service type
  const relevantCompanies = useMemo(() => {
    const directMatches = companies.filter(
      (c) => !c.type || c.type === formData.serviceType || c.type === 'general'
    );
    return directMatches.length > 0 ? directMatches : companies;
  }, [companies, formData.serviceType]);

  // Filtered customers for search dropdown
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.customerCode?.toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  // Live Financial Calculations
  const cost = parseFloat(formData.costPrice || 0);
  const sell = parseFloat(formData.sellPrice || 0);
  const grossProfit = Math.round((sell - cost) * 100) / 100;
  const profitMarginPercent = sell > 0 ? Math.round(((sell - cost) / sell) * 10000) / 100 : 0;
  const initPayment = parseFloat(formData.initialPayment || 0);
  const balanceDue = Math.max(0, Math.round((sell - initPayment) * 100) / 100);

  // Service Type Metadata & Placeholders
  const serviceConfigs = {
    flight: {
      name: 'Flight',
      icon: Plane,
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      activeTab: 'bg-sky-600 text-white shadow-sky-600/30',
      refPlaceholder: 'e.g. EK98XA or 6E-208',
      descPlaceholder: 'e.g. DEL-DXB Flight EK-511 / Economy',
      companyLabel: 'Airline / Airline Partner'
    },
    train: {
      name: 'Train',
      icon: Train,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      activeTab: 'bg-emerald-600 text-white shadow-emerald-600/30',
      refPlaceholder: 'e.g. 2489102839 (IRCTC PNR)',
      descPlaceholder: 'e.g. 12952 Mumbai Rajdhani Exp (3AC - Coach B3)',
      companyLabel: 'Railway Operator / IRCTC Vendor'
    },
    bus: {
      name: 'Bus',
      icon: Bus,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      activeTab: 'bg-amber-600 text-white shadow-amber-600/30',
      refPlaceholder: 'e.g. RDB-881923',
      descPlaceholder: 'e.g. Zingbus Delhi to Manali AC Sleeper (Seat 14)',
      companyLabel: 'Bus Operator / Vendor'
    },
    hotel: {
      name: 'Hotel',
      icon: Hotel,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      activeTab: 'bg-purple-600 text-white shadow-purple-600/30',
      refPlaceholder: 'e.g. HTL-CONF-9921',
      descPlaceholder: 'e.g. Taj Palace Mumbai - Deluxe Sea View Room (2 Nights)',
      companyLabel: 'Hotel / Hospitality Partner'
    },
    car: {
      name: 'Car',
      icon: Car,
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      activeTab: 'bg-indigo-600 text-white shadow-indigo-600/30',
      refPlaceholder: 'e.g. CAR-TRIP-771',
      descPlaceholder: 'e.g. Innova Crysta Airport Pickup & Full Day Tour',
      companyLabel: 'Car Rental / Fleet Vendor'
    }
  };

  const currentConfig = serviceConfigs[formData.serviceType] || serviceConfigs.flight;
  const CurrentIcon = currentConfig.icon;

  // Passenger management
  const addPassenger = () => {
    setAdditionalPassengers((prev) => [
      ...prev,
      {
        title: 'Mr',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        passportNumber: '',
        phone: ''
      }
    ]);
  };

  const removePassenger = (index) => {
    setAdditionalPassengers((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePassenger = (index, field, value) => {
    setAdditionalPassengers((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  // Quick Add Company Handler
  const handleQuickAddCompany = async (e) => {
    e.preventDefault();
    if (!quickCompanyForm.name || !quickCompanyForm.code) {
      return toastError('Company Name and Code are required.');
    }

    setSavingQuickCompany(true);
    try {
      const res = await api.post('/companies', {
        ...quickCompanyForm,
        type: formData.serviceType
      });
      if (res.data.success) {
        const created = res.data.company || res.data.airline;
        success(`Company ${created.name} added!`);
        setCompanies((prev) => [...prev, created]);
        setFormData((prev) => ({ ...prev, companyId: created.id || created._id }));
        setIsQuickCompanyModalOpen(false);
        setQuickCompanyForm({ name: '', code: '', type: formData.serviceType, contact: '', status: 'active' });
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to add company.');
    } finally {
      setSavingQuickCompany(false);
    }
  };

  // Main Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.companyId) {
      return toastError('Please select a Company / Vendor.');
    }

    if (!formData.bookingDate) {
      return toastError('Please enter Date of Booking.');
    }

    if (!formData.passengerName.trim()) {
      return toastError('Please enter Passenger Name.');
    }

    if (customerMode === 'existing' && !formData.customerId) {
      return toastError('Please select an existing customer.');
    }

    if (customerMode === 'new' && (!formData.customerName || !formData.customerPhone)) {
      return toastError('Please enter New Customer Name and Phone number.');
    }

    if (sell <= 0) {
      return toastError('Sell Price must be greater than 0.');
    }

    if (initPayment > sell) {
      return toastError(`Initial payment (₹${initPayment}) cannot exceed Sell Price (₹${sell}).`);
    }

    setSubmitting(true);
    try {
      // Build passengers payload
      const passengersPayload = [];
      const nameParts = formData.passengerName.trim().split(' ');
      const p1FirstName = nameParts[0] || formData.passengerName.trim();
      const p1LastName = nameParts.slice(1).join(' ') || '';

      passengersPayload.push({
        title: 'Mr',
        firstName: p1FirstName,
        lastName: p1LastName,
        phone: formData.customerPhone || ''
      });

      if (additionalPassengers.length > 0) {
        additionalPassengers.forEach((p) => {
          if (p.firstName.trim()) {
            passengersPayload.push(p);
          }
        });
      }

      const payload = {
        serviceType: formData.serviceType,
        companyId: formData.companyId,
        airlineId: formData.companyId,
        bookingDate: formData.bookingDate,
        journeyDate: formData.journeyDate || formData.bookingDate,
        referenceNo: formData.referenceNo ? formData.referenceNo.trim().toUpperCase() : undefined,
        pnr: formData.referenceNo ? formData.referenceNo.trim().toUpperCase() : undefined,
        description: formData.description.trim() || `${formData.serviceType.toUpperCase()} Booking`,
        sector: formData.description.trim() || `${formData.serviceType.toUpperCase()} Booking`,
        passengerName: formData.passengerName.trim(),
        
        costPrice: cost,
        sellPrice: sell,
        baseFare: sell,
        totalAmount: sell,
        profit: grossProfit,

        initialPayment: initPayment,
        paymentMethod: formData.paymentMethod,
        paymentReference: formData.paymentReference,
        paymentNotes: formData.paymentNotes,
        status: formData.status,

        passengers: passengersPayload
      };

      if (customerMode === 'existing') {
        payload.customerId = formData.customerId;
      } else {
        payload.customerName = formData.customerName.trim();
        payload.customerPhone = formData.customerPhone.trim();
        payload.customerEmail = formData.customerEmail?.trim();
        payload.customerAddress = formData.customerAddress?.trim();
      }

      const res = await api.post('/bookings', payload);
      if (res.data.success) {
        success(`Booking ${res.data.booking.referenceNo} created successfully!`);
        const targetId = res.data.booking?.id || res.data.booking?._id;
        if (targetId) {
          navigate(`/bookings/${targetId}`);
        } else {
          navigate('/bookings');
        }
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to create booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full pb-10 min-w-0">
      <PageHeader
        title="Create New Booking"
        subtitle="Universal booking module for Flight, Train, Bus, Hotel, and Car reservations"
        icon={CurrentIcon}
        breadcrumbs={['Bookings', 'New Booking']}
      />

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 w-full min-w-0">
        
        {/* TOP CARD: SERVICE TYPE SELECTION (FLIGHT / TRAIN / BUS / HOTEL / CAR) */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-brand-600 text-white font-bold text-[10px] flex items-center justify-center">1</span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Service Category Option
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Select from the 5 service options: Flight, Train, Bus, Hotel, or Car
              </p>
            </div>

            {/* Quick Dropdown Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600 whitespace-nowrap hidden sm:inline">
                Service Dropdown:
              </label>
              <select
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                className="px-3 py-1.5 border border-slate-200 rounded-xl font-bold text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
              >
                <option value="flight">✈️ Flight Booking</option>
                <option value="train">🚆 Train Booking</option>
                <option value="bus">🚌 Bus Booking</option>
                <option value="hotel">🏨 Hotel Booking</option>
                <option value="car">🚗 Car / Cab Booking</option>
              </select>
            </div>
          </div>

          {/* Visual Interactive Category Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mt-3.5">
            {Object.entries(serviceConfigs).map(([typeKey, config]) => {
              const Icon = config.icon;
              const isSelected = formData.serviceType === typeKey;
              return (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => setFormData({ ...formData, serviceType: typeKey })}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? `${config.activeTab} border-transparent shadow-md scale-[1.02]`
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                  <span className="text-xs font-bold">{config.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN FORM GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* LEFT 2 COLUMNS: BOOKING PARTICULARS & CUSTOMER */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* SECTION 2: COMPANY, DATES, REF NO & DESCRIPTION */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-brand-600 text-white font-bold text-[10px] flex items-center justify-center">2</span>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Booking Particulars ({currentConfig.name})
                  </h3>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${currentConfig.badgeColor}`}>
                  {currentConfig.name}
                </span>
              </div>

              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 text-xs">
                
                {/* 1. COMPANY OPTION (FETCHED FROM BACKEND WITH SIDEBAR OPTION) */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-800">
                      Company / Supplier *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickCompanyForm((prev) => ({ ...prev, type: formData.serviceType }));
                        setIsQuickCompanyModalOpen(true);
                      }}
                      className="text-[11px] font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Quick Add Company
                    </button>
                  </div>

                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      required
                      value={formData.companyId}
                      onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                      className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                    >
                      <option value="">-- Choose Company ({currentConfig.name}) --</option>
                      {relevantCompanies.map((c) => (
                        <option key={c.id || c._id} value={c.id || c._id}>
                          {c.name} ({c.code}) {c.type ? `• ${c.type.toUpperCase()}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Fetched from Company Master module (accessible via sidebar "Companies")
                  </p>
                </div>

                {/* 2. DATE OF BOOKING */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Date of Booking *
                  </label>
                  <DateInput
                    required
                    value={formData.bookingDate}
                    onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                  />
                </div>

                {/* 3. REFERENCE NO */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Reference No / PNR
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={currentConfig.refPlaceholder}
                      value={formData.referenceNo}
                      onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value.toUpperCase() })}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none uppercase font-mono font-bold"
                    />
                  </div>
                </div>

                {/* 4. DESCRIPTION */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 mb-1">
                    Description / Details *
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <textarea
                      rows={2}
                      required
                      placeholder={currentConfig.descPlaceholder}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                {/* 5. PASSENGER NAME */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-800">
                      Passenger Name *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (!showAdditionalPax) {
                          setShowAdditionalPax(true);
                          if (additionalPassengers.length === 0) addPassenger();
                        } else {
                          addPassenger();
                        }
                      }}
                      className="text-[11px] font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Additional Passenger
                    </button>
                  </div>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.passengerName}
                      onChange={(e) => setFormData({ ...formData, passengerName: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none font-semibold text-slate-900"
                    />
                  </div>
                </div>

                {/* Additional Passengers Expandable List */}
                {showAdditionalPax && additionalPassengers.length > 0 && (
                  <div className="sm:col-span-2 space-y-2.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Additional Passengers ({additionalPassengers.length})
                      </span>
                      <button
                        type="button"
                        onClick={addPassenger}
                        className="text-[11px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add One More
                      </button>
                    </div>

                    {additionalPassengers.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-2"
                      >
                        <div className="w-full sm:w-20">
                          <select
                            value={p.title}
                            onChange={(e) => updatePassenger(idx, 'title', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          >
                            <option value="Mr">Mr</option>
                            <option value="Mrs">Mrs</option>
                            <option value="Ms">Ms</option>
                            <option value="Master">Master</option>
                          </select>
                        </div>
                        <div className="flex-1 w-full">
                          <input
                            type="text"
                            placeholder={`Passenger #${idx + 2} First Name`}
                            value={p.firstName}
                            onChange={(e) => updatePassenger(idx, 'firstName', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="flex-1 w-full">
                          <input
                            type="text"
                            placeholder="Last Name"
                            value={p.lastName}
                            onChange={(e) => updatePassenger(idx, 'lastName', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removePassenger(idx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3: CUSTOMER NAME & BILLING (PREVIOUS CUSTOMER DROPDOWN & NEW CUSTOMER) */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-brand-600 text-white font-bold text-[10px] flex items-center justify-center">3</span>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Customer Name & Client Details
                  </h3>
                </div>

                {/* Switcher */}
                <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setCustomerMode('existing')}
                    className={`px-3 py-1 rounded-md transition ${
                      customerMode === 'existing' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Previous Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerMode('new')}
                    className={`px-3 py-1 rounded-md transition ${
                      customerMode === 'new' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    + New Customer
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 text-xs">
                {customerMode === 'existing' ? (
                  <div className="space-y-3">
                    <label className="block font-bold text-slate-800">
                      Select Previous / Registered Customer *
                    </label>

                    {/* Search & Select */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Quick search by name or phone..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                        />
                      </div>

                      <select
                        required={customerMode === 'existing'}
                        value={formData.customerId}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const found = customers.find((c) => (c.id || c._id) === selectedId);
                          setFormData({
                            ...formData,
                            customerId: selectedId,
                            customerPhone: found?.phone || '',
                            passengerName: formData.passengerName || found?.name || ''
                          });
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                      >
                        <option value="">-- Choose Customer from Dropdown ({filteredCustomers.length}) --</option>
                        {filteredCustomers.map((c) => (
                          <option key={c.id || c._id} value={c.id || c._id}>
                            {c.name} ({c.customerCode || 'CUST'}) - 📞 {c.phone}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.customerId && (
                      <div className="p-3 bg-brand-50/60 rounded-xl border border-brand-100 flex items-center justify-between text-xs text-brand-900">
                        <div>
                          <span className="font-bold">Selected: </span>
                          {customers.find((c) => (c.id || c._id) === formData.customerId)?.name} (
                          {customers.find((c) => (c.id || c._id) === formData.customerId)?.phone})
                        </div>
                        <span className="text-[10px] bg-brand-200/80 px-2 py-0.5 rounded-md font-bold text-brand-800">
                          {customers.find((c) => (c.id || c._id) === formData.customerId)?.customerCode}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Customer Full Name *</label>
                      <input
                        type="text"
                        required={customerMode === 'new'}
                        placeholder="e.g. Vikram Singhania"
                        value={formData.customerName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({
                            ...formData,
                            customerName: val,
                            passengerName: formData.passengerName || val
                          });
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
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
                      <label className="block font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                      <input
                        type="email"
                        placeholder="client@example.com"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Address / City</label>
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
          </div>

          {/* RIGHT 1 COLUMN: COST PRICE, SELL PRICE & FINANCIAL SUMMARY COLUMN */}
          <div className="space-y-4 sm:space-y-6">
            
            {/* PRICING & PROFIT CARD */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-brand-600 text-white font-bold text-[10px] flex items-center justify-center">4</span>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Pricing & Profit Columns
                  </h3>
                </div>
              </div>

              <div className="p-4 sm:p-5 space-y-4 text-xs">
                
                {/* COST PRICE COLUMN */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Cost Price (₹) <span className="text-[10px] font-normal text-slate-400">(Buy / Vendor Rate)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.costPrice || ''}
                      onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* SELL PRICE COLUMN */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Sell Price (₹) * <span className="text-[10px] font-normal text-slate-400">(Customer Price)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-brand-600">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={formData.sellPrice || ''}
                      onChange={(e) => setFormData({ ...formData, sellPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 pr-3 py-2 border border-brand-300 bg-brand-50/20 rounded-xl font-mono font-black text-brand-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* LIVE PROFIT / MARGIN BADGE */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  grossProfit >= 0 ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-rose-50/70 border-rose-200 text-rose-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" /> Gross Profit
                    </span>
                    <span className="font-mono font-black text-sm">
                      {grossProfit >= 0 ? `+₹${grossProfit.toLocaleString('en-IN')}` : `-₹${Math.abs(grossProfit).toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] mt-1 pt-1 border-t border-emerald-200/50">
                    <span className="opacity-80">Profit Margin:</span>
                    <span className="font-mono font-bold">{profitMarginPercent}%</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-3">
                  {/* INITIAL PAYMENT */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Initial Payment Received (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-emerald-600">₹</span>
                      <input
                        type="number"
                        min="0"
                        max={sell}
                        step="0.01"
                        placeholder="0.00"
                        value={formData.initialPayment || ''}
                        onChange={(e) => setFormData({ ...formData, initialPayment: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                  </div>

                  {initPayment > 0 && (
                    <div className="space-y-2">
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Payment Method</label>
                        <select
                          value={formData.paymentMethod}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
                        >
                          <option value="cash">Cash</option>
                          <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                          <option value="bank_transfer">Bank Transfer / NEFT / IMPS</option>
                          <option value="card">Credit / Debit Card</option>
                          <option value="cheque">Cheque</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Payment Ref / Txn ID</label>
                        <input
                          type="text"
                          placeholder="e.g. UPI-998822"
                          value={formData.paymentReference}
                          onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* LIVE BALANCE DUE */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Balance Due</p>
                      <p className={`text-lg font-black font-mono ${balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ₹{balanceDue.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      balanceDue === 0 ? 'bg-emerald-100 text-emerald-800' : initPayment > 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {balanceDue === 0 ? 'Paid' : initPayment > 0 ? 'Partial' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Confirm & Save Booking <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/bookings')}
                className="w-full py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* QUICK ADD COMPANY MODAL */}
      <Modal
        isOpen={isQuickCompanyModalOpen}
        onClose={() => setIsQuickCompanyModalOpen(false)}
        title={`Add New Company (${currentConfig.name})`}
        size="sm"
      >
        <form onSubmit={handleQuickAddCompany} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Company Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Indigo, IRCTC, Taj Hotels, RedBus"
              value={quickCompanyForm.name}
              onChange={(e) => setQuickCompanyForm({ ...quickCompanyForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Short Code *</label>
            <input
              type="text"
              required
              placeholder="e.g. 6E, IRCTC, TAJ, RDB"
              value={quickCompanyForm.code}
              onChange={(e) => setQuickCompanyForm({ ...quickCompanyForm, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl uppercase font-mono font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Contact Phone (Optional)</label>
            <input
              type="text"
              placeholder="+91..."
              value={quickCompanyForm.contact}
              onChange={(e) => setQuickCompanyForm({ ...quickCompanyForm, contact: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsQuickCompanyModalOpen(false)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingQuickCompany}
              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs"
            >
              {savingQuickCompany ? 'Adding...' : 'Add & Select'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
