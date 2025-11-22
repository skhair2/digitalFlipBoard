# Google OAuth Setup Guide

## Overview

The Digital FlipBoard now supports Google OAuth 2.0 with PKCE flow for secure authentication. The entire OAuth infrastructure is built and ready—you just need to provide Google credentials.

## What's Implemented

✅ **Complete OAuth Flow**:
- Google OAuth 2.0 with PKCE (Proof Key for Code Exchange)
- CSRF protection via state parameter
- Secure token exchange
- User profile creation in Supabase
- Session persistence in localStorage
- Analytics tracking via Mixpanel
- Email verification support

✅ **Integration Points**:
- `src/services/googleOAuthService.js` - OAuth orchestration service
- `src/pages/OAuthCallback.jsx` - OAuth callback handler
- `src/pages/Login.jsx` - OAuth trigger (Google button)
- `src/store/authStore.js` - Session management with OAuth support
- `src/App.jsx` - Routing for `/auth/callback` endpoint

✅ **Security Features**:
- PKCE flow (recommended for native/SPA apps)
- State validation for CSRF protection
- Token verification
- Secure session storage

## Required Setup

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - Development: `http://localhost:5173/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`
7. Copy the **Client ID** (you'll need this)

### Step 2: Add Environment Variables

Create or update `.env` file in project root:

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
VITE_APP_URL=http://localhost:5173
```

For production:
```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
VITE_APP_URL=https://yourdomain.com
```

### Step 3: Restart Development Server

```bash
npm run dev
```

The OAuth service will now be ready to use.

## How It Works

### User Signup Flow

1. **User clicks "Sign up with Google"** → Login page
2. **Validates T&C checkbox** → Required for all signup methods
3. **Calls `googleOAuthService.startOAuthFlow()`** → Redirects to Google login
4. **User signs in with Google** → Redirected back to `/auth/callback`
5. **OAuthCallback page processes response** → Verifies state & token
6. **User profile created in Supabase** → `profiles` table
7. **Session stored in localStorage** → `auth_session` key
8. **Auth store updated** → User + profile loaded
9. **Redirects to Dashboard** → Ready to use app

### Session Persistence

- OAuth session stored in `localStorage` as `auth_session`
- `authStore.initialize()` loads OAuth session on app startup
- Falls back to Supabase session if OAuth session not found
- Session remains valid across tab reloads

### Profile Creation

When a user signs in with Google:
- Email is used to check if profile exists
- If new user: creates entry in `profiles` table with:
  - `full_name` from Google
  - `picture` from Google avatar
  - `email` from Google
  - `subscription_tier` set to `'free'`
  - `created_at` timestamp
  - `last_sign_in` timestamp
  - `email_verified` set to true (Google guarantees verified emails)
- If existing user: updates `last_sign_in` timestamp

## File Structure

```
src/
├── services/
│   └── googleOAuthService.js        # OAuth service (280 lines)
├── pages/
│   ├── Login.jsx                    # OAuth trigger point
│   ├── OAuthCallback.jsx            # Callback handler (150 lines)
│   ├── Dashboard.jsx                # Email verification banner
│   └── Control.jsx                  # Email verification banner
├── store/
│   └── authStore.js                 # Session management (updated)
├── components/
│   └── auth/
│       └── EmailVerificationBanner.jsx  # Verification prompt
└── App.jsx                          # OAuth route configuration
```

## Testing Locally

### Manual Test

1. Open browser to `http://localhost:5173`
2. Go to Login page
3. Click "Sign up with Google"
4. You should be redirected to Google login
5. Sign in with your Google account
6. You should be redirected back and logged in
7. Verify profile created in Supabase: `profiles` table

### Test Email Verification

1. After Google OAuth signup, go to Dashboard or Control page
2. You should see: "Email verified with Google" (no banner needed)
3. If testing with non-Google signup, banner will appear until verified

### Test Session Persistence

1. Sign in with Google
2. Go to Dashboard (you should be logged in)
3. Refresh the page
4. You should remain logged in
5. Open browser DevTools → Application → localStorage
6. Look for `auth_session` key with your session data

## Troubleshooting

### "Google Client ID not configured"

- Check `.env` file has `VITE_GOOGLE_CLIENT_ID`
- Restart dev server after adding/changing .env
- Verify Client ID format matches `xxx-yyy.apps.googleusercontent.com`

### "Redirect URI mismatch"

- Check `VITE_APP_URL` matches Google Console configuration
- For localhost: must be `http://localhost:5173` (not https)
- For production: must match your domain
- In Google Console: "OAuth 2.0 Client ID" → edit → check "Authorized redirect URIs"

### "State validation failed"

- Likely CORS issue or session storage cleared
- Check browser console for error details
- Clear sessionStorage and try again
- Verify not in private/incognito mode (sessionStorage may be blocked)

### "Failed to create user profile"

- Check Supabase connection is working
- Verify `profiles` table exists with correct schema
- Check browser console for detailed error
- Ensure RLS policies allow insert/update on `profiles` table

## Advanced: Token Refresh

Currently, OAuth tokens are not refreshed automatically. For production, consider:

1. Store `refresh_token` in localStorage
2. Check token expiration before API calls
3. If expired, refresh using `exchangeCodeForToken()` with refresh token
4. Example in `googleOAuthService.js` comments for future implementation

## API Reference

### `googleOAuthService.startOAuthFlow()`

Initiates Google OAuth login flow. Redirects to Google login page.

```javascript
import { googleOAuthService } from '../services/googleOAuthService'

const handleGoogleSignup = async () => {
    try {
        await googleOAuthService.startOAuthFlow()
    } catch (err) {
        console.error('OAuth failed:', err)
    }
}
```

### `googleOAuthService.handleCallback()`

Processes OAuth callback from Google. Called automatically by OAuthCallback page.

Returns:
```javascript
{
    success: boolean,
    user: {
        id: string,
        email: string,
        name: string,
        picture: string,
        email_verified: boolean
    },
    tokens: {
        access_token: string,
        refresh_token: string,
        expires_in: number
    },
    error?: string  // if success=false
}
```

### `authStore.setUser(user)`

Sets authenticated user in store.

```javascript
const { setUser } = useAuthStore()
setUser(googleUser)
```

### `authStore.setProfile(profile)`

Sets user profile with subscription tier and design limits.

```javascript
const { setProfile } = useAuthStore()
setProfile(profileData)
```

## Next Steps

1. ✅ Get Google Client ID from Google Cloud Console
2. ✅ Add to `.env` file
3. ✅ Restart dev server
4. ✅ Test OAuth flow
5. ✅ Deploy to production with prod URL

## Support

For issues or questions:
1. Check browser console for errors
2. Review `OAuthCallback.jsx` error handling
3. Check Supabase logs for profile creation issues
4. Verify Google Cloud Console settings match `.env` configuration

---

**Status**: OAuth infrastructure complete ✅  
**Ready for**: Google credentials + testing
