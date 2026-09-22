import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ProtectedRoute = ({ children, superAdminOnly = false, agencyOnly = false, customerOnly = false }) => {
  const { isAuthenticated, loading, isSuperAdmin, isCustomer } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // If it's a customer route, redirect to customer login
    if (customerOnly) {
      return <Navigate to="/customer-portal/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Customer only routes
  if (customerOnly && !isCustomer) {
    return <Navigate to="/dashboard" replace />;
  }

  // Agency/SuperAdmin cannot access customer routes unless handled above, but just in case:
  if (!customerOnly && isCustomer) {
    return <Navigate to="/customer-portal/dashboard" replace />;
  }

  // Regular admin cannot access superadmin portal
  if (superAdminOnly && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Super admin cannot access agency ERP workspace (Super admin is company/platform side only)
  if (agencyOnly && isSuperAdmin) {
    return <Navigate to="/superadmin/dashboard" replace />;
  }

  return children;
};
