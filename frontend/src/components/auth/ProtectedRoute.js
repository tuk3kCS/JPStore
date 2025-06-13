import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from '../common/Loading';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, token, loading } = useAuth();

  console.log('ProtectedRoute: Check -', {
    loading,
    isAuthenticated,
    hasUser: !!user,
    hasToken: !!token,
    adminOnly,
    userRole: user?.role
  });

  if (loading) {
    return <Loading message="Checking authentication..." />;
  }

  // Check authentication using multiple criteria for robustness
  const isUserAuthenticated = isAuthenticated && user && token;

  if (!isUserAuthenticated) {
    console.log('ProtectedRoute: User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    console.log('ProtectedRoute: User not admin, redirecting to home');
    return <Navigate to="/" replace />;
  }

  console.log('ProtectedRoute: Authentication passed, rendering children');
  return children;
};

export default ProtectedRoute; 