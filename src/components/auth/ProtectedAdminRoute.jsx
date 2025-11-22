import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/**
 * ProtectedAdminRoute
 * Ensures only authenticated admin users can access admin routes
 */

export default function ProtectedAdminRoute({ children }) {
  const { user, profile, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-gray-700 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated and is an admin
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
