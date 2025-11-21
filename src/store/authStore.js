import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../services/supabaseClient'
import mixpanel from '../services/mixpanelService'

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            session: null,
            isPremium: false,
            loading: true,

            // Initialize auth state
            initialize: async () => {
                const { data: { session } } = await supabase.auth.getSession()
                if (session) {
                    set({
                        user: session.user,
                        session,
                        isPremium: session.user.user_metadata?.is_premium || false,
                        loading: false
                    })
                    mixpanel.identify(session.user.id)
                    mixpanel.people.set({
                        $email: session.user.email,
                        $name: session.user.user_metadata?.full_name,
                        signupDate: session.user.created_at,
                        isPremium: session.user.user_metadata?.is_premium || false,
                    })
                } else {
                    set({ loading: false })
                }

                // Listen for auth changes
                supabase.auth.onAuthStateChange((_event, session) => {
                    set({
                        user: session?.user ?? null,
                        session,
                        isPremium: session?.user.user_metadata?.is_premium || false
                    })
                })
            },

            // Magic link signup
            signUpWithMagicLink: async (email) => {
                try {
                    const { data, error } = await supabase.auth.signInWithOtp({
                        email,
                        options: {
                            emailRedirectTo: `${window.location.origin}/auth/callback`,
                            data: {
                                signup_source: 'magic_link',
                                signup_timestamp: new Date().toISOString(),
                            }
                        }
                    })

                    if (error) throw error

                    mixpanel.track('Magic Link Sent', { email })
                    return { success: true, data }
                } catch (error) {
                    mixpanel.track('Magic Link Error', { error: error.message })
                    return { success: false, error: error.message }
                }
            },

            // Google OAuth signup
            signUpWithGoogle: async () => {
                try {
                    const { data, error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                            redirectTo: `${window.location.origin}/auth/callback`,
                            queryParams: {
                                access_type: 'offline',
                                prompt: 'consent',
                            },
                        }
                    })

                    if (error) throw error

                    mixpanel.track('Google Auth Initiated')
                    return { success: true, data }
                } catch (error) {
                    mixpanel.track('Google Auth Error', { error: error.message })
                    return { success: false, error: error.message }
                }
            },

            // Sign out
            signOut: async () => {
                try {
                    const { error } = await supabase.auth.signOut()
                    if (error) throw error

                    set({ user: null, session: null, isPremium: false })
                    mixpanel.track('User Signed Out')
                    mixpanel.reset()
                } catch (error) {
                    console.error('Sign out error:', error)
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                isPremium: state.isPremium
            }),
        }
    )
)
