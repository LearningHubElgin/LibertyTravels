import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

// Lazy-loaded route components for high-speed initial bundle delivery
const LoginPage = lazy(() => import('../pages/LoginPage').then(m => ({ default: m.LoginPage })));

// Super Admin Pages
const SuperAdminDashboardPage = lazy(() => import('../pages/superadmin/SuperAdminDashboardPage').then(m => ({ default: m.SuperAdminDashboardPage })));
const ManageAgenciesPage = lazy(() => import('../pages/superadmin/ManageAgenciesPage').then(m => ({ default: m.ManageAgenciesPage })));
const AgencyDetailPage = lazy(() => import('../pages/superadmin/AgencyDetailPage').then(m => ({ default: m.AgencyDetailPage })));
const SuperAdminUsersPage = lazy(() => import('../pages/superadmin/SuperAdminUsersPage').then(m => ({ default: m.SuperAdminUsersPage })));

// Agency ERP Pages
const DashboardPage = lazy(() => import('../pages/agency/DashboardPage').then(m => ({ default: m.DashboardPage })));
const NewBookingPage = lazy(() => import('../pages/agency/NewBookingPage').then(m => ({ default: m.NewBookingPage })));
const AllBookingsPage = lazy(() => import('../pages/agency/AllBookingsPage').then(m => ({ default: m.AllBookingsPage })));
const BookingDetailsPage = lazy(() => import('../pages/agency/BookingDetailsPage').then(m => ({ default: m.BookingDetailsPage })));
const TransactionsPage = lazy(() => import('../pages/agency/TransactionsPage').then(m => ({ default: m.TransactionsPage })));
const CustomersPage = lazy(() => import('../pages/agency/CustomersPage').then(m => ({ default: m.CustomersPage })));
const CompaniesPage = lazy(() => import('../pages/agency/CompaniesPage').then(m => ({ default: m.CompaniesPage })));
const CompanyDetailsPage = lazy(() => import('../pages/agency/CompanyDetailsPage').then(m => ({ default: m.CompanyDetailsPage })));
const PaymentsPage = lazy(() => import('../pages/agency/PaymentsPage').then(m => ({ default: m.PaymentsPage })));
const LedgerPage = lazy(() => import('../pages/agency/LedgerPage').then(m => ({ default: m.LedgerPage })));
const ExpensesPage = lazy(() => import('../pages/agency/ExpensesPage').then(m => ({ default: m.ExpensesPage })));

const UpcomingJourneysPage = lazy(() => import('../pages/agency/UpcomingJourneysPage').then(m => ({ default: m.UpcomingJourneysPage })));
const CalendarPage = lazy(() => import('../pages/agency/CalendarPage').then(m => ({ default: m.CalendarPage })));
const ReportsPage = lazy(() => import('../pages/agency/ReportsPage').then(m => ({ default: m.ReportsPage })));
const UsersPage = lazy(() => import('../pages/agency/UsersPage').then(m => ({ default: m.UsersPage })));
const ActivityLogsPage = lazy(() => import('../pages/agency/ActivityLogsPage').then(m => ({ default: m.ActivityLogsPage })));
const SettingsPage = lazy(() => import('../pages/agency/SettingsPage').then(m => ({ default: m.SettingsPage })));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <LoadingSpinner size="lg" text="Loading Liberty ERP..." />
  </div>
);

// Dynamic Role-Based Index Redirection
const IndexRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'super_admin') {
    return <Navigate to="/superadmin/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

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
        {/* Dynamic Entry based on User Role */}
        <Route path="/" element={<IndexRedirect />} />

        {/* ---------------------------------------------------- */}
        {/* 1. SUPER ADMIN CONTROL PORTAL                        */}
        {/* ---------------------------------------------------- */}
        <Route
          path="/superadmin/dashboard"
          element={
            <ProtectedRoute superAdminOnly>
              <SuperAdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/agencies"
          element={
            <ProtectedRoute superAdminOnly>
              <ManageAgenciesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/agencies/:id"
          element={
            <ProtectedRoute superAdminOnly>
              <AgencyDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/users"
          element={
            <ProtectedRoute superAdminOnly>
              <SuperAdminUsersPage />
            </ProtectedRoute>
          }
        />
        {/* Convenience alias */}
        <Route path="/agencies" element={<Navigate to="/superadmin/agencies" replace />} />

        {/* ---------------------------------------------------- */}
        {/* 2. TRAVEL AGENCY ERP MODULES                         */}
        {/* ---------------------------------------------------- */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Bookings */}
        <Route path="/bookings/new" element={<NewBookingPage />} />
        <Route path="/bookings" element={<AllBookingsPage />} />
        <Route path="/bookings/:id" element={<BookingDetailsPage />} />

        {/* Master & Financial Modules */}
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/companies/:id" element={<CompanyDetailsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/ledger" element={<LedgerPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />

        {/* Schedules & Management */}
        <Route path="/upcoming-journeys" element={<UpcomingJourneysPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/reports" element={<ReportsPage />} />

        {/* Agency Users & Logs */}
        <Route path="/users" element={<UsersPage />} />
        <Route path="/activity-logs" element={<ActivityLogsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<IndexRedirect />} />
    </Routes>
  );
};
