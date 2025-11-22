# Quick Start: Google OAuth Setup

Your Google OAuth implementation is **complete and ready to use**! Follow these steps to get it running.

## 1️⃣ Get Google Credentials (5 minutes)

### Create OAuth 2.0 Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Sign in** with your Google account
3. At the top, click the project dropdown and select **"NEW PROJECT"**
   - Project name: `Digital FlipBoard`
   - Click **CREATE**
4. Wait for project to be created, then select it
5. Go to **APIs & Services** in the left sidebar
6. Click **Credentials**
7. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client ID**
8. You may get prompted to configure the OAuth consent screen first:
   - Click **CONFIGURE CONSENT SCREEN**
   - Choose **External** user type
   - Fill in:
     - **App name**: Digital FlipBoard
     - **User support email**: (your email)
     - **Developer contact**: (your email)
   - Click **SAVE AND CONTINUE**
   - Skip optional scopes (click **SAVE AND CONTINUE**)
   - Skip optional info (click **SAVE AND CONTINUE**)
   - Review and click **BACK TO DASHBOARD**
9. Go back to **Credentials** → **+ CREATE CREDENTIALS** → **OAuth 2.0 Client ID**
10. Select **Web application**
11. Give it a name: `Digital FlipBoard Web`
12. Add **Authorized redirect URIs**:
    - Click **+ ADD URI**
    - Enter: `http://localhost:5173/auth/callback`
    - Click **CREATE**
13. **Copy the Client ID** (looks like: `xxx-yyy.apps.googleusercontent.com`)

You don't need the Client Secret for this app (PKCE flow doesn't require it).

## 2️⃣ Add to Environment (2 minutes)

1. Open project root folder in VS Code
2. Create or edit `.env` file (if doesn't exist):

   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   VITE_APP_URL=http://localhost:5173
   ```

3. **Replace** `your-client-id...` with the Client ID you copied
4. **Save the file**

Example:
```env
VITE_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
VITE_APP_URL=http://localhost:5173
```

## 3️⃣ Restart Dev Server (1 minute)

```bash
npm run dev
```

The OAuth service will now be active.

## 4️⃣ Test It (2 minutes)

1. Open browser to `http://localhost:5173`
2. Go to **Login** page
3. Click **"Sign up with Google"** button
4. You should be redirected to Google login
5. Sign in with your Google account
6. You should be redirected back to **Dashboard**
7. ✅ You're logged in via Google OAuth!

## What Happens Under the Hood

```
You click "Sign up with Google"
↓
Redirected to Google login
↓
You sign in with Google
↓
Google redirects back with authorization code
↓
App exchanges code for access token securely
↓
Your profile is fetched from Google
↓
Profile is stored in Supabase database
↓
You're logged in!
```

## Verify Everything Works

### Check User Created

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **SQL Editor**
4. Run:
   ```sql
   SELECT * FROM profiles;
   ```
5. You should see your profile with name, email, picture from Google

### Check Session Storage

1. Open browser DevTools (F12)
2. Go to **Application** tab
3. Click **Local Storage** → `http://localhost:5173`
4. Look for `auth_session` key
5. It should contain your user ID and tokens

### Check Persistence

1. Logged in? Refresh the page (Ctrl+R)
2. You should remain logged in ✅
3. Go to Dashboard page
4. You should NOT see email verification banner (Google verifies emails)

## Production Deployment

When deploying to production:

1. Update Google Console redirect URI:
   - Go to **Credentials** → Your Client ID
   - Add new **Authorized redirect URI**: `https://yourdomain.com/auth/callback`

2. Update `.env` for production:
   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   VITE_APP_URL=https://yourdomain.com
   ```

3. Deploy and test the OAuth flow

## Troubleshooting

### "Google Client ID not configured"
- Check `.env` file has `VITE_GOOGLE_CLIENT_ID`
- Restart dev server after updating `.env`
- Clear browser cache (Ctrl+Shift+Delete)

### "Redirect URI mismatch"
- Verify `http://localhost:5173/auth/callback` in Google Console
- Check you're using `http` (not https) for localhost
- Verify `VITE_APP_URL=http://localhost:5173` in `.env`

### "Error: User already exists"
- You're trying to sign up with an email already in system
- Try a different email or use "Sign in" instead

### Can't get past Google login
- Check browser console (F12) for errors
- Verify Client ID is correct in `.env`
- Verify redirect URI is exactly `http://localhost:5173/auth/callback`
- Try in incognito mode (clears cache)

### Session not persisting after refresh
- Check browser allows localStorage (not blocked by privacy settings)
- Check DevTools → Application → Local Storage for `auth_session`
- Try different browser

## Files Used

Here's what we built for you:

| File | Purpose | Size |
|------|---------|------|
| `src/services/googleOAuthService.js` | OAuth logic | 280 lines |
| `src/pages/OAuthCallback.jsx` | Handles Google redirect | 150 lines |
| `src/store/authStore.js` | Session management (updated) | Updated |
| `src/pages/Login.jsx` | OAuth button (updated) | Updated |
| `src/App.jsx` | OAuth route (updated) | Updated |

## What's Secure

✅ **PKCE Flow** - Enhanced security for web apps  
✅ **State Validation** - Protects against CSRF attacks  
✅ **Token Exchange** - Codes exchanged securely server-side  
✅ **Email Verified** - Google guarantees verified emails  
✅ **No Client Secret** - Doesn't expose secrets in frontend  

## Questions?

1. Check `docs/GOOGLE_OAUTH_SETUP.md` for detailed documentation
2. Check `docs/OAUTH_IMPLEMENTATION_SUMMARY.md` for technical details
3. Check `src/services/googleOAuthService.js` for code comments

---

**Status**: ✅ Ready to test with Google credentials  
**Time to setup**: ~10 minutes total  
**Next step**: Follow steps 1-4 above
