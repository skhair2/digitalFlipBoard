import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DigitalFlipBoardGrid from '../components/display/DigitalFlipBoardGrid'
import SessionCode from '../components/display/SessionCode'
import BrandingWatermark from '../components/display/BrandingWatermark'
import ControlOverlay from '../components/display/ControlOverlay'
import SettingsPanel from '../components/display/SettingsPanel'
import { useSessionStore } from '../store/sessionStore'
import { useWebSocket } from '../hooks/useWebSocket'
import { useAutoHide } from '../hooks/useAutoHide'
import { useKeyboardShortcuts, toggleFullscreen } from '../hooks/useKeyboardShortcuts'
import { useActivityTracking } from '../hooks/useActivityTracking'
import { useMessageBroker } from '../hooks/useMessageBroker'
import mixpanel from '../services/mixpanelService'

export default function Display() {
    const { isConnected, setSessionCode, setBoardId, setConnected, isClockMode, setClockMode, currentMessage, sessionCode, controllerSubscriptionTier } = useSessionStore()
    const [searchParams] = useSearchParams()
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [timeString, setTimeString] = useState('')
    const [showInfo, setShowInfo] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [showPairingCode, setShowPairingCode] = useState(true) // Track pairing code visibility
    const [showConnectedMessage, setShowConnectedMessage] = useState(false) // Track connected message visibility
    const [sessionWarning, setSessionWarning] = useState(null)

    // Use message broker for Redis Pub/Sub message routing
    const { currentState: brokerState, config: brokerConfig } = useMessageBroker()

    // Call useWebSocket hook to establish and maintain WebSocket connection
    useWebSocket()

    // Track user activity to prevent session timeout
    useActivityTracking(sessionCode, 'display')

    // Display settings state
    const [displaySettings, setDisplaySettings] = useState({
        brightness: 100,
        volume: 50,
        clockMode: isClockMode,
        autoHideControls: true,
    })

    // Hide pairing code when controller connects
    useEffect(() => {
        if (isConnected) {
            setShowPairingCode(false)
            // Show connected message and auto-hide after 2 seconds
            setShowConnectedMessage(true)
            const timer = setTimeout(() => {
                setShowConnectedMessage(false)
            }, 2000)
            return () => clearTimeout(timer)
        } else {
            setShowPairingCode(true)
            setShowConnectedMessage(false)
        }
    }, [isConnected])

    // Ensure display always has a session code by default unless one is already set or provided via boardId.
    // NOTE: Changed to NOT auto-generate. Display should wait for user to manually generate pairing code.
    // This prevents auto-connection when both display and controller are on the same browser.
    useEffect(() => {
        if (!sessionCode && !searchParams.get('boardId')) {
            // Do NOT auto-generate - let user manually create the code
            // This prevents unwanted auto-connection between display and controller tabs
            console.log('[Display] Waiting for user to generate pairing code')
        }
    }, [sessionCode, searchParams])

    // Check every minute if display should disconnect due to 24h inactivity + free tier controller
    useEffect(() => {
        if (!isConnected || controllerSubscriptionTier === 'pro' || controllerSubscriptionTier === 'premium') {
            return // Only disconnect if: connected AND controller is free tier
        }

        const checkInactivityPolicy = () => {
            try {
                const lastSessionTime = localStorage.getItem('lastSessionTime')
                if (lastSessionTime) {
                    const timeSinceLastSession = Date.now() - parseInt(lastSessionTime)
                    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

                    if (timeSinceLastSession > TWENTY_FOUR_HOURS) {
                        console.log('[Display] Disconnecting free tier controller - no activity for 24+ hours')
                        // Force disconnect
                        setConnected(false)
                        setSessionCode(null)
                        setShowPairingCode(true)
                        // Show notification
                        window.dispatchEvent(new CustomEvent('session:inactivity:policy', {
                            detail: {
                                message: 'Display session ended. Free tier requires activity within 24 hours. Please re-pair to continue.',
                                reason: 'free_tier_24h_policy'
                            }
                        }))
                    }
                }
            } catch (error) {
                console.warn('[Display] Error checking inactivity policy:', error)
            }
        }

        // Check immediately on mount
        checkInactivityPolicy()

        // Then check every minute
        const interval = setInterval(checkInactivityPolicy, 60 * 1000)
        return () => clearInterval(interval)
    }, [isConnected, controllerSubscriptionTier, setConnected, setSessionCode])

    // Auto-hide controls after 3 seconds of inactivity (if enabled in settings)
    const { isVisible: controlsVisible } = useAutoHide(3000, isFullscreen && displaySettings.autoHideControls)

    // Track boardId from URL for reference, but don't auto-connect
    // Connection only happens when Controller sends pairing code via WebSocket
    useEffect(() => {
        const boardId = searchParams.get('boardId')
        if (boardId) {
            setBoardId(boardId)
            // Note: NOT calling setSessionCode() or setConnected(true) here
            // Display must wait for user to manually enter pairing code or Controller to send it
        }
        mixpanel.track('Display Page Viewed', { boardId: boardId || 'temporary' })
    }, [searchParams, setBoardId])

    // Sync message broker state with display state
    useEffect(() => {
        if (brokerState?.state?.currentMessage) {
            console.log('[Display] Received message from broker:', brokerState.state.currentMessage)
            // Message will be displayed via currentMessage in render
        }
        if (brokerConfig) {
            console.log('[Display] Received config from broker:', brokerConfig)
            // Apply config settings to display
            if (brokerConfig.brightness !== undefined) {
                setDisplaySettings(prev => ({ ...prev, brightness: brokerConfig.brightness }))
            }
            if (brokerConfig.clockMode !== undefined) {
                setClockMode(brokerConfig.clockMode)
            }
            if (brokerConfig.animation) {
                setDisplaySettings(prev => ({ ...prev, animation: brokerConfig.animation }))
            }
            if (brokerConfig.color) {
                setDisplaySettings(prev => ({ ...prev, color: brokerConfig.color }))
            }
        }
    }, [brokerState, brokerConfig, setClockMode])

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

    // Listen for session inactivity warnings and terminations
    useEffect(() => {
        const handleInactivityWarning = (event) => {
            const { message, minutesRemaining } = event.detail
            setSessionWarning({
                type: 'warning',
                message,
                minutesRemaining
            })
            // Auto-hide warning after 5 seconds
            setTimeout(() => setSessionWarning(null), 5000)
        }

        const handleSessionTerminated = (event) => {
            const { reason, message } = event.detail
            setSessionWarning({
                type: 'error',
                message: `Session ended: ${message}`,
                reason
            })
            // Show for longer as session is ending
            setTimeout(() => setSessionWarning(null), 10000)
        }

        const handleForceDisconnect = (event) => {
            const { reason, message } = event.detail
            setSessionWarning({
                type: 'error',
                message: `Disconnected: ${message}`,
                reason
            })
        }

        window.addEventListener('session:inactivity:warning', handleInactivityWarning)
        window.addEventListener('session:terminated', handleSessionTerminated)
        window.addEventListener('session:force-disconnect', handleForceDisconnect)

        return () => {
            window.removeEventListener('session:inactivity:warning', handleInactivityWarning)
            window.removeEventListener('session:terminated', handleSessionTerminated)
            window.removeEventListener('session:force-disconnect', handleForceDisconnect)
        }
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
    }, [isClockMode, displaySettings.clockMode])

    useKeyboardShortcuts({
        onToggleFullscreen: handleToggleFullscreen,
        onExitFullscreen: handleExitFullscreen,
        onShowInfo: handleShowInfo,
    })

    return (
        <div
            className={`bg-black flex flex-col items-center justify-center overflow-hidden relative ${isFullscreen ? 'fixed inset-0 w-screen h-screen p-0' : 'min-h-screen p-4'
                }`}
            style={{ filter: `brightness(${displaySettings.brightness}%)` }}
        >
            {/* Background glow - hide in fullscreen for cleaner look */}
            {!isFullscreen && (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black opacity-50 pointer-events-none" />
            )}

            {/* Show Pairing Setup Screen if no session code is set */}
            {!sessionCode ? (
                <div className="z-10 flex items-center justify-center w-full h-screen">
                    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
                        <h1 className="text-3xl font-bold text-white mb-2">Digital Flip Board</h1>
                        <p className="text-gray-400 mb-8">Display Mode - Waiting for Setup</p>
                        
                        <button
                            onClick={() => {
                                // Generate a session code for display
                                const tempCode = Math.random().toString(36).substring(2, 8).toUpperCase()
                                setSessionCode(tempCode)
                                console.log('[Display] Generated session code:', tempCode, '- waiting for controller')
                            }}
                            className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors mb-4"
                        >
                            Generate Pairing Code
                        </button>
                        
                        <p className="text-sm text-gray-400 mb-4">
                            Click the button to generate a 6-character code. Share this code with the controller user to establish a connection.
                        </p>
                        
                        <div className="text-xs text-gray-500 bg-slate-900/50 rounded p-3 border border-slate-700">
                            <p className="font-mono">
                                💡 The controller will enter the code on their screen to pair with this display.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                // Display content when sessionCode is set
                <div className={`z-10 w-full h-full flex flex-col items-center ${isFullscreen ? 'justify-center' : 'gap-8'}`}>
                {/* Display Grid - Always visible */}

                {/* Flip Display Style: Show info text and session code in grid if not connected */}
                {!isConnected && showPairingCode && sessionCode ? (
                    <div className="flex flex-col items-center justify-center w-full">
                        {/* Status indicator top right */}
                        <div className="fixed top-4 right-4 flex items-center gap-2 transition-opacity duration-300 z-50">
                            <div className={`w-2 h-2 rounded-full ${window?.digitalFlipBoardSocket?.reconnecting
                                ? 'bg-amber-500 animate-pulse'
                                : isConnected
                                    ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                                    : 'bg-amber-500 animate-pulse'
                            }`} />
                            <span className="text-xs text-gray-500 font-mono uppercase">
                                {window?.digitalFlipBoardSocket?.reconnecting ? 'Reconnecting...' : isConnected ? 'Connected' : 'Not Connected'}
                            </span>
                        </div>
                        {/* All info and code in one flip display grid */}
                        <div className="w-full flex justify-center">
                            <DigitalFlipBoardGrid
                                overrideMessage={`DISPLAY CODE  ${sessionCode}`}
                                isFullscreen={isFullscreen}
                            />
                        </div>
                    </div>
                ) : isConnected && !isClockMode && !currentMessage && showConnectedMessage ? (
                    <div className="flex flex-col items-center justify-center w-full">
                        <div className="w-full flex justify-center mb-2">
                            <DigitalFlipBoardGrid
                                overrideMessage={"✓ CONNECTED"}
                                isFullscreen={isFullscreen}
                            />
                        </div>
                        <div className="w-full flex justify-center">
                            <DigitalFlipBoardGrid
                                overrideMessage={"Controller is now pairing with this display"}
                                isFullscreen={isFullscreen}
                            />
                        </div>
                    </div>
                ) : (
                    <DigitalFlipBoardGrid
                        overrideMessage={isClockMode ? timeString : undefined}
                        isFullscreen={isFullscreen}
                    />
                )}
            </div>
            )}

            {/* Branding Watermark - Hidden in fullscreen as requested */}
            {/* {isFullscreen && <BrandingWatermark />} */}

            {/* Session Inactivity Warning/Error */}
            {sessionWarning && (
                <div className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md rounded-lg shadow-lg z-40 animate-fade-in p-4 flex gap-3 ${sessionWarning.type === 'warning'
                        ? 'bg-amber-500/90 border border-amber-400 text-amber-900'
                        : 'bg-red-500/90 border border-red-400 text-red-900'
                    }`}>
                    <div className="flex-shrink-0 mt-1">
                        {sessionWarning.type === 'warning' ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-sm">{sessionWarning.message}</p>
                        {sessionWarning.minutesRemaining !== undefined && (
                            <p className="text-xs opacity-75 mt-1">Keep using the display to stay connected.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Control Overlay (replaces old fullscreen button) */}
            <ControlOverlay
                isVisible={controlsVisible || !isFullscreen}
                isFullscreen={isFullscreen}
                onToggleFullscreen={handleToggleFullscreen}
                onShowInfo={handleShowInfo}
                onShowSettings={() => setShowSettings(true)}
            />

            {/* Status indicator removed: now shown in flip display style above */}

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
