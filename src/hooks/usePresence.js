/**
 * usePresence Hook
 * Manages online user presence tracking
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { useAuthStore } from '../store/authStore';

const usePresence = (autoPolling = true, pollInterval = 5000) => {
  const sessionCode = useSessionStore((state) => state.sessionCode);
  const userId = useAuthStore((state) => state.userId);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollingIntervalRef = useRef(null);

  /**
   * Get presence summary (stats and user count)
   */
  const fetchPresence = useCallback(async () => {
    if (!sessionCode || sessionCode.length !== 6) {
      return null;
    }

    try {
      const response = await fetch(`/api/session/${sessionCode}/presence`);

      if (!response.ok) {
        throw new Error(`Failed to fetch presence: ${response.status}`);
      }

      const data = await response.json();
      setStats(data.presence || null);
      setError(null);

      return data.presence;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch presence';
      console.error('[usePresence] Error fetching presence:', err);
      setError(errorMessage);
      return null;
    }
  }, [sessionCode]);

  /**
   * Get detailed list of online users
   */
  const fetchUsers = useCallback(async () => {
    if (!sessionCode || sessionCode.length !== 6) {
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/session/${sessionCode}/presence/users`);

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data.users || []);

      return data.users;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      console.error('[usePresence] Error fetching users:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [sessionCode]);

  /**
   * Join the session (announce presence)
   */
  const joinSession = useCallback(async (userType = 'controller', displayName = null) => {
    if (!sessionCode || sessionCode.length !== 6) {
      setError('Invalid session code');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/session/${sessionCode}/presence/join`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId || `anonymous_${Math.random().toString(36).substring(7)}`,
            type: userType,
            name: displayName || `${userType}_${Math.random().toString(36).substring(7)}`,
            metadata: {
              joinedAt: new Date().toISOString()
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to join session: ${response.status}`);
      }

      // Fetch updated presence
      await fetchPresence();
      await fetchUsers();

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join session';
      setError(errorMessage);
      console.error('[usePresence] Error joining session:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionCode, userId, fetchPresence, fetchUsers]);

  /**
   * Leave the session (remove presence)
   */
  const leaveSession = useCallback(async () => {
    if (!sessionCode || sessionCode.length !== 6 || !userId) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/session/${sessionCode}/presence/leave`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to leave session: ${response.status}`);
      }

      // Fetch updated presence
      await fetchPresence();
      await fetchUsers();

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave session';
      setError(errorMessage);
      console.error('[usePresence] Error leaving session:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionCode, userId, fetchPresence, fetchUsers]);

  /**
   * Update activity timestamp (keep-alive)
   */
  const updateActivity = useCallback(async () => {
    if (!sessionCode || sessionCode.length !== 6 || !userId) {
      return false;
    }

    try {
      const response = await fetch(
        `/api/session/${sessionCode}/presence/activity`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        }
      );

      return response.ok;
    } catch (err) {
      console.error('[usePresence] Error updating activity:', err);
      return false;
    }
  }, [sessionCode, userId]);

  /**
   * Get controllers only
   */
  const getControllers = useCallback(() => {
    return users.filter(u => u.type === 'controller');
  }, [users]);

  /**
   * Get displays only
   */
  const getDisplays = useCallback(() => {
    return users.filter(u => u.type === 'display');
  }, [users]);

  /**
   * Check if user is online
   */
  const isUserOnline = useCallback((checkUserId) => {
    return users.some(u => u.userId === checkUserId);
  }, [users]);

  /**
   * Start polling for presence updates
   */
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      return; // Already polling
    }

    // Fetch immediately
    fetchPresence();
    fetchUsers();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(() => {
      fetchPresence();
      fetchUsers();
      updateActivity();
    }, pollInterval);
  }, [pollInterval, fetchPresence, fetchUsers, updateActivity]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Auto-start polling when session code changes
  useEffect(() => {
    if (sessionCode && autoPolling) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [sessionCode, autoPolling, startPolling, stopPolling]);

  // Periodic activity update (keep user alive)
  useEffect(() => {
    const activityInterval = setInterval(() => {
      updateActivity();
    }, 30000); // Every 30 seconds

    return () => clearInterval(activityInterval);
  }, [updateActivity]);

  return {
    // State
    users,
    stats,
    isLoading,
    error,

    // Methods
    fetchPresence,
    fetchUsers,
    joinSession,
    leaveSession,
    updateActivity,
    startPolling,
    stopPolling,

    // Helpers
    getControllers,
    getDisplays,
    isUserOnline,

    // Computed
    onlineCount: stats?.total || 0,
    controllerCount: stats?.controllers || 0,
    displayCount: stats?.displays || 0
  };
};

export default usePresence;
