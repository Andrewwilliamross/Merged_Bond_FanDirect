
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

const ProtectedRoute = () => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Check if the route is an admin route
  const isAdminRoute = location.pathname.startsWith('/dashboard/admin');
  
  // Check if user is an admin (using proper role from profile)
  const isAdmin = profile?.role === 'admin';

  // Show the loading screen while checking authentication status
  if (loading) {
    return <LoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if trying to access admin routes without admin privileges
  if (isAdminRoute && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated and has appropriate permissions, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
