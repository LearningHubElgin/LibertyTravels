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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Customers can only access the customer portal
  if (isCustomer && !customerOnly) {
    return <Navigate to="/customer/dashboard" replace />;
  }
  
  // Non-customers cannot access the customer portal
  if (!isCustomer && customerOnly) {
    if (isSuperAdmin) return <Navigate to="/superadmin/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  // Super admins cannot access the agency ERP workspace
  if (isSuperAdmin && agencyOnly) {
    return <Navigate to="/superadmin/dashboard" replace />;
  }

  // Regular admins cannot access the superadmin portal
  if (!isSuperAdmin && !isCustomer && superAdminOnly) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
