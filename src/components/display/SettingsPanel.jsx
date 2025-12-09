import { motion, AnimatePresence } from 'framer-motion'
import PropTypes from 'prop-types'
import { useState } from 'react'

const MotionDiv = motion.div

export default function SettingsPanel({ isOpen, onClose, settings, onSettingsChange }) {
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
                    <MotionDiv
                        key="settings-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
                    />

                    {/* Settings Panel */}
                    <MotionDiv
                        key="settings-panel"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[201] flex items-center justify-center p-4"
                        onClick={onClose}
                    >
                        <div
                            className="bg-slate-800/95 backdrop-blur-md border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-white text-2xl font-bold">Display Settings</h3>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-white transition-colors p-2"
                                    aria-label="Close settings"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Settings Controls */}
                            <div className="space-y-6">
                                {/* Brightness Control */}
                                <div>
                                    <label className="flex items-center justify-between mb-3">
                                        <span className="text-white font-medium">Brightness</span>
                                        <span className="text-primary-400 font-mono text-sm">{localSettings.brightness}%</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="20"
                                        max="100"
                                        value={localSettings.brightness}
                                        onChange={(e) => handleChange('brightness', parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                        style={{
                                            background: `linear-gradient(to right, #21808d 0%, #21808d ${localSettings.brightness}%, #334155 ${localSettings.brightness}%, #334155 100%)`
                                        }}
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>Dim</span>
                                        <span>Bright</span>
                                    </div>
                                </div>

                                {/* Volume Control */}
                                <div>
                                    <label className="flex items-center justify-between mb-3">
                                        <span className="text-white font-medium">Volume</span>
                                        <span className="text-primary-400 font-mono text-sm">{localSettings.volume}%</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={localSettings.volume}
                                        onChange={(e) => handleChange('volume', parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                        style={{
                                            background: `linear-gradient(to right, #21808d 0%, #21808d ${localSettings.volume}%, #334155 ${localSettings.volume}%, #334155 100%)`
                                        }}
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>Mute</span>
                                        <span>Max</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">For future audio notifications</p>
                                </div>

                                {/* Clock Mode Toggle */}
                                <div className="flex items-center justify-between py-3 border-t border-slate-700">
                                    <div>
                                        <span className="text-white font-medium block">Clock Mode</span>
                                        <span className="text-xs text-gray-500">Display current time when idle</span>
                                    </div>
                                    <button
                                        onClick={() => handleChange('clockMode', !localSettings.clockMode)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localSettings.clockMode ? 'bg-primary-500' : 'bg-slate-700'
                                            }`}
                                        aria-label="Toggle clock mode"
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSettings.clockMode ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                {/* Auto-Hide Controls Toggle */}
                                <div className="flex items-center justify-between py-3 border-t border-slate-700">
                                    <div>
                                        <span className="text-white font-medium block">Auto-Hide Controls</span>
                                        <span className="text-xs text-gray-500">Hide controls after 3 seconds</span>
                                    </div>
                                    <button
                                        onClick={() => handleChange('autoHideControls', !localSettings.autoHideControls)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localSettings.autoHideControls ? 'bg-primary-500' : 'bg-slate-700'
                                            }`}
                                        aria-label="Toggle auto-hide controls"
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSettings.autoHideControls ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-8 flex gap-3">
                                <button
                                    onClick={() => {
                                        const defaults = {
                                            brightness: 100,
                                            volume: 50,
                                            clockMode: false,
                                            autoHideControls: true,
                                        }
                                        setLocalSettings(defaults)
                                        onSettingsChange(defaults)
                                    }}
                                    className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                >
                                    Reset to Defaults
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </MotionDiv>
                </>
            )}
        </AnimatePresence>
    )
}

SettingsPanel.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    settings: PropTypes.shape({
        brightness: PropTypes.number,
        volume: PropTypes.number,
        clockMode: PropTypes.bool,
        autoHideControls: PropTypes.bool,
    }).isRequired,
    onSettingsChange: PropTypes.func.isRequired,
}
