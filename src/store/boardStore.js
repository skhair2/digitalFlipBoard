import { create } from 'zustand'
import { supabase } from '../services/supabaseClient'

export const useBoardStore = create((set, get) => ({
    boards: [],
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
            set({ boards: data })
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
            set((state) => ({ boards: [data, ...state.boards] }))
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
    }
}))
