import React, { useEffect, useState } from 'react';
import { useModeStore } from '../store/modeStore';
import { useSessionStore } from '../store/sessionStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import DigitalFlipBoardGrid from './display/DigitalFlipBoardGrid';
import SettingsPanel from './display/SettingsPanel';
import QRCodeDisplay from './display/QRCodeDisplay';
import BrandingWatermark from './display/BrandingWatermark';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    SignalIcon, 
    CpuChipIcon, 
    DevicePhoneMobileIcon,
    GlobeAltIcon,
    BoltIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

export default function DisplayView() {
  const clearMode = useModeStore((state) => state.clearMode);
  const { sessionCode, isConnected, setIsFullscreen } = useSessionStore();
  const { isP2P } = useWebRTC();
  
  const [showSessionCode, setShowSessionCode] = useState(!isConnected);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [displaySettings, setDisplaySettings] = useState({
    brightness: 100,
    volume: 80,
    showWatermark: true
  });

  // Handle fullscreen on mount
  useEffect(() => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.log('Fullscreen request failed:', err);
      });
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      setIsFullscreen(false);
    };
  }, [setIsFullscreen]);

  const handleExitDisplay = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    clearMode();
  };

  // --- INITIALIZING STATE ---
  if (!sessionCode) {
    return (
      <div className="w-screen h-screen bg-[#020617] flex flex-col items-center justify-center overflow-hidden relative">
        <div className="relative">
            <div className="w-24 h-24 border-2 border-teal-500/20 rounded-full animate-ping absolute inset-0" />
            <div className="w-24 h-24 border-t-2 border-teal-500 rounded-full animate-spin relative z-10" />
        </div>
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
        >
            <p className="text-xs font-black text-teal-500 uppercase tracking-[0.3em] animate-pulse">Initializing System</p>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-2">Establishing Secure Protocol...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
        className="w-screen h-screen bg-black flex flex-col items-center justify-center overflow-hidden relative font-sans transition-opacity duration-500"
        style={{ opacity: displaySettings.brightness / 100 }}
    >
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-teal-500/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Main Display Grid */}
      <div className="flex-1 flex items-center justify-center w-full relative z-10">
        <AnimatePresence mode="wait">
          {isConnected ? (
            <motion.div 
                key="grid"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="w-full h-full flex items-center justify-center"
            >
                <DigitalFlipBoardGrid isFullscreen={true} />
            </motion.div>
          ) : (
            <motion.div 
                key="waiting"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col lg:flex-row items-center justify-center gap-20 max-w-6xl px-12"
            >
                {/* Left Side: Instructions & Code */}
                <div className="text-center lg:text-left max-w-md">
                    <div className="mb-10 relative inline-block">
                        <div className="w-24 h-24 bg-teal-500/10 border border-teal-500/20 rounded-3xl flex items-center justify-center shadow-2xl shadow-teal-500/10">
                            <SignalIcon className="w-12 h-12 text-teal-500 animate-pulse" />
                        </div>
                        <div className="absolute -top-3 -right-3 w-10 h-10 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center shadow-xl">
                            <DevicePhoneMobileIcon className="w-5 h-5 text-slate-400" />
                        </div>
                    </div>

                    <h2 className="text-5xl font-black text-white mb-6 tracking-tight uppercase leading-tight">
                        Waiting for <br/><span className="text-teal-500">Controller</span>
                    </h2>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-[0.2em] mb-12 leading-relaxed">
                        System is ready for pairing. Enter the code below on your mobile device or scan the QR code.
                    </p>

                    <div className="relative group inline-block">
                        <div className="absolute inset-0 bg-teal-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="relative bg-slate-900/50 backdrop-blur-xl border-2 border-slate-800 rounded-3xl p-8 shadow-2xl">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Pairing Code</p>
                            <div className="flex items-center justify-center lg:justify-start gap-3">
                                {sessionCode.split('').map((char, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="w-12 h-16 bg-slate-950 border-2 border-slate-800 rounded-xl flex items-center justify-center text-3xl font-mono font-black text-teal-400 shadow-inner"
                                    >
                                        {char}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex items-center justify-center lg:justify-start gap-8">
                        <div className="flex items-center gap-2">
                            <GlobeAltIcon className="w-4 h-4 text-slate-600" />
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Cloud Relay</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-slate-800" />
                        <div className="flex items-center gap-2">
                            <BoltIcon className="w-4 h-4 text-slate-600" />
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Low Latency</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: QR Code */}
                <div className="hidden md:block">
                    <QRCodeDisplay sessionCode={sessionCode} />
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Connection Status Indicator (Top Left) */}
      <div className="absolute top-8 left-8 flex flex-col gap-3 z-50">
        <div className="flex items-center gap-3 px-3 py-2 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl">
          <div className={clsx(
            "h-2 w-2 rounded-full shadow-[0_0_8px]",
            isConnected ? "bg-green-500 shadow-green-500/50 animate-pulse" : "bg-amber-500 shadow-amber-500/50"
          )} />
          <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">
            {isConnected ? 'System Online' : 'Awaiting Link'}
          </span>
        </div>
        
        {isConnected && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 px-3 py-2 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl"
          >
            <CpuChipIcon className={clsx("w-3.5 h-3.5", isP2P ? "text-teal-400" : "text-slate-600")} />
            <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">
              {isP2P ? 'P2P Protocol' : 'Relay Protocol'}
            </span>
          </motion.div>
        )}
      </div>

      {/* Session Code Display (Top Right) */}
      <AnimatePresence>
        {showSessionCode && (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-8 right-8 z-50"
            >
                <div className="bg-slate-900/80 backdrop-blur-xl px-6 py-4 rounded-2xl border border-slate-800 shadow-2xl group">
                    <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] mb-2">Session ID</p>
                    <div className="flex items-center gap-4">
                        <p className="font-mono text-2xl font-black text-teal-400 tracking-[0.2em]">{sessionCode}</p>
                        <button
                            onClick={() => setShowSessionCode(false)}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-600 hover:text-slate-300 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Branding Watermark */}
      {displaySettings.showWatermark && <BrandingWatermark />}

      {/* Minimal Control Button (Bottom Right) */}
      <div className="absolute bottom-8 right-8 flex items-center gap-4 z-50">
        {!showSessionCode && isConnected && (
            <motion.button
                onClick={() => setShowSessionCode(true)}
                whileHover={{ scale: 1.05, opacity: 1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                className="px-4 py-2 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all"
            >
                Show Code
            </motion.button>
        )}
        <motion.button
            onClick={() => setIsSettingsOpen(true)}
            whileHover={{ scale: 1.1, opacity: 1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            className="p-3 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 rounded-xl text-white transition-all"
            title="System Menu"
        >
            <Cog6ToothIcon className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Settings Panel Overlay */}
      <SettingsPanel 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={displaySettings}
        onSettingsChange={setDisplaySettings}
        onExit={handleExitDisplay}
      />

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50" />
    </div>
  );
}
