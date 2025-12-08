/**
 * Hook for managing message broker operations
 * Provides easy access to send/receive messages and manage configurations
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { messageBrokerService } from '../services/messageBrokerService';
import { useSessionStore } from '../store/sessionStore';

export function useMessageBroker() {
  const { sessionCode } = useSessionStore();
  const [isConnected, setIsConnected] = useState(false);
  const [currentState, setCurrentState] = useState(null);
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollingStartedRef = useRef(false);

  // Initialize message broker with session code
  useEffect(() => {
    if (sessionCode) {
      messageBrokerService.setSessionCode(sessionCode);
      setIsConnected(true);
      console.log('[useMessageBroker] Connected to session:', sessionCode);

      return () => {
        messageBrokerService.stopPolling();
      };
    }
  }, [sessionCode]);

  // Start polling for state changes when connected
  useEffect(() => {
    if (isConnected && sessionCode && !pollingStartedRef.current) {
      pollingStartedRef.current = true;

      const handleStateChange = (newState) => {
        setCurrentState(newState);
        if (newState?.config) {
          setConfig(newState.config);
        }
      };

      messageBrokerService.startPolling(handleStateChange, 2000);
    }

    return () => {
      if (pollingStartedRef.current && !sessionCode) {
        messageBrokerService.stopPolling();
        pollingStartedRef.current = false;
      }
    };
  }, [isConnected, sessionCode]);

  /**
   * Send a message to the Display
   */
  const sendMessage = useCallback(
    async (message, options = {}) => {
      if (!isConnected || !sessionCode) {
        setError('Not connected to a session');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const success = await messageBrokerService.sendMessage(message, {
          animation: options.animation || 'flip',
          color: options.color || 'monochrome',
          customConfig: options.customConfig || {}
        });

        if (success) {
          console.log('[useMessageBroker] Message sent successfully');
          return true;
        } else {
          setError('Failed to send message');
          return false;
        }
      } catch (err) {
        setError(err.message);
        console.error('[useMessageBroker] Error sending message:', err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, sessionCode]
  );

  /**
   * Update session configuration
   */
  const updateConfig = useCallback(
    async (newConfig) => {
      if (!isConnected || !sessionCode) {
        setError('Not connected to a session');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await messageBrokerService.updateConfig(newConfig);

        if (result) {
          setConfig(result);
          console.log('[useMessageBroker] Config updated successfully');
          return true;
        } else {
          setError('Failed to update configuration');
          return false;
        }
      } catch (err) {
        setError(err.message);
        console.error('[useMessageBroker] Error updating config:', err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, sessionCode]
  );

  /**
   * Get current state
   */
  const getState = useCallback(async () => {
    if (!isConnected || !sessionCode) {
      setError('Not connected to a session');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await messageBrokerService.getState();
      if (result) {
        setCurrentState(result);
      }
      return result;
    } catch (err) {
      setError(err.message);
      console.error('[useMessageBroker] Error getting state:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, sessionCode]);

  /**
   * Get current config
   */
  const getConfig = useCallback(async () => {
    if (!isConnected || !sessionCode) {
      setError('Not connected to a session');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await messageBrokerService.getConfig();
      if (result) {
        setConfig(result);
      }
      return result;
    } catch (err) {
      setError(err.message);
      console.error('[useMessageBroker] Error getting config:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, sessionCode]);

  /**
   * End session
   */
  const endSession = useCallback(async () => {
    if (!sessionCode) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await messageBrokerService.endSession();
      if (success) {
        setIsConnected(false);
        setCurrentState(null);
        setConfig(null);
        console.log('[useMessageBroker] Session ended');
      }
      return success;
    } catch (err) {
      setError(err.message);
      console.error('[useMessageBroker] Error ending session:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionCode]);

  return {
    // State
    isConnected,
    isLoading,
    error,
    currentState,
    config,

    // Methods
    sendMessage,
    updateConfig,
    getState,
    getConfig,
    endSession
  };
}
