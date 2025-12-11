import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../../store/sessionStore'
import { useAuthStore } from '../../store/authStore'
import { useUsageStore } from '../../store/usageStore'
import { Button, Input, Card } from '../ui/Components'
import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import mixpanelService from '../../services/mixpanelService'

const CONNECTION_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

export default function SessionPairing({ suggestedCode }) {
    const [code, setCode] = useState('')
    const [error, setError] = useState('')
    const [showReconnect, setShowReconnect] = useState(false)
    const [remainingTime, setRemainingTime] = useState(null)
    const [isWarning, setIsWarning] = useState(false) // Amber warning at <2 min
    const [showCodeForm, setShowCodeForm] = useState(false) // Track if user wants to enter new code
    const [showQuickReconnect, setShowQuickReconnect] = useState(false) // Show reconnect option within 24h
    const navigate = useNavigate()
    
    const { 
        setSessionCode, 
        lastSessionCode, 
        isConnected, 
        connectionStartTime,
        lastActivityTime,
        isConnectionExpired,
        disconnectReason,
        recordActivity,
        setConnectionExpired,
        sessionCode,
    } = useSessionStore()
    const { user } = useAuthStore()
    const { freeSessionUsed, incrementSession } = useUsageStore()

    useEffect(() => {
        if (suggestedCode && !code) {
            setCode(suggestedCode.toUpperCase())
        }
    }, [suggestedCode, code])

    // Initialize: Check if last session was within 24 hours
    useEffect(() => {
        if (lastSessionCode && !showCodeForm) {
            const lastSessionTime = localStorage.getItem('lastSessionTime')
            if (lastSessionTime) {
                const timeSinceLastSession = Date.now() - parseInt(lastSessionTime)
                const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000
                
                if (timeSinceLastSession < TWENTY_FOUR_HOURS) {
                    setShowQuickReconnect(true)
                } else {
                    // Last session was more than 24 hours ago - show new form
                    setShowCodeForm(true)
                    setShowQuickReconnect(false)
                }
            } else {
                setShowQuickReconnect(true)
            }
            setShowReconnect(false)
        }
    }, [lastSessionCode, showCodeForm])

    // Monitor dual timeout: Hard 15-min limit + 5-min inactivity
    useEffect(() => {
        if (!isConnected || !connectionStartTime) return

        const checkTimeout = () => {
            const now = Date.now()
            const totalElapsed = now - connectionStartTime
            const inactiveElapsed = now - (lastActivityTime || connectionStartTime)
            
            // Hard 15-minute timeout
            const remaining = CONNECTION_TIMEOUT_MS - totalElapsed
            
            // 5-minute inactivity timeout
            const inactivityExpired = inactiveElapsed >= INACTIVITY_TIMEOUT_MS

            if (inactivityExpired) {
                // Inactivity timeout - disconnect silently
                setConnectionExpired(true, 'inactivity')
                setShowReconnect(true)
                setRemainingTime(null)
                mixpanelService.track('connection_expired', { 
                    reason: 'inactivity',
                    duration_seconds: Math.round(totalElapsed / 1000)
                })
            } else if (remaining <= 0) {
                // Hard timeout - expired
                setConnectionExpired(true, 'timeout')
                setShowReconnect(true)
                setRemainingTime(null)
                mixpanelService.track('connection_expired', { 
                    reason: 'timeout',
                    duration_seconds: Math.round(totalElapsed / 1000)
                })
            } else {
                const secondsRemaining = Math.ceil(remaining / 1000)
                setRemainingTime(secondsRemaining)
                
                // Show amber warning at <2 minutes
                if (secondsRemaining <= 120 && !isWarning) {
                    setIsWarning(true)
                    mixpanelService.track('connection_expiring_soon', { 
                        remaining_seconds: secondsRemaining
                    })
                }
            }
        }

        checkTimeout()
        const interval = setInterval(checkTimeout, 1000)
        
        return () => clearInterval(interval)
    }, [isConnected, connectionStartTime, lastActivityTime, isWarning, setConnectionExpired])

    // Handle NEW session (uses free quota)
    const handlePair = async (e) => {
        e.preventDefault()
        const trimmedCode = code.trim().toUpperCase()

        // Controller must never generate its own code
        // Only use code entered by user
        if (!trimmedCode || trimmedCode === 'TEMPORARY' || trimmedCode === 'XXXXXX') {
            setError('Please enter the pairing code shown on the display')
            return
        }

        if (trimmedCode.length !== 6) {
            setError('Code must be 6 characters')
            return
        }

        // Validate that the Display has created this session code (exists on backend)
        try {
            const response = await fetch(`/api/session/exists/${trimmedCode}`)
            const result = await response.json()
            if (!result.exists) {
                setError('Display code not found. Please ask the display to generate a code.')
                return
            }
        } catch (err) {
            setError('Unable to verify display code. Please try again.')
            return
        }

        // Check limits for non-authenticated users
        if (!user && freeSessionUsed) {
            setError('Free session limit reached. Please sign in to continue.')
            return
        }

        // This is a NEW session - increment quota
        if (!user) {
            incrementSession()
        }

        setSessionCode(trimmedCode, { isReconnecting: false, markControllerPaired: true })
        // Mark controller as active on this browser to prevent auto-connect on display
        sessionStorage.setItem(`controller_active_${trimmedCode}`, 'true')
        localStorage.setItem('lastSessionTime', Date.now().toString()) // Save current time for 24h tracking
        setShowReconnect(false)
        setShowQuickReconnect(false)
        setError('')
        setIsWarning(false)

        mixpanelService.track('connection_started', { 
            code: trimmedCode.substring(0, 2) + '****',
            is_authenticated: !!user,
            session_type: 'new_session',
            has_prior_session: !!lastSessionCode
        })
    }

    // Handle RECONNECT to last session (NO quota used, tagged as reconnect)
    const handleContinueSession = () => {
        if (!lastSessionCode) return
        
        setSessionCode(lastSessionCode, { isReconnecting: true, markControllerPaired: true })
        // Mark controller as active on this browser to prevent auto-connect on display
        sessionStorage.setItem(`controller_active_${lastSessionCode}`, 'true')
        localStorage.setItem('lastSessionTime', Date.now().toString()) // Save current time
        setShowReconnect(false)
        setShowQuickReconnect(false)
        setError('')
        setIsWarning(false)
        recordActivity() // Reset activity timer

        mixpanelService.track('connection_continued', { 
            code: lastSessionCode.substring(0, 2) + '****',
            is_authenticated: !!user,
            session_type: 'reconnect',
            user_action: 'quick_reconnect'
        })
    }

    // Handle user choosing to enter NEW code (clear reconnect state)
    const handleEnterNewCode = () => {
        setCode('')
        setShowCodeForm(true)
        setError('')
        setIsWarning(false)
    }

    // Success Animation State - Connected & Active
    if (isConnected && !isConnectionExpired) {
        const minutes = Math.floor((remainingTime || 0) / 60)
        const seconds = (remainingTime || 0) % 60
        const activeCode = sessionCode || lastSessionCode || code

        // Show amber warning when <2 minutes remaining
        const timerBgColor = isWarning ? 'bg-amber-500/10 border-amber-500/30' : 'bg-teal-500/10 border-teal-500/30'
        const timerTextColor = isWarning ? 'text-amber-300' : 'text-teal-300'
        const timerIconColor = isWarning ? 'text-amber-400' : 'text-teal-400'

        return (
            <Card className={`max-w-md mx-auto w-full ${isWarning ? 'bg-amber-900/20 border-amber-500/50' : 'bg-teal-900/20 border-teal-500/50'}`}>
                <div className="text-center py-8">
                    {/* Animated Success Icon */}
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${
                        isWarning 
                            ? 'bg-amber-500 animate-pulse' 
                            : 'bg-teal-500 animate-bounce'
                    }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-2">
                        {isWarning ? 'Connection Expiring Soon' : 'Connected!'}
                    </h2>
                    <p className={`mb-4 ${isWarning ? 'text-amber-200' : 'text-teal-200'}`}>
                        {isWarning 
                            ? 'Your session will end shortly. Reconnect to continue.' 
                            : 'Your device is paired successfully.'}
                    </p>

                    {/* Connected Code Display */}
                    <div className={`mb-6 border rounded-lg px-4 py-3 ${timerBgColor}`}>
                        <p className="text-xs text-gray-400 mb-1">Connected to</p>
                        <p className="text-2xl font-mono font-bold text-white tracking-widest">{activeCode}</p>
                    </div>
                    
                    {/* Connection Timer with Warning */}
                    <div className={`flex items-center justify-center gap-2 mb-8 rounded-lg px-3 py-2 ${timerBgColor}`}>
                        {isWarning && <ExclamationTriangleIcon className="w-4 h-4 text-amber-400" />}
                        <ClockIcon className={`w-4 h-4 ${timerIconColor}`} />
                        <span className={`text-sm font-mono font-bold ${timerTextColor}`}>
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </span>
                    </div>

                    <Button
                        onClick={() => navigate('/control/dashboard')}
                        className={`w-full font-bold ${
                            isWarning
                                ? 'bg-amber-500 hover:bg-amber-400 text-white'
                                : 'bg-teal-500 hover:bg-teal-400 text-white'
                        }`}
                    >
                        Go to Dashboard
                    </Button>
                </div>
            </Card>
        )
    }

    // Connection Expired - Show Reconnect Options
    if (isConnectionExpired && showReconnect) {
        const expiredMessage = disconnectReason === 'inactivity' 
            ? 'No activity for 5 minutes. Your session ended.'
            : 'Your 15-minute session has timed out.'

        return (
            <Card className="max-w-md mx-auto w-full bg-red-900/20 border-red-500/50">
                <div className="text-center py-8">
                    <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Connection Expired</h2>
                    <p className="text-red-200 mb-8">{expiredMessage}</p>

                    <div className="space-y-3">
                        {lastSessionCode && (
                            <Button
                                onClick={handleContinueSession}
                                className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold"
                            >
                                🔄 Reconnect to {lastSessionCode}
                            </Button>
                        )}
                        <Button
                            onClick={handleEnterNewCode}
                            variant="outline"
                            className="w-full"
                        >
                            ➕ Enter New Display Code
                        </Button>
                    </div>

                    {lastSessionCode && (
                        <p className="text-xs text-gray-500 text-center mt-4">
                            Reconnecting won't use another free session
                        </p>
                    )}
                </div>
            </Card>
        )
    }

    return (
        <Card className="max-w-md mx-auto w-full">
            {/* SCENARIO 1: First Time / Cold Start (no prior session) */}
            {!lastSessionCode && !showCodeForm && (
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-teal-500/50">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-teal-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7.5V3m0 4.5H3m0 13.5h12m-12 0V8.25m0 13.5H3" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Connect Your Display</h2>
                    <p className="text-gray-400 text-center mb-8">Enter the 6-character code shown on your display screen</p>

                    <form onSubmit={handlePair} className="space-y-4">
                        <Input
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value.toUpperCase())
                                setError('')
                            }}
                            placeholder="A1B2C3"
                            maxLength={6}
                            className="text-center text-3xl tracking-[0.5em] font-mono uppercase"
                            autoFocus
                        />

                        {error && (
                            <div className="text-center">
                                <p className="text-red-400 text-sm">{error}</p>
                                {!user && freeSessionUsed && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate('/login')}
                                        className="mt-2"
                                    >
                                        Sign In for Unlimited Access
                                    </Button>
                                )}
                            </div>
                        )}

                        <Button type="submit" className="w-full" size="lg" disabled={code.length !== 6}>
                            Connect Device
                        </Button>

                        {!user && !freeSessionUsed && (
                            <p className="text-xs text-gray-500 text-center">
                                ✓ 1 free session available without sign in
                            </p>
                        )}
                    </form>

                    <div className="text-xs text-gray-500 text-center mt-6 space-y-1 border-t border-gray-700 pt-4">
                        <div className="flex items-center justify-center gap-2 text-gray-400">
                            <ClockIcon className="w-3 h-3" />
                            <span>15 min session • auto-disconnect at 5 min idle</span>
                        </div>
                        <p className="text-gray-600">💡 Code will be remembered for quick reconnect</p>
                    </div>
                </div>
            )}

            {/* SCENARIO 2: Returning User within 24h (has lastSessionCode in localStorage) */}
            {lastSessionCode && !showCodeForm && showQuickReconnect && (
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-teal-500/50">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-teal-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.693 7.38A2 2 0 0115.385 20H7m0 0a2 2 0 100-4m0 4v4m0 0H3m0 0a2 2 0 100-4m0 4v4" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">Welcome back! 👋</h2>
                    <p className="text-gray-400 text-center mb-6">Your last display code is saved</p>

                    {/* Show last code prominently */}
                    <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg px-4 py-4 mb-6">
                        <p className="text-xs text-gray-400 mb-2">Last used display</p>
                        <p className="text-4xl font-mono font-bold text-teal-300 tracking-widest">{lastSessionCode}</p>
                    </div>

                    <div className="space-y-2 mb-6">
                        <Button 
                            onClick={handleContinueSession}
                            className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold py-3"
                        >
                            🔄 Continue with {lastSessionCode}
                        </Button>
                        <Button 
                            onClick={handleEnterNewCode}
                            variant="outline"
                            className="w-full"
                        >
                            ➕ Enter Different Display Code
                        </Button>
                    </div>

                    <p className="text-xs text-gray-500 text-center border-t border-gray-700 pt-4">
                        ✓ Reconnecting doesn't use another free session
                    </p>
                </div>
            )}

            {/* SCENARIO 3: User chose "Enter New Code" - show form */}
            {showCodeForm && (
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/50">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Connect New Display</h2>
                    <p className="text-gray-400 text-center mb-8">Enter a different 6-character code</p>

                    <form onSubmit={handlePair} className="space-y-4">
                        <Input
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value.toUpperCase())
                                setError('')
                            }}
                            placeholder="A1B2C3"
                            maxLength={6}
                            className="text-center text-3xl tracking-[0.5em] font-mono uppercase"
                            autoFocus
                        />

                        {error && (
                            <div className="text-center">
                                <p className="text-red-400 text-sm">{error}</p>
                                {!user && freeSessionUsed && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate('/login')}
                                        className="mt-2"
                                    >
                                        Sign In for Unlimited Access
                                    </Button>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button 
                                type="submit" 
                                className="flex-1 bg-blue-500 hover:bg-blue-400" 
                                disabled={code.length !== 6}
                            >
                                Connect New
                            </Button>
                            <Button 
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    setShowCodeForm(false)
                                    setCode('')
                                    setError('')
                                }}
                            >
                                Back
                            </Button>
                        </div>

                        {!user && !freeSessionUsed && (
                            <p className="text-xs text-gray-500 text-center">
                                ✓ 1 free session available
                            </p>
                        )}
                    </form>

                    <p className="text-xs text-gray-500 text-center border-t border-gray-700 pt-4 mt-4">
                        This will start a new session (uses 1 free connection)
                    </p>
                </div>
            )}
        </Card>
    )
}

SessionPairing.propTypes = {
    suggestedCode: PropTypes.string,
}
