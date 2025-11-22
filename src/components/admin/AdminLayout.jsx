import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { useAuthStore } from '../../store/authStore';
import AdminSidebar from './AdminSidebar';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import ActivityLog from './ActivityLog';
import SystemHealth from './SystemHealth';
import AdminCouponManagement from './AdminCouponManagement';
import RoleManagement from './RoleManagement';

/**
 * Admin Layout
 * Main container for all admin views with sidebar navigation
 */

export default function AdminLayout() {
  const { isAdminViewActive, setAdminViewActive, clearAdminView } = useAdminStore();
  const { user } = useAuthStore();
  const [currentSection, setCurrentSection] = useState('dashboard');

  if (!isAdminViewActive) {
    return null;
  }

  const handleBackToUser = () => {
    clearAdminView();
    setAdminViewActive(false);
  };

  const renderSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <UserManagement />;
      case 'roles':
        return <RoleManagement />;
      case 'activity':
        return <ActivityLog />;
      case 'health':
        return <SystemHealth />;
      case 'coupons':
        return <AdminCouponManagement />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="admin-layout flex h-screen bg-gray-900">
      {/* Sidebar */}
      <AdminSidebar 
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Admin Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Logged in as: {user?.email}</p>
          </div>
          <button
            onClick={handleBackToUser}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            ← Back to User View
          </button>
        </div>

        {/* Section Content */}
        <div className="p-8">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
