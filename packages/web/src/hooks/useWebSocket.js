import { useEffect, useCallback, useRef } from 'react'
import { useSessionStore } from '../store/sessionStore'
import websocketService from '../services/websocketService'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../services/supabaseClient'
import { getSessionStatus } from '../services/sessionService'

export const useWebSocket = () => {
    const { sessionCode, isConnected, setConnected, setMessage, recordActivity, setControllerSubscriptionTier, controllerHasPaired, isCodeConfirmed } = useSessionStore()
    const { user, session } = useAuthStore()
    const pollingIntervalRef = useRef(null)

    // Determine role from context (window.location.pathname)
    let role = 'display'
    if (window.location.pathname.includes('control')) {
        role = 'controller'
    }

    // Polling for Display role when not connected
    useEffect(() => {
        if (role !== 'display' || isConnected || !sessionCode) {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
                pollingIntervalRef.current = null
            }
            return
        }

        console.log('[WebSocket] Display: Starting status polling for session:', sessionCode)
        
        const pollStatus = async () => {
            try {
                const status = await getSessionStatus(sessionCode)
                
                // Debug log to see what the server is actually returning
                if (status && Object.keys(status).length > 0) {
                    console.log('[WebSocket] Polling status response:', {
                        code: sessionCode,
                        status: status.status,
                        hasController: !!status.controllerId,
                        paired: status.paired
                    })
                }

                // Check for various ways the paired state might be represented
                const isPaired = status.status === 'paired' || 
                                status.paired === true || 
                                !!status.controllerId ||
                                !!status.controllerConnected;

                if (isPaired) {
                    console.log('[WebSocket] Display: Session paired detected! status:', status.status)
                    setConnected(true)
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current)
                        pollingIntervalRef.current = null
                    }
                }
            } catch (error) {
                // Silently handle errors during polling (e.g. session not found yet)
                if (error.message !== 'Session not found') {
                    console.warn('[WebSocket] Polling error:', error)
                }
            }
        }

        // Poll every 3 seconds
        pollingIntervalRef.current = setInterval(pollStatus, 3000)
        
        // Initial poll
        pollStatus()

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
                pollingIntervalRef.current = null
            }
        }
    }, [role, isConnected, sessionCode, setConnected])

    useEffect(() => {
        if (!sessionCode) {
            console.log('[WebSocket] No sessionCode, skipping connection')
            return
        }

        console.log('[WebSocket] useEffect triggered:', { role, sessionCode, controllerHasPaired, isConnected })

        // Lazy Connection Logic:
        // Display only connects if isConnected is true (set by polling or manual action)
        if (role === 'display' && !isConnected) {
            console.log('[WebSocket] Display: Waiting for pairing (Lazy Connection mode)')
            return
        }

        // Controller waits until code is validated/paired
        if (role === 'controller' && !controllerHasPaired) {
            console.log('[WebSocket] Controller has not completed pairing yet. Skipping connection attempt.', { controllerHasPaired })
            return
        }
        
        if (role === 'controller' && controllerHasPaired) {
            console.log('[WebSocket] Controller ready to connect:', { sessionCode, controllerHasPaired })
        }

        // Get the latest session token for authentication
        const initializeConnection = async () => {
            let token = null

            // Try to get current session from Supabase
            if (session?.access_token) {
                token = session.access_token
            } else if (user?.id) {
                // If no session in store, try to get from Supabase directly
                try {
                    const { data: { session: currentSession } } = await supabase.auth.getSession()
                    token = currentSession?.access_token || null
                } catch (error) {
                    console.warn('Failed to get session token:', error)
                }
            }

            // Connect with token and role
            websocketService.connect(sessionCode, user?.id, token, role)
        }

        initializeConnection()

        const handleConnectionStatus = ({ connected }) => {
            // IMPORTANT: Display should NOT auto-connect when Controller joins
            // Display maintains its own connection state and should NOT listen to connection:status
            // This event is for Controller role only
            if (role === 'display') {
                console.log('[WebSocket] Display ignoring connection:status event (Controller paired, but Display stays in control of own state)')
                return
            }
            
            // Only Controller should react to connection:status
            console.log('[WebSocket] Connection status event received (Controller role):', connected)
            setConnected(connected)
            if (connected) {
                recordActivity() // Record activity on reconnect
            }
        }

        const handleMessageReceived = (data) => {
            console.log('[WebSocket] Message received:', data)
            recordActivity() // Record activity when message received
            setMessage(data.content, data.animationType, data.colorTheme)
        }

        // Handle controller subscription tier information
        const handleControllerTier = (data) => {
            console.log('[WebSocket] Controller tier received:', data.tier)
            setControllerSubscriptionTier(data.tier || 'free')
        }

        // Handle session inactivity warning
        const handleInactivityWarning = (data) => {
            console.warn('[WebSocket] Session inactivity warning:', data)
            // Show toast or modal notification to user
            const message = data.message || 'Session is inactive. Please interact with the display to keep it alive.'
            window.dispatchEvent(new CustomEvent('session:inactivity:warning', { 
                detail: { 
                  message, 
                  minutesRemaining: data.minutesRemaining 
                } 
            }))
        }

        // Handle session termination
        const handleSessionTerminated = (data) => {
            console.error('[WebSocket] Session terminated:', data)
            setConnected(false)
            // Show alert to user
            window.dispatchEvent(new CustomEvent('session:terminated', { 
                detail: { 
                  reason: data.reason,
                  message: data.message 
                } 
            }))
            // Disconnect from session
            websocketService.disconnect()
        }

        // Handle force disconnect
        const handleForceDisconnect = (data) => {
            console.error('[WebSocket] Force disconnected:', data)
            setConnected(false)
            window.dispatchEvent(new CustomEvent('session:force-disconnect', { 
                detail: { 
                  reason: data.reason,
                  message: data.message 
                } 
            }))
            websocketService.disconnect()
        }

        websocketService.on('connection:status', handleConnectionStatus)
        websocketService.on('message:received', handleMessageReceived)
        websocketService.on('controller:tier', handleControllerTier)
        websocketService.on('session:inactivity:warning', handleInactivityWarning)
        websocketService.on('session:terminated', handleSessionTerminated)
        websocketService.on('session:force-disconnect', handleForceDisconnect)

        return () => {
            websocketService.off('connection:status', handleConnectionStatus)
            websocketService.off('message:received', handleMessageReceived)
            websocketService.off('controller:tier', handleControllerTier)
            websocketService.off('session:inactivity:warning', handleInactivityWarning)
            websocketService.off('session:terminated', handleSessionTerminated)
            websocketService.off('session:force-disconnect', handleForceDisconnect)
            websocketService.disconnect()
        }
    }, [sessionCode, isCodeConfirmed, user, session, setConnected, setMessage, recordActivity, setControllerSubscriptionTier, controllerHasPaired, isConnected])

    const sendMessage = useCallback((message, options) => {
        try {
            if (!isConnected) {
                throw new Error('WebSocket not connected. Connection status: ' + isConnected)
            }
            recordActivity() // Record activity when sending message
            websocketService.sendMessage(message, options)
            return { success: true }
        } catch (error) {
            console.error('[WebSocket] Error sending message:', error.message)
            return { success: false, error: error.message }
        }
    }, [isConnected, recordActivity])

    return {
        sendMessage,
        isConnected, // Return from store instead of checking websocketService directly
    }
}
