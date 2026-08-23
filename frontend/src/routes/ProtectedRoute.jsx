import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ProtectedRoute = ({ children, superAdminOnly = false, agencyOnly = false }) => {
  const { isAuthenticated, loading, isSuperAdmin } = useAuth();
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
