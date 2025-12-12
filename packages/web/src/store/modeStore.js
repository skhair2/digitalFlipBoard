import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Mode Store - Manages Display vs Controller mode
 * Persists to localStorage so user's preference is remembered
 */
export const useModeStore = create(
  persist(
    (set) => ({
      // 'display' | 'controller' | null (null = show mode selection)
      mode: null,
      
      // Set the mode
      setMode: (mode) => set({ mode }),
      
      // Clear mode (show selection screen again)
      clearMode: () => set({ mode: null }),
      
      // Check if in display mode
      isDisplay: () => {
        const state = useModeStore.getState();
        return state.mode === 'display';
      },
      
      // Check if in controller mode
      isController: () => {
        const state = useModeStore.getState();
        return state.mode === 'controller';
      },
    }),
    {
      name: 'flipboard-mode-store',
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);
