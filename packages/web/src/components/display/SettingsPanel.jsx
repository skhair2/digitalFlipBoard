import { motion, AnimatePresence } from 'framer-motion'
import PropTypes from 'prop-types'
import { useState } from 'react'
import { 
    XMarkIcon, 
    SunIcon, 
    SpeakerWaveIcon, 
    ArrowsPointingOutIcon,
    ArrowLeftOnRectangleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

export default function SettingsPanel({ isOpen, onClose, settings, onSettingsChange, onExit }) {
    const [localSettings, setLocalSettings] = useState(settings)

    const handleChange = (key, value) => {
        const newSettings = { ...localSettings, [key]: value }
        setLocalSettings(newSettings)
        onSettingsChange(newSettings)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]"
                    />

                    {/* Settings Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 z-[201] flex items-center justify-center p-6 pointer-events-none"
                    >
                        <div
                            className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] p-10 max-w-lg w-full shadow-[0_0_100px_rgba(0,0,0,0.5)] pointer-events-auto relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Ambient Glow */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-500/10 blur-[80px] rounded-full" />

                            {/* Header */}
                            <div className="flex items-center justify-between mb-10 relative z-10">
                                <div>
                                    <h3 className="text-white text-3xl font-black tracking-tight uppercase">System Config</h3>
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Display Parameters</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-12 h-12 bg-slate-800/50 hover:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all border border-slate-700/50"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Settings Controls */}
                            <div className="space-y-10 relative z-10">
                                {/* Brightness Control */}
                                <div className="group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                                                <SunIcon className="w-4 h-4 text-amber-500" />
                                            </div>
                                            <span className="text-slate-300 font-black text-xs uppercase tracking-widest">Luminance</span>
                                        </div>
                                        <span className="text-teal-400 font-mono text-sm font-black">{localSettings.brightness}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="20"
                                        max="100"
                                        value={localSettings.brightness}
                                        onChange={(e) => handleChange('brightness', parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-teal-500"
                                    />
                                </div>

                                {/* Volume Control */}
                                <div className="group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                                <SpeakerWaveIcon className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <span className="text-slate-300 font-black text-xs uppercase tracking-widest">Acoustics</span>
                                        </div>
                                        <span className="text-teal-400 font-mono text-sm font-black">{localSettings.volume}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={localSettings.volume}
                                        onChange={(e) => handleChange('volume', parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-teal-500"
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <button
                                        onClick={() => {
                                            if (document.documentElement.requestFullscreen) {
                                                document.documentElement.requestFullscreen();
                                            }
                                        }}
                                        className="flex items-center justify-center gap-3 p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-2xl text-slate-300 hover:text-white transition-all group"
                                    >
                                        <ArrowsPointingOutIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Fullscreen</span>
                                    </button>
                                    <button
                                        onClick={onExit}
                                        className="flex items-center justify-center gap-3 p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-red-400 hover:text-red-300 transition-all group"
                                    >
                                        <ArrowLeftOnRectangleIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Terminate</span>
                                    </button>
                                </div>
                            </div>

                            {/* Footer Info */}
                            <div className="mt-10 pt-8 border-t border-slate-800/50 flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-2">
                                    <InformationCircleIcon className="w-4 h-4 text-slate-600" />
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">v2.4.0 Stable Build</span>
                                </div>
                                <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Digital FlipBoard OS</span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

SettingsPanel.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    settings: PropTypes.object.isRequired,
    onSettingsChange: PropTypes.func.isRequired,
    onExit: PropTypes.func.isRequired
}
