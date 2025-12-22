import { create } from 'zustand'
import { supabase } from '../services/supabaseClient'

console.log('Board Store Module Loading...')

export const useBoardStore = create((set) => {
    console.log('Initializing Board Store...')
    const store = {
    boards: [],
    schedules: [],
    isLoading: false,
    error: null,

    fetchBoards: async () => {
        set({ isLoading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('boards')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            set({ boards: Array.isArray(data) ? data : [] })
        } catch (error) {
            set({ error: error.message })
        } finally {
            set({ isLoading: false })
        }
    },

    createBoard: async (name) => {
        set({ isLoading: true, error: null })
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not authenticated')

            const { data, error } = await supabase
                .from('boards')
                .insert([{ name, user_id: user.id }])
                .select()
                .single()

            if (error) throw error
            set((state) => ({ boards: [data, ...(Array.isArray(state.boards) ? state.boards : [])] }))
            return data
        } catch (error) {
            set({ error: error.message })
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    deleteBoard: async (id) => {
        set({ isLoading: true, error: null })
        try {
            const { error } = await supabase
                .from('boards')
                .delete()
                .eq('id', id)

            if (error) throw error
            set((state) => ({ boards: state.boards.filter((b) => b.id !== id) }))
        } catch (error) {
            set({ error: error.message })
        } finally {
            set({ isLoading: false })
        }
    },

    // Schedule Actions
    fetchSchedules: async (boardId) => {
        set({ isLoading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('scheduled_messages')
                .select('*')
                .eq('board_id', boardId)
                .order('scheduled_time', { ascending: true })

            if (error) throw error
            set({ schedules: data || [] })
        } catch (error) {
            set({ error: error.message })
        } finally {
            set({ isLoading: false })
        }
    },

    createSchedule: async (boardId, content, scheduledTime, layout = null, metadata = {}) => {
        set({ isLoading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('scheduled_messages')
                .insert([{
                    board_id: boardId,
                    content,
                    scheduled_time: scheduledTime,
                    layout,
                    metadata,
                    status: 'pending'
                }])
                .select()
                .single()

            if (error) throw error
            set((state) => ({ schedules: [data, ...state.schedules] }))
            return data
        } catch (error) {
            set({ error: error.message })
            throw error
        } finally {
            set({ isLoading: false })
        }
    },

    deleteSchedule: async (id) => {
        set({ isLoading: true, error: null })
        try {
            const { error } = await supabase
                .from('scheduled_messages')
                .delete()
                .eq('id', id)

            if (error) throw error
            set((state) => ({ schedules: state.schedules.filter((s) => s.id !== id) }))
        } catch (error) {
            set({ error: error.message })
        } finally {
            set({ isLoading: false })
        }
    }
    }
    console.log('Board Store Actions:', Object.keys(store))
    return store
})
