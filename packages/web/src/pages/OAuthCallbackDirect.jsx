import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../services/supabaseClient'
import googleOAuthService from '../services/googleOAuthServiceDirect'
import { emailService } from '../services/emailService'
import Spinner from '../components/ui/Spinner'
import Logo from '../components/ui/Logo'

export default function OAuthCallback() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { setUser, setProfile } = useAuthStore()
    const [error, setError] = useState(null)
    const hasRunRef = useRef(false)

    useEffect(() => {
        // Guard against running twice in development (Strict Mode)
        if (hasRunRef.current) return;
        hasRunRef.current = true;

        const handleCallback = async () => {
            try {
                setError(null)

                // Check if this is a magic link callback from Supabase
                const authType = searchParams.get('type')
                const code = searchParams.get('code')
                const state = searchParams.get('state')
                
                if (authType === 'recovery' || authType === 'signup') {
                    // Handle Magic Link / Email confirmation
                    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
                    
                    if (sessionError) throw sessionError
                    if (!session) throw new Error('No session found after magic link')

                    // Get or create user profile
                    const { data: existingProfile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single()

                    let profile = existingProfile

                    // Create profile if it doesn't exist
                    if (!profile) {
                        const { data: newProfile, error: profileError } = await supabase
                            .from('profiles')
                            .insert({
                                id: session.user.id,
                                email: session.user.email,
                                full_name: session.user.user_metadata?.full_name || ''
                            })
                            .select()
                            .single()

                        if (profileError) throw profileError
                        profile = newProfile
                    }

                    // Update auth store immediately
                    setUser(session.user)
                    await setProfile(profile)

                    // Fire-and-forget: Send welcome email in background (don't await)
                    if (profile && !profile.welcome_email_sent) {
                        emailService.sendWelcome(session.user.email, profile.full_name || 'User').catch(err => {
                            console.warn('Failed to send welcome email:', err)
                        });
                        
                        // Update welcome_email_sent flag in background
                        supabase
                            .from('profiles')
                            .update({ welcome_email_sent: true })
                            .eq('id', session.user.id)
                            .then(() => {
                                console.log('Welcome email flag updated')
                            })
                            .catch(err => {
                                console.warn('Failed to update welcome_email_sent:', err)
                            })
                    }

                    // Fire-and-forget: Track in analytics in background (don't await)
                    const mixpanel = window.mixpanel
                    if (mixpanel) {
                        try {
                            mixpanel.identify(session.user.id)
                            mixpanel.people.set({
                                $email: session.user.email,
                                signup_method: 'magic_link',
                                signup_date: new Date().toISOString()
                            })
                            mixpanel.track('Magic Link Login', {
                                email: session.user.email
                            })
                        } catch (err) {
                            console.warn('Mixpanel tracking failed:', err)
                        }
                    }

                    // Redirect to dashboard immediately (don't wait for email/analytics)
                    navigate('/dashboard', { replace: true })
                } else if (code && state) {
                    // Handle Direct Google OAuth (using code + state)
                    console.log('Processing direct Google OAuth callback...')
                    
                    const result = await googleOAuthService.handleCallback(code, state)
                    
                    if (!result.success) {
                        throw new Error(result.error || 'Failed to process Google OAuth')
                    }

                    const { googleUser, tokens } = result

                    // Call backend to create/update user in Supabase auth
                    const backendResponse = await fetch('/api/auth/google/create-user', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            googleId: googleUser.sub,
                            email: googleUser.email,
                            name: googleUser.name,
                            picture: googleUser.picture,
                            emailVerified: googleUser.verified_email,
                        })
                    })

                    if (!backendResponse.ok) {
                        const error = await backendResponse.json()
                        throw new Error(error.error || 'Failed to create user')
                    }

                    const { user: supabaseUser, profile } = await backendResponse.json()

                    // Now set the Supabase session manually using the backend-created user
                    // This simulates a successful OAuth login
                    const supabaseSession = {
                        user: {
                            id: supabaseUser.id,
                            email: supabaseUser.email,
                            user_metadata: supabaseUser.user_metadata,
                            email_confirmed_at: supabaseUser.email_confirmed_at || new Date().toISOString(),
                        },
                        access_token: tokens.access_token, // Use Google's access token for now
                        refresh_token: tokens.refresh_token,
                    }

                    // Update auth store
                    setUser(supabaseSession.user)
                    await setProfile(profile)

                    // Store session in Supabase session storage for consistency
                    try {
                        await supabase.auth.setSession(supabaseSession)
                    } catch (err) {
                        console.warn('Failed to set Supabase session:', err)
                        // Session stored in local storage via setUser/setProfile should still work
                    }

                    // Fire-and-forget: Send welcome email in background (don't await)
                    if (profile && !profile.welcome_email_sent) {
                        emailService.sendWelcome(googleUser.email, googleUser.name || 'User').catch(err => {
                            console.warn('Failed to send welcome email:', err)
                        });
                        
                        // Update welcome_email_sent flag in background
                        supabase
                            .from('profiles')
                            .update({ welcome_email_sent: true })
                            .eq('id', supabaseUser.id)
                            .then(() => {
                                console.log('Welcome email flag updated')
                            })
                            .catch(err => {
                                console.warn('Failed to update welcome_email_sent:', err)
                            })
                    }

                    // Fire-and-forget: Track in analytics in background (don't await)
                    const mixpanel = window.mixpanel
                    if (mixpanel) {
                        try {
                            mixpanel.identify(supabaseUser.id)
                            mixpanel.people.set({
                                $email: googleUser.email,
                                $name: googleUser.name,
                                signup_method: 'google_oauth_direct',
                                signup_date: new Date().toISOString()
                            })
                            mixpanel.track('Google OAuth Direct Login', {
                                email: googleUser.email,
                                name: googleUser.name
                            })
                        } catch (err) {
                            console.warn('Mixpanel tracking failed:', err)
                        }
                    }

                    // Redirect to dashboard immediately (don't wait for email/analytics)
                    navigate('/dashboard', { replace: true })
                } else {
                    throw new Error('Invalid callback parameters')
                }
            } catch (err) {
                console.error('Callback error:', err)
                setError(err.message || 'Failed to process login. Please try again.')

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login', { replace: true })
                }, 3000)
            } finally {
                // Callback complete
            }
        }

        handleCallback()
    }, [navigate, setUser, setProfile, searchParams])

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
                <div className="max-w-md w-full">
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 text-center">
                        <div className="mb-4">
                            <Logo className="w-12 h-12 mx-auto" animated />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Login Error</h2>
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-6">
                            <p className="text-red-200 text-sm">{error}</p>
                        </div>
                        <p className="text-slate-400 text-sm mb-8">
                            Redirecting you back to login...
                        </p>
                        <button
                            onClick={() => navigate('/login', { replace: true })}
                            className="w-full px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-semibold transition-colors"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <div className="text-center">
                <div className="mb-6">
                    <Logo className="w-16 h-16 mx-auto" animated />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Completing Login</h2>
                <p className="text-slate-400 mb-6">Setting up your account...</p>
                <Spinner size="lg" />
            </div>
        </div>
    )
}
