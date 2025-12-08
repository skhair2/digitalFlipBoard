import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import * as adminService from '../../services/adminService';
import Spinner from '../ui/Spinner';

/**
 * Admin Dashboard
 * Displays system metrics, analytics, and key statistics
 */

export default function AdminDashboard() {
  const { systemStats, setSystemStats } = useAdminStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      setLoading(true);
      const result = await adminService.getSystemAnalytics();
      if (result.success) {
        setSystemStats(result.analytics);
      } else {
        setError(result.error || 'Failed to load analytics');
      }
    } catch (err) {
      console.error('Failed to load system stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [setSystemStats]);

  const handleRefreshStats = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const handleExportReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      stats: systemStats
    };
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-report-${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleViewAlerts = () => {
    alert('Alerts feature coming soon. No critical alerts at this time.');
  };

  if (loading) return <Spinner />;

  const stats = systemStats || {};
  const premiumUsers = stats.tierBreakdown?.premium || 0;
  const totalMessages = stats.totalBoards || 0;

  const metrics = [
    {
      label: 'Total Users',
      value: stats.totalUsers || 0,
      icon: '👥',
      color: 'bg-blue-500'
    },
    {
      label: 'Premium Users',
      value: premiumUsers,
      icon: '⭐',
      color: 'bg-yellow-500'
    },
    {
      label: 'Total Sessions',
      value: totalMessages,
      icon: '💬',
      color: 'bg-green-500'
    },
    {
      label: 'Active Sessions (24h)',
      value: stats.activeSessions24h || 0,
      icon: '🔗',
      color: 'bg-purple-500'
    },
    {
      label: 'Custom Designs',
      value: stats.totalDesigns || 0,
      icon: '🎨',
      color: 'bg-indigo-500'
    },
    {
      label: 'New Signups (30d)',
      value: stats.newSignupsLast30Days || 0,
      icon: '📊',
      color: 'bg-pink-500'
    }
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-2">System overview and key metrics</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
            <p>Error loading stats: {error}</p>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-gray-400 text-sm">{metric.label}</p>
                  <p className="text-3xl font-bold text-white mt-2">{metric.value}</p>
                </div>
                <div className={`${metric.color} w-12 h-12 rounded-lg flex items-center justify-center text-xl`}>
                  {metric.icon}
                </div>
              </div>
              <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                <div className={`${metric.color} h-full w-2/3`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Last Updated */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">📅 System Info</h2>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="text-white font-medium">
                  {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Database Status:</span>
                <span className="text-green-400 font-medium">✓ Connected</span>
              </div>
              <div className="flex justify-between">
                <span>API Status:</span>
                <span className="text-green-400 font-medium">✓ Operational</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">⚡ Quick Actions</h2>
            <div className="space-y-2">
              <button 
                onClick={handleRefreshStats}
                disabled={refreshing}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
              >
                {refreshing ? '⏳ Refreshing...' : '🔄 Refresh Stats'}
              </button>
              <button 
                onClick={handleExportReport}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg text-sm transition-colors"
              >
                📊 Export Report
              </button>
              <button 
                onClick={handleViewAlerts}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg text-sm transition-colors"
              >
                🔔 View Alerts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
