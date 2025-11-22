// Google OAuth Service
// Handles OAuth flow, token management, and user profile creation

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
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
    // Start the OAuth flow
    startOAuthFlow: async () => {
        if (!GOOGLE_CLIENT_ID) {
            throw new Error('Google Client ID not configured. Add VITE_GOOGLE_CLIENT_ID to .env')
        }

        try {
            const { verifier, challenge } = await generatePKCE()
            const state = generateState()

            // Store state and verifier in sessionStorage for verification later
            sessionStorage.setItem('oauth_state', state)
            sessionStorage.setItem('oauth_pkce_verifier', verifier)

            // Build OAuth URL
            const params = new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                redirect_uri: GOOGLE_REDIRECT_URI,
                response_type: 'code',
                scope: 'openid email profile',
                state,
                code_challenge: challenge,
                code_challenge_method: 'S256',
                prompt: 'consent'
            })

            // Redirect to Google
            window.location.href = `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`
        } catch (error) {
            console.error('OAuth flow error:', error)
            throw error
        }
    },

    // Handle OAuth callback
    handleCallback: async () => {
        try {
            // Get auth code and state from URL
            const params = new URLSearchParams(window.location.search)
            const code = params.get('code')
            const state = params.get('state')
            const error = params.get('error')

            if (error) {
                throw new Error(`Google OAuth error: ${error}`)
            }

            if (!code) {
                throw new Error('No authorization code received')
            }

            // Verify state for CSRF protection
            const storedState = sessionStorage.getItem('oauth_state')
            if (state !== storedState) {
                throw new Error('Invalid state parameter - possible CSRF attack')
            }

            // Get PKCE verifier
            const pkceVerifier = sessionStorage.getItem('oauth_pkce_verifier')
            if (!pkceVerifier) {
                throw new Error('PKCE verifier not found')
            }

            // Exchange code for tokens
            const tokenData = await googleOAuthService.exchangeCodeForToken(code, pkceVerifier)

            // Get user info from Google
            const userInfo = await googleOAuthService.getUserInfo(tokenData.access_token)

            // Clean up session storage
            sessionStorage.removeItem('oauth_state')
            sessionStorage.removeItem('oauth_pkce_verifier')

            return {
                success: true,
                user: userInfo,
                tokens: tokenData
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
