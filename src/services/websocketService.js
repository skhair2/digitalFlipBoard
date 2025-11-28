import { io } from 'socket.io-client'
import { messageRateLimiter } from '../utils/rateLimit'
import mixpanel from './mixpanelService'

class WebSocketService {
    constructor() {
        this.socket = null
        this.sessionCode = null
        this.reconnectAttempts = 0
        this.maxReconnectAttempts = 5
        this.listeners = new Map()
    }

    connect(sessionCode, userId = null, token = null, role = 'display') {
        if (this.socket?.connected) {
            console.warn('Already connected')
            return
        }

        this.sessionCode = sessionCode

        // Build auth object - token is required for backend authentication
        const auth = {
            sessionCode,
            userId,
            role,
        }

        // Include token if provided (required for Supabase auth validation)
        if (token) {
            auth.token = token
        }

        // Determine WebSocket URL:
        // 1. Use env var if set (for production)
        // 2. Otherwise use hostname + backend port (3001)
        let wsUrl = import.meta.env.VITE_WEBSOCKET_URL

        if (!wsUrl) {
            // Build URL from current window location
            // Extract just the hostname/IP without port, then use backend port 3001
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
            const hostname = window.location.hostname // IP or domain, no port
            wsUrl = `${protocol}//${hostname}:3001`
        }

        console.log('[WebSocket] Connecting to:', wsUrl, 'from origin:', window.location.origin)

        this.socket = io(wsUrl, {
            auth,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000,
        })

        this.setupEventListeners()
        mixpanel.track('WebSocket Connect Attempt', { sessionCode })
    }

    setupEventListeners() {
        this.socket.on('connect', () => {
            console.log('WebSocket connected')
            this.reconnectAttempts = 0
            this.startHeartbeat()
            mixpanel.track('WebSocket Connected', { sessionCode: this.sessionCode })
        })

        this.socket.on('disconnect', (reason) => {
            console.log('WebSocket disconnected:', reason)
            this.stopHeartbeat()
            mixpanel.track('WebSocket Disconnected', { reason })
        })

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error)
            this.reconnectAttempts++
            mixpanel.track('WebSocket Error', { error: error.message })

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                this.emit('connection:failed', { error: 'Max reconnection attempts reached' })
            }
        })

        // Session paired event
        this.socket.on('session:paired', (data) => {
            console.log('Session paired:', data)
            mixpanel.track('Session Paired', data)
            this.emit('session:paired', data)
        })

        // Message received event
        this.socket.on('message:received', (data) => {
            // Simple rate limit: ignore messages if they come too fast (e.g., < 100ms)
            const now = Date.now()
            if (this.lastMessageTime && (now - this.lastMessageTime < 100)) {
                console.warn('Rate limit exceeded: Message ignored')
                return
            }
            this.lastMessageTime = now

            console.log('Message received:', data)
            mixpanel.track('Message Received', {
                sessionCode: this.sessionCode,
                animationType: data.animationType,
                colorTheme: data.colorTheme,
            })
            this.emit('message:received', data)
        })

        // Session expired event
        this.socket.on('session:expired', () => {
            console.log('Session expired')
            mixpanel.track('Session Expired', { sessionCode: this.sessionCode })
            this.emit('session:expired')
            this.disconnect()
        })
    }

    startHeartbeat() {
        this.stopHeartbeat() // Clear any existing interval
        // Send heartbeat every 2 minutes (well within the 5-minute stale timeout)
        this.heartbeatInterval = setInterval(() => {
            if (this.socket?.connected) {
                this.socket.emit('client:heartbeat', {
                    sessionCode: this.sessionCode,
                    timestamp: Date.now()
                })
            }
        }, 2 * 60 * 1000)
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval)
            this.heartbeatInterval = null
        }
    }

    // Send message to display
    sendMessage(message, options = {}) {
        if (!this.socket?.connected) {
            throw new Error('WebSocket not connected')
        }

        if (!messageRateLimiter.canMakeRequest()) {
            const timeUntilReset = Math.ceil(messageRateLimiter.getTimeUntilReset() / 1000)
            throw new Error(`Rate limit exceeded. Try again in ${timeUntilReset} seconds`)
        }

        const payload = {
            sessionCode: this.sessionCode,
            content: message,
            animationType: options.animationType || 'flip',
            colorTheme: options.colorTheme || 'monochrome',
            timestamp: Date.now(),
        }

        this.socket.emit('message:send', payload, (response) => {
            if (response.success) {
                mixpanel.track('Message Sent', payload)
            } else {
                mixpanel.track('Message Send Failed', { error: response.error })
            }
        })
    }

    // Subscribe to events
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, [])
        }
        this.listeners.get(event).push(callback)
    }

    // Unsubscribe from events
    off(event, callback) {
        if (!this.listeners.has(event)) return
        const callbacks = this.listeners.get(event)
        const index = callbacks.indexOf(callback)
        if (index > -1) {
            callbacks.splice(index, 1)
        }
    }

    // Emit events to listeners
    emit(event, data) {
        if (!this.listeners.has(event)) return
        this.listeners.get(event).forEach(callback => callback(data))
    }

    disconnect() {
        this.stopHeartbeat()
        if (this.socket) {
            this.socket.disconnect()
            this.socket = null
            this.sessionCode = null
            this.listeners.clear()
            mixpanel.track('WebSocket Disconnected Manually')
        }
    }

    isConnected() {
        return this.socket?.connected || false
    }
}

export default new WebSocketService()
