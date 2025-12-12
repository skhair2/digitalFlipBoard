import React from 'react';
import { useModeStore } from '../store/modeStore';
import { motion } from 'framer-motion';

/**
 * ModeSelector - Let users choose between Display and Controller modes
 * Shows on first load or when user clicks to change mode
 */
export default function ModeSelector() {
  const setMode = useModeStore((state) => state.setMode);

  const handleModeSelect = (mode) => {
    setMode(mode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            FlipBoard
          </h1>
          <p className="text-xl text-slate-300">
            Choose how you want to use FlipBoard
          </p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Display Mode Card */}
          <motion.button
            onClick={() => handleModeSelect('display')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="group relative p-8 bg-gradient-to-br from-cyan-900 to-cyan-950 rounded-2xl border-2 border-cyan-500 hover:border-cyan-400 transition-all cursor-pointer text-left"
          >
            <div className="absolute top-4 right-4 text-4xl">📺</div>
            <h2 className="text-2xl font-bold text-cyan-300 mb-3 group-hover:text-cyan-200 transition">
              Display Mode
            </h2>
            <p className="text-cyan-100 mb-6">
              Perfect for large screens & TVs. Shows animated split-flap display in fullscreen.
            </p>
            <ul className="text-sm text-cyan-100 space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span> Fullscreen animations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span> Real-time message updates
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">✓</span> No distractions
              </li>
            </ul>
          </motion.button>

          {/* Controller Mode Card */}
          <motion.button
            onClick={() => handleModeSelect('controller')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="group relative p-8 bg-gradient-to-br from-teal-900 to-teal-950 rounded-2xl border-2 border-teal-500 hover:border-teal-400 transition-all cursor-pointer text-left"
          >
            <div className="absolute top-4 right-4 text-4xl">📱</div>
            <h2 className="text-2xl font-bold text-teal-300 mb-3 group-hover:text-teal-200 transition">
              Controller Mode
            </h2>
            <p className="text-teal-100 mb-6">
              Perfect for phones & laptops. Control messages, settings, and sharing.
            </p>
            <ul className="text-sm text-teal-100 space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-teal-400">✓</span> Send messages
              </li>
              <li className="flex items-center gap-2">
                <span className="text-teal-400">✓</span> Customize animations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-teal-400">✓</span> Share & manage sessions
              </li>
            </ul>
          </motion.button>
        </div>

        {/* Info Footer */}
        <div className="text-center text-slate-400 text-sm">
          <p>
            💡 Tip: You can switch modes anytime from the settings menu
          </p>
        </div>
      </motion.div>
    </div>
  );
}
