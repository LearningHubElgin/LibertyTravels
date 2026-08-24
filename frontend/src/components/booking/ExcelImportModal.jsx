import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Car,
  Users
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
  const [updateExistingMode, setUpdateExistingMode] = useState(true);
  const [filterTab, setFilterTab] = useState('all');
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

    // 3. Passenger Name (e.g. Passenger Name, Pax Name, Guest Name, Passenger Name/ pax / Guest / Narration)
    if (
      ['passengername', 'paxname', 'passenger', 'pax', 'travelername', 'guestname', 'guest', 'passengernames', 'passengernamepaxguestnarration', 'passengernamepaxguest', 'paxguest', 'narration', 'passengerdetail'].includes(clean) ||
      (clean.includes('passenger') && (clean.includes('name') || clean.includes('pax') || clean.includes('guest') || clean.includes('narration'))) ||
      (clean.includes('pax') && (clean.includes('guest') || clean.includes('name')))
    ) {
      return 'passengerName';
    }

    // 4. Extra Passengers / Quota Count (e.g. extra passenger, extra guests, extra pax, extra)
    if (
      ['extrapassenger', 'extrapassengers', 'extraguests', 'extraguest', 'extrapax', 'extraperson', 'additionalpassengers', 'extra', 'extrapass', 'extrapassengerpax', 'extrapassengerscount', 'guestcount', 'extrapaxcount', 'tickets', 'ticketcount', 'seats', 'extraseats'].includes(clean) ||
      (clean.includes('extra') && (clean.includes('passenger') || clean.includes('pax') || clean.includes('guest') || clean.includes('ticket') || clean.includes('person') || clean.includes('seat')))
    ) {
      return 'extraPassengers';
    }

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
        const existingRefMap = new Map();
        const existingPnrMap = new Map();
        (existingBookings || []).forEach((b) => {
          if (b.referenceNo) existingRefMap.set(b.referenceNo.toUpperCase().trim(), b);
          if (b.pnr) existingPnrMap.set(b.pnr.toUpperCase().trim(), b);
        });

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
          const matchedExisting = rawRefNo ? (existingRefMap.get(rawRefNo) || existingPnrMap.get(rawRefNo) || null) : null;
          const isExistingBooking = Boolean(matchedExisting);

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

          // Extra passenger and total tickets quota count
          const extraPaxCount = parseInt(mapped.extraPassengers || mapped.extraGuests || mapped.extraPassenger || mapped.extraPax || 0, 10) || 0;
          const totalTickets = 1 + Math.max(0, extraPaxCount);

          // Detect all field data changes compared to existing database record
          let hasChanges = false;
          let changedFields = [];
          let diffDetails = {};

          if (matchedExisting) {
            const existingCustName = (matchedExisting.customer?.name || matchedExisting.customerName || '').trim();
            const existingCompName = (matchedExisting.company?.name || matchedExisting.companyName || '').trim();
            const existingService = (matchedExisting.serviceType || '').trim();
            const existingBookingDate = (matchedExisting.bookingDate || '').trim();
            const existingCost = parseFloat(matchedExisting.costPrice || 0);
            const existingSell = parseFloat(matchedExisting.sellPrice || 0);
            const existingPaxName = (matchedExisting.passengerName || '').trim();
            const existingDesc = (matchedExisting.description || '').trim();
            const existingPaxCount = matchedExisting.passengerCount || (1 + (matchedExisting.extraGuests || 0));

            // 1. Customer Name change
            if (finalCustName && existingCustName && finalCustName.toLowerCase().trim() !== existingCustName.toLowerCase().trim()) {
              changedFields.push('Customer Name');
              diffDetails.customer = { oldVal: existingCustName, newVal: finalCustName };
            }

            // 2. Cost Price change
            if (Math.abs(cost - existingCost) > 0.01) {
              changedFields.push('Cost Price');
              diffDetails.costPrice = { oldVal: existingCost, newVal: cost };
            }

            // 3. Sale Price change
            if (Math.abs(sell - existingSell) > 0.01) {
              changedFields.push('Sale Price');
              diffDetails.sellPrice = { oldVal: existingSell, newVal: sell };
            }

            // 4. Passenger Count / Tickets Quota change
            if (totalTickets !== existingPaxCount) {
              changedFields.push(`Tickets (${existingPaxCount}→${totalTickets})`);
              diffDetails.tickets = { oldVal: existingPaxCount, newVal: totalTickets };
            }

            // 5. Passenger Name change
            if (rawPaxName && existingPaxName && rawPaxName.toLowerCase().trim() !== existingPaxName.toLowerCase().trim()) {
              changedFields.push('Passenger Name');
              diffDetails.passenger = { oldVal: existingPaxName, newVal: rawPaxName };
            }

            // 6. Description change
            if (mapped.description && existingDesc && mapped.description.toLowerCase().trim() !== existingDesc.toLowerCase().trim()) {
              changedFields.push('Description');
              diffDetails.description = { oldVal: existingDesc, newVal: mapped.description };
            }

            // 7. Company Name change
            if (mapped.companyName && existingCompName && mapped.companyName.toLowerCase().trim() !== existingCompName.toLowerCase().trim()) {
              changedFields.push('Company');
              diffDetails.company = { oldVal: existingCompName, newVal: mapped.companyName };
            }

            // 8. Service Type change
            if (service && existingService && service.toLowerCase() !== existingService.toLowerCase()) {
              changedFields.push('Service');
              diffDetails.service = { oldVal: existingService, newVal: service };
            }

            hasChanges = changedFields.length > 0;
          }

          return {
            _index: idx + 1,
            customerId,
            customerCode,
            isExistingCustomer: isExistingCust,
            isExistingBooking, // Mark indicating if already in database
            matchedExisting,
            hasChanges,
            changedFields,
            diffDetails,
            shouldUpdate: true,
            customerName: finalCustName,
            passengerName: rawPaxName,
            extraPassengers: extraPaxCount,
            extraGuests: extraPaxCount,
            passengerCount: totalTickets,
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
        'COMPANY': 'akbar',
        'Date': '09-08-2026',
        'Reference No.': 'MYPR26893855303',
        'Description': 'HDFC LIBERTY',
        'Passenger Name/ pax / Guest / Narration': 'HDFC LIBERTY',
        'extra passenger': 1,
        'Coustomer Name': 'Niladri Sekhar Maji',
        'COST PRICE': 500,
        'sale price': 2000
      },
      {
        'FLIGHT/TRAIN/ETC': 'train',
        'COMPANY': 'abcd',
        'Date': '09-08-2026',
        'Reference No.': 'MYPR26893855303_RC',
        'Description': 'DI',
        'Passenger Name/ pax / Guest / Narration': 'DI',
        'extra passenger': 2,
        'Coustomer Name': 'shilpa',
        'COST PRICE': 600,
        'sale price': 2000
      },
      {
        'FLIGHT/TRAIN/ETC': 'flight',
        'COMPANY': 'akbar',
        'Date': '10-08-2026',
        'Reference No.': 'MN7LZ1FHM3IHL3UV7106',
        'Description': 'DMK CCU 12 AUG FD',
        'Passenger Name/ pax / Guest / Narration': 'Vikas kumar Gupta',
        'extra passenger': 25,
        'Coustomer Name': 'Niladri Sekhar Maji',
        'COST PRICE': 800,
        'sale price': 2000
      },
      {
        'FLIGHT/TRAIN/ETC': 'bus',
        'COMPANY': 'xyz',
        'Date': '10-08-2026',
        'Reference No.': 'MF7MAX81GEMUEF4I1941',
        'Description': 'CCU BOM 11 BOM 6E',
        'Passenger Name/ pax / Guest / Narration': 'MOHAMMED SIDDIK SHAIKH',
        'extra passenger': 47,
        'Coustomer Name': 'SID 2022',
        'COST PRICE': 1000,
        'sale price': 2000
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bookings_Template');
    XLSX.writeFile(wb, 'Liberty_Bookings_Import_Template.xlsx');
  };

  // Live Inline Editor: updates any cell value in real-time with instant recalculation
  const handleUpdateRowField = (index, field, value) => {
    setParsedRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[index] };

      if (field === 'costPrice' || field === 'sellPrice' || field === 'tax' || field === 'initialPayment') {
        const num = Math.max(0, parseFloat(value) || 0);
        row[field] = num;
        const c = field === 'costPrice' ? num : (row.costPrice || 0);
        const s = field === 'sellPrice' ? num : (row.sellPrice || 0);
        const t = field === 'tax' ? num : (row.tax || 0);
        const init = field === 'initialPayment' ? num : (row.initialPayment || 0);
        row.profit = s - c - t;
        row.balanceDue = Math.max(0, s - init);
      } else if (field === 'extraPassengers' || field === 'extraGuests') {
        const extra = Math.max(0, parseInt(value, 10) || 0);
        row.extraPassengers = extra;
        row.extraGuests = extra;
        row.passengerCount = 1 + extra;
      } else if (field === 'passengerCount') {
        const count = Math.max(1, parseInt(value, 10) || 1);
        row.passengerCount = count;
        row.extraPassengers = Math.max(0, count - 1);
        row.extraGuests = Math.max(0, count - 1);
      } else {
        row[field] = value;
      }

      // Re-evaluate diff against existing database booking
      if (row.matchedExisting) {
        const diffs = [];
        if (Math.abs(parseFloat(row.costPrice || 0) - parseFloat(row.matchedExisting.costPrice || 0)) > 0.01) diffs.push('Cost Price');
        if (Math.abs(parseFloat(row.sellPrice || 0) - parseFloat(row.matchedExisting.sellPrice || 0)) > 0.01) diffs.push('Sale Price');
        const existingPaxCount = row.matchedExisting.passengerCount || (1 + (row.matchedExisting.extraGuests || 0));
        if ((row.passengerCount || 1) !== existingPaxCount) diffs.push(`Tickets (${existingPaxCount}→${row.passengerCount || 1})`);
        if ((row.passengerName || '').trim().toLowerCase() !== (row.matchedExisting.passengerName || '').trim().toLowerCase()) diffs.push('Passenger');
        if ((row.description || '').trim().toLowerCase() !== (row.matchedExisting.description || '').trim().toLowerCase()) diffs.push('Description');
        row.hasChanges = diffs.length > 0;
        row.changedFields = diffs;
      }

      updated[index] = row;
      return updated;
    });
  };

  const handleToggleRowUpdate = (index) => {
    setParsedRows((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        shouldUpdate: !(updated[index].shouldUpdate !== undefined ? updated[index].shouldUpdate : updateExistingMode)
      };
      return updated;
    });
  };

  const handleUploadSubmit = async () => {
    if (parsedRows.length === 0) {
      toastError('No valid booking rows to import.');
      return;
    }

    try {
      setIsUploading(true);
      const res = await api.post('/bookings/bulk-import', {
        bookings: parsedRows.map((r) => ({
          ...r,
          shouldUpdate: r.shouldUpdate !== undefined ? r.shouldUpdate : updateExistingMode
        })),
        updateExisting: updateExistingMode
      });
      if (res.data?.success) {
        toastSuccess(res.data.message || `Successfully processed ${parsedRows.length} bookings!`);
        if (onSuccess) onSuccess(res.data);
        handleClose();
      }
    } catch (err) {
      console.error('Error during bulk import/update:', err);
      toastError(err.response?.data?.message || 'Failed to process bookings.');
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Full-Screen Pure Transparent Dimmed Overlay (No Blur) */}
      <div
        className="fixed inset-0 bg-slate-950/60 transition-opacity animate-fadeIn"
        onClick={handleClose}
      />

      {/* Modal Centering Wrapper */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4 md:p-6 text-center">
        <div className="relative transform overflow-hidden rounded-2xl sm:rounded-3xl bg-white text-left shadow-2xl transition-all w-full max-w-7xl max-h-[94vh] flex flex-col border border-slate-200 animate-scale-up my-auto">
          
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
          {parsedRows.length > 0 && (() => {
            const newRows = parsedRows.filter((r) => !r.isExistingBooking);
            const modifiedRows = parsedRows.filter((r) => r.isExistingBooking && r.hasChanges);
            const unchangedRows = parsedRows.filter((r) => r.isExistingBooking && !r.hasChanges);

            const displayedRows = parsedRows.filter((r) => {
              if (filterTab === 'modified') return r.isExistingBooking && r.hasChanges;
              if (filterTab === 'new') return !r.isExistingBooking;
              if (filterTab === 'unchanged') return r.isExistingBooking && !r.hasChanges;
              return true;
            });

            return (
              <div className="space-y-3">
                {/* Toolbar: Filter Tabs, Stats & Mode Switcher */}
                <div className="flex items-center justify-between flex-wrap gap-2.5 bg-slate-50/90 p-2.5 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* View Filter Tabs */}
                    <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs gap-1">
                      <button
                        type="button"
                        onClick={() => setFilterTab('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          filterTab === 'all'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        All ({parsedRows.length})
                      </button>

                      {modifiedRows.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setFilterTab('modified')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            filterTab === 'modified'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
                          }`}
                        >
                          <RefreshCw className="w-3 h-3 text-indigo-500" />
                          <span>Modified to Update ({modifiedRows.length})</span>
                        </button>
                      )}

                      {newRows.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setFilterTab('new')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            filterTab === 'new'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          <span>✨ New ({newRows.length})</span>
                        </button>
                      )}

                      {unchangedRows.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setFilterTab('unchanged')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            filterTab === 'unchanged'
                              ? 'bg-slate-700 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          In DB (Unchanged: {unchangedRows.length})
                        </button>
                      )}
                    </div>

                    {/* Mode Selector */}
                    <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setUpdateExistingMode(true)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          updateExistingMode
                            ? 'bg-brand-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                        title="Sync & Update: Any modified data from Excel will update the existing records in the database"
                      >
                        <RefreshCw className={`w-3 h-3 ${updateExistingMode ? 'text-white' : 'text-brand-600'}`} />
                        <span>Update Mode</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUpdateExistingMode(false)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          !updateExistingMode
                            ? 'bg-slate-800 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                        title="Skip: Existing records in DB will remain strictly untouched"
                      >
                        <Layers className={`w-3 h-3 ${!updateExistingMode ? 'text-white' : 'text-slate-500'}`} />
                        <span>Skip Mode</span>
                      </button>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      {parsedRows.reduce((acc, curr) => acc + (curr.passengerCount || 1), 0)} Total Tickets Quota
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => { setFile(null); setParsedRows([]); setFilterTab('all'); }}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear All
                    </button>
                  </div>
                </div>

                {/* Extended Width Horizontally Scrollable Clean Table */}
                <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs max-h-[440px] overflow-y-auto bg-white">
                  <table className="w-full text-left text-xs border-collapse min-w-[1250px]">
                    <thead className="bg-slate-50 sticky top-0 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 z-10">
                      <tr>
                        <th className="px-3.5 py-3 whitespace-nowrap text-center">#</th>
                        <th className="px-3.5 py-3 whitespace-nowrap">Service</th>
                        <th className="px-3.5 py-3 whitespace-nowrap">Company</th>
                        <th className="px-3.5 py-3 whitespace-nowrap">Date</th>
                        <th className="px-3.5 py-3 whitespace-nowrap min-w-[200px]">Ref No. / PNR & Status</th>
                        <th className="px-3.5 py-3 whitespace-nowrap">Description</th>
                        <th className="px-3.5 py-3 whitespace-nowrap">Passenger / Pax</th>
                        <th className="px-3.5 py-3 whitespace-nowrap text-center min-w-[130px]">Tickets (Quota)</th>
                        <th className="px-3.5 py-3 whitespace-nowrap">Customer Name</th>
                        <th className="px-3.5 py-3 whitespace-nowrap text-right">Cost Price (₹)</th>
                        <th className="px-3.5 py-3 whitespace-nowrap text-right">Sale Price (₹)</th>
                        <th className="px-3.5 py-3 whitespace-nowrap text-right">Profit (₹)</th>
                        <th className="px-3.5 py-3 whitespace-nowrap text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {displayedRows.map((r, i) => (
                        <tr
                          key={i}
                          className={
                            r.isExistingBooking
                              ? r.hasChanges
                                ? 'bg-indigo-50/50 hover:bg-indigo-100/50 border-l-4 border-indigo-600 transition'
                                : 'bg-slate-50/30 hover:bg-slate-100/50 transition'
                              : 'hover:bg-slate-50/80 transition'
                          }
                        >
                          {/* Index */}
                          <td className="px-3.5 py-3 font-bold text-slate-400 text-[10px] text-center whitespace-nowrap">
                            {r._index || i + 1}
                          </td>

                          {/* Service Type */}
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 w-fit">
                                {getServiceIcon(r.serviceType)}
                                {r.serviceType}
                              </span>
                              {r.diffDetails?.service && (
                                <span className="text-[9px] text-rose-500 font-semibold line-through">
                                  was: {r.diffDetails.service.oldVal}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Company Name */}
                          <td className="px-3.5 py-3 font-bold text-slate-800 text-xs whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span>{r.companyName}</span>
                              {r.diffDetails?.company && (
                                <span className="text-[9px] text-rose-500 font-semibold line-through">
                                  was: {r.diffDetails.company.oldVal}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Booking Date */}
                          <td className="px-3.5 py-3 font-mono text-xs text-slate-700 font-semibold whitespace-nowrap">
                            {formatDisplayDMY(r.bookingDate)}
                          </td>

                          {/* Reference No / PNR & Smart Status */}
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-mono font-black text-xs text-brand-700">
                                {r.referenceNo || 'AUTO'}
                              </span>
                              {r.isExistingBooking ? (
                                r.hasChanges ? (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border w-fit shadow-2xs ${
                                      updateExistingMode
                                        ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                                        : 'bg-amber-100 text-amber-900 border-amber-300'
                                    }`}
                                    title={`Changed in Excel: ${r.changedFields.join(', ')}`}
                                  >
                                    <RefreshCw className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
                                    {updateExistingMode ? `Changes: ${r.changedFields.join(', ')} → Will Update DB` : 'Already in DB (Skipped)'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 w-fit">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-slate-400" />
                                    {updateExistingMode ? 'Already in DB (In Sync)' : 'Already in DB (Will Skip)'}
                                  </span>
                                )
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 w-fit">
                                  ✨ New Booking
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Description */}
                          <td className="px-3.5 py-3 text-xs text-slate-600 max-w-[180px] whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span className="truncate" title={r.description}>{r.description}</span>
                              {r.diffDetails?.description && (
                                <span className="text-[9px] text-rose-500 font-semibold line-through truncate" title={`was: ${r.diffDetails.description.oldVal}`}>
                                  was: {r.diffDetails.description.oldVal}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Passenger Name */}
                          <td className="px-3.5 py-3 font-semibold text-slate-800 text-xs whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span>{r.passengerName || r.customerName}</span>
                              {r.diffDetails?.passenger && (
                                <span className="text-[9px] text-rose-500 font-semibold line-through">
                                  was: {r.diffDetails.passenger.oldVal}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Tickets Quota & Extra Pax */}
                          <td className="px-3.5 py-3 whitespace-nowrap text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold text-xs border ${
                                r.diffDetails?.tickets
                                  ? 'bg-indigo-100 text-indigo-900 border-indigo-300 shadow-2xs'
                                  : 'bg-brand-50 text-brand-800 border-brand-200'
                              }`}>
                                <Users className="w-3.5 h-3.5 text-brand-600" />
                                {r.passengerCount} {r.passengerCount === 1 ? 'Ticket' : 'Tickets'}
                              </span>
                              {r.diffDetails?.tickets ? (
                                <span className="text-[9px] text-rose-600 font-bold line-through">
                                  was: {r.diffDetails.tickets.oldVal} Tickets
                                </span>
                              ) : r.extraGuests > 0 ? (
                                <div className="text-[10px] text-amber-700 font-bold mt-0.5">
                                  1 Lead + {r.extraGuests} Extra
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Single Pax
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Customer Name with Live Diff Highlight */}
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`font-bold ${r.diffDetails?.customer ? 'text-indigo-900' : 'text-slate-900'}`}>
                                  {r.customerName}
                                </span>
                                {r.diffDetails?.customer ? (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                                    <RefreshCw className="w-2 h-2 text-indigo-600" /> Changed
                                  </span>
                                ) : r.isExistingCustomer ? (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> {r.customerCode || 'Matched'}
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                    + New Client
                                  </span>
                                )}
                              </div>
                              {r.diffDetails?.customer && (
                                <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 w-fit line-through">
                                  was: {r.diffDetails.customer.oldVal}
                                </span>
                              )}
                              {r.customerPhone && r.customerPhone !== '+91 9800000000' && (
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{r.customerPhone}</div>
                              )}
                            </div>
                          </td>

                          {/* Cost Price */}
                          <td className="px-3.5 py-3 font-mono text-right text-slate-600 font-bold whitespace-nowrap">
                            <div className="flex flex-col items-end gap-0.5">
                              <span>₹{r.costPrice.toLocaleString('en-IN')}</span>
                              {r.diffDetails?.costPrice && (
                                <span className="text-[9px] text-rose-500 font-mono line-through">
                                  ₹{r.diffDetails.costPrice.oldVal.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Sale Price */}
                          <td className="px-3.5 py-3 font-mono font-black text-right text-slate-900 whitespace-nowrap">
                            <div className="flex flex-col items-end gap-0.5">
                              <span>₹{r.sellPrice.toLocaleString('en-IN')}</span>
                              {r.diffDetails?.sellPrice && (
                                <span className="text-[9px] text-rose-500 font-mono line-through">
                                  ₹{r.diffDetails.sellPrice.oldVal.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Real-time Profit */}
                          <td className="px-3.5 py-3 font-mono font-black text-right text-emerald-600 whitespace-nowrap">
                            +₹{r.profit.toLocaleString('en-IN')}
                          </td>

                          {/* Action Buttons */}
                          <td className="px-3.5 py-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(r._index ? r._index - 1 : i)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Remove row from import"
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
            );
          })()}
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

          {(() => {
            const newCount = parsedRows.filter((r) => !r.isExistingBooking).length;
            const modifiedCount = parsedRows.filter((r) => r.isExistingBooking && r.hasChanges).length;
            const unchangedCount = parsedRows.filter((r) => r.isExistingBooking && !r.hasChanges).length;
            const hasActionableItems = newCount > 0 || (updateExistingMode && modifiedCount > 0);

            return (
              <button
                type="button"
                onClick={handleUploadSubmit}
                disabled={isUploading || parsedRows.length === 0 || !hasActionableItems}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition ${
                  !hasActionableItems || isUploading
                    ? 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed opacity-90 shadow-none'
                    : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer'
                }`}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Bookings...</span>
                  </>
                ) : !hasActionableItems ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-400" />
                    <span>All {parsedRows.length} Bookings in DB (In Sync – No Changes to Save)</span>
                  </>
                ) : updateExistingMode ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {modifiedCount > 0 && newCount > 0
                        ? `Save & Update (${newCount} New + ${modifiedCount} Modified in DB)`
                        : modifiedCount > 0
                        ? `Update ${modifiedCount} Modified Booking${modifiedCount > 1 ? 's' : ''} in Database (${unchangedCount} Kept As-Is)`
                        : `Save All ${newCount} New Bookings (${unchangedCount} In DB Kept As-Is)`}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Save {newCount} New Bookings (Skip {parsedRows.length - newCount} Existing)
                    </span>
                  </>
                )}
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  </div>,
  document.body
);
};
