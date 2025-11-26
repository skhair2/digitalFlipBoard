import React from 'react';


/**
 * Admin Sidebar
 * Navigation for different admin sections
 */

export default function AdminSidebar({ currentSection, onSectionChange }) {
  const sections = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      description: 'Overview & Analytics'
    },
    {
      id: 'users',
      label: 'Users',
      icon: '👥',
      description: 'User Management'
    },
    {
      id: 'roles',
      label: 'Roles',
      icon: '🔐',
      description: 'Admin Role Control'
    },
    {
      id: 'coupons',
      label: 'Coupons',
      icon: '🎟️',
      description: 'Coupon Management'
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: '📋',
      description: 'Admin Activity Log'
    },
    {
      id: 'health',
      label: 'Health',
      icon: '🔧',
      description: 'System Status'
    }
  ];

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 p-6 flex flex-col">
      {/* Logo */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white">🔐 Admin</h2>
        <p className="text-gray-400 text-xs mt-1">System Control Panel</p>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 flex-1">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
              currentSection === section.id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="text-xl">{section.icon}</span>
            <div>
              <p className="font-medium">{section.label}</p>
              <p className="text-xs opacity-75">{section.description}</p>
            </div>
          </button>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          Admin Panel v1.0
        </p>
      </div>
    </aside>
  );
}
