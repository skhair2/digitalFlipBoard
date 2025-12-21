import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../services/supabaseClient'
import mixpanel from '../services/mixpanelService'
import { isUserAdmin } from '../services/permissionService'
import { emailService } from '../services/emailService.jsx'

export const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            session: null,
            profile: null,
            isPremium: false,
            subscriptionTier: 'free',
            isAdmin: false,
            designLimits: {
                maxDesigns: 5,
                maxCollections: 0,
                canShareDesigns: false,
                versionHistory: false
            },
            loading: true,

            // Initialize auth state
            initialize: async () => {
                // Check for OAuth session first
                const oauthSession = localStorage.getItem('auth_session')
                if (oauthSession) {
                    try {
                        const session = JSON.parse(oauthSession)
                        // Fetch profile data
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', session.user.id)
                            .single()

                        const tier = profile?.subscription_tier || 'free'
                        const isPremium = tier === 'pro' || tier === 'enterprise'
                        const adminStatus = await isUserAdmin(session.user.id)

                        set({
                            user: session.user,
                            session,
                            profile: profile || null,
                            isPremium,
                            isAdmin: adminStatus,
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
                        return
                    } catch (err) {
                        console.error('Failed to restore OAuth session:', err)
                        localStorage.removeItem('auth_session')
                    }
                }

                // Fall back to Supabase session
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
                    const adminStatus = await isUserAdmin(session.user.id)

                    set({
                        user: session.user,
                        session,
                        profile: profile || null,
                        isPremium,
                        isAdmin: adminStatus,
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
                        isAdmin: adminStatus,
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
                    const adminStatus = session?.user ? await isUserAdmin(session.user.id) : false

                    set({
                        user: session?.user ?? null,
                        session,
                        profile: profile || null,
                        isPremium,
                        isAdmin: adminStatus,
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

            // Magic link sign in (Sign In Only)
            signInWithMagicLink: async (email) => {
                try {
                    // 1. Check if user exists first
                    const { data: exists, error: checkError } = await supabase.rpc('check_user_exists', {
                        email_to_check: email
                    })

                    if (checkError) throw checkError

                    if (!exists) {
                        return { success: false, error: 'User not found', code: 'USER_NOT_FOUND' }
                    }

                    // 2. Call backend to send magic link via Resend
                    const API_URL = import.meta.env.VITE_API_URL || ''
                    const response = await fetch(`${API_URL}/api/auth/send-magic-link`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email })
                    })

                    if (!response.ok) {
                        const error = await response.json()
                        throw new Error(error.error || 'Failed to send magic link')
                    }

                    console.log('[Magic Link] Sent via Resend to:', email)
                    mixpanel.track('Magic Link Sent', { email, provider: 'resend' })
                    return { success: true }
                } catch (error) {
                    console.error('[Magic Link] Exception:', error)
                    mixpanel.track('Magic Link Error', { error: error.message })
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
                                signup_method: 'password'
                            },
                            emailRedirectTo: undefined // Disable Supabase's auto email confirmation
                        }
                    })

                    if (error) throw error

                    const userId = data.user?.id
                    mixpanel.track('User Signed Up', { method: 'password', email })

                    // Note: PostgreSQL trigger automatically creates the profile on auth user creation
                    // No need to manually insert here as it will cause RLS 401 error

                    // Send custom verification email via Resend (not Supabase's default)
                    try {
                        // Generate a 6-digit verification code
                        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
                        
                        // Send verification email with our custom template
                        await emailService.sendVerification(email, verificationCode)
                        mixpanel.track('Verification Email Sent', { email })

                        // TODO: Store verification code in database for validation
                        // In a future enhancement, store this code and validate it when user confirms
                    } catch (emailError) {
                        // Log email error but don't fail the signup
                        console.warn('Failed to send verification email:', emailError)
                        mixpanel.track('Verification Email Failed', { email, error: emailError.message })
                    }

                    // Also send welcome email after successful signup
                    try {
                        await emailService.sendWelcome(email, fullName || 'User')
                        mixpanel.track('Welcome Email Sent', { email })

                        // Update welcome_email_sent flag in database
                        if (userId) {
                            try {
                                await supabase
                                    .from('profiles')
                                    .update({ welcome_email_sent: true })
                                    .eq('id', userId)
                            } catch (updateError) {
                                console.warn('Failed to update welcome email flag:', updateError)
                            }
                        }
                    } catch (emailError) {
                        // Log email error but don't fail the signup
                        console.warn('Failed to send welcome email:', emailError)
                        mixpanel.track('Welcome Email Failed', { email, error: emailError.message })
                    }

                    // Note: User will need to confirm their email before they can fully log in
                    // If they have an active session in the response, use it; otherwise they'll need to confirm
                    if (data.session) {
                        set({
                            user: data.user,
                            session: data.session,
                            loading: false
                        })
                        
                        // Fetch and set profile
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', userId)
                            .single()
                        
                        if (profile) {
                            set({
                                profile,
                                isPremium: profile.subscription_tier === 'pro' || profile.subscription_tier === 'enterprise',
                                subscriptionTier: profile.subscription_tier || 'free'
                            })
                        }
                    }

                    return { success: true, data, requiresEmailConfirmation: !data.session }
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

            // Set user (OAuth and other flows)
            setUser: (user) => {
                set({ user })
                if (user?.id) {
                    mixpanel.identify(user.id)
                }
            },

            // Set user profile (OAuth and other flows)
            setProfile: async (profile) => {
                const tier = profile?.subscription_tier || 'free'
                const isPremium = tier === 'pro' || tier === 'enterprise'
                const adminStatus = profile?.id ? await isUserAdmin(profile.id) : false

                console.log('setProfile called:', {
                    profileId: profile?.id,
                    profileEmail: profile?.email,
                    adminStatus,
                    tier,
                    isPremium
                })

                set({
                    profile,
                    isPremium,
                    isAdmin: adminStatus,
                    subscriptionTier: tier,
                    designLimits: {
                        maxDesigns: isPremium ? 999999 : 5,
                        maxCollections: tier === 'enterprise' ? 999999 : (isPremium ? 20 : 0),
                        canShareDesigns: isPremium,
                        versionHistory: isPremium
                    }
                })

                if (profile?.id) {
                    mixpanel.people.set({
                        'Full Name': profile.full_name || '',
                        'Email': profile.email || '',
                        'Subscription Tier': tier,
                        'Profile Picture': profile.picture || ''
                    })
                }
            },

            // Sign out
            signOut: async () => {
                try {
                    const { error } = await supabase.auth.signOut()
                    if (error) throw error

                    localStorage.removeItem('auth_session')
                    set({
                        user: null,
                        session: null,
                        profile: null,
                        isPremium: false,
                        isAdmin: false,
                        subscriptionTier: 'free',
                        designLimits: {
                            maxDesigns: 5,
                            maxCollections: 0,
                            canShareDesigns: false,
                            versionHistory: false
                        }
                    })
                    mixpanel.track('User Signed Out')
                    mixpanel.reset()
                } catch (error) {
                    console.error('Sign out error:', error)
                }
            },

            // Resend verification email
            resendVerificationEmail: async (email) => {
                try {
                    const { error } = await supabase.auth.resend({
                        type: 'signup',
                        email
                    })

                    if (error) {
                        return { success: false, error: error.message }
                    }

                    mixpanel.track('Verification Email Resent', { email })
                    return { success: true }
                } catch (error) {
                    mixpanel.track('Resend Email Error', { error: error.message })
                    return { success: false, error: error.message }
                }
            },

            // Check email verification status
            checkEmailVerification: async () => {
                try {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (user) {
                        set((state) => ({
                            user: {
                                ...state.user,
                                email_confirmed_at: user.email_confirmed_at
                            }
                        }))
                        return { isVerified: !!user.email_confirmed_at }
                    }
                    return { isVerified: false }
                } catch (error) {
                    console.error('Check email verification error:', error)
                    return { isVerified: false }
                }
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                isPremium: state.isPremium
            }),
        }
    )
)
