import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { googleOAuthService } from '../services/googleOAuthService'
import { supabase } from '../services/supabaseClient'
import Spinner from '../components/ui/Spinner'
import Logo from '../components/ui/Logo'

export default function OAuthCallback() {
    const navigate = useNavigate()
    const { setUser, setProfile } = useAuthStore()
    const [error, setError] = useState(null)
    const [isProcessing, setIsProcessing] = useState(true)

    useEffect(() => {
        const handleOAuthCallback = async () => {
            try {
                setIsProcessing(true)
                setError(null)

                // Handle the OAuth callback
                const result = await googleOAuthService.handleCallback()

                if (!result.success) {
                    throw new Error(result.error)
                }

                const googleUser = result.user

                // Create or update user profile in Supabase
                const profile = await googleOAuthService.createOrUpdateUser(supabase, googleUser)

                // Create a custom session/token (since we're not using Supabase auth directly)
                const session = {
                    user: {
                        id: profile.id,
                        email: googleUser.email,
                        user_metadata: {
                            full_name: googleUser.name,
                            avatar_url: googleUser.picture
                        },
                        email_confirmed_at: googleUser.email_verified ? new Date().toISOString() : null
                    },
                    access_token: result.tokens.access_token,
                    refresh_token: result.tokens.refresh_token || null,
                    expires_in: result.tokens.expires_in,
                    oauth_provider: 'google'
                }

                // Store session
                localStorage.setItem('auth_session', JSON.stringify(session))

                // Update auth store
                setUser(session.user)
                setProfile(profile)

                // Track in analytics
                const mixpanel = window.mixpanel
                if (mixpanel) {
                    mixpanel.identify(profile.id)
                    mixpanel.people.set({
                        $email: googleUser.email,
                        $name: googleUser.name,
                        signup_method: 'google_oauth',
                        signup_date: new Date().toISOString()
                    })
                    mixpanel.track('Google OAuth Signup', {
                        email: googleUser.email,
                        name: googleUser.name
                    })
                }

                // Redirect to dashboard
                setTimeout(() => {
                    navigate('/dashboard', { replace: true })
                }, 500)
            } catch (err) {
                console.error('OAuth callback error:', err)
                setError(err.message || 'Failed to process Google login. Please try again.')

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login', { replace: true })
                }, 3000)
            } finally {
                setIsProcessing(false)
            }
        }

        handleOAuthCallback()
    }, [navigate, setUser, setProfile])

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
