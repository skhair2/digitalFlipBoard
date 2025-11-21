import { useEffect, useCallback } from 'react'
import { useSessionStore } from '../store/sessionStore'
import websocketService from '../services/websocketService'
import { useAuthStore } from '../store/authStore'

export const useWebSocket = () => {
    const { sessionCode, setConnected, setMessage } = useSessionStore()
    const { user } = useAuthStore()

    useEffect(() => {
        if (!sessionCode) return

        websocketService.connect(sessionCode, user?.id)

        const handleConnectionStatus = ({ connected }) => {
            setConnected(connected)
        }

        const handleMessageReceived = (data) => {
            setMessage(data.content, data.animationType, data.colorTheme)
        }

        websocketService.on('connection:status', handleConnectionStatus)
        websocketService.on('message:received', handleMessageReceived)

        return () => {
            websocketService.off('connection:status', handleConnectionStatus)
            websocketService.off('message:received', handleMessageReceived)
            websocketService.disconnect()
        }
    }, [sessionCode, user, setConnected, setMessage])

    const sendMessage = useCallback((message, options) => {
        try {
            websocketService.sendMessage(message, options)
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }, [])

    return {
        sendMessage,
        isConnected: websocketService.isConnected(),
    }
}
