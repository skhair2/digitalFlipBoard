# User Tracking Implementation - Complete

## Overview
Comprehensive user profile tracking has been implemented across all authentication methods (password signup, Google OAuth, magic link) to track signup methods, email verification status, and welcome email delivery.

## Database Schema Changes

### Migration Applied: `011_add_user_tracking_columns`
**Status:** ✅ Applied to Supabase production database

New columns added to `profiles` table:
```sql
welcome_email_sent BOOLEAN DEFAULT FALSE
email_verified BOOLEAN DEFAULT FALSE  
signup_method TEXT CHECK (signup_method IN ('password', 'google_oauth', 'magic_link'))
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### Database Indexes
Created for query optimization:
- `idx_profiles_signup_method` - for analytics on signup methods
- `idx_profiles_email_verified` - for finding unverified emails
- `idx_profiles_welcome_email_sent` - for email campaign tracking

## Implementation Details

### 1. Password Signup Flow (`src/store/authStore.js`)
**Function:** `signUpWithPassword(email, password, fullName)`

**Flow:**
1. User signs up via password form
2. Supabase creates auth account
3. Profile created with:
   - `signup_method: 'password'`
   - `email_verified: false` (user must click verification link)
   - `created_at: ISO timestamp`
4. Welcome email sent via emailService
5. After successful email send, `welcome_email_sent: true` set in database
6. If email fails, flag remains false and error is logged

**Tracking:**
- Mixpanel event: `User Signed Up` (method: 'password')
- Mixpanel event: `Welcome Email Sent` (on success)
- Mixpanel event: `Welcome Email Failed` (on error)

### 2. Google OAuth Flow (`src/pages/OAuthCallback.jsx`)
**Trigger:** User completes Google OAuth challenge

**Flow:**
1. Session retrieved from Supabase session store
2. User's full_name extracted from `user.user_metadata.full_name`
3. Profile upserted with:
   - `signup_method: 'google_oauth'`
   - `email_verified: false` (until user manually verifies)
   - `created_at: ISO timestamp`
4. Existing profiles updated with name/verification status if needed
5. Session stored in localStorage and URL
6. Redirect to Display or Dashboard based on session role

**Tracking:**
- Mixpanel event: `Google OAuth Login` (tracks user acquisition)

### 3. Magic Link Flow (`src/pages/OAuthCallback.jsx`)
**Trigger:** User clicks magic link in email (type=recovery or type=signup)

**Flow:**
1. Session retrieved from Supabase
2. Profile created with:
   - `signup_method: 'magic_link'`
   - `email_verified: true` (magic link validates ownership)
   - `created_at: ISO timestamp`
3. Existing profiles updated with verification status
4. Session established and stored

**Tracking:**
- Mixpanel event: `Magic Link Login` (tracks user acquisition)

## Data Flow Diagram

```
User Signs Up
    ↓
┌─────────────────────────────────────┐
│ Authentication Method:              │
│ • Password                          │
│ • Google OAuth                      │
│ • Magic Link                        │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Create/Update Profile               │
│ • signup_method (password|google...) │
│ • email_verified (false/true)       │
│ • full_name (from Google or input)  │
│ • created_at (timestamp)            │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Send Welcome Email (if password)    │
│ • emailService.sendWelcome()        │
│ • Update welcome_email_sent: true   │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Track in Analytics (Mixpanel)       │
│ • User Signed Up                    │
│ • Welcome Email Sent/Failed         │
└─────────────────────────────────────┘
```

## Analytics Queries

### Find users by signup method:
```sql
SELECT signup_method, COUNT(*) as count 
FROM profiles 
GROUP BY signup_method;
```

### Find unverified emails:
```sql
SELECT email, signup_method, created_at 
FROM profiles 
WHERE email_verified = FALSE 
ORDER BY created_at DESC;
```

### Find users without welcome email:
```sql
SELECT email, signup_method, created_at 
FROM profiles 
WHERE signup_method = 'password' 
AND welcome_email_sent = FALSE 
ORDER BY created_at DESC;
```

## Testing Checklist

- [ ] Password signup creates profile with all tracking columns
- [ ] Password signup triggers welcome email and sets `welcome_email_sent: true`
- [ ] Google OAuth captures full_name from Google account
- [ ] Google OAuth sets `signup_method: 'google_oauth'`
- [ ] Magic link sets `signup_method: 'magic_link'` and `email_verified: true`
- [ ] Existing profiles updated if re-authenticating
- [ ] Mixpanel events track signup methods correctly
- [ ] Database queries work correctly with new indexes

## Files Modified

1. **src/store/authStore.js**
   - Updated `signUpWithPassword()` to create profiles with tracking columns
   - Added welcome email sending with flag update
   - Added error handling for email failures

2. **src/pages/OAuthCallback.jsx**
   - Already updated in previous commits to track signup_method and email_verified
   - Captures full_name from Google user_metadata
   - Sets created_at timestamp

3. **supabase/migrations/011_add_user_tracking_columns.sql**
   - Migration file created and applied
   - All four columns added with proper defaults
   - Indexes created for optimization

## Security Considerations

1. **Email Verification:** Flag tracks verification status without storing verification codes
2. **RLS Policies:** Ensure profiles table has proper RLS policies to prevent unauthorized access
3. **Data Privacy:** Welcome email flag helps with compliance (knowing who was contacted)
4. **Signup Method:** Enables feature flags based on auth method (e.g., password-only features)

## Performance Notes

- Added indexes on `signup_method`, `email_verified`, `welcome_email_sent` for fast querying
- Defaults set on all columns to reduce NULL handling
- CHECK constraint on signup_method ensures data integrity

## Future Enhancements

1. **Email Campaign Tracking:** Use `welcome_email_sent` flag to retry failed sends
2. **Signup Source Analytics:** Breakdown user acquisition by method and time
3. **Account Verification:** Email verification reminders for unverified accounts
4. **Feature Gating:** Different features available based on signup_method
5. **Re-engagement Campaigns:** Target users without welcome emails
