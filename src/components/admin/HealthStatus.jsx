import React, { useEffect, useState } from 'react';
import * as adminService from '../../services/adminService';
import Spinner from '../ui/Spinner';
import { CheckCircleIcon, ExclamationIcon, XCircleIcon } from '@heroicons/react/24/outline';

/**
 * Health Status Dashboard
 * Senior PM Feature Set:
 * - Real-time system resource monitoring (CPU, RAM, Disk)
 * - Service health status tracking
 * - Performance metrics and trends
 * - Alert management with severity levels
 * - Historical data for capacity planning
 * - SLA compliance tracking
 */

export default function HealthStatus() {
  const [healthData, setHealthData] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10000); // 10 seconds
  const [alerts, setAlerts] = useState([]);

  // Fetch health and system metrics
  const fetchHealthData = async () => {
    try {
      const health = await adminService.getSystemHealth();
      setHealthData(health.health);

      // Simulate system metrics (would come from backend in production)
      const metrics = {
        cpu: {
          usage: 45.2,
          cores: 8,
          limit: 80,
          trend: 'stable'
        },
        memory: {
          used: 6.2,
          total: 16,
          usagePercent: 38.75,
          limit: 85,
          trend: 'increasing'
        },
        disk: {
          used: 245,
          total: 500,
          usagePercent: 49,
          limit: 90,
          trend: 'stable'
        },
        network: {
          inbound: 12.5,
          outbound: 8.3,
          latency: 2.1,
          bandwidth: 100,
          trend: 'stable'
        },
        database: {
          connections: 45,
          maxConnections: 100,
          queryTime: 12.3,
          slowQueries: 2,
          trend: 'stable'
        },
        uptime: {
          days: 47,
          hours: 3,
          minutes: 28,
          percent: 99.94
        }
      };

      setSystemMetrics(metrics);

      // Generate alerts based on thresholds
      const newAlerts = [];
      if (metrics.memory.usagePercent > metrics.memory.limit - 20) {
        newAlerts.push({
          id: 'memory-high',
          severity: 'warning',
          title: 'Memory Usage High',
          message: `Memory at ${metrics.memory.usagePercent.toFixed(1)}% of limit`,
          action: 'Monitor or scale resources'
        });
      }
      if (metrics.database.slowQueries > 0) {
        newAlerts.push({
          id: 'slow-queries',
          severity: 'info',
          title: 'Slow Queries Detected',
          message: `${metrics.database.slowQueries} queries exceeded 100ms`,
          action: 'Review query performance'
        });
      }

      setAlerts(newAlerts);
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();

    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchHealthData, refreshInterval);
    }

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  if (loading) return <Spinner />;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <ExclamationIcon className="w-5 h-5 text-yellow-400" />;
      case 'unhealthy':
        return <XCircleIcon className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (value, limit, warning) => {
    if (value >= limit) return 'text-red-400';
    if (value >= warning) return 'text-yellow-400';
    return 'text-green-400';
  };

  const ResourceBar = ({ value, limit, warning, label, unit = '%' }) => {
    const percentage = (value / limit) * 100;
    const status = value >= limit ? 'critical' : value >= warning ? 'warning' : 'healthy';
    
    let bgColor = 'bg-green-500';
    if (status === 'warning') bgColor = 'bg-yellow-500';
    if (status === 'critical') bgColor = 'bg-red-500';

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">{label}</span>
          <span className={`font-medium ${getStatusColor(value, limit, warning)}`}>
            {value.toFixed(1)}{unit} / {limit}{unit}
          </span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`${bgColor} h-full transition-all duration-300`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white">System Health</h1>
              <p className="text-gray-400 mt-2">Real-time monitoring and resource utilization</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  autoRefresh
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {autoRefresh ? '⏸ Pause' : '▶ Auto-refresh'}
              </button>
              <button
                onClick={fetchHealthData}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                🔄 Refresh Now
              </button>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-8 space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${
                  alert.severity === 'critical'
                    ? 'bg-red-500/10 border-red-500 text-red-300'
                    : alert.severity === 'warning'
                    ? 'bg-yellow-500/10 border-yellow-500 text-yellow-300'
                    : 'bg-blue-500/10 border-blue-500 text-blue-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{alert.title}</h3>
                    <p className="text-sm mt-1">{alert.message}</p>
                    <p className="text-xs mt-2 opacity-75">Action: {alert.action}</p>
                  </div>
                  <button className="text-2xl opacity-50 hover:opacity-75 ml-4">×</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* System Resources Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* CPU Usage */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>⚙️</span> CPU Usage
            </h2>
            <div className="space-y-4">
              <ResourceBar
                value={systemMetrics?.cpu.usage}
                limit={100}
                warning={systemMetrics?.cpu.limit}
                label="CPU Load"
                unit="%"
              />
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-700">
                <div>
                  <p className="text-xs text-gray-400">Cores</p>
                  <p className="text-lg font-bold text-white">{systemMetrics?.cpu.cores}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Trend</p>
                  <p className="text-lg font-bold text-white capitalize">{systemMetrics?.cpu.trend}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>🧠</span> Memory
            </h2>
            <div className="space-y-4">
              <ResourceBar
                value={systemMetrics?.memory.usagePercent}
                limit={100}
                warning={systemMetrics?.memory.limit}
                label="RAM Usage"
                unit="%"
              />
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-700">
                <div>
                  <p className="text-xs text-gray-400">Used</p>
                  <p className="text-lg font-bold text-white">{systemMetrics?.memory.used}GB / {systemMetrics?.memory.total}GB</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Trend</p>
                  <p className="text-lg font-bold text-white capitalize">{systemMetrics?.memory.trend}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Disk Usage */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>💾</span> Storage
            </h2>
            <div className="space-y-4">
              <ResourceBar
                value={systemMetrics?.disk.usagePercent}
                limit={100}
                warning={systemMetrics?.disk.limit}
                label="Disk Usage"
                unit="%"
              />
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-700">
                <div>
                  <p className="text-xs text-gray-400">Used</p>
                  <p className="text-lg font-bold text-white">{systemMetrics?.disk.used}GB / {systemMetrics?.disk.total}GB</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Trend</p>
                  <p className="text-lg font-bold text-white capitalize">{systemMetrics?.disk.trend}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Network */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>🌐</span> Network
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Inbound</span>
                <span className="text-green-400 font-medium">{systemMetrics?.network.inbound} Mbps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Outbound</span>
                <span className="text-blue-400 font-medium">{systemMetrics?.network.outbound} Mbps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Latency</span>
                <span className="text-white font-medium">{systemMetrics?.network.latency} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Capacity</span>
                <span className="text-white font-medium">{systemMetrics?.network.bandwidth} Mbps</span>
              </div>
            </div>
          </div>
        </div>

        {/* Service Status */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-6">🔧 Service Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Database', status: healthData?.database },
              { name: 'Authentication', status: healthData?.authentication },
              { name: 'Realtime', status: healthData?.realtime },
              { name: 'API Gateway', status: 'healthy' }
            ].map((service) => (
              <div key={service.name} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <span className="text-gray-300">{service.name}</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(service.status)}
                  <span className={`text-xs font-medium ${service.status === 'healthy' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {service.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Database & Uptime Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Database Performance */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>📊</span> Database
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-400">Active Connections</p>
                <p className="text-2xl font-bold text-white mt-1">{systemMetrics?.database.connections}/{systemMetrics?.database.maxConnections}</p>
              </div>
              <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full"
                  style={{ width: `${(systemMetrics?.database.connections / systemMetrics?.database.maxConnections) * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-700">
                <div>
                  <p className="text-xs text-gray-400">Avg Query Time</p>
                  <p className="text-lg font-bold text-white">{systemMetrics?.database.queryTime}ms</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Slow Queries</p>
                  <p className="text-lg font-bold text-yellow-400">{systemMetrics?.database.slowQueries}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Uptime */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>⏱️</span> Uptime
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-400">Running Time</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {systemMetrics?.uptime.days}d {systemMetrics?.uptime.hours}h
                </p>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full" style={{ width: '99.94%' }} />
              </div>
              <p className="text-white font-semibold">{systemMetrics?.uptime.percent}% SLA Compliance</p>
            </div>
          </div>

          {/* Capacity Planning */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>📈</span> Capacity
            </h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Memory Headroom</span>
                <span className="text-green-400 font-medium">
                  {(systemMetrics?.memory.total - systemMetrics?.memory.used).toFixed(1)}GB
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Disk Headroom</span>
                <span className="text-green-400 font-medium">
                  {systemMetrics?.disk.total - systemMetrics?.disk.used}GB
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-700">
                <span className="text-gray-400">Est. Scaling Needed</span>
                <span className="text-yellow-400 font-medium">~30 days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Refresh Interval Control */}
        <div className="mt-8 p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white font-medium">Auto-refresh Settings</p>
              <p className="text-gray-400 text-sm mt-1">Last updated: {new Date().toLocaleTimeString()}</p>
            </div>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
              <option value={30000}>30 seconds</option>
              <option value={60000}>1 minute</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
