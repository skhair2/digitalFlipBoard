import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './authStore'

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
            controllerSubscriptionTier: 'free', // Track controller's subscription tier (free/pro/premium)

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
            setControllerSubscriptionTier: (tier) => set({ controllerSubscriptionTier: tier }),
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
            // Only persist specific fields, NOT sessionCode (sessions are ephemeral)
            // lastSessionCode is persisted separately for 24h reconnect history
            partialize: (state) => {
                const authStore = useAuthStore.getState()
                const isPremium = authStore.isPremium
                
                return {
                    // DO NOT persist sessionCode - sessions should be per-browser-session only
                    // boardId persists if loaded from URL with ?boardId= parameter
                    boardId: state.boardId,
                    lastAnimationType: state.lastAnimationType,
                    lastColorTheme: state.lastColorTheme,
                    gridConfig: state.gridConfig,
                    isClockMode: state.isClockMode,
                    lastSessionCode: state.lastSessionCode, // For 24h reconnect history
                    
                    // Only persist messages for premium users
                    currentMessage: isPremium ? state.currentMessage : null,
                    boardState: isPremium ? state.boardState : null,
                }
            },
            // Migration: Clear stale sessionCode from old localStorage data
            migrate: (persistedState) => {
                // Remove sessionCode if it exists in old data (from before the fix)
                if (persistedState && persistedState.sessionCode) {
                    delete persistedState.sessionCode
                }
                return persistedState
            }
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
    
    // Clear messages on page unload for anonymous users
    window.addEventListener('beforeunload', () => {
        const authStore = useAuthStore.getState()
        if (!authStore.isPremium) {
            const state = useSessionStore.getState()
            // Clear message data from memory to prevent leakage
            state.setMessage(null)
            state.setBoardState(null)
        }
    })
}
