/**
 * Presence Component
 * Displays online users and presence statistics
 */

import React from 'react';
import usePresence from '../../hooks/usePresence';

const Presence = ({ className = '', showJoinButton = false, userType = 'controller' }) => {
  const {
    users,
    stats,
    isLoading,
    error,
    joinSession,
    leaveSession,
    getControllers,
    getDisplays,
    onlineCount,
    controllerCount,
    displayCount
  } = usePresence(true, 5000);

  const controllers = getControllers();
  const displays = getDisplays();

  const handleJoin = async () => {
    await joinSession(userType);
  };

  const handleLeave = async () => {
    await leaveSession();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Online Users</h2>
        {showJoinButton && (
          <button
            onClick={onlineCount > 0 ? handleLeave : handleJoin}
            disabled={isLoading}
            className={`px-3 py-1 text-sm rounded text-white ${
              onlineCount > 0
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
            } disabled:opacity-50`}
          >
            {isLoading ? 'Loading...' : onlineCount > 0 ? 'Leave' : 'Join'}
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 p-3 rounded text-center">
            <div className="text-2xl font-bold text-blue-600">{onlineCount}</div>
            <div className="text-xs text-gray-600">Online</div>
          </div>
          <div className="bg-purple-50 p-3 rounded text-center">
            <div className="text-2xl font-bold text-purple-600">{controllerCount}</div>
            <div className="text-xs text-gray-600">Controllers</div>
          </div>
          <div className="bg-teal-50 p-3 rounded text-center">
            <div className="text-2xl font-bold text-teal-600">{displayCount}</div>
            <div className="text-xs text-gray-600">Displays</div>
          </div>
        </div>
      )}

      {/* Controllers List */}
      {controllers.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-purple-700 mb-2">Controllers ({controllerCount})</h3>
          <div className="space-y-2">
            {controllers.map((user) => (
              <div key={user.userId} className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500">
                    {user.lastSeen ? `Active ${Math.round((Date.now() - user.lastSeen) / 1000)}s ago` : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Displays List */}
      {displays.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-teal-700 mb-2">Displays ({displayCount})</h3>
          <div className="space-y-2">
            {displays.map((user) => (
              <div key={user.userId} className="flex items-center gap-2 p-2 bg-teal-50 rounded">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500">
                    {user.lastSeen ? `Active ${Math.round((Date.now() - user.lastSeen) / 1000)}s ago` : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {users.length === 0 && !isLoading && (
        <div className="p-8 text-center text-gray-400 border rounded bg-gray-50">
          No users online
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="p-8 text-center text-gray-400">
          <div className="inline-block">
            <div className="animate-spin">
              <div className="h-4 w-4 border-2 border-teal-500 border-t-transparent rounded-full"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Presence;
