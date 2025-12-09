// Direct Google OAuth Service (No Supabase OAuth Provider)
// Handles OAuth flow directly with Google API using PKCE

import { supabase } from './supabaseClient'

// Get redirect URI safely
const getRedirectUri = () => {
    // Always use the current origin for redirect URI
    const redirectUri = `${window.location.origin}/auth/callback`
    console.log('Google OAuth Redirect URI:', redirectUri)
    return redirectUri
}

const GOOGLE_REDIRECT_URI = getRedirectUri()
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v2/userinfo'

console.log('Google OAuth configured:', { GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID.substring(0, 20) + '...', GOOGLE_REDIRECT_URI })

// PKCE: Generate code verifier
const generateCodeVerifier = () => {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode.apply(null, array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
}

// PKCE: Generate code challenge from verifier
const generateCodeChallenge = async (verifier) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return btoa(String.fromCharCode.apply(null, new Uint8Array(hashBuffer)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
}

// Generate random state for CSRF protection
const generateState = () => {
    return btoa(Math.random().toString()).slice(0, 32)
}

export const googleOAuthService = {
    // Start the OAuth flow - direct with Google
    startOAuthFlow: async () => {
        try {
            console.log('Starting direct Google OAuth flow with redirect URI:', GOOGLE_REDIRECT_URI)
            
            // Generate PKCE values
            const codeVerifier = generateCodeVerifier()
            const codeChallenge = await generateCodeChallenge(codeVerifier)
            const state = generateState()
            
            // Store PKCE verifier and state in sessionStorage
            sessionStorage.setItem('oauth_code_verifier', codeVerifier)
            sessionStorage.setItem('oauth_state', state)
            
            // Build OAuth URL
            const params = new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                redirect_uri: GOOGLE_REDIRECT_URI,
                response_type: 'code',
                scope: 'openid email profile',
                state: state,
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
                access_type: 'offline',
                prompt: 'consent'
            })
            
            const authUrl = `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`
            console.log('Redirecting to Google:', authUrl)
            
            // Redirect to Google OAuth
            window.location.href = authUrl
        } catch (error) {
            console.error('OAuth flow error:', error)
            throw error
        }
    },

    // Handle OAuth callback - exchange code for tokens via backend
    handleCallback: async (code, state) => {
        try {
            // Verify state matches (CSRF protection)
            const storedState = sessionStorage.getItem('oauth_state')
            if (state !== storedState) {
                throw new Error('State mismatch - possible CSRF attack')
            }
            
            // Get PKCE verifier
            const codeVerifier = sessionStorage.getItem('oauth_code_verifier')
            if (!codeVerifier) {
                throw new Error('Code verifier not found')
            }
            
            console.log('Calling backend to exchange authorization code for tokens...')
            
            // Call backend to exchange code for tokens (backend has client secret)
            const tokenResponse = await fetch('/api/auth/google/exchange-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code,
                    codeVerifier: codeVerifier,
                    redirectUri: GOOGLE_REDIRECT_URI,
                })
            })
            
            if (!tokenResponse.ok) {
                let errorMessage = 'Token exchange failed'
                try {
                    const error = await tokenResponse.json()
                    errorMessage = error.error || error.message || 'Token exchange failed'
                } catch (e) {
                    // Response is not JSON, use status code
                    errorMessage = `Token exchange failed with status ${tokenResponse.status}`
                }
                throw new Error(errorMessage)
            }
            
            const { tokens, googleUser } = await tokenResponse.json()
            console.log('Tokens received from backend:', { access_token: tokens.access_token.substring(0, 20) + '...' })
            console.log('Google user info:', { email: googleUser.email, name: googleUser.name })
            
            // Clean up sessionStorage
            sessionStorage.removeItem('oauth_code_verifier')
            sessionStorage.removeItem('oauth_state')
            
            return {
                success: true,
                googleUser: googleUser,
                tokens: {
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expires_in: tokens.expires_in,
                    id_token: tokens.id_token
                }
            }
        } catch (error) {
            console.error('OAuth callback error:', error)
            return {
                success: false,
                error: error.message
            }
        }
    },

    // Create or update user in Supabase via backend API
    createOrUpdateUserInSupabase: async (googleUser) => {
        try {
            // Call backend endpoint to create/update user with admin privileges
            const response = await fetch('/api/auth/google/create-user', {
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

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create user on backend')
            }

            const { user } = await response.json()
            console.log('User created/updated via backend:', { userId: user.id, email: user.email })
            return user
        } catch (error) {
            console.error('Failed to create/update user via backend:', error)
            throw error
        }
    },

    // Create user profile in profiles table
    createOrUpdateUserProfile: async (userId, googleUser) => {
        // NOTE: This is now handled by the backend endpoint /api/auth/google/create-user
        // We keep this method for backward compatibility only
        try {
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (existingProfile) {
                // Update existing profile
                const { data: updated, error } = await supabase
                    .from('profiles')
                    .update({
                        full_name: googleUser.name || existingProfile.full_name,
                        email_verified: googleUser.verified_email,
                        signup_method: 'google_oauth_direct'
                    })
                    .eq('id', userId)
                    .select()
                    .single()

                if (error) throw error
                return updated
            } else {
                // Create new profile
                const { data: newProfile, error } = await supabase
                    .from('profiles')
                    .insert({
                        id: userId,
                        email: googleUser.email,
                        full_name: googleUser.name,
                        email_verified: googleUser.verified_email,
                        signup_method: 'google_oauth_direct'
                    })
                    .select()
                    .single()

                if (error) throw error
                return newProfile
            }
        } catch (error) {
            console.error('Failed to create/update user profile:', error)
            throw error
        }
    }
}

export default googleOAuthService
