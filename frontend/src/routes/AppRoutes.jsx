import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// Lazy-loaded route components for high-speed initial bundle delivery
const LoginPage = lazy(() => import('../pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const NewBookingPage = lazy(() => import('../pages/bookings/NewBookingPage').then(m => ({ default: m.NewBookingPage })));
const AllBookingsPage = lazy(() => import('../pages/bookings/AllBookingsPage').then(m => ({ default: m.AllBookingsPage })));
const BookingDetailsPage = lazy(() => import('../pages/bookings/BookingDetailsPage').then(m => ({ default: m.BookingDetailsPage })));
const TransactionsPage = lazy(() => import('../pages/transactions/TransactionsPage').then(m => ({ default: m.TransactionsPage })));
const CustomersPage = lazy(() => import('../pages/customers/CustomersPage').then(m => ({ default: m.CustomersPage })));
const AirlinesPage = lazy(() => import('../pages/airlines/AirlinesPage').then(m => ({ default: m.AirlinesPage })));
const PaymentsPage = lazy(() => import('../pages/payments/PaymentsPage').then(m => ({ default: m.PaymentsPage })));
const LedgerPage = lazy(() => import('../pages/ledger/LedgerPage').then(m => ({ default: m.LedgerPage })));
const ExpensesPage = lazy(() => import('../pages/expenses/ExpensesPage').then(m => ({ default: m.ExpensesPage })));
const UpcomingJourneysPage = lazy(() => import('../pages/upcoming-journeys/UpcomingJourneysPage').then(m => ({ default: m.UpcomingJourneysPage })));
const CalendarPage = lazy(() => import('../pages/calendar/CalendarPage').then(m => ({ default: m.CalendarPage })));
const ReportsPage = lazy(() => import('../pages/reports/ReportsPage').then(m => ({ default: m.ReportsPage })));
const UsersPage = lazy(() => import('../pages/users/UsersPage').then(m => ({ default: m.UsersPage })));
const ActivityLogsPage = lazy(() => import('../pages/activity-logs/ActivityLogsPage').then(m => ({ default: m.ActivityLogsPage })));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <LoadingSpinner size="lg" text="Loading Liberty ERP..." />
  </div>
);

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Route */}
      <Route
        path="/login"
        element={
          <Suspense fallback={<PageLoader />}>
            <LoginPage />
          </Suspense>
        }
      />

      {/* Protected ERP Routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* Bookings */}
        <Route path="/bookings/new" element={<NewBookingPage />} />
        <Route path="/bookings" element={<AllBookingsPage />} />
        <Route path="/bookings/:id" element={<BookingDetailsPage />} />

        {/* Master & Financial Modules */}
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/airlines" element={<AirlinesPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/ledger" element={<LedgerPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />

        {/* Schedules & Management */}
        <Route path="/upcoming-journeys" element={<UpcomingJourneysPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/reports" element={<ReportsPage />} />

        {/* Administration */}
        <Route
          path="/users"
          element={
            <ProtectedRoute superAdminOnly>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route path="/activity-logs" element={<ActivityLogsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
