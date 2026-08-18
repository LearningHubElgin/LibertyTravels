import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { NewBookingPage } from '../pages/bookings/NewBookingPage';
import { AllBookingsPage } from '../pages/bookings/AllBookingsPage';
import { BookingDetailsPage } from '../pages/bookings/BookingDetailsPage';
import { TransactionsPage } from '../pages/transactions/TransactionsPage';
import { CustomersPage } from '../pages/customers/CustomersPage';
import { AirlinesPage } from '../pages/airlines/AirlinesPage';
import { PaymentsPage } from '../pages/payments/PaymentsPage';
import { LedgerPage } from '../pages/ledger/LedgerPage';
import { ExpensesPage } from '../pages/expenses/ExpensesPage';
import { UpcomingJourneysPage } from '../pages/upcoming-journeys/UpcomingJourneysPage';
import { CalendarPage } from '../pages/calendar/CalendarPage';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { UsersPage } from '../pages/users/UsersPage';
import { ActivityLogsPage } from '../pages/activity-logs/ActivityLogsPage';
import { SettingsPage } from '../pages/settings/SettingsPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Route */}
      <Route path="/login" element={<LoginPage />} />

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
