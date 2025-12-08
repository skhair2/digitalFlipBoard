/**
 * useMessageHistory Hook
 * Manages message history retrieval and pagination
 */

import { useState, useCallback, useEffect } from 'react';
import { useSessionStore } from '../store/sessionStore';

const useMessageHistory = () => {
  const sessionCode = useSessionStore((state) => state.sessionCode);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 20,
    total: 0,
    hasMore: false
  });
  const [stats, setStats] = useState(null);
  const [searchResults, setSearchResults] = useState(null);

  /**
   * Fetch paginated message history
   */
  const fetchHistory = useCallback(async (page = 0, pageSize = 20) => {
    if (!sessionCode || sessionCode.length !== 6) {
      setError('Invalid session code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/session/${sessionCode}/history?page=${page}&pageSize=${pageSize}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.status}`);
      }

      const data = await response.json();
      setMessages(data.messages || []);
      setPagination(data.pagination || {});

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch history';
      setError(errorMessage);
      console.error('[useMessageHistory] Error fetching history:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionCode]);

  /**
   * Fetch latest messages
   */
  const fetchLatest = useCallback(async (limit = 10) => {
    if (!sessionCode || sessionCode.length !== 6) {
      setError('Invalid session code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/session/${sessionCode}/history/latest?limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch latest: ${response.status}`);
      }

      const data = await response.json();
      setMessages(data.messages || []);

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch latest messages';
      setError(errorMessage);
      console.error('[useMessageHistory] Error fetching latest:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionCode]);

  /**
   * Search message history
   */
  const search = useCallback(async (query) => {
    if (!sessionCode || sessionCode.length !== 6) {
      setError('Invalid session code');
      return;
    }

    if (!query || query.trim().length === 0) {
      setError('Search query is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/session/${sessionCode}/history/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to search: ${response.status}`);
      }

      const data = await response.json();
      setSearchResults(data.results || []);

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search history';
      setError(errorMessage);
      console.error('[useMessageHistory] Error searching:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionCode]);

  /**
   * Fetch message statistics
   */
  const fetchStats = useCallback(async () => {
    if (!sessionCode || sessionCode.length !== 6) {
      setError('Invalid session code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/session/${sessionCode}/history/stats`);

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }

      const data = await response.json();
      setStats(data.stats || null);

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch statistics';
      setError(errorMessage);
      console.error('[useMessageHistory] Error fetching stats:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionCode]);

  /**
   * Clear message history
   */
  const clearHistory = useCallback(async () => {
    if (!sessionCode || sessionCode.length !== 6) {
      setError('Invalid session code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/session/${sessionCode}/history`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error(`Failed to clear history: ${response.status}`);
      }

      setMessages([]);
      setSearchResults(null);
      setPagination({ page: 0, pageSize: 20, total: 0, hasMore: false });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear history';
      setError(errorMessage);
      console.error('[useMessageHistory] Error clearing history:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionCode]);

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (pagination.hasMore) {
      fetchHistory(pagination.page + 1, pagination.pageSize);
    }
  }, [pagination, fetchHistory]);

  /**
   * Go to previous page
   */
  const previousPage = useCallback(() => {
    if (pagination.page > 0) {
      fetchHistory(pagination.page - 1, pagination.pageSize);
    }
  }, [pagination, fetchHistory]);

  /**
   * Go to specific page
   */
  const goToPage = useCallback((page) => {
    fetchHistory(page, pagination.pageSize);
  }, [pagination.pageSize, fetchHistory]);

  // Auto-fetch history when session code changes
  useEffect(() => {
    if (sessionCode && sessionCode.length === 6) {
      fetchHistory(0, pagination.pageSize);
    }
  }, [sessionCode]);

  return {
    // State
    messages,
    searchResults,
    stats,
    isLoading,
    error,
    pagination,

    // Methods
    fetchHistory,
    fetchLatest,
    search,
    fetchStats,
    clearHistory,
    nextPage,
    previousPage,
    goToPage
  };
};

export default useMessageHistory;
