import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Trash2,
  RefreshCw,
  Layers,
  ArrowRight,
  Plane,
  Train,
  Bus,
  Hotel,
  Car
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const ExcelImportModal = ({ isOpen, onClose, onSuccess }) => {
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [existingCustomers, setExistingCustomers] = useState([]);
  const [existingBookings, setExistingBookings] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Load existing customers and bookings on open for live auto-matching and duplicate detection
  useEffect(() => {
    if (isOpen) {
      Promise.all([
        api.get('/customers?limit=1000').catch(() => ({ data: { customers: [] } })),
        api.get('/bookings?limit=5000').catch(() => ({ data: { bookings: [] } }))
      ]).then(([custRes, bookRes]) => {
        if (custRes.data?.customers) setExistingCustomers(custRes.data.customers || []);
        if (bookRes.data?.bookings) setExistingBookings(bookRes.data.bookings || []);
      }).catch((err) => console.error('Failed to load agency data:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Helper: normalize service type value
  const normalizeServiceValue = (val) => {
    if (!val) return 'flight';
    const s = String(val).toLowerCase().trim();
    if (s.includes('train') || s.includes('rail') || s.includes('irctc')) return 'train';
    if (s.includes('bus') || s.includes('volvo') || s.includes('coach')) return 'bus';
    if (s.includes('hotel') || s.includes('room') || s.includes('resort') || s.includes('stay') || s.includes('villa')) return 'hotel';
    if (s.includes('car') || s.includes('cab') || s.includes('taxi') || s.includes('driver')) return 'car';
    if (s.includes('flight') || s.includes('air') || s.includes('plane') || s.includes('indigo') || s.includes('spicejet') || s.includes('airindia')) return 'flight';
    return 'flight';
  };

  // Helper: map arbitrary header names to standardized keys
  const normalizeKey = (key) => {
    const clean = key.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Service type header (e.g. FLIGHT/TRAIN/ETC, Service, Type, Mode)
    if (
      ['servicetype', 'service', 'services', 'type', 'mode', 'category', 'item', 'flighttrainetc', 'flighttrain', 'flighttrainbus', 'traveltype', 'bookingtype'].includes(clean) ||
      (clean.includes('flight') && (clean.includes('train') || clean.includes('etc') || clean.includes('type') || clean.includes('service') || clean.includes('bus'))) ||
      (clean.includes('train') && clean.includes('etc')) ||
      (clean.includes('service') && clean.includes('type'))
    ) {
      return 'serviceType';
    }

    // 2. Customer Name (e.g. Coustomer Name, Customer Name, Coustomer, Client)
    if (['customername', 'coustomername', 'customer', 'coustomer', 'client', 'clientname'].includes(clean)) return 'customerName';
    
    // 3. Passenger Name (e.g. Passenger Name, Pax Name, Guest Name)
    if (['passengername', 'paxname', 'passenger', 'pax', 'travelername', 'guestname', 'guest'].includes(clean)) return 'passengerName';

    // 4. Contact / Phone
    if (['customerphone', 'phone', 'mobile', 'cell', 'contact', 'phonenumber', 'customermobile', 'contactnumber'].includes(clean)) return 'customerPhone';
    if (['customeremail', 'email', 'mail'].includes(clean)) return 'customerEmail';

    // 5. Reference No. (e.g. Reference No., Reference Number, PNR)
    if (['referenceno', 'referencenumber', 'reference', 'ref', 'pnr', 'bookingno', 'bookingid', 'ticketnumber', 'ticketno', 'refno'].includes(clean)) return 'referenceNo';

    // 6. Company (e.g. COMPANY, Vendor, Airline, Operator)
    if (['company', 'companyname', 'vendor', 'airline', 'operator', 'supplier', 'carrier'].includes(clean)) return 'companyName';

    // 7. Date (e.g. Date, Booking Date, Entry Date)
    if (['date', 'bookingdate', 'bookedon', 'entrydate', 'issuedate', 'traveldate'].includes(clean)) return 'bookingDate';
    if (['journeydate', 'departuredate', 'checkin', 'tourdate'].includes(clean)) return 'journeyDate';
    if (['returndate', 'checkout', 'arrivaldate'].includes(clean)) return 'returnDate';

    // 8. Description (e.g. Description, Sector, Route, Details)
    if (['description', 'sector', 'route', 'details', 'particulars', 'remarks', 'destination'].includes(clean)) return 'description';

    // 9. Cost Price & Sale Price
    if (['costprice', 'cost', 'buyrate', 'buyingrate', 'vendorprice', 'purchaseprice', 'buyingprice', 'netrate'].includes(clean)) return 'costPrice';
    if (['saleprice', 'salesprice', 'sellprice', 'sell', 'sale', 'price', 'customerprice', 'rate', 'totalamount', 'amount', 'sellingprice', 'grossrate', 'total'].includes(clean)) return 'sellPrice';
    if (['tax', 'gst', 'taxamount', 'gstamount', 'gstonmargin'].includes(clean)) return 'tax';
    if (['initialpayment', 'paid', 'payment', 'advance', 'paidamount', 'amountreceived', 'received', 'advancepaid'].includes(clean)) return 'initialPayment';
    if (['paymentmethod', 'method', 'paymode', 'modeofpayment'].includes(clean)) return 'paymentMethod';
    if (['status', 'bookingstatus'].includes(clean)) return 'status';
    if (['notes', 'remarks', 'comment'].includes(clean)) return 'notes';
    return key;
  };

  // Helper: robust date parser for Excel dates (DD-MM-YYYY, D-M-YYYY, serial dates, ISO dates)
  const parseExcelDate = (val) => {
    if (!val) return new Date().toISOString().split('T')[0];

    // If JavaScript Date object
    if (val instanceof Date && !isNaN(val)) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // If numeric Excel serial date
    if (typeof val === 'number' && val > 0) {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    const str = String(val).trim();

    // Match DD-MM-YYYY or D-M-YYYY or DD/MM/YYYY or D/M/YYYY (Indian/International travel standard)
    const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }

    // Match YYYY-MM-DD or YYYY/MM/DD
    const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (ymdMatch) {
      const year = ymdMatch[1];
      const month = ymdMatch[2].padStart(2, '0');
      const day = ymdMatch[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Match DD-MM-YY (2-digit year)
    const dmyShortMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/);
    if (dmyShortMatch) {
      const day = dmyShortMatch[1].padStart(2, '0');
      const month = dmyShortMatch[2].padStart(2, '0');
      const year = `20${dmyShortMatch[3]}`;
      return `${year}-${month}-${day}`;
    }

    return str;
  };

  // Helper: format any ISO/raw date into DD-MM-YYYY display format
  const formatDisplayDMY = (val) => {
    if (!val) return '';
    const str = String(val).trim();
    // YYYY-MM-DD -> DD-MM-YYYY
    const ymd = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (ymd) {
      return `${ymd[3].padStart(2, '0')}-${ymd[2].padStart(2, '0')}-${ymd[1]}`;
    }
    // D-M-YYYY -> DD-MM-YYYY
    const dmy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (dmy) {
      return `${dmy[1].padStart(2, '0')}-${dmy[2].padStart(2, '0')}-${dmy[3]}`;
    }
    return str;
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const fileExt = selected.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExt)) {
      toastError('Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    setFile(selected);
    parseExcelFile(selected);
  };

  const parseExcelFile = (fileObj) => {
    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: false });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

        if (rawJson.length === 0) {
          toastError('The uploaded Excel sheet contains no data rows.');
          setParsedRows([]);
          return;
        }

        // Build quick lookup map of existing booking reference numbers & PNRs
        const existingRefMap = new Set(
          (existingBookings || [])
            .map((b) => (b.referenceNo || '').toUpperCase().trim())
            .filter(Boolean)
        );
        const existingPnrMap = new Set(
          (existingBookings || [])
            .map((b) => (b.pnr || '').toUpperCase().trim())
            .filter(Boolean)
        );

        // Map and sanitize each row with automatic existing customer & booking duplicate matching
        const sanitized = rawJson.map((row, idx) => {
          const mapped = {};
          Object.keys(row).forEach((k) => {
            const standardKey = normalizeKey(k);
            mapped[standardKey] = row[k];
          });

          const rawCustName = (mapped.customerName || `Customer ${idx + 1}`).toString().trim();
          const rawPaxName = (mapped.passengerName || rawCustName).toString().trim();
          const rawCustPhone = (mapped.customerPhone || '').toString().trim();

          // Auto-match against existing saved agency customers
          const matchedCust = existingCustomers.find((c) => {
            const cName = (c.name || '').toLowerCase().trim();
            const rName = rawCustName.toLowerCase().trim();
            if (cName && rName && (cName === rName || cName.includes(rName) || rName.includes(cName))) return true;
            if (c.customerCode && rawCustName.toUpperCase() === c.customerCode.toUpperCase()) return true;
            if (rawCustPhone && c.phone && c.phone.replace(/[^0-9]/g, '') === rawCustPhone.replace(/[^0-9]/g, '')) return true;
            return false;
          });

          const isExistingCust = Boolean(matchedCust);
          const finalCustName = matchedCust ? matchedCust.name : rawCustName;
          const finalCustPhone = matchedCust ? matchedCust.phone : (rawCustPhone || '+91 9800000000');
          const finalCustEmail = matchedCust?.email || mapped.customerEmail || '';
          const customerId = matchedCust ? (matchedCust.id || matchedCust._id) : null;
          const customerCode = matchedCust?.customerCode || null;

          // Check if this booking reference / PNR already exists in database
          const rawRefNo = (mapped.referenceNo || '').toString().trim().toUpperCase();
          const isExistingBooking = Boolean(
            rawRefNo && (existingRefMap.has(rawRefNo) || existingPnrMap.has(rawRefNo))
          );

          // Format defaults
          const cost = parseFloat(mapped.costPrice || 0) || 0;
          const sell = parseFloat(mapped.sellPrice || 0) || cost;
          const tax = parseFloat(mapped.tax || 0) || 0;
          const profit = sell - cost - tax;
          const initialPay = parseFloat(mapped.initialPayment || 0) || 0;
          const balance = Math.max(0, sell - initialPay);

          // Determine service type with full auto-detection and normalization
          let rawServiceVal = mapped.serviceType;
          if (!rawServiceVal) {
            Object.values(row).forEach((v) => {
              const vs = String(v).toLowerCase().trim();
              if (['flight', 'train', 'bus', 'hotel', 'car', 'flights', 'trains', 'buses', 'hotels', 'cars', 'rail', 'irctc'].includes(vs)) {
                rawServiceVal = vs;
              }
            });
          }
          const service = normalizeServiceValue(rawServiceVal);

          const parsedBookingDate = parseExcelDate(mapped.bookingDate || mapped.date);
          const parsedJourneyDate = parseExcelDate(mapped.journeyDate || mapped.travelDate || mapped.bookingDate || mapped.date);

          return {
            _index: idx + 1,
            customerId,
            customerCode,
            isExistingCustomer: isExistingCust,
            isExistingBooking, // Mark indicating if already in database
            customerName: finalCustName,
            passengerName: rawPaxName,
            customerPhone: finalCustPhone,
            customerEmail: finalCustEmail,
            serviceType: service,
            referenceNo: rawRefNo,
            bookingDate: parsedBookingDate,
            journeyDate: parsedJourneyDate,
            description: mapped.description || `${service.toUpperCase()} Booking`,
            companyName: mapped.companyName || `${service.toUpperCase()} Vendor`,
            costPrice: cost,
            sellPrice: sell,
            tax,
            profit,
            initialPayment: initialPay,
            balanceDue: balance,
            paymentMethod: mapped.paymentMethod || 'cash',
            status: mapped.status || 'confirmed',
            notes: mapped.notes || 'Imported via Excel Sheet',
            isValid: Boolean(finalCustName && (sell > 0 || cost > 0))
          };
        });

        setParsedRows(sanitized);
        toastSuccess(`Successfully parsed ${sanitized.length} rows from ${fileObj.name}!`);
      } catch (err) {
        console.error('Error parsing Excel:', err);
        toastError('Failed to parse Excel file. Please ensure valid tabular structure.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(fileObj);
  };

  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        'FLIGHT/TRAIN/ETC': 'flight',
        'COMPANY': 'IndiGo Airlines',
        'Date': '09-08-2026',
        'Reference No.': 'MYPR26893855303',
        'Description': 'HDFC LIBERTY',
        'Passenger Name': 'Rahul Sharma',
        'Coustomer Name': 'HDFC LIBERTY',
        'COST PRICE': 500,
        'sale price': 500
      },
      {
        'FLIGHT/TRAIN/ETC': 'train',
        'COMPANY': 'IRCTC Rail',
        'Date': '10-08-2026',
        'Reference No.': 'MYPR26893855303_RC',
        'Description': 'DI',
        'Passenger Name': 'DI',
        'Coustomer Name': 'DI',
        'COST PRICE': 600,
        'sale price': 600
      },
      {
        'FLIGHT/TRAIN/ETC': 'bus',
        'COMPANY': 'Volvo Travels',
        'Date': '11-08-2026',
        'Reference No.': 'MN2FE89CHQDROU5C6687',
        'Description': 'BKK CCU 12 AUG TG',
        'Passenger Name': 'Brajendra Sah',
        'Coustomer Name': 'BRAJENDRA SAH',
        'COST PRICE': 700,
        'sale price': 700
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bookings_Template');
    XLSX.writeFile(wb, 'Liberty_Bookings_Import_Template.xlsx');
  };

  const handleUploadSubmit = async () => {
    if (parsedRows.length === 0) {
      toastError('No valid booking rows to import.');
      return;
    }

    try {
      setIsUploading(true);
      const res = await api.post('/bookings/bulk-import', { bookings: parsedRows });
      if (res.data?.success) {
        toastSuccess(res.data.message || `Successfully imported ${parsedRows.length} bookings!`);
        if (onSuccess) onSuccess();
        handleClose();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to import bookings.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedRows([]);
    setIsProcessing(false);
    setIsUploading(false);
    onClose();
  };

  const handleDeleteRow = (index) => {
    setParsedRows((prev) => prev.filter((_, i) => i !== index));
  };

  const getServiceIcon = (type) => {
    switch (type) {
      case 'train': return <Train className="w-3.5 h-3.5 text-emerald-600" />;
      case 'bus': return <Bus className="w-3.5 h-3.5 text-amber-600" />;
      case 'hotel': return <Hotel className="w-3.5 h-3.5 text-purple-600" />;
      case 'car': return <Car className="w-3.5 h-3.5 text-indigo-600" />;
      default: return <Plane className="w-3.5 h-3.5 text-sky-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-7xl max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#0B1E36] to-[#1E3A5F] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                Import Bookings from Excel Sheet
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-300">
                Bulk upload existing travel records (.xlsx, .xls, .csv) with auto-ledger creation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold border border-white/20 transition shrink-0 cursor-pointer"
              title="Download Sample Template"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Sample Template</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* File Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-5 sm:p-6 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/40 hover:bg-brand-50/70 transition cursor-pointer text-center group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto mb-2.5 shadow-md group-hover:scale-110 transition">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">
              {file ? file.name : 'Click to Choose or Drag & Drop Excel Sheet'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) spreadsheets
            </p>
          </div>

          {/* Parsed Rows Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    Parsed Rows Preview
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {parsedRows.filter((r) => !r.isExistingBooking).length} New to Import
                  </span>
                  {parsedRows.filter((r) => r.isExistingBooking).length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" /> {parsedRows.filter((r) => r.isExistingBooking).length} Already in Database (Previous Data Kept Unchanged)
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => { setFile(null); setParsedRows([]); }}
                  className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Clear All
                </button>
              </div>

              {/* Extended Width Horizontally Scrollable Table */}
              <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs max-h-[440px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[1150px]">
                  <thead className="bg-slate-50 sticky top-0 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 z-10">
                    <tr>
                      <th className="px-3.5 py-3 whitespace-nowrap">#</th>
                      <th className="px-3.5 py-3 whitespace-nowrap">Service</th>
                      <th className="px-3.5 py-3 whitespace-nowrap">Company</th>
                      <th className="px-3.5 py-3 whitespace-nowrap">Date</th>
                      <th className="px-3.5 py-3 whitespace-nowrap">Ref No. / PNR</th>
                      <th className="px-3.5 py-3 whitespace-nowrap">Description</th>
                      <th className="px-3.5 py-3 whitespace-nowrap">Passenger Name</th>
                      <th className="px-3.5 py-3 whitespace-nowrap">Customer Name</th>
                      <th className="px-3.5 py-3 whitespace-nowrap text-right">Cost Price (₹)</th>
                      <th className="px-3.5 py-3 whitespace-nowrap text-right">Sale Price (₹)</th>
                      <th className="px-3.5 py-3 whitespace-nowrap text-right">Profit (₹)</th>
                      <th className="px-3.5 py-3 whitespace-nowrap text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedRows.map((r, i) => (
                      <tr
                        key={i}
                        className={
                          r.isExistingBooking
                            ? 'bg-amber-50/60 hover:bg-amber-100/50 transition'
                            : 'hover:bg-slate-50/90 transition'
                        }
                      >
                        <td className="px-3.5 py-3 font-bold text-slate-400 text-[10px] whitespace-nowrap">{i + 1}</td>
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {getServiceIcon(r.serviceType)}
                            {r.serviceType}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 font-bold text-slate-800 text-xs whitespace-nowrap">
                          {r.companyName}
                        </td>
                        <td className="px-3.5 py-3 font-mono text-xs text-slate-700 font-semibold whitespace-nowrap">
                          {formatDisplayDMY(r.bookingDate)}
                        </td>
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-mono font-black text-xs text-brand-700">
                              {r.referenceNo || 'AUTO'}
                            </span>
                            {r.isExistingBooking && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 mt-1 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 w-fit">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0" /> Already in DB (Will Skip)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3.5 py-3 text-xs text-slate-600 max-w-[200px] truncate" title={r.description}>
                          {r.description}
                        </td>
                        <td className="px-3.5 py-3 font-semibold text-slate-800 text-xs whitespace-nowrap">
                          {r.passengerName || r.customerName}
                        </td>
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{r.customerName}</span>
                            {r.isExistingCustomer ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-2.5 h-2.5" /> {r.customerCode || 'Matched'}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                + New
                              </span>
                            )}
                          </div>
                          {r.customerPhone && r.customerPhone !== '+91 9800000000' && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{r.customerPhone}</div>
                          )}
                        </td>
                        <td className="px-3.5 py-3 font-mono text-right text-slate-600 font-bold whitespace-nowrap">₹{r.costPrice.toLocaleString('en-IN')}</td>
                        <td className="px-3.5 py-3 font-mono font-black text-right text-slate-900 whitespace-nowrap">₹{r.sellPrice.toLocaleString('en-IN')}</td>
                        <td className="px-3.5 py-3 font-mono font-black text-right text-emerald-600 whitespace-nowrap">
                          +₹{r.profit.toLocaleString('en-IN')}
                        </td>
                        <td className="px-3.5 py-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(i)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 sm:px-6 sm:py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleUploadSubmit}
            disabled={isUploading || parsedRows.length === 0 || parsedRows.filter((r) => !r.isExistingBooking).length === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 text-white font-black text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Importing Bookings...</span>
              </>
            ) : parsedRows.filter((r) => !r.isExistingBooking).length === 0 && parsedRows.length > 0 ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>All {parsedRows.length} Bookings Already Saved in Database</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {parsedRows.filter((r) => r.isExistingBooking).length > 0
                    ? `Save ${parsedRows.filter((r) => !r.isExistingBooking).length} New Bookings (${parsedRows.filter((r) => r.isExistingBooking).length} Existing Kept Unchanged)`
                    : `Save All ${parsedRows.length} Bookings to Database`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
