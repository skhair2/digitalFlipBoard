import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DigitalFlipBoardGrid from '../components/display/DigitalFlipBoardGrid'
import SessionCode from '../components/display/SessionCode'
import BrandingWatermark from '../components/display/BrandingWatermark'
import ControlOverlay from '../components/display/ControlOverlay'
import SettingsPanel from '../components/display/SettingsPanel'
import { useSessionStore } from '../store/sessionStore'
import { useAutoHide } from '../hooks/useAutoHide'
import { useKeyboardShortcuts, toggleFullscreen } from '../hooks/useKeyboardShortcuts'
import mixpanel from '../services/mixpanelService'

export default function Display() {
    const { isConnected, setSessionCode, setBoardId, setConnected, isClockMode, setClockMode, currentMessage } = useSessionStore()
    const [searchParams] = useSearchParams()
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [timeString, setTimeString] = useState('')
    const [showInfo, setShowInfo] = useState(false)
    const [showSettings, setShowSettings] = useState(false)

    // Display settings state
    const [displaySettings, setDisplaySettings] = useState({
        brightness: 100,
        volume: 50,
        clockMode: isClockMode,
        autoHideControls: true,
    })

    // Auto-hide controls after 3 seconds of inactivity (if enabled in settings)
    const { isVisible: controlsVisible } = useAutoHide(3000, isFullscreen && displaySettings.autoHideControls)

    useEffect(() => {
        const boardId = searchParams.get('boardId')
        if (boardId) {
            setBoardId(boardId)
            setSessionCode(boardId)
            setConnected(true)
        }
        mixpanel.track('Display Page Viewed', { boardId: boardId || 'temporary' })
    }, [searchParams, setBoardId, setSessionCode, setConnected])

    // Clock Mode Logic
    useEffect(() => {
        if (isClockMode) {
            const updateTime = () => {
                const now = new Date()
                const hours = String(now.getHours()).padStart(2, '0')
                const minutes = String(now.getMinutes()).padStart(2, '0')
                setTimeString(`${hours}:${minutes}`)
            }
            updateTime()
            const interval = setInterval(updateTime, 1000)
            return () => clearInterval(interval)
        }
    }, [isClockMode])

    // Track fullscreen state
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    // Keyboard shortcuts
    const handleToggleFullscreen = async () => {
        const newFullscreenState = await toggleFullscreen()
        setIsFullscreen(newFullscreenState)
    }

    const handleExitFullscreen = async () => {
        if (document.fullscreenElement) {
            await document.exitFullscreen()
            setIsFullscreen(false)
        }
    }

    const handleShowInfo = () => {
        setShowInfo(prev => !prev)
    }

    const handleSettingsChange = (newSettings) => {
        setDisplaySettings(newSettings)

        // Sync clock mode with session store
        if (newSettings.clockMode !== isClockMode) {
            setClockMode(newSettings.clockMode)
        }

        // Apply brightness to the display
        document.documentElement.style.setProperty('--display-brightness', `${newSettings.brightness}%`)
    }

    // Apply brightness on mount and when settings change
    useEffect(() => {
        document.documentElement.style.setProperty('--display-brightness', `${displaySettings.brightness}%`)
    }, [displaySettings.brightness])

    // Sync clock mode from session store
    useEffect(() => {
        if (displaySettings.clockMode !== isClockMode) {
            setDisplaySettings(prev => ({ ...prev, clockMode: isClockMode }))
        }
    }, [isClockMode])

    useKeyboardShortcuts({
        onToggleFullscreen: handleToggleFullscreen,
        onExitFullscreen: handleExitFullscreen,
        onShowInfo: handleShowInfo,
    })

    return (
        <div
            className={`min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden relative ${isFullscreen ? 'p-0' : 'p-4'}`}
            style={{ filter: `brightness(${displaySettings.brightness}%)` }}
        >
            {/* Background glow - hide in fullscreen for cleaner look */}
            {!isFullscreen && (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black opacity-50 pointer-events-none" />
            )}

            <div className={`z-10 w-full flex flex-col items-center ${isFullscreen ? 'h-screen justify-center' : 'gap-8'}`}>
                {/* Display Grid - Auto-adjusts to screen size */}
                <DigitalFlipBoardGrid
                    overrideMessage={
                        isClockMode ? timeString :
                            (!isConnected && !searchParams.get('boardId')) ? "" : undefined
                    }
                    isFullscreen={isFullscreen}
                />

                {/* Session Code - Only show when NOT connected AND NOT in fullscreen */}
                {!isConnected && !searchParams.get('boardId') && !isFullscreen && (
                    <div className="transition-opacity duration-500 relative">
                        <SessionCode fullScreenMode={isFullscreen} />
                    </div>
                )}

                {/* Connection Success Message/Animation - Brief display then fade */}
                {isConnected && !isClockMode && !currentMessage && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="text-teal-500 font-bold text-2xl md:text-4xl animate-bounce">
                            CONNECTED
                        </div>
                    </div>
                )}
            </div>

            {/* Branding Watermark - Hidden in fullscreen as requested */}
            {/* {isFullscreen && <BrandingWatermark />} */}

            {/* Control Overlay (replaces old fullscreen button) */}
            <ControlOverlay
                isVisible={controlsVisible || !isFullscreen}
                isFullscreen={isFullscreen}
                onToggleFullscreen={handleToggleFullscreen}
                onShowInfo={handleShowInfo}
                onShowSettings={() => setShowSettings(true)}
            />

            {/* Status indicator (auto-hide in fullscreen) */}
            {(!isFullscreen || controlsVisible) && (
                <div className="absolute top-4 right-4 flex items-center gap-2 transition-opacity duration-300">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                    <span className="text-xs text-gray-500 font-mono uppercase">
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
            )}

            {/* Info Overlay (triggered by 'I' key or info button) */}
            {showInfo && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center" onClick={() => setShowInfo(false)}>
                    <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-2xl p-8 max-w-md" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-white text-xl font-bold mb-4">Display Information</h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="text-gray-400">Status:</span>
                                <span className="text-white ml-2">{isConnected ? 'Connected' : 'Waiting for connection'}</span>
                            </div>
                            {!searchParams.get('boardId') && (
                                <div>
                                    <span className="text-gray-400">Session Code:</span>
                                    <span className="text-primary-400 ml-2 font-mono font-bold">{useSessionStore.getState().sessionCode}</span>
                                </div>
                            )}
                            <div className="pt-4 border-t border-slate-700">
                                <p className="text-gray-400 mb-2">Keyboard Shortcuts:</p>
                                <ul className="space-y-1 text-gray-300">
                                    <li><kbd className="px-2 py-1 bg-slate-700 rounded text-xs">F</kbd> - Toggle Fullscreen</li>
                                    <li><kbd className="px-2 py-1 bg-slate-700 rounded text-xs">Esc</kbd> - Exit Fullscreen</li>
                                    <li><kbd className="px-2 py-1 bg-slate-700 rounded text-xs">I</kbd> - Show Info</li>
                                </ul>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowInfo(false)}
                            className="mt-6 w-full py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Settings Panel */}
            <SettingsPanel
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                settings={displaySettings}
                onSettingsChange={handleSettingsChange}
            />
        </div>
    )
}
