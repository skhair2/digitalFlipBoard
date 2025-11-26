import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSessionStore = create(
    persist(
        (set) => ({
            sessionCode: null,
            boardId: null,
            isConnected: false,
            currentMessage: null,
            isClockMode: false,
            lastAnimationType: 'flip',
            lastColorTheme: 'monochrome',
            gridConfig: { rows: 6, cols: 22 }, // Default config
            
            // Connection timeout tracking
            connectionTimeout: null,
            lastSessionCode: null, // Remember the last code
            connectionStartTime: null,
            isConnectionExpired: false,
            lastActivityTime: null, // Track last user activity
            disconnectReason: null, // 'inactivity' or 'timeout' or 'manual'
            isReconnect: false, // Flag to track if this is a reconnect

            boardState: null, // Array of { char, color }

            setSessionCode: (code, isReconnecting = false) => set({ 
                sessionCode: code,
                lastSessionCode: code, // Remember this code
                connectionStartTime: Date.now(),
                lastActivityTime: Date.now(),
                isConnectionExpired: false,
                disconnectReason: null,
                isReconnect: isReconnecting
            }),
            recordActivity: () => set({ lastActivityTime: Date.now() }),
            setBoardId: (id) => set({ boardId: id }),
            setConnected: (status) => set({ isConnected: status }),
            setClockMode: (status) => set({ isClockMode: status }),
            setGridConfig: (config) => set({ gridConfig: config }),
            setConnectionExpired: (expired, reason = 'timeout') => set({ 
                isConnectionExpired: expired,
                disconnectReason: reason
            }),
            setConnectionTimeout: (timeout) => set({ connectionTimeout: timeout }),

            setMessage: (content, animationType = 'flip', colorTheme = 'monochrome') =>
                set({
                    currentMessage: content,
                    boardState: null, // Clear board state when setting simple message
                    isClockMode: false,
                    lastAnimationType: animationType,
                    lastColorTheme: colorTheme
                }),
            setBoardState: (state) => set({
                boardState: state,
                currentMessage: null, // Clear simple message when setting board state
                isClockMode: false
            }),
            setPreferences: (animationType, colorTheme) =>
                set((state) => ({
                    lastAnimationType: animationType ?? state.lastAnimationType,
                    lastColorTheme: colorTheme ?? state.lastColorTheme
                })),
            clearSession: () => set({
                sessionCode: null,
                boardId: null,
                isConnected: false,
                currentMessage: null,
                boardState: null,
                connectionStartTime: null,
                lastActivityTime: null,
                isConnectionExpired: true,
                isReconnect: false
            }),
        }),
        {
            name: 'session-storage',
        }
    )
)

// Enable cross-tab synchronization
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
        if (e.key === 'session-storage') {
            useSessionStore.persist.rehydrate()
        }
    })
}
