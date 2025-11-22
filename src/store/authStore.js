import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../services/supabaseClient'
import mixpanel from '../services/mixpanelService'

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            session: null,
            profile: null,
            isPremium: false,
            subscriptionTier: 'free',
            designLimits: {
                maxDesigns: 5,
                maxCollections: 0,
                canShareDesigns: false,
                versionHistory: false
            },
            loading: true,

            // Initialize auth state
            initialize: async () => {
                const { data: { session } } = await supabase.auth.getSession()
                if (session) {
            // Fetch profile data
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

            const tier = profile?.subscription_tier || 'free'
            const isPremium = tier === 'pro' || tier === 'enterprise'

            set({
                user: session.user,
                session,
                profile: profile || null,
                isPremium,
                subscriptionTier: tier,
                designLimits: {
                  maxDesigns: isPremium ? 999999 : 5,
                  maxCollections: tier === 'enterprise' ? 999999 : (isPremium ? 20 : 0),
                  canShareDesigns: isPremium,
                  versionHistory: isPremium
                },
                loading: false
            })
            
            mixpanel.identify(session.user.id)
            mixpanel.people.set({
                $email: session.user.email,
                $name: profile?.full_name || session.user.user_metadata?.full_name,
                signupDate: session.user.created_at,
                isPremium: isPremium,
                subscriptionTier: tier,
                maxDesigns: isPremium ? 999999 : 5
            })
                } else {
                    set({ loading: false })
                }

                // Listen for auth changes
                supabase.auth.onAuthStateChange(async (_event, session) => {
                    let profile = null
                    if (session?.user) {
                        const { data } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', session.user.id)
                            .single()
                        profile = data
                    }

                    const tier = profile?.subscription_tier || 'free'
                    const isPremium = tier === 'pro' || tier === 'enterprise'

                    set({
                        user: session?.user ?? null,
                        session,
                        profile: profile || null,
                        isPremium,
                        subscriptionTier: tier,
                        designLimits: {
                          maxDesigns: isPremium ? 999999 : 5,
                          maxCollections: tier === 'enterprise' ? 999999 : (isPremium ? 20 : 0),
                          canShareDesigns: isPremium,
                          versionHistory: isPremium
                        }
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

            // Password Sign Up
            signUpWithPassword: async (email, password, fullName) => {
                try {
                    const { data, error } = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            data: {
                                full_name: fullName,
                            }
                        }
                    })

                    if (error) throw error

                    mixpanel.track('User Signed Up', { method: 'password' })
                    return { success: true, data }
                } catch (error) {
                    mixpanel.track('Sign Up Error', { error: error.message })
                    return { success: false, error: error.message }
                }
            },

            // Password Sign In
            signInWithPassword: async (email, password) => {
                try {
                    const { data, error } = await supabase.auth.signInWithPassword({
                        email,
                        password
                    })

                    if (error) throw error

                    mixpanel.track('User Signed In', { method: 'password' })
                    return { success: true, data }
                } catch (error) {
                    mixpanel.track('Sign In Error', { error: error.message })
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
