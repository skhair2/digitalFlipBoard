import React, { useEffect } from 'react';
import { useModeStore } from '../store/modeStore';
import DigitalFlipBoardGrid from './display/DigitalFlipBoardGrid';
import { motion } from 'framer-motion';

/**
 * DisplayView - Fullscreen display mode for TVs and large screens
 * Shows animated split-flap display with minimal UI
 */
export default function DisplayView() {
  const clearMode = useModeStore((state) => state.clearMode);

  // Handle fullscreen on mount
  useEffect(() => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        // Fullscreen may fail on some devices, that's ok
      });
    }
  }, []);

  const handleExitDisplay = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    clearMode();
  };

  return (
    <div className="w-screen h-screen bg-black flex flex-col items-center justify-center overflow-hidden relative">
      {/* Main Display Grid */}
      <div className="flex-1 flex items-center justify-center w-full">
        <DigitalFlipBoardGrid />
      </div>

      {/* Minimal Control Button (Bottom Right) */}
      <motion.button
        onClick={handleExitDisplay}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        whileHover={{ opacity: 1 }}
        className="absolute bottom-6 right-6 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-white text-sm transition-all"
        title="Click to change mode"
      >
        ⚙️ Menu
      </motion.button>

      {/* Session Code Display (Top Left) - Small and unobtrusive */}
      <div className="absolute top-6 left-6 text-white/40 text-sm font-mono">
        {/* Session code would go here */}
      </div>
    </div>
  );
}
