import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { googleOAuthService } from '../services/googleOAuthService'
import { supabase } from '../services/supabaseClient'
import Spinner from '../components/ui/Spinner'
import Logo from '../components/ui/Logo'

export default function OAuthCallback() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { setUser, setProfile } = useAuthStore()
    const [error, setError] = useState(null)
    const [isProcessing, setIsProcessing] = useState(true)

    useEffect(() => {
        const handleCallback = async () => {
            try {
                setIsProcessing(true)
                setError(null)

                // Check if this is a magic link callback from Supabase
                const authType = searchParams.get('type')
                
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

                    // Update auth store
                    setUser(session.user)
                    setProfile(profile)

                    // Track in analytics
                    const mixpanel = window.mixpanel
                    if (mixpanel) {
                        mixpanel.identify(session.user.id)
                        mixpanel.people.set({
                            $email: session.user.email,
                            signup_method: 'magic_link',
                            signup_date: new Date().toISOString()
                        })
                        mixpanel.track('Magic Link Login', {
                            email: session.user.email
                        })
                    }

                    // Redirect to dashboard
                    setTimeout(() => {
                        navigate('/dashboard', { replace: true })
                    }, 500)
                } else {
                    // Handle Google OAuth (via Supabase)
                    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
                    
                    if (sessionError) throw sessionError
                    if (!session) throw new Error('No session found after Google OAuth')

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

                    // Update auth store
                    setUser(session.user)
                    setProfile(profile)

                    // Track in analytics
                    const mixpanel = window.mixpanel
                    if (mixpanel) {
                        mixpanel.identify(session.user.id)
                        mixpanel.people.set({
                            $email: session.user.email,
                            $name: session.user.user_metadata?.full_name,
                            signup_method: 'google_oauth',
                            signup_date: new Date().toISOString()
                        })
                        mixpanel.track('Google OAuth Login', {
                            email: session.user.email,
                            name: session.user.user_metadata?.full_name
                        })
                    }

                    // Redirect to dashboard
                    setTimeout(() => {
                        navigate('/dashboard', { replace: true })
                    }, 500)
                }
            } catch (err) {
                console.error('Callback error:', err)
                setError(err.message || 'Failed to process login. Please try again.')

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login', { replace: true })
                }, 3000)
            } finally {
                setIsProcessing(false)
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
                        <p className="text-slate-400 text-sm mb-6">
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
                <p className="text-slate-500 text-xs mt-6">
                    {isProcessing ? 'Please wait while we verify your information' : 'Redirecting...'}
                </p>
            </div>
        </div>
    )
}
