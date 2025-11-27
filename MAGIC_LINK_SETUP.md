# Magic Link Authentication Setup

## Overview
Magic Link authentication allows users to sign in without passwords using email-based authentication.

## How It Works

1. **User enters email** → Login page, "Magic Link" tab
2. **User agrees to Terms & Privacy** → Checkbox required
3. **Send Magic Link** → Email sent to user's inbox
4. **User clicks link in email** → Redirected to `/auth/callback?type=signup`
5. **Supabase creates session** → User automatically authenticated
6. **Profile created** → New user profile in database
7. **User redirected** → Taken to dashboard

## Implementation Details

### Frontend Flow
- **Login.jsx**: User enters email and clicks "Send Magic Link"
- **authStore.js**: `signUpWithMagicLink()` calls Supabase OTP
- **OAuthCallback.jsx**: Handles magic link callback with `type=signup` or `type=recovery`

### Backend (Supabase)
1. Magic link sent to user email
2. User clicks link with `type=signup` parameter
3. Supabase creates session automatically
4. Application retrieves session and creates profile

### Key Files
- `src/pages/Login.jsx` - Magic Link form input
- `src/store/authStore.js` - Magic link signup function
- `src/pages/OAuthCallback.jsx` - Magic link callback handler
- `src/services/supabaseClient.js` - Supabase configuration

## Supabase Configuration Required

### Email Configuration
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Verify "Confirm signup" template is configured
3. Template should include magic link with type=signup

### Redirect URL
- Default: `http://localhost:5173/auth/callback` (development)
- Production: `https://flipdisplay.online/auth/callback`

### Email Provider (Resend)
- Currently configured with Resend API
- API Key: `RESEND_API_KEY` in `.env`
- Email sender: noreply@flipdisplay.online

## Testing Locally

1. **Start the app**:
   ```bash
   npm run dev
   npm run server:dev
   ```

2. **Go to Login page**:
   - Navigate to `http://localhost:3000/login`
   - Click "Magic Link" tab

3. **Enter test email**:
   - Check Terms & Privacy
   - Click "Send Magic Link"
   - Should see success message

4. **Check email**:
   - Email client (Gmail, Outlook, etc.)
   - Look for "Confirm your signup" email
   - Click the magic link

5. **Verify login**:
   - Should redirect to `/auth/callback`
   - Then redirect to `/dashboard`
   - User profile should be created

## Troubleshooting

### Error: "No session found after magic link"
- ✅ Verify redirect URL matches Supabase configuration
- ✅ Check Supabase auth settings are correct
- ✅ Clear browser localStorage and try again

### Error: "Failed to create profile"
- ✅ Check that `profiles` table exists in Supabase
- ✅ Verify RLS policies allow profile insertion
- ✅ Check database permissions

### Email not received
- ✅ Check Resend API key is valid
- ✅ Check email address is correct (no typos)
- ✅ Check spam/junk folder
- ✅ Verify Supabase email templates are configured

### Magic link not working after clicking
- ✅ Link may have expired (typically 24 hours)
- ✅ Request new magic link
- ✅ Check browser console for errors
- ✅ Verify callback page is loading correctly

## Security Features

✅ **Email verification** - User must have access to email
✅ **Time-limited tokens** - Links expire after 24 hours
✅ **No passwords stored** - More secure than password auth
✅ **Terms acceptance** - Mandatory terms agreement
✅ **Audit logging** - All signups tracked in Mixpanel

## Analytics Tracking

When a user signs up with magic link:
- Event: "Magic Link Sent" - When email is sent
- Event: "Magic Link Login" - When user completes login
- User property: `signup_method` = "magic_link"
- User property: `signup_date` = ISO timestamp

## Comparison with Other Auth Methods

| Method | Pros | Cons |
|--------|------|------|
| **Magic Link** | No password needed, email verified, secure | Requires email access |
| **Google OAuth** | Quick signup, existing Google account | Privacy concerns, external dependency |
| **Password** | Simple, offline capable | Weak passwords, forgot password complexity |

---

**Last Updated**: November 26, 2025
**Status**: ✅ Fully Implemented & Working
