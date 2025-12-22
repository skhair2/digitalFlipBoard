import React, { useState, useEffect } from 'react';
import { useModeStore } from '../store/modeStore';
import { useSessionStore } from '../store/sessionStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { motion, AnimatePresence } from 'framer-motion';
import SessionPairing from './control/SessionPairing';
import MessageInput from './control/MessageInput';
import AnimationPicker from './control/AnimationPicker';
import ColorThemePicker from './control/ColorThemePicker';
import { 
    DevicePhoneMobileIcon, 
    ArrowPathIcon, 
    Cog6ToothIcon,
    BookmarkIcon,
    CalendarIcon,
    PaintBrushIcon,
    ShareIcon,
    SignalIcon,
    PowerIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

export default function ControllerView() {
  const clearMode = useModeStore((state) => state.clearMode);
  const { sessionCode, isConnected, lastAnimationType, lastColorTheme } = useSessionStore();
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('control'); // control, library, settings

  // If not connected to a session, show pairing UI
  if (!sessionCode || !isConnected) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col">
        <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                <DevicePhoneMobileIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight uppercase">Controller</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Offline</p>
              </div>
            </div>
            <motion.button
              onClick={clearMode}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors uppercase tracking-widest border border-slate-700"
            >
              Exit
            </motion.button>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <SessionPairing />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      {/* Professional Header */}
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <DevicePhoneMobileIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight uppercase">Controller</h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Live Connection</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full">
              <SignalIcon className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">{sessionCode}</span>
            </div>
            <motion.button
              onClick={clearMode}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-xl transition-all border border-slate-700 hover:border-red-500/50"
            >
              <PowerIcon className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Column: Primary Controls */}
          <div className="lg:col-span-8 space-y-8">
            {/* Message Input Engine */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Message Engine</h2>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Auto-Sync</span>
                  <div className="w-8 h-4 bg-teal-500/20 rounded-full relative">
                    <div className="absolute right-1 top-1 w-2 h-2 bg-teal-500 rounded-full" />
                  </div>
                </div>
              </div>
              <MessageInput message={message} setMessage={setMessage} />
            </section>

            {/* Visual Preferences */}
            <section className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Animation Profile</h2>
                <AnimationPicker />
              </div>
              <div className="space-y-4">
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Color Spectrum</h2>
                <ColorThemePicker />
              </div>
            </section>
          </div>

          {/* Right Column: Utilities & Status */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Access Panel */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Quick Access</h2>
              <div className="space-y-2">
                {[
                  { id: 'library', label: 'Saved Library', icon: BookmarkIcon, color: 'text-blue-400' },
                  { id: 'scheduler', label: 'Scheduler', icon: CalendarIcon, color: 'text-amber-400' },
                  { id: 'designer', label: 'Grid Designer', icon: PaintBrushIcon, color: 'text-purple-400' },
                  { id: 'share', label: 'Share Session', icon: ShareIcon, color: 'text-teal-400' },
                ].map((item) => (
                  <button
                    key={item.id}
                    className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={clsx("w-5 h-5", item.color)} />
                      <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{item.label}</span>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-all group-hover:translate-x-1" />
                  </button>
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6">System Status</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Latency</span>
                  <span className="text-xs font-mono font-bold text-green-400">24ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Protocol</span>
                  <span className="text-xs font-mono font-bold text-teal-400">WSS/AES</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Uptime</span>
                  <span className="text-xs font-mono font-bold text-slate-300">00:14:52</span>
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Preferences</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                      {lastAnimationType}
                    </span>
                    <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                      {lastColorTheme}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Toggle */}
            <button className="w-full flex items-center justify-center gap-3 p-4 bg-slate-800/30 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-slate-600 rounded-2xl transition-all group">
              <Cog6ToothIcon className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
              <span className="text-xs font-black text-slate-500 group-hover:text-white uppercase tracking-widest">Advanced Settings</span>
            </button>
          </div>
        </div>
      </main>

      {/* Mobile Navigation Bar (Visible only on small screens) */}
      <nav className="lg:hidden bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 p-4 sticky bottom-0 z-50">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center gap-1 text-teal-500">
            <DevicePhoneMobileIcon className="w-6 h-6" />
            <span className="text-[8px] font-black uppercase tracking-widest">Control</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-500">
            <BookmarkIcon className="w-6 h-6" />
            <span className="text-[8px] font-black uppercase tracking-widest">Library</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-500">
            <PaintBrushIcon className="w-6 h-6" />
            <span className="text-[8px] font-black uppercase tracking-widest">Design</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-500">
            <Cog6ToothIcon className="w-6 h-6" />
            <span className="text-[8px] font-black uppercase tracking-widest">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
