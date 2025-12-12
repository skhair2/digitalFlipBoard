import React, { useEffect, useState } from 'react';
import { useModeStore } from '../store/modeStore';
import { useSessionStore } from '../store/sessionStore';
import { useWebSocket } from '../hooks/useWebSocket';
import DigitalFlipBoardGrid from './display/DigitalFlipBoardGrid';
import SessionPairing from './control/SessionPairing';
import { motion } from 'framer-motion';

/**
 * DisplayView - Fullscreen display mode for TVs and large screens
 * Shows animated split-flap display with minimal UI
 * Integrates with actual WebSocket for real-time message updates
 */
export default function DisplayView() {
  const clearMode = useModeStore((state) => state.clearMode);
  const { sessionCode, isConnected, currentMessage } = useSessionStore();
  const [connectionStatus, setConnectionStatus] = useState('waiting');
  const [showSessionCode, setShowSessionCode] = useState(!isConnected);

  // Initialize WebSocket and listen for connection changes
  useEffect(() => {
    // WebSocket hook handles connection automatically if sessionCode exists
    
    // Update connection status display
    if (isConnected) {
      setConnectionStatus('connected');
      // Hide session code after 3 seconds if connected
      const timer = setTimeout(() => setShowSessionCode(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setConnectionStatus('waiting');
      setShowSessionCode(true);
    }
  }, [isConnected]);

  // Handle fullscreen on mount
  useEffect(() => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log('Fullscreen request failed:', err);
        // Fullscreen may fail on some devices, that's ok
      });
    }
  }, []);

  const handleExitDisplay = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    clearMode();
  };

  // If no session code yet, show pairing UI
  if (!sessionCode) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col items-center justify-center overflow-hidden relative">
        <div className="w-full max-w-md">
          <SessionPairing />
        </div>
        <motion.button
          onClick={handleExitDisplay}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="absolute bottom-6 right-6 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-white text-sm transition-all"
          title="Click to switch modes"
        >
          ⚙️ Menu
        </motion.button>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black flex flex-col items-center justify-center overflow-hidden relative">
      {/* Main Display Grid */}
      <div className="flex-1 flex items-center justify-center w-full">
        {isConnected ? (
          <DigitalFlipBoardGrid />
        ) : (
          <div className="text-center text-slate-400">
            <div className="text-6xl mb-4">📡</div>
            <p className="text-lg">Waiting for Controller to Connect...</p>
            <p className="text-sm text-slate-500 mt-2">Share this code with your controller:</p>
            <div className="font-mono text-2xl font-bold text-teal-400 mt-3 tracking-widest">
              {sessionCode}
            </div>
          </div>
        )}
      </div>

      {/* Connection Status Indicator */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`}></div>
        <span className="text-white/60 text-sm font-mono">
          {isConnected ? 'Connected' : 'Waiting...'}
        </span>
      </div>

      {/* Session Code Display (Top Right) - Toggleable */}
      {showSessionCode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-6 right-6 bg-slate-900/80 backdrop-blur px-4 py-2 rounded-lg border border-slate-700"
        >
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Session Code</p>
          <p className="font-mono text-lg font-bold text-teal-400">{sessionCode}</p>
          <button
            onClick={() => setShowSessionCode(false)}
            className="text-xs text-slate-500 mt-1 hover:text-slate-300"
          >
            Hide
          </button>
        </motion.div>
      )}

      {/* Minimal Control Button (Bottom Right) */}
      <motion.button
        onClick={handleExitDisplay}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        whileHover={{ opacity: 1 }}
        className="absolute bottom-6 right-6 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-white text-sm transition-all"
        title="Click to switch modes"
      >
        ⚙️ Menu
      </motion.button>

      {/* Show Session Code Button (if hidden) */}
      {!showSessionCode && isConnected && (
        <motion.button
          onClick={() => setShowSessionCode(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          whileHover={{ opacity: 0.7 }}
          className="absolute top-6 right-6 px-2 py-1 bg-slate-800/50 hover:bg-slate-700 rounded text-white text-xs transition-all"
        >
          Show Code
        </motion.button>
      )}
    </div>
  );
}
