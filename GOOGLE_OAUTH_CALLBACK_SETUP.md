# Google OAuth Callback URL Configuration

## Summary

Your Google OAuth application needs to be configured with the following callback URLs:

### Development Environment
```
http://localhost:5173/auth/callback
```

### Production Environment
```
https://flipdisplay.online/auth/callback
https://www.flipdisplay.online/auth/callback
```

---

## How to Configure in Google OAuth

### Step 1: Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **"APIs & Services"** → **"Credentials"**

### Step 2: Edit OAuth 2.0 Client
1. Find your OAuth 2.0 Client ID (Web Application)
2. Click the **edit icon** (pencil)
3. Under **"Authorized redirect URIs"**, add:

#### For Development:
```
http://localhost:5173/auth/callback
```

#### For Production:
```
https://flipdisplay.online/auth/callback
https://www.flipdisplay.online/auth/callback
```

### Step 3: Save Changes
- Click **"Save"** button
- The configuration is now active

---

## Application Configuration

### Environment Variables Required

#### Frontend (.env or .env.local)
```dotenv
VITE_APP_URL=http://localhost:5173           # Development
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Or for production:
```dotenv
VITE_APP_URL=https://flipdisplay.online      # Production
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### How It Works

1. **User initiates OAuth** → Clicks "Sign in with Google"
2. **Google login page** → User logs in to their Google account
3. **Google redirects** → Sends authorization code to callback URL
4. **Callback handler** (`src/pages/OAuthCallback.jsx`) → Processes the response
5. **Token exchange** → Trades code for access token
6. **User profile fetched** → Gets user information from Google
7. **Session created** → User logged in locally

### Key Files

| File | Purpose |
|------|---------|
| `src/services/googleOAuthService.js` | Handles OAuth flow, PKCE, token management |
| `src/pages/OAuthCallback.jsx` | Processes callback from Google |
| `src/pages/Login.jsx` | Displays "Sign in with Google" button |
| `src/App.jsx` | Routes `/auth/callback` to OAuthCallback page |

### Callback Flow

The callback URL path is constructed as:
```javascript
const GOOGLE_REDIRECT_URI = `${VITE_APP_URL}/auth/callback`
```

Where `VITE_APP_URL` is your application's base URL.

---

## Testing

### Local Testing
```bash
# Make sure your .env has:
VITE_APP_URL=http://localhost:5173

# Google OAuth must be configured with:
http://localhost:5173/auth/callback
```

### Production Testing
```bash
# Update .env to:
VITE_APP_URL=https://flipdisplay.online

# Google OAuth must be configured with:
https://flipdisplay.online/auth/callback
https://www.flipdisplay.online/auth/callback
```

---

## Troubleshooting

### Error: "Redirect URI mismatch"
- ✅ Verify the callback URL is **exactly** what Google expects (case-sensitive)
- ✅ No trailing slashes or extra parameters
- ✅ Protocol must match (http vs https)
- ✅ Port number must match if using localhost

### Error: "Client ID not configured"
- ✅ Check `VITE_GOOGLE_CLIENT_ID` is set in `.env` or `.env.local`
- ✅ Restart the development server after updating `.env`

### OAuth flow not completing
- ✅ Check browser console for errors
- ✅ Verify `/auth/callback` route exists in App.jsx
- ✅ Check OAuthCallback.jsx is rendering without errors

---

## Security Notes

✅ Uses **PKCE flow** (Proof Key for Public Clients) for enhanced security  
✅ **State parameter** included to prevent CSRF attacks  
✅ **HTTPS required** for production  
✅ Tokens stored in **sessionStorage** (not localStorage, for security)  
✅ Code verifier and state validated on callback

---

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2/web-server-flow)
- [PKCE Flow](https://datatracker.ietf.org/doc/html/rfc7636)
- Implementation: `src/services/googleOAuthService.js`
