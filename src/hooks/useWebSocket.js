import { useEffect, useCallback } from 'react'
import { useSessionStore } from '../store/sessionStore'
import websocketService from '../services/websocketService'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../services/supabaseClient'

export const useWebSocket = () => {
    const { sessionCode, isConnected, setConnected, setMessage, recordActivity, setControllerSubscriptionTier } = useSessionStore()
    const { user, session } = useAuthStore()

    useEffect(() => {
        if (!sessionCode) return

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

            // Connect with token (optional but recommended for auth)
            websocketService.connect(sessionCode, user?.id, token)
        }

        initializeConnection()

        const handleConnectionStatus = ({ connected }) => {
            console.log('[WebSocket] Connection status changed to:', connected)
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
    }, [sessionCode, user, session, setConnected, setMessage, recordActivity, setControllerSubscriptionTier])

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
