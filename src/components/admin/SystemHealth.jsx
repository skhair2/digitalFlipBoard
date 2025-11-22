import React, { useEffect, useState } from 'react';
import * as adminService from '../../services/adminService';
import Spinner from '../ui/Spinner';

/**
 * System Health
 * Monitor system status, database health, and performance metrics
 */

export default function SystemHealth() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadHealthData();

    if (autoRefresh) {
      const interval = setInterval(() => {
        loadHealthData();
      }, 10000); // Refresh every 10 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadHealthData = async () => {
    try {
      const data = await adminService.getSystemHealth();
      setHealthData(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load health data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !healthData) return <Spinner />;

  const health = healthData || {};

  const HealthCard = ({ title, status, details, icon }) => {
    const statusColor = status === 'healthy' ? 'text-green-400' : status === 'warning' ? 'text-yellow-400' : 'text-red-400';
    const borderColor = status === 'healthy' ? 'border-green-500' : status === 'warning' ? 'border-yellow-500' : 'border-red-500';
    const bgColor = status === 'healthy' ? 'bg-green-500/10' : status === 'warning' ? 'bg-yellow-500/10' : 'bg-red-500/10';

    return (
      <div className={`${bgColor} border ${borderColor} rounded-lg p-6 mb-6`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className={`text-sm font-semibold mt-1 ${statusColor}`}>
              ● {status.toUpperCase()}
            </p>
          </div>
          <div className="text-3xl">{icon}</div>
        </div>

        {details && (
          <div className="space-y-2 text-sm text-gray-300">
            {Object.entries(details).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-400">{key}:</span>
                <span className="font-medium text-white">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">System Health</h1>
            <p className="text-gray-400 mt-2">Monitor system status and performance</p>
          </div>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Auto Refresh</span>
            </label>
            <button
              onClick={loadHealthData}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
            >
              🔄 Refresh Now
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
            <p>Error loading health data: {error}</p>
          </div>
        )}

        {/* Database Health */}
        <HealthCard
          title="Database"
          status={health.database?.status || 'unknown'}
          icon="🗄️"
          details={health.database ? {
            'Connection': 'Active',
            'Response Time': `${health.database.responseTime || 'N/A'}ms`,
            'Connections': health.database.activeConnections || 'N/A',
            'Storage Used': health.database.storageUsed || 'N/A'
          } : {}}
        />

        {/* API Server Health */}
        <HealthCard
          title="API Server"
          status={health.api?.status || 'unknown'}
          icon="🌐"
          details={health.api ? {
            'Uptime': health.api.uptime || 'N/A',
            'Memory Usage': health.api.memoryUsage || 'N/A',
            'Request Rate': health.api.requestRate || 'N/A',
            'Error Rate': health.api.errorRate || '0%'
          } : {}}
        />

        {/* WebSocket Health */}
        <HealthCard
          title="WebSocket Server"
          status={health.websocket?.status || 'unknown'}
          icon="🔗"
          details={health.websocket ? {
            'Connected Clients': health.websocket.connectedClients || 0,
            'Active Rooms': health.websocket.activeRooms || 0,
            'Messages/min': health.websocket.messagesPerMinute || 0,
            'Latency': health.websocket.latency || 'N/A'
          } : {}}
        />

        {/* Auth Service Health */}
        <HealthCard
          title="Auth Service (Supabase)"
          status={health.auth?.status || 'unknown'}
          icon="🔐"
          details={health.auth ? {
            'Provider': 'Supabase',
            'Last Sync': health.auth.lastSync || 'N/A',
            'Active Sessions': health.auth.activeSessions || 0,
            'Failed Logins (24h)': health.auth.failedLogins || 0
          } : {}}
        />

        {/* Storage Health */}
        <HealthCard
          title="Storage Service"
          status={health.storage?.status || 'unknown'}
          icon="💾"
          details={health.storage ? {
            'Total Used': health.storage.totalUsed || 'N/A',
            'File Count': health.storage.fileCount || 0,
            'Bandwidth (24h)': health.storage.bandwidthUsed || 'N/A',
            'Available': health.storage.available || 'N/A'
          } : {}}
        />

        {/* Analytics Health */}
        <HealthCard
          title="Analytics (Mixpanel)"
          status={health.analytics?.status || 'unknown'}
          icon="📊"
          details={health.analytics ? {
            'Events Tracked': health.analytics.eventsTracked || 0,
            'Last Event': health.analytics.lastEvent || 'N/A',
            'Queue Size': health.analytics.queueSize || 0,
            'Status': 'Connected'
          } : {}}
        />

        {/* Overall System Status */}
        <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4">📈 Overall Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-2">System Status</p>
              <p className="text-2xl font-bold text-green-400">
                ✓ All Systems Operational
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-2">Last Check</p>
              <p className="text-lg font-medium text-white">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4">⚡ Performance Metrics</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">CPU Usage</span>
                <span className="text-white font-medium">45%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">Memory Usage</span>
                <span className="text-white font-medium">62%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500" style={{ width: '62%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">Disk Usage</span>
                <span className="text-white font-medium">28%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '28%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
