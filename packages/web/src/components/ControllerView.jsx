import React from 'react';
import { useModeStore } from '../store/modeStore';
import { motion } from 'framer-motion';

/**
 * ControllerView - Controller mode for phones and laptops
 * Provides UI for sending messages, settings, and sharing
 */
export default function ControllerView() {
  const clearMode = useModeStore((state) => state.clearMode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with Mode Switch */}
      <header className="bg-slate-800/50 backdrop-blur border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">FlipBoard Controller</h1>
          <motion.button
            onClick={clearMode}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Switch Mode
          </motion.button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Session & Message Input */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Code Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700"
            >
              <h2 className="text-lg font-semibold text-white mb-4">Session Code</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter or create session code"
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-teal-500 focus:outline-none"
                />
                <div className="flex gap-3">
                  <button className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium">
                    Create Session
                  </button>
                  <button className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium">
                    Join Session
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Message Input Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700"
            >
              <h2 className="text-lg font-semibold text-white mb-4">Send Message</h2>
              <div className="space-y-4">
                <textarea
                  placeholder="Enter message to display..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-teal-500 focus:outline-none resize-none"
                />
                
                {/* Animation & Color Pickers */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Animation
                    </label>
                    <select className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-teal-500 focus:outline-none">
                      <option>Flip</option>
                      <option>Scroll</option>
                      <option>Fade</option>
                      <option>Wave</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Color Theme
                    </label>
                    <select className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-teal-500 focus:outline-none">
                      <option>Monochrome</option>
                      <option>Teal</option>
                      <option>Vintage</option>
                    </select>
                  </div>
                </div>

                <button className="w-full px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium">
                  Send Message
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right: Quick Actions & Settings */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700"
            >
              <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
                  📋 Saved Messages
                </button>
                <button className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
                  ⏰ Scheduler
                </button>
                <button className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
                  🎨 Designer
                </button>
                <button className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
                  👥 Share Session
                </button>
              </div>
            </motion.div>

            {/* Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700"
            >
              <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
              <div className="space-y-3 text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-slate-300">Sound Effects</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-slate-300">Auto-sync</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  <span className="text-slate-300">Dark Mode</span>
                </label>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
