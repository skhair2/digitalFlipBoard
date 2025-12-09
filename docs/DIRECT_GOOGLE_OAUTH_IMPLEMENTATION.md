# Direct Google OAuth Implementation

## Overview

This document describes the new **Direct Google OAuth** implementation that replaces Supabase's OAuth provider with a direct Google API integration. This gives you full control over the OAuth flow while maintaining security through PKCE and CSRF protection.

## Architecture

### Components

1. **Frontend Services**
   - `src/services/googleOAuthServiceDirect.js` - PKCE flow and token exchange
   - `src/pages/Login.jsx` - Initiates OAuth flow
   - `src/pages/OAuthCallbackDirect.jsx` - Handles OAuth callback

2. **Backend Endpoints**
   - `POST /api/auth/google/create-user` - Creates/updates user in Supabase
   - `server/googleOAuthEndpoint.js` - Backend logic

3. **Database**
   - Users created in Supabase Auth via admin API
   - Profiles stored in `profiles` table
   - `signup_method = 'google_oauth_direct'`

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Login.jsx                                   │
│                 "Sign up with Google"                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│         googleOAuthServiceDirect.startOAuthFlow()              │
│  1. Generate PKCE code_verifier & code_challenge               │
│  2. Generate CSRF state token                                   │
│  3. Store verifier + state in sessionStorage                    │
│  4. Redirect to Google OAuth endpoint                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
            ┌────────────────────────┐
            │   Google Login Page    │
            │  (User signs in here)  │
            └────────────┬───────────┘
                         │
                         ↓ Redirects back to /auth/callback
                         │ with code + state params
                         │
┌─────────────────────────────────────────────────────────────────┐
│         OAuthCallbackDirect.jsx (handleCallback)               │
│  1. Extract code & state from URL                               │
│  2. Call googleOAuthServiceDirect.handleCallback()             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│   googleOAuthServiceDirect.handleCallback(code, state)         │
│  1. Validate state (CSRF check)                                 │
│  2. Get code_verifier from sessionStorage                       │
│  3. Exchange code for tokens with Google                        │
│  4. Fetch user info from Google                                 │
│  5. Return googleUser + tokens                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│  OAuthCallbackDirect calls /api/auth/google/create-user       │
│  1. POST request with googleId, email, name, picture, etc.     │
│  2. Backend validates Google user                               │
│  3. Creates/updates Supabase auth user (admin API)            │
│  4. Creates/updates profile in profiles table                   │
│  5. Returns Supabase user + profile                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│  OAuthCallbackDirect updates auth store                        │
│  1. setUser(supabaseUser)                                       │
│  2. setProfile(profile)                                         │
│  3. Fire-and-forget: Send welcome email (background)            │
│  4. Fire-and-forget: Track in Mixpanel (background)            │
│  5. Redirect to /dashboard                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
                   ┌─────────────┐
                   │ Dashboard   │
                   │ (Logged In) │
                   └─────────────┘
```

## Key Security Features

### 1. PKCE (Proof Key for Code Exchange)
- **Code Verifier**: Random 43-character string
- **Code Challenge**: SHA-256 hash of verifier, base64 encoded
- **Protection**: Prevents authorization code interception attacks

### 2. CSRF Protection
- **State Parameter**: Random token generated per request
- **Validation**: State from callback must match stored state
- **Protection**: Prevents Cross-Site Request Forgery attacks

### 3. Fire-and-Forget Operations
- Email sending happens in background (non-blocking)
- Mixpanel tracking happens in background (non-blocking)
- User immediately redirected after auth (fast login)

## Files Modified/Created

### Created Files
- `src/pages/OAuthCallbackDirect.jsx` - New OAuth callback handler
- `src/services/googleOAuthServiceDirect.js` - Direct Google OAuth service
- `server/googleOAuthEndpoint.js` - Backend user creation endpoint
- `docs/DIRECT_GOOGLE_OAUTH_IMPLEMENTATION.md` - This file

### Modified Files
- `src/pages/Login.jsx` - Import from googleOAuthServiceDirect instead of googleOAuthService
- `src/App.jsx` - Route to OAuthCallbackDirect instead of OAuthCallback
- `server/index.js` - Register googleOAuthEndpoint

## Configuration

### Environment Variables Required

**Frontend (.env)**
```
VITE_GOOGLE_CLIENT_ID=579925197262-6sef62n6ge58cvl7ckab5m27g5ab4ukb.apps.googleusercontent.com
VITE_APP_URL=http://localhost:5173 (for development)
```

**Backend (.env)**
```
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Google OAuth Configuration

