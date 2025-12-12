import React, { useState, useEffect } from 'react';
import { useModeStore } from '../store/modeStore';
import { useSessionStore } from '../store/sessionStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { motion } from 'framer-motion';
import SessionPairing from './control/SessionPairing';

/**
 * ControllerView - Controller mode for phones and laptops
 * Provides UI for sending messages, settings, and sharing
 * Integrates with actual WebSocket and session management
 */
export default function ControllerView() {
  const clearMode = useModeStore((state) => state.clearMode);
  const { sessionCode, isConnected, currentMessage } = useSessionStore();
  const { sendMessage } = useWebSocket();
  
  const [message, setMessage] = useState('');
  const [animation, setAnimation] = useState('flip');
  const [colorTheme, setColorTheme] = useState('monochrome');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Initialize WebSocket connection
  useEffect(() => {
    // WebSocket hook handles connection automatically if sessionCode exists
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (!isConnected) {
      setError('Not connected to session. Create or join a session first.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      await sendMessage(message, {
        animationType: animation,
        colorTheme: colorTheme,
      });
      setMessage('');
    } catch (err) {
      setError(err.message || 'Failed to send message');
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  };

  // If not connected to a session, show pairing UI
  if (!sessionCode || !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
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
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
          <SessionPairing />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with Mode Switch */}
      <header className="bg-slate-800/50 backdrop-blur border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">FlipBoard Controller</h1>
            <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
          </div>
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
            {/* Session Code Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700"
            >
              <h2 className="text-lg font-semibold text-white mb-4">Active Session</h2>
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-2">Share this code with your display device:</p>
                <div className="bg-slate-700 rounded-lg p-4 font-mono text-2xl font-bold text-teal-400 tracking-widest">
                  {sessionCode}
                </div>
                <p className="text-slate-500 text-xs mt-3">
                  Status: <span className={isConnected ? 'text-green-400' : 'text-yellow-400'}>
                    {isConnected ? '✓ Connected' : '⟳ Connecting'}
                  </span>
                </p>
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
              
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSendMessage} className="space-y-4">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter message to display..."
                  rows={4}
                  maxLength={132}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-teal-500 focus:outline-none resize-none"
                />
                
                {/* Animation & Color Pickers */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Animation
                    </label>
                    <select 
                      value={animation}
                      onChange={(e) => setAnimation(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-teal-500 focus:outline-none"
                    >
                      <option value="flip">Flip</option>
                      <option value="scroll">Scroll</option>
                      <option value="fade">Fade</option>
                      <option value="wave">Wave</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Color Theme
                    </label>
                    <select 
                      value={colorTheme}
                      onChange={(e) => setColorTheme(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-teal-500 focus:outline-none"
                    >
                      <option value="monochrome">Monochrome</option>
                      <option value="teal">Teal</option>
                      <option value="vintage">Vintage</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={!message.trim() || sending || !isConnected}
                  className={`w-full px-6 py-3 rounded-lg transition-colors font-medium ${
                    !message.trim() || sending || !isConnected
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-teal-600 hover:bg-teal-700 text-white'
                  }`}
                >
                  {sending ? '⟳ Sending...' : 'Send Message'}
                </button>
              </form>

              <div className="text-right text-xs text-gray-500 mt-2">
                {message.length}/132
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
