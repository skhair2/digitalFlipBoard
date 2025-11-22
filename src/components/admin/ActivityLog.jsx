import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import * as adminService from '../../services/adminService';
import Spinner from '../ui/Spinner';

/**
 * Activity Log
 * Displays admin activity audit trail and system events
 */

export default function ActivityLog() {
  const { activityLog, setActivityLog } = useAdminStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadActivityLog();
  }, []);

  const loadActivityLog = async () => {
    try {
      setLoading(true);
      const log = await adminService.fetchAdminActivityLog({ limit: 100 });
      setActivityLog(log);
    } catch (err) {
      console.error('Failed to load activity log:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      'user_created': '👤',
      'user_updated': '✏️',
      'user_deactivated': '⛔',
      'user_deleted': '🗑️',
      'tier_changed': '⭐',
      'admin_login': '🔑',
      'system_health': '🔧',
      'alert': '🚨',
      'report_generated': '📊'
    };
    return icons[type] || '📌';
  };

  const getActivityColor = (type) => {
    if (type.includes('created')) return 'bg-green-500/20 text-green-300 border-green-500/30';
    if (type.includes('updated') || type.includes('changed')) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    if (type.includes('deactivated') || type.includes('deleted')) return 'bg-red-500/20 text-red-300 border-red-500/30';
    if (type.includes('login')) return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    if (type.includes('alert')) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const filteredLog = filterType === 'all' 
    ? activityLog 
    : activityLog.filter(entry => entry.action_type === filterType);

  if (loading && activityLog.length === 0) return <Spinner />;

  const activityTypes = [...new Set(activityLog.map(entry => entry.action_type))];

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Activity Log</h1>
          <p className="text-gray-400 mt-2">Admin and system activity audit trail</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
            <p>{error}</p>
          </div>
        )}

        {/* Filter */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-3">Filter by Type</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All Activities
            </button>
            {activityTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {type.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="space-y-4">
          {filteredLog.length === 0 ? (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center text-gray-400">
              No activities found
            </div>
          ) : (
            filteredLog.map((entry, idx) => (
              <div
                key={entry.id || idx}
                className={`border rounded-lg p-6 transition-colors hover:border-gray-600 ${getActivityColor(entry.action_type)}`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-2xl mt-1">
                    {getActivityIcon(entry.action_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">
                        {entry.action_type.replace(/_/g, ' ').toUpperCase()}
                      </h3>
                      <span className="text-xs opacity-75">
                        {new Date(entry.created_at).toLocaleString()}
                      </span>
                    </div>

                    {entry.description && (
                      <p className="mb-3">{entry.description}</p>
                    )}

                    {entry.metadata && (
                      <div className="bg-black/20 rounded px-3 py-2 text-xs font-mono overflow-x-auto">
                        <pre>{JSON.stringify(entry.metadata, null, 2)}</pre>
                      </div>
                    )}

                    <div className="mt-3 text-xs opacity-75">
                      {entry.admin_id && <p>Admin: {entry.admin_id}</p>}
                      {entry.user_id && <p>User: {entry.user_id}</p>}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={loadActivityLog}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            🔄 Refresh Log
          </button>
          <button
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            📥 Export
          </button>
        </div>
      </div>
    </div>
  );
}
