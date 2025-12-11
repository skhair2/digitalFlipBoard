/**
 * useActivityTracking Hook
 * 
 * Manages activity tracking lifecycle in React components
 * Automatically starts/stops tracking based on session and connection state
 * Emits activity events to prevent session inactivity timeout
 */

import { useEffect, useRef } from 'react';
import ActivityTracker from '../utils/activityTracker';
import websocketService from '../services/websocketService';

export function useActivityTracking(sessionCode, type = 'client') {
  const trackerRef = useRef(null);
  const sessionCodeRef = useRef(sessionCode);

  useEffect(() => {
    // Only start tracking if we have a session code and connection
    if (!sessionCode || !websocketService.isConnected()) {
      return;
    }

    // Update session code reference
    sessionCodeRef.current = sessionCode;

    // Create activity tracker
    trackerRef.current = new ActivityTracker(sessionCode, websocketService, type);

    // Start tracking
    trackerRef.current.start();

    // Cleanup on unmount or when dependencies change
    return () => {
      if (trackerRef.current) {
        trackerRef.current.stop();
      }
    };
  }, [sessionCode, type]);

  // Return object with methods to manually record activity
  return {
    recordActivity: () => {
      if (trackerRef.current) {
        trackerRef.current.recordActivity();
      }
    },
    isTracking: () => {
      return trackerRef.current?.isListening || false;
    }
  };
}

export default useActivityTracking;
