# Liberty Tours & Travels ERP

A modern, full-featured Travel Agency ERP and Booking Management System built with Node.js, Express, MongoDB Atlas, React, and Tailwind CSS.

---

## 🌟 Key Features

- **Flight Bookings & Manifest Management**: Complete booking workflow with PNR, sector, airline, multiple passengers, and custom fare breakdown.
- **Tax Invoice Generation**: Clean PDF/printable tax invoices with custom agency branding, sequence numbers, and GST breakdown.
- **Double-Entry Accounting & Ledger**: Customer running ledger statements and agency general ledger.
- **Financial Transactions & Receivables**: Transaction tracking, partial payments, payment receipts, and balance due tracking.
- **Overhead Expense Tracker**: Categorized business expense management with monthly analytics.
- **Upcoming Flight Manifest & Calendar**: Flight departures timeline with day/week views.
- **Interactive Reports & Analytics**: Sales charts, revenue trends, status breakdown, and CSV data export.
- **User Role Management**: Super Admin and Admin staff access control with complete audit activity logging.
- **Agency Settings**: Dynamic business profile, logo branding, GST/PAN numbers, and customizable invoice terms.

---

## 🚀 Technology Stack

### Backend
- **Runtime**: Node.js & Express
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with bcryptjs
- **Dev Tools**: Nodemon, Cors, Dotenv

### Frontend
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS & Lucide Icons
- **Charts**: Recharts
- **Routing**: React Router v6
- **HTTP Client**: Axios

---

## 🛠️ Getting Started

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
```

Start the backend server:

```bash
npm run dev
```

---

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the Vite frontend development server:

```bash
npm run dev
```

---

## 🔒 Default Credentials

- **Super Admin**: `admin@libertytravel.com` / `admin123`
- **Staff Admin**: `staff@libertytravel.com` / `staff123`

---

## 📄 License
MIT License
