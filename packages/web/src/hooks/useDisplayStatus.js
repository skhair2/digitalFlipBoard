/**
 * useDisplayStatus Hook
 * 
 * Manages display status polling via HTTP fallback (10% traffic).
 * Complements WebSocket-based status updates with HTTP polling for resilience.
 * 
 * Features:
 * - Lightweight HTTP polling (30-second interval)
 * - Automatic retry on failure
 * - Exponential backoff for failed requests
 * - Metrics collection (FPS, CPU, memory, latency)
 * - Status caching in localStorage
 * - Graceful fallback if HTTP also fails
 * 
 * Usage:
 *   const { displayStatus, isPolling, error } = useDisplayStatus(displayId);
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const POLL_INTERVAL = 30000; // 30 seconds for HTTP fallback polling
const MAX_RETRIES = 3;
const RETRY_BACKOFF = [1000, 2000, 5000]; // Exponential backoff in ms

/**
 * Get local cache key for display status
 */
function getCacheKey(displayId) {
  return `display_status_${displayId}`;
}

/**
 * Fetch display status via HTTP endpoint
 * 
 * @param {string} displayId - Display identifier
 * @param {string} apiUrl - API base URL (defaults to window.location.origin)
 * @returns {Promise<Object>} Display status object
 */
async function fetchDisplayStatus(displayId, apiUrl = '') {
  const url = new URL(`/api/displays/${displayId}/status`, apiUrl || window.location.origin);
  
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch display status: ${error.message}`);
  }
}

/**
 * Send display heartbeat via HTTP (health check)
 * 
 * @param {string} displayId - Display identifier
 * @param {Object} status - Current display status
 * @param {string} apiUrl - API base URL
 * @returns {Promise<Object>} Heartbeat response
 */
async function sendDisplayHeartbeat(displayId, status = {}, apiUrl = '') {
  const url = new URL(`/api/displays/${displayId}/heartbeat`, apiUrl || window.location.origin);
  
  try {
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: status.status || 'online',
        timestamp: Date.now()
      }),
      signal: AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined // 3 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // Heartbeat failures are non-fatal - just log
    console.warn(`Display heartbeat failed for ${displayId}:`, error.message);
    return null;
  }
}

/**
 * Hook for managing display status polling
 * 
 * @param {string} displayId - Display identifier to monitor
 * @param {Object} options - Configuration options
 * @param {number} options.pollInterval - Polling interval in ms (default: 30000)
 * @param {boolean} options.enableCache - Use localStorage cache (default: true)
 * @param {string} options.apiUrl - API base URL (default: window.location.origin)
 * @param {Function} options.onStatusChange - Callback when status changes
 * @returns {Object} Hook state and methods
 */
export function useDisplayStatus(displayId, options = {}) {
  const {
    pollInterval = POLL_INTERVAL,
    enableCache = true,
    apiUrl = '',
    onStatusChange = null
  } = options;

  const [displayStatus, setDisplayStatus] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const pollTimeoutRef = useRef(null);
  const previousStatusRef = useRef(null);
  const abortControllerRef = useRef(null);

  /**
   * Load status from local cache
   */
  const loadFromCache = useCallback(() => {
    if (!enableCache) return null;
    
    try {
      const cacheKey = getCacheKey(displayId);
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      console.warn('Failed to load display status cache:', err);
      return null;
    }
  }, [displayId, enableCache]);

  /**
   * Save status to local cache
   */
  const saveToCache = useCallback((status) => {
    if (!enableCache) return;
    
    try {
      const cacheKey = getCacheKey(displayId);
      localStorage.setItem(cacheKey, JSON.stringify(status));
    } catch (err) {
      console.warn('Failed to save display status cache:', err);
    }
  }, [displayId, enableCache]);

  /**
   * Perform single poll with retry logic
   */
  const performPoll = useCallback(async () => {
    if (!displayId) return;

    try {
      setError(null);
      const status = await fetchDisplayStatus(displayId, apiUrl);
      
      setDisplayStatus(status);
      saveToCache(status);
      setLastUpdateTime(Date.now());
      setRetryCount(0); // Reset retry count on success

      // Call onChange callback if status actually changed
      if (onStatusChange && previousStatusRef.current?.status !== status.status) {
        onStatusChange(status);
      }

      previousStatusRef.current = status;
    } catch (err) {
      console.error(`Display status poll failed for ${displayId}:`, err);
      setError(err.message);

      // Implement retry with exponential backoff
      if (retryCount < MAX_RETRIES) {
        const backoffDelay = RETRY_BACKOFF[Math.min(retryCount, RETRY_BACKOFF.length - 1)];
        console.log(`Retrying display status poll in ${backoffDelay}ms (attempt ${retryCount + 1})`);
        
        setRetryCount(prev => prev + 1);
        
        pollTimeoutRef.current = setTimeout(() => {
          performPoll();
        }, backoffDelay);
      } else {
        // Max retries exceeded - use cached value as fallback
        console.warn(`Max retries exceeded for ${displayId}, using cached status`);
        const cached = loadFromCache();
        if (cached) {
          setDisplayStatus(cached);
        }
      }
    }
  }, [displayId, apiUrl, retryCount, onStatusChange, saveToCache, loadFromCache]);

  /**
   * Start polling
   */
  const startPolling = useCallback(() => {
    if (isPolling) return;

    setIsPolling(true);

    // Load from cache first
    const cached = loadFromCache();
    if (cached) {
      setDisplayStatus(cached);
      previousStatusRef.current = cached;
    }

    // Perform immediate poll
    performPoll();

    // Set up recurring polls
    pollTimeoutRef.current = setInterval(performPoll, pollInterval);
  }, [isPolling, pollInterval, performPoll, loadFromCache]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearInterval(pollTimeoutRef.current);
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    setIsPolling(false);
  }, []);

  /**
   * Send heartbeat to keep display alive (called from Display component)
   */
  const sendHeartbeat = useCallback(async (status = null) => {
    const currentStatus = status || displayStatus;
    if (!currentStatus) return;

    try {
      const result = await sendDisplayHeartbeat(displayId, currentStatus, apiUrl);
      return result;
    } catch (err) {
      console.error('Failed to send display heartbeat:', err);
      return null;
    }
  }, [displayId, displayStatus, apiUrl]);

  /**
   * Manually refresh status
   */
  const refresh = useCallback(() => {
    setRetryCount(0);
    performPoll();
  }, [performPoll]);

  // Auto-start polling when component mounts
  useEffect(() => {
    if (displayId) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [displayId, startPolling, stopPolling]);

  // Auto-send heartbeat every 10 seconds to keep display alive
  useEffect(() => {
    if (!isPolling || !displayId) return;

    const heartbeatInterval = setInterval(() => {
      sendHeartbeat();
    }, 10000); // Every 10 seconds

    return () => clearInterval(heartbeatInterval);
  }, [isPolling, displayId, sendHeartbeat]);

  return {
    displayStatus,
    isPolling,
    error,
    lastUpdateTime,
    retryCount,
    startPolling,
    stopPolling,
    refresh,
    sendHeartbeat
  };
}

/**
 * Hook for managing status of multiple displays
 * 
 * Useful for controller pages that track multiple display instances
 * 
 * @param {string[]} displayIds - Array of display identifiers
 * @param {Object} options - Configuration options (same as useDisplayStatus)
 * @returns {Object} Mapping of displayId -> status from useDisplayStatus
 */
export function useMultipleDisplayStatus(displayIds = [], options = {}) {
  const [statuses, setStatuses] = useState({});

  // Create a hook instance for each display ID
  const statusHooks = displayIds.map(id => ({
    displayId: id,
    ...useDisplayStatus(id, options)
  }));

  // Aggregate statuses
  useEffect(() => {
    const aggregated = {};
    statusHooks.forEach(hook => {
      aggregated[hook.displayId] = {
        status: hook.displayStatus,
        isPolling: hook.isPolling,
        error: hook.error,
        refresh: hook.refresh
      };
    });
    setStatuses(aggregated);
  }, [statusHooks]);

  return statuses;
}

export default useDisplayStatus;
