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

            boardState: null, // Array of { char, color }

            setSessionCode: (code) => set({ sessionCode: code }),
            setBoardId: (id) => set({ boardId: id }),
            setConnected: (status) => set({ isConnected: status }),
            setClockMode: (status) => set({ isClockMode: status }),
            setGridConfig: (config) => set({ gridConfig: config }),

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
                boardState: null
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
