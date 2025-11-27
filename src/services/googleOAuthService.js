// Google OAuth Service
// Handles OAuth flow, token management, and user profile creation

import { supabase } from './supabaseClient'
const GOOGLE_REDIRECT_URI = `${import.meta.env.VITE_APP_URL}/auth/callback`
const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v2/userinfo'

// Generate a random state for CSRF protection
function generateState() {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Generate code verifier and challenge for PKCE flow
function generatePKCE() {
    const verifier = generateState()
    
    // Create code challenge from verifier
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    
    return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashString = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('')
        const challenge = btoa(hashString)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '')
        
        return { verifier, challenge }
    })
}

export const googleOAuthService = {
    // Start the OAuth flow using Supabase
    startOAuthFlow: async () => {
        try {
            // Use Supabase's built-in Google OAuth provider
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${import.meta.env.VITE_APP_URL}/auth/callback`
                }
            })

            if (error) throw error
        } catch (error) {
            console.error('OAuth flow error:', error)
            throw error
        }
    },

    // Handle OAuth callback
    handleCallback: async () => {
        try {
            // Supabase automatically handles the callback
            // Just get the current session
            const { data: { session }, error } = await supabase.auth.getSession()

            if (error) throw error
            if (!session) throw new Error('No session found after OAuth callback')

            return {
                success: true,
                user: session.user,
                tokens: {
                    access_token: session.access_token,
                    refresh_token: session.refresh_token,
                    expires_in: session.expires_in
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

    // Exchange authorization code for tokens
    exchangeCodeForToken: async (code, pkceVerifier) => {
        try {
            const tokenParams = new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: GOOGLE_REDIRECT_URI,
                client_id: GOOGLE_CLIENT_ID,
                code_verifier: pkceVerifier
            })

            const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: tokenParams.toString()
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error_description || 'Token exchange failed')
            }

            const data = await response.json()
            return data
        } catch (error) {
            console.error('Token exchange error:', error)
            throw error
        }
    },

    // Get user info from Google
    getUserInfo: async (accessToken) => {
        try {
            const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch user info')
            }

            const data = await response.json()
            return {
                id: data.id,
                email: data.email,
                name: data.name,
                picture: data.picture,
                email_verified: data.verified_email
            }
        } catch (error) {
            console.error('User info fetch error:', error)
            throw error
        }
    },

    // Create or update user in Supabase
    createOrUpdateUser: async (supabase, googleUser) => {
        try {
            // Check if user already exists
            const { data: existingProfile, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', googleUser.email)
                .single()

            if (fetchError && fetchError.code !== 'PGRST116') {
                // Error other than "not found"
                throw fetchError
            }

            if (existingProfile) {
                // Update existing user
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        full_name: googleUser.name || existingProfile.full_name,
                        avatar_url: googleUser.picture || existingProfile.avatar_url,
                        email_verified: googleUser.email_verified,
                        last_sign_in: new Date().toISOString()
                    })
                    .eq('id', existingProfile.id)

                if (updateError) throw updateError
                return existingProfile
            } else {
                // Create new user profile
                const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert({
                        email: googleUser.email,
                        full_name: googleUser.name,
                        avatar_url: googleUser.picture,
                        email_verified: googleUser.email_verified,
                        subscription_tier: 'free',
                        created_at: new Date().toISOString(),
                        last_sign_in: new Date().toISOString()
                    })
                    .select()
                    .single()

                if (createError) throw createError
                return newProfile
            }
        } catch (error) {
            console.error('User creation/update error:', error)
            throw error
        }
    }
}