1. Create OAuth 2.0 credentials in Google Cloud Console
2. Set Authorized Redirect URIs:
   - Development: `http://localhost:5173/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`
3. Set Application Type: Web application
4. Use `access_type=offline` for refresh token (implemented)
5. Use `prompt=consent` to force consent screen on every login (implemented)

## Testing

### Local Testing

```bash
# 1. Start backend
npm run server:dev

# 2. Start frontend
npm run dev

# 3. Navigate to http://localhost:5173/login

# 4. Click "Sign up with Google"

# 5. You'll be redirected to Google login

# 6. After signing in, you'll be redirected to /auth/callback

# 7. You should see a loading screen, then redirect to /dashboard

# 8. Check browser console for any errors

# 9. Check server logs for OAuth flow details
```

### Expected Console Logs

**Frontend (Developer Tools Console)**
```
Redirecting to Google: https://accounts.google.com/o/oauth2/v2/auth?...
Processing direct Google OAuth callback...
Tokens received: { access_token: "ya29..." }
Google user info: { email: "user@example.com", name: "User Name" }
```

**Backend (Terminal)**
```
[2025-12-08T...] INFO     Google OAuth user created/updated successfully
{
  userId: "...",
  email: "user@example.com",
  isNew: true
}
```

### Debugging

**Check if OAuth flow starts:**
- Click "Sign up with Google"
- URL should change to Google's OAuth endpoint
- Google login page should appear

**Check if callback is processed:**
- After Google login, you're redirected to `/auth/callback?code=...&state=...`
- Check browser console for "Processing direct Google OAuth callback..."
- Check server logs for user creation

**Check if user is created:**
- Query Supabase auth table for new user
- Query profiles table for user profile
- Verify `signup_method = 'google_oauth_direct'`

**Check if email is sent:**
- Check background email service logs (non-blocking, won't show immediately)
- Check email inbox for welcome email

## Troubleshooting

### "State mismatch" Error
- Clear browser sessionStorage
- Try again
- This usually means localStorage/sessionStorage was cleared between redirect

### "Token exchange failed"
- Verify VITE_GOOGLE_CLIENT_ID is correct in .env
- Verify Authorized Redirect URIs in Google Cloud Console
- Check server logs for detailed error

### "Failed to create user on backend"
- Verify SUPABASE_SERVICE_ROLE_KEY is set
- Verify Supabase connection is working
- Check server logs for detailed error

### User not appearing in dashboard
- Verify profile was created in `profiles` table
- Verify `authStore.setUser()` and `authStore.setProfile()` were called
- Check localStorage for auth state

## Differences from Supabase OAuth

| Aspect | Supabase OAuth | Direct Google OAuth |
|--------|---|---|
| **Code Exchange** | Supabase handles | Frontend handles with PKCE |
| **Token Management** | Supabase manages | Custom implementation |
| **User Creation** | Automatic | Backend endpoint |
| **Refresh Tokens** | Supabase handles | Custom (if needed) |
| **Session Management** | Supabase auth | Custom via authStore |
| **Control** | Limited | Full control |

## Migration from Supabase OAuth

If migrating from Supabase OAuth:

1. ✅ Done: Created new googleOAuthServiceDirect
2. ✅ Done: Created OAuthCallbackDirect
3. ✅ Done: Updated Login.jsx to use new service
4. ✅ Done: Updated App.jsx to use new callback
5. ✅ Done: Created backend endpoint
6. ⏳ Next: Test the complete flow
7. ⏳ Next: Remove old Supabase OAuth code (optional)

## Next Steps

### Priority 1: Test Complete Flow
1. Click "Sign up with Google" on login page
2. Verify redirect to Google
3. Sign in with Google account
4. Verify redirect back to dashboard
5. Verify user data in Supabase

### Priority 2: Handle Token Refresh (Optional)
If implementing offline access:
1. Store refresh_token in secure storage
2. Implement token refresh logic
3. Handle expired tokens gracefully

### Priority 3: Cleanup (Optional)
1. Remove old `googleOAuthService.js` (Supabase provider)
2. Remove Supabase OAuth configuration from credentials
3. Update documentation

## Support

For issues or questions:
1. Check server logs for errors
2. Check browser console for client-side errors
3. Verify Google OAuth credentials in Google Cloud Console
4. Verify environment variables are set correctly
5. Check database for user/profile records
