import { create } from 'zustand'
import { supabase } from '../services/supabaseClient'
import { useAuthStore } from './authStore'
import { useSessionStore } from './sessionStore'
import mixpanel from '../services/mixpanelService'

export const useDesignStore = create((set, get) => ({
    savedDesigns: [],
    currentDesign: [],
    designCollections: [],
    isLoading: false,
    error: null,
    designCount: 0,
    maxDesigns: 5,  // Default free tier limit

    // Initialize design based on current grid config
    initializeDesign: () => {
        const { gridConfig } = useSessionStore.getState()
        const rows = gridConfig?.rows || 6
        const cols = gridConfig?.cols || 22
        set({ currentDesign: Array(rows * cols).fill({ char: ' ', color: null }) })
    },

    // Actions
    setCurrentDesign: (design) => set({ currentDesign: design }),

    updateCell: (index, value) => {
        const newDesign = [...get().currentDesign]
        newDesign[index] = value // value is { char, color }
        set({ currentDesign: newDesign })
    },

    clearDesign: () => {
        const { gridConfig } = useSessionStore.getState()
        const rows = gridConfig?.rows || 6
        const cols = gridConfig?.cols || 22
        set({ currentDesign: Array(rows * cols).fill({ char: ' ', color: null }) })
    },

    // Async Actions - Premium Designs (new table)
    fetchDesigns: async () => {
        const { user, isPremium } = useAuthStore.getState()
        if (!user) return

        set({ isLoading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('premium_designs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            
            const count = data?.length || 0
            set({ 
                savedDesigns: data || [],
                designCount: count,
                maxDesigns: isPremium ? 999999 : 5
            })
        } catch (error) {
            set({ error: error.message })
            mixpanel.track('Design Fetch Error', { error: error.message })
        } finally {
            set({ isLoading: false })
        }
    },

    fetchCollections: async () => {
        const { user } = useAuthStore.getState()
        if (!user) return

        set({ isLoading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('design_collections')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            set({ designCollections: data || [] })
        } catch (error) {
            set({ error: error.message })
        } finally {
            set({ isLoading: false })
        }
    },

    saveDesign: async (name, description = null) => {
        const { user, isPremium } = useAuthStore.getState()
        if (!user) return { success: false, error: 'Not authenticated' }

        // Premium-only feature check
        if (!isPremium) {
            const { designCount, maxDesigns } = get()
            if (designCount >= maxDesigns) {
                const msg = `Free tier limited to ${maxDesigns} designs. Upgrade to Pro for unlimited designs.`
                mixpanel.track('Design Save Blocked - Limit Reached', { isPremium, designCount, maxDesigns })
                return { success: false, error: msg, requiresUpgrade: true }
            }
        }

        const { gridConfig } = useSessionStore.getState()
        const rows = gridConfig?.rows || 6
        const cols = gridConfig?.cols || 22

        set({ isLoading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('premium_designs')
                .insert([
                    {
                        user_id: user.id,
                        name,
                        description,
                        layout: get().currentDesign,
                        grid_rows: rows,
                        grid_cols: cols,
                        version: 1
                    }
                ])
                .select()

            if (error) throw error

            set(state => ({
                savedDesigns: [data[0], ...state.savedDesigns],
                designCount: state.designCount + 1
            }))
            
            mixpanel.track('Design Saved', { 
                designId: data[0]?.id,
                isPremium,
                totalDesigns: get().designCount
            })
            
            return { success: true, data: data[0] }
        } catch (error) {
            set({ error: error.message })
            mixpanel.track('Design Save Error', { error: error.message, isPremium })
            return { success: false, error: error.message }
        } finally {
            set({ isLoading: false })
        }
    },

    updateDesign: async (id, updates) => {
        set({ isLoading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('premium_designs')
                .update({
                    ...updates,
                    version: (updates.layout ? (updates.version || 1) + 1 : undefined)
                })
                .eq('id', id)
                .select()
                .single()

            if (error) throw error

            set(state => ({
                savedDesigns: state.savedDesigns.map(d => d.id === id ? data : d)
            }))

            mixpanel.track('Design Updated', { designId: id })
            return { success: true, data }
        } catch (error) {
            set({ error: error.message })
            return { success: false, error: error.message }
        } finally {
            set({ isLoading: false })
        }
    },

    deleteDesign: async (id) => {
        set({ isLoading: true, error: null })
        try {
            const { error } = await supabase
                .from('premium_designs')
                .delete()
                .eq('id', id)

            if (error) throw error

            set(state => ({
                savedDesigns: state.savedDesigns.filter(d => d.id !== id),
                designCount: Math.max(0, state.designCount - 1)
            }))

            mixpanel.track('Design Deleted', { designId: id })
            return { success: true }
        } catch (error) {
            set({ error: error.message })
            return { success: false, error: error.message }
        } finally {
            set({ isLoading: false })
        }
    },

    loadDesign: async (id) => {
        set({ isLoading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('premium_designs')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error

            set({ currentDesign: data.layout || [] })
            return { success: true }
        } catch (error) {
            set({ error: error.message })
            return { success: false, error: error.message }
        } finally {
            set({ isLoading: false })
        }
    },

    // Collection operations (Pro feature)
    createCollection: async (name, description = null) => {
        const { user, isPremium } = useAuthStore.getState()
        if (!user) return { success: false, error: 'Not authenticated' }
        if (!isPremium) return { success: false, error: 'Collections are a Pro feature', requiresUpgrade: true }

        set({ isLoading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('design_collections')
                .insert([{ user_id: user.id, name, description }])
                .select()
                .single()

            if (error) throw error

            set(state => ({
                designCollections: [data, ...state.designCollections]
            }))

            mixpanel.track('Collection Created', { collectionId: data.id })
            return { success: true, data }
        } catch (error) {
            set({ error: error.message })
            return { success: false, error: error.message }
        } finally {
            set({ isLoading: false })
        }
    },

    addDesignToCollection: async (collectionId, designId) => {
        set({ isLoading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('design_collection_members')
                .insert([{ collection_id: collectionId, design_id: designId }])
                .select()
                .single()

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            set({ error: error.message })
            return { success: false, error: error.message }
        } finally {
            set({ isLoading: false })
        }
    },

    deleteCollection: async (id) => {
        set({ isLoading: true, error: null })
        try {
            const { error } = await supabase
                .from('design_collections')
                .delete()
                .eq('id', id)

            if (error) throw error

            set(state => ({
                designCollections: state.designCollections.filter(c => c.id !== id)
            }))

            mixpanel.track('Collection Deleted', { collectionId: id })
            return { success: true }
        } catch (error) {
            set({ error: error.message })
            return { success: false, error: error.message }
        } finally {
            set({ isLoading: false })
        }
    }
}))
