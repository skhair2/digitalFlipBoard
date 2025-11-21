import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUsageStore = create(
    persist(
        (set) => ({
            freeSessionUsed: false,

            incrementSession: () => set({ freeSessionUsed: true }),

            // For debugging or admin reset
            resetFreeSession: () => set({ freeSessionUsed: false })
        }),
        {
            name: 'usage-storage', // unique name
        }
    )
)
