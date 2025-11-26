# 📱 Complete User Journey Guide

**Digital FlipBoard User Paths, Features & Limitations**  
**Last Updated**: November 25, 2025  
**Status**: ✅ Production Ready

---

## Table of Contents

1. [User Types & Tiers](#user-types--tiers)
2. [Anonymous User Journey](#anonymous-user-journey)
3. [Signed-In User Journey](#signed-in-user-journey)
4. [Pro User Journey](#pro-user-journey)
5. [Admin User Journey](#admin-user-journey)
6. [Feature Comparison Matrix](#feature-comparison-matrix)
7. [Limitations & Quotas](#limitations--quotas)
8. [Common Workflows](#common-workflows)
9. [Error Handling & Edge Cases](#error-handling--edge-cases)

---

## User Types & Tiers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            USER TYPES                                    │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
    │  ANONYMOUS   │       │  SIGNED-IN   │       │     PRO      │
    │   (Free)     │──────▶│   (Free)     │──────▶│  (Premium)   │
    └──────────────┘       └──────────────┘       └──────────────┘
    
    └─ Can use basic     └─ Can save boards  └─ Unlimited features
       features 1x/day      └─ Can create       └─ Advanced tools
       └─ Limited to        designs             └─ Sharing enabled
          60 seconds        └─ Basic sharing     └─ Custom branding
                            └─ Profile page

    ALSO: ADMIN (Superuser - manages platform)
    └─ Can view all users
    └─ Can grant/revoke admin roles
    └─ Can audit all actions
    └─ Can manage coupons
```

---

## Anonymous User Journey

### 📍 Path: No Account Required

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ANONYMOUS USER (No Login)                         │
│                    One free 60-second session per day                │
└─────────────────────────────────────────────────────────────────────┘

START
  │
  ├─ User visits: http://localhost:3000
  │
  ├─ Sees: Hero page with CTA "Get Started"
  │
  ├─ Clicks: "Get Started" → Navigates to /control
  │
  ├─ Sees: SessionPairing component (Scenario 1: Cold Start)
  │         "Connect Your Display"
  │         Code input field (blank, autofocused)
  │         "Connect Device" button (disabled)
  │
  ├─ Opens second browser/device → Navigates to /display
  │
  ├─ Sees: SessionCode component
  │         "Session Code: ABC123" (6-char code)
  │         Grid ready to receive messages
  │
  ├─ Returns to Control device, enters code "ABC123"
  │
  ├─ Clicks: "Connect Device" button
  │
  ├─ System: Checks free quota (freeSessionUsed in store)
  │          └─ IF already used today → Error: "Free session limit reached"
  │          └─ IF available → Increments freeSessionUsed counter
  │
  ├─ Connected: SessionPairing shows success
  │             Timer starts: 60 seconds countdown
  │             "Session expires in 00:59"
  │             (Amber warning at <15 seconds)
  │
  ├─ User: Types message in MessageInput component
  │
  ├─ Sends: Message via WebSocket
  │          Backend validates + broadcasts to session room
  │
  ├─ Display: Shows message with flip animation
  │
  ├─ Timer: Reaches 0
  │
  ├─ Session: Expires automatically (non-interrupting)
  │           Timer stops
  │           DigitalFlipBoardGrid freezes at last message
  │           SessionPairing shows: "Connection Expired"
  │
  ├─ Options displayed:
  │   1. "Reconnect to ABC123" (starts new session, uses daily quota)
  │   2. "Enter New Display Code" (if has quota remaining)
  │   3. "Sign In for Unlimited Access" (premium CTA)
  │
  ├─ If quota exhausted:
  │   └─ Shows: Upgrade modal with pricing
  │       "Sign in to unlock unlimited sessions"
  │       CTA: "Sign Up" or "Sign In"
  │
  └─ END
```

### ⏱️ Time Limits

| Aspect | Limit | Details |
|--------|-------|---------|
| **Session Duration** | 60 seconds | Timer starts when connected |
| **Inactivity Timeout** | N/A (No timeout) | As long as sending/receiving, continues |
| **Daily Quota** | 1 per day | 1 free session per calendar day |
| **Message Length** | 512 characters | Max message length |
| **Grid Size** | 6×22 (fixed) | Cannot customize |
| **Animations** | 5 basic options | Fade, Flip, Slide, Bounce, Flip-Random |
| **Colors** | 3 themes | Monochrome, Teal, Vintage |

### 🚫 Limitations

```
❌ Cannot save boards
❌ Cannot create custom designs
❌ Cannot share boards with others
❌ No user profile/account
❌ No design history
❌ Cannot customize grid size
❌ Limited to 60 seconds per session
❌ Only 1 free session per day
❌ No special effects (pro only)
```

### 📊 Session Example

```
00:00 - User connects, timer starts (60s)
00:15 - User sends "Hello World"
00:15 - Message animates on display
00:28 - User sends "Check this out!"
00:28 - Second message displays
00:45 - User sends "Cool!"
00:59 - Timer alerts: amber warning <15s
01:00 - Session expires, timer stops
        Display freezes with last message
        Control shows: "Connection Expired"
```

---

## Signed-In User Journey

### 📍 Path: User has Account (Free Tier)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SIGNED-IN USER (Free Tier)                      │
│            Account-based free user with full features               │
│                   Unlimited sessions (no quota)                     │
└─────────────────────────────────────────────────────────────────────┘

START
  │
  ├─ User visits: http://localhost:3000
  │
  ├─ Sees: Navigation bar with "Sign In" button
  │
  ├─ Clicks: "Sign In"
  │
  ├─ Presented with auth options:
  │   ├─ "Sign in with Google" (OAuth)
  │   ├─ "Continue with Magic Link" (email)
  │   └─ "Create Account" (password signup)
  │
  ├─ Completes auth flow (Google OAuth shown)
  │
  ├─ Redirected to: /dashboard
  │
  ├─ Sees: User profile page with:
  │   ├─ User avatar + name
  │   ├─ Subscription tier: "Free"
  │   ├─ Session count for today
  │   ├─ "Start New Session" button
  │   ├─ "Saved Boards" section (empty or list)
  │   ├─ "Account Settings"
  │   └─ "Sign Out" option
  │
  ├─ Clicks: "Start New Session" → Navigates to /control
  │
  ├─ Sees: SessionPairing component (Scenario 1: Cold Start, or Scenario 2: Returning)
  │         Since no prior session: "Connect Your Display"
  │
  ├─ Enters code from Display page (/display)
  │
  ├─ Clicks: "Connect Device"
  │
  ├─ System: Check free quota
  │          └─ Since signed in: NO QUOTA CHECK (unlimited)
  │          └─ Session allowed regardless of daily count
  │
  ├─ Connected: SessionPairing shows success
  │             No timer (sessions last until inactive 5+ min or hard 15 min limit)
  │             "Session active" indicator
  │
  ├─ User: Can now use MessageInput fully
  │         ├─ Type messages (512 char limit)
  │         ├─ Choose animation
  │         ├─ Choose color theme
  │         └─ Send infinitely
  │
  ├─ Features now available:
  │   ├─ MessageInput (full)
  │   ├─ AnimationPicker (5 options)
  │   ├─ ColorThemePicker (3 themes)
  │   ├─ SessionPairing (unlimited sessions)
  │   ├─ PreloadedMessages (quick send templates)
  │   ├─ Save Board option (NEW)
  │   ├─ Designer tab (LIMITED - pro only gets full)
  │   └─ Sharing panel (LIMITED sharing)
  │
  ├─ User: Sends messages, watches display update in real-time
  │
  ├─ After 15 minutes of activity:
  │   └─ Session expires (hard timeout)
  │   └─ Shows: "Connection Expired" overlay
  │   └─ Reconnect option uses no quota
  │
  ├─ User: Can save board
  │   ├─ Clicks: "Save Board" button
  │   ├─ Enters: Board name
  │   ├─ System: Saves to `boards` table in Supabase
  │   ├─ User: Can view saved boards in dashboard
  │   └─ Note: Free tier limited to 5 saved boards
  │
  ├─ User: Can share board
  │   ├─ Clicks: "Share Board" in SharingPanel
  │   ├─ Enters: Recipient email(s)
  │   ├─ System: Sends invitation email
  │   ├─ Recipient: Can access shared board
  │   └─ Note: Limited to 3 shares in free tier
  │
  ├─ User: Wants premium features
  │   ├─ Sees: "Upgrade" button in Designer tab
  │   ├─ Clicks: Navigate to /pricing
  │   ├─ Sees: Pricing page with pro/enterprise tiers
  │   ├─ Clicks: "Upgrade to Pro"
  │   ├─ Stripe checkout flow
  │   ├─ Payment processed
  │   ├─ Subscription updated: tier = 'pro'
  │   ├─ Dashboard updated: shows "Pro" badge
  │   └─ Pro features now unlocked
  │
  └─ END
```

### ⏱️ Time Limits & Quotas

| Aspect | Limit | Details |
|--------|-------|---------|
| **Session Duration** | 15 minutes | Per session (hard timeout) OR 5 min inactivity |
| **Daily Limit** | Unlimited | No daily cap, reconnect as needed |
| **Message Length** | 512 characters | Max per message |
| **Grid Size** | 6×22 (fixed) | Cannot customize |
| **Animations** | 5 basic | Fade, Flip, Slide, Bounce, Flip-Random |
| **Colors** | 3 themes | Monochrome, Teal, Vintage |
| **Saved Boards** | 5 max | Can save 5 custom boards |
| **Shares** | 3 per board | Can share with up to 3 people |
| **Design Templates** | 5 | Limited to pre-made templates |

### ✨ New Features Unlocked

```
✅ Unlimited sessions (no daily quota)
✅ Save boards (up to 5)
✅ Share boards (limited to 3 per board)
✅ PreloadedMessages (quick templates)
✅ User profile + dashboard
✅ Session history
✅ Basic designer (limited)
✅ Account settings
✅ Email preferences
```

### 🚫 Still Limited

```
❌ Cannot customize grid size
❌ Limited animation options
❌ Limited color themes
❌ No special effects
❌ No team management
❌ No API access
❌ No advanced designer tools
❌ No bulk operations
```

---

## Pro User Journey

### 📍 Path: Premium Subscriber

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PRO USER (Premium Tier)                         │
│              Full-featured access to all platform tools              │
│                   $9.99/month or annual discount                    │
└─────────────────────────────────────────────────────────────────────┘

START (Assuming already signed in as Free user)
  │
  ├─ User: Notices "Upgrade" prompts in limited features
  │
  ├─ Clicks: "Upgrade to Pro" button
  │
  ├─ Navigated to: /pricing page
  │
  ├─ Sees: Pricing tiers with comparison table
  │   ├─ Free: $0 (current)
  │   ├─ Pro: $9.99/month (with badge: "Most Popular")
  │   └─ Enterprise: Contact us
  │
  ├─ Clicks: "Subscribe to Pro" button
  │
  ├─ Redirected to: Stripe Checkout (hosted)
  │   ├─ Email: pre-filled
  │   ├─ Payment method: Card entry
  │   ├─ Billing period: Monthly (toggle for annual)
  │   └─ Button: "Subscribe for $9.99/month"
  │
  ├─ Payment processed
  │
  ├─ Success: Redirected to /dashboard with success banner
  │           "🎉 Welcome to Pro! All features unlocked"
  │
  ├─ Dashboard updates:
  │   ├─ Subscription tier: "Pro" (with badge)
  │   ├─ Billing section: Shows subscription details
  │   ├─ Cancel/manage button visible
  │   ├─ Invoice history available
  │   └─ Pro features badge on tabs
  │
  ├─ Navigation: Sees "Designer" tab now fully available
  │             (was "Upgrade" button before)
  │
  ├─ User opens Control page again
  │
  ├─ Sees: MessageInput with PRO-only features:
  │   ├─ Scheduler tab (send at specific times)
  │   ├─ Designer tab (custom grid layouts)
  │   ├─ Sharing panel (unlimited shares)
  │   └─ Brand customization (logo, colors)
  │
  ├─ Opens: Designer tab
  │
  ├─ Sees: GridEditor component with options:
  │   ├─ Custom grid size: 4×16 to 10×40 (configurable)
  │   ├─ Save custom layouts
  │   ├─ Load saved designs
  │   ├─ Template library (20+ templates)
  │   └─ Export as JSON/PNG
  │
  ├─ Creates: Custom 8×30 grid
  │           Saves as "My Custom Board"
  │
  ├─ Opens: Scheduler tab
  │
  ├─ Sees: Calendar + time picker
  │   ├─ "Schedule message for later"
  │   ├─ Select date & time
  │   ├─ Message preview
  │   ├─ Recurring options (daily, weekly, monthly)
  │   └─ Save schedule
  │
  ├─ Schedules: "Good Morning" message for 7 AM daily
  │
  ├─ Opens: SharingPanel
  │
  ├─ Sees: Unlimited sharing options (not limited to 3)
  │   ├─ "Invite users: " with email input
  │   ├─ "Manage access: " with existing shares
  │   ├─ Permissions: View, Edit, Delete options
  │   └─ Can invite unlimited users
  │
  ├─ Invites: "team@example.com" with Edit permissions
  │           "partner@example.com" with View permissions
  │
  ├─ Opens: Color theme customization
  │
  ├─ Sees: Advanced color picker
  │   ├─ Brand colors (define primary, secondary, accent)
  │   ├─ Custom animation speeds
  │   ├─ Custom fonts (5+ options instead of 3)
  │   ├─ Save brand profile
  │   └─ Apply to all displays
  │
  ├─ Saved Boards: Can save UNLIMITED boards (vs 5 for free)
  │
  ├─ Version History: Available (5+ versions per board)
  │
  ├─ Export Options:
  │   ├─ Download as PNG
  │   ├─ Download as MP4 (animation)
  │   ├─ Export settings as JSON
  │   └─ Share via link (permanent URL)
  │
  ├─ Analytics: Available on dashboard
  │   ├─ Sessions per month
  │   ├─ Popular messages
  │   ├─ Peak usage times
  │   └─ Engagement metrics
  │
  ├─ API Access: Available
  │   ├─ API documentation visible
  │   ├─ API keys generated in settings
  │   ├─ Can integrate with 3rd-party tools
  │   └─ Webhook support enabled
  │
  ├─ Team Management: (Enterprise feature, not in Pro)
  │   └─ Note: Shows "Enterprise required" message
  │
  ├─ Renewal: Automatic monthly on billing date
  │   └─ Email reminder sent 7 days before
  │   └─ Auto-renewal can be disabled
  │
  ├─ Cancellation (if decides to downgrade):
  │   ├─ Clicks: "Cancel Subscription" in settings
  │   ├─ Sees: "Are you sure?" confirmation
  │   ├─ Sees: Cancellation reason form (optional)
  │   ├─ Confirms: "Yes, cancel my subscription"
  │   ├─ Effective: End of current billing period
  │   ├─ Data: All saved boards preserved
  │   ├─ Features: Downgrade to Free tier features
  │   └─ Email: Confirmation sent
  │
  └─ END
```

### ✨ Pro Features Unlocked

| Feature | Free | Pro | Details |
|---------|------|-----|---------|
| Sessions | Unlimited | Unlimited | Both have unlimited daily |
| Saved Boards | 5 max | Unlimited | Pro can save as many as needed |
| Designer | Limited | Full | Pro gets custom grid editor |
| Animations | 5 basic | 15+ | Pro gets special effects |
| Themes | 3 | 10+ | Pro gets advanced customization |
| Sharing | 3 per board | Unlimited | Pro can invite unlimited users |
| Scheduler | ❌ | ✅ | Schedule messages for later |
| Version History | ❌ | ✅ (5+) | Track board changes |
| Export | ❌ | ✅ | Download as PNG, MP4, JSON |
| Analytics | ❌ | ✅ | Usage statistics + insights |
| API Access | ❌ | ✅ | Integrate with external tools |
| Custom Branding | ❌ | ✅ | Company colors, fonts, logo |
| Priority Support | ❌ | ✅ | Email support within 24h |
| Team Management | ❌ | ❌ | Enterprise only |

---

## Admin User Journey

### 📍 Path: Platform Administrator

```
┌─────────────────────────────────────────────────────────────────────┐
│                       ADMIN USER (Superuser)                         │
│         Manages platform, users, roles, and system health             │
│              Only accessible to granted admin accounts                │
└─────────────────────────────────────────────────────────────────────┘

PREREQUISITES
  ├─ Must be signed-in Pro user
  ├─ Must have admin role granted by another admin
  ├─ Role stored in `admin_roles` table
  └─ Requires isUserAdmin() check on login

START
  │
  ├─ User: Opens app while logged in as admin
  │
  ├─ Navigation: Updates to show "🔐 Admin" link
  │   ├─ Visible in navbar (next to Dashboard)
  │   ├─ Only if isAdmin = true in authStore
  │   └─ Appears on main navigation
  │
  ├─ Clicks: "🔐 Admin" link → Navigates to /admin
  │
  ├─ Route Guard: ProtectedAdminRoute verifies:
  │   ├─ User is authenticated
  │   ├─ User has admin role (checked in permission service)
  │   ├─ If not: Redirected to /dashboard
  │   └─ If yes: Proceeds to AdminLayout
  │
  ├─ Sees: Admin Dashboard
  │   ├─ Header: "Admin Dashboard" + user email
  │   ├─ Sidebar: Navigation menu with sections
  │   ├─ "← Back to User View" button
  │   └─ Main content area
  │
  ├─ Sidebar tabs:
  │   ├─ 📊 Dashboard (overview)
  │   ├─ 👥 User Management
  │   ├─ 🔐 Role Management
  │   ├─ 📋 Activity Log
  │   ├─ 💚 System Health
  │   └─ 🎟️  Coupon Management
  │
  ├─ Tab: Dashboard
  │   ├─ Shows: Platform overview
  │   ├─ Total users: 2,541
  │   ├─ Active sessions: 156
  │   ├─ Messages sent today: 12,456
  │   ├─ System health: Green (all systems OK)
  │   ├─ Revenue: $4,230 (this month)
  │   └─ Charts: User growth, activity trends
  │
  ├─ Tab: User Management
  │   ├─ Shows: Table of all users
  │   ├─ Columns: Email, Name, Tier, Join Date, Actions
  │   ├─ Search: Filter by email or name
  │   ├─ Filter: By tier (free, pro, enterprise)
  │   ├─ Sort: By join date, last activity, etc.
  │   ├─ Pagination: 25 users per page
  │   ├─ Actions per user:
  │   │   ├─ View profile
  │   │   ├─ Change subscription tier
  │   │   ├─ Suspend user
  │   │   ├─ Delete user (with confirmation)
  │   │   └─ View audit trail
  │   │
  │   ├─ Example: Admin clicks "View" on user "john@example.com"
  │   │   ├─ Sees: Full profile + detailed info
  │   │   ├─ Email: john@example.com
  │   │   ├─ Name: John Doe
  │   │   ├─ Tier: Free → can upgrade to Pro/Enterprise
  │   │   ├─ Joined: 3 months ago
  │   │   ├─ Sessions this month: 45
  │   │   ├─ Messages sent: 2,340
  │   │   ├─ Last active: 5 minutes ago
  │   │   ├─ Button: "Upgrade to Pro (for support)"
  │   │   └─ Button: "Suspend this user"
  │   │
  │   └─ Returns to list
  │
  ├─ Tab: Role Management (NEW)
  │   ├─ Subtabs:
  │   │   ├─ "Grant Admin" (search user, grant role)
  │   │   ├─ "All Admins" (view current admins)
  │   │   ├─ "Audit Log" (see all role changes)
  │   │   └─ "Search Users" (find users for grants)
  │   │
  │   ├─ Subtab: Grant Admin
  │   │   ├─ Search field: "Enter email to search"
  │   │   ├─ Search results: Shows matching users
  │   │   ├─ Clicks: Select user "sarah@example.com"
  │   │   ├─ Reason field: "Why grant admin?"
  │   │   ├─ Example: "Senior team member, needs access"
  │   │   ├─ Button: "Grant Admin Role"
  │   │   ├─ Verification: Email confirmation needed
  │   │   ├─ Email sent: "You've been granted admin role"
  │   │   ├─ Confirmation: "Admin role granted to sarah@example.com"
  │   │   ├─ Mixpanel: Tracked with reason
  │   │   ├─ Audit log: Entry created with timestamp
  │   │   └─ sarah: Can now see "🔐 Admin" link on next login
  │   │
  │   ├─ Subtab: All Admins
  │   │   ├─ Table: Current admins
  │   │   ├─ Columns: Email, Name, Granted By, Date Granted
  │   │   ├─ Total: "5 active admins"
  │   │   ├─ Actions per admin:
  │   │   │   ├─ "Revoke Role" (with confirmation)
  │   │   │   ├─ "View Details"
  │   │   │   └─ "View Audit Trail"
  │   │   │
  │   │   └─ Example: Admin hovers on "joe@example.com"
  │   │       ├─ Shows: "Granted by admin@example.com on Nov 20"
  │   │       ├─ Button: "Revoke" (red, with confirmation)
  │   │       └─ Note: "Cannot revoke self"
  │   │
  │   └─ Subtab: Audit Log
  │       ├─ Table: All role change events
  │       ├─ Columns: Action, User, Admin, Reason, Timestamp
  │       ├─ Filters: By action (grant, revoke, suspended)
  │       ├─ Search: By email or admin name
  │       ├─ Pagination: 50 entries per page
  │       └─ Export: "Download as CSV"
  │
  ├─ Tab: Activity Log
  │   ├─ Shows: All user actions on platform
  │   ├─ Columns: User, Action, Timestamp, Details
  │   ├─ Actions: Login, Message sent, Board saved, etc.
  │   ├─ Filters: By user, action type, date range
  │   ├─ Pagination: 50 per page
  │   ├─ Search: By user email
  │   └─ Export: "Download activity report"
  │
  ├─ Tab: System Health
  │   ├─ Shows: Platform status checks
  │   ├─ Database: ✅ Connected, responding
  │   ├─ WebSocket: ✅ Active, 156 connections
  │   ├─ Storage: ✅ 45% usage (45GB of 100GB)
  │   ├─ Emails: ✅ Queue: 23 pending
  │   ├─ Supabase: ✅ Responding normally
  │   ├─ Uptime: 99.98% (last 30 days)
  │   ├─ Response time: 245ms avg
  │   ├─ Errors today: 12 (0.01%)
  │   └─ Alerts: None (all green)
  │
  ├─ Tab: Coupon Management
  │   ├─ Shows: Discount codes for pro/enterprise
  │   ├─ Actions:
  │   │   ├─ "Create Coupon"
  │   │   ├─ "View all coupons"
  │   │   ├─ "Deactivate coupon"
  │   │   └─ "View redemption stats"
  │   │
  │   ├─ Create: Admin clicks "Create Coupon"
  │   │   ├─ Code: "BLACK50" (editable)
  │   │   ├─ Discount: 50% (can be fixed or percent)
  │   │   ├─ Tier: "Pro" (which tier is eligible)
  │   │   ├─ Expiry: Select date
  │   │   ├─ Usage limit: 100 redemptions max
  │   │   ├─ Notes: "Black Friday promotion"
  │   │   ├─ Button: "Create Coupon"
  │   │   └─ Confirmation: "Coupon created successfully"
  │   │
  │   └─ View: Admin clicks coupon "BLACK50"
  │       ├─ Shows: Coupon details
  │       ├─ Redeemed: 67 of 100
  │       ├─ Revenue impact: $3,350 total discounts
  │       ├─ Users: List of who used it
  │       ├─ Button: "Deactivate Coupon"
  │       └─ Button: "Extend Expiry"
  │
  ├─ Security Features Active:
  │   ├─ CSRF token: Generated + validated
  │   ├─ Rate limit: 5 operations per minute (enforced)
  │   ├─ All actions: Logged with timestamp + admin ID
  │   ├─ Error handling: User-friendly messages
  │   ├─ Input sanitization: DOMPurify on all inputs
  │   └─ Session: Auto-logout after 30 min inactivity
  │
  ├─ Rate Limiting Example:
  │   ├─ Admin grants 6 roles in 60 seconds
  │   ├─ 6th request: Shows "Rate limited"
  │   ├─ Message: "Try again in 45 seconds"
  │   ├─ Countdown timer: Visible + updates every second
  │   ├─ Button: Disabled until timeout expires
  │   └─ Retry: Automatic after countdown
  │
  ├─ Logs Everything:
  │   ├─ SUCCESS: "Admin role granted to user@email.com"
  │   ├─ FAILURE: "Grant attempt failed: User not found"
  │   ├─ TIMESTAMP: Nov 25, 2025 14:32:15
  │   ├─ ADMIN ID: User who performed action
  │   ├─ REASON: Optional reason provided
  │   └─ AUDIT: All searchable in Audit Log tab
  │
  ├─ When Done:
  │   ├─ Clicks: "← Back to User View" button
  │   ├─ Returns to: Dashboard or user's regular view
  │   ├─ Admin access: Persists until logout
  │   ├─ Session: Subject to 30-min inactivity timeout
  │   └─ Next login: "🔐 Admin" link shown again
  │
  └─ END
```

### 🔐 Admin Security & Restrictions

```
CSRF PROTECTION
├─ Every admin action requires CSRF token
├─ Token generated: Valid for 10 minutes
├─ Token usage: One-time only (consumed after use)
├─ Token validation: Server checks on every request
├─ Error: Expired/invalid token → Clear error message
└─ Result: Prevents cross-site admin attacks

RATE LIMITING
├─ Limit: 5 admin operations per minute
├─ Per admin: Tracked separately
├─ Operations: Grant, Revoke, User edit, etc.
├─ When exceeded: User sees countdown timer
├─ Auto-retry: After timer expires
└─ Logging: Rate limit hits logged

AUDIT LOGGING
├─ What's logged:
│   ├─ Action type (GRANT, REVOKE, SUSPEND, etc)
│   ├─ Who performed it (admin ID)
│   ├─ Who was affected (user ID)
│   ├─ When (timestamp)
│   ├─ Reason (if provided)
│   ├─ Result (success/failure)
│   └─ Error message (if failed)
│
├─ Where stored: role_change_audit_log table
├─ Who can view: Admins only (via Audit Log tab)
├─ Searchable: Yes (by user, admin, date range)
├─ Exportable: Yes (as CSV)
└─ Retention: Permanent (for compliance)

SESSION SECURITY
├─ Inactivity timeout: 30 minutes
├─ Session location: Httponly cookies (if self-hosted)
├─ Login requirement: Admin role persists until logout
├─ Multi-device: Each device has separate session
└─ Logout: Clears all admin permissions
```

---

## Feature Comparison Matrix

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        FEATURE COMPARISON TABLE                            │
├──────────────────────────┬───────────┬────────────┬──────────┬──────────────┤
│ Feature                  │ Anonymous │ Free/Login │   Pro    │    Admin     │
├──────────────────────────┼───────────┼────────────┼──────────┼──────────────┤
│ Connect Display          │     ✅    │     ✅     │    ✅    │      ✅      │
│ Send Messages            │     ✅    │     ✅     │    ✅    │      ✅      │
│ Session Duration         │   60 sec  │  15 min    │  15 min  │    15 min    │
│ Daily Sessions           │  1 free   │ Unlimited  │ Unlimited│   Unlimited  │
│ Create Account           │     ❌    │     ✅     │    ✅    │      ✅      │
│ Save Boards              │     ❌    │   5 max    │ Unlimited│   Unlimited  │
│ Share Boards             │     ❌    │   3 limit  │ Unlimited│   Unlimited  │
│ Designer Tab             │     ❌    │   Limited  │   Full   │     Full     │
│ Custom Grid Size         │     ❌    │     ❌     │    ✅    │      ✅      │
│ Animation Options        │     5     │     5      │   15+    │      15+     │
│ Color Themes             │     3     │     3      │   10+    │      10+     │
│ Scheduler                │     ❌    │     ❌     │    ✅    │      ✅      │
│ Version History          │     ❌    │     ❌     │   5+     │      5+      │
│ Export (PNG/MP4/JSON)    │     ❌    │     ❌     │    ✅    │      ✅      │
│ Analytics                │     ❌    │     ❌     │    ✅    │      ✅      │
│ API Access               │     ❌    │     ❌     │    ✅    │      ✅      │
│ Custom Branding          │     ❌    │     ❌     │    ✅    │      ✅      │
│ Priority Support         │     ❌    │     ❌     │    ✅    │      ✅      │
│ Team Management          │     ❌    │     ❌     │    ❌    │      ✅      │
│ User Management          │     ❌    │     ❌     │    ❌    │      ✅      │
│ Admin Role Grant         │     ❌    │     ❌     │    ❌    │      ✅      │
│ Audit Logs               │     ❌    │     ❌     │    ❌    │      ✅      │
│ System Health            │     ❌    │     ❌     │    ❌    │      ✅      │
│ Coupon Management        │     ❌    │     ❌     │    ❌    │      ✅      │
└──────────────────────────┴───────────┴────────────┴──────────┴──────────────┘
```

---

## Limitations & Quotas

### Anonymous User Quotas

```
Daily Quota
├─ Sessions: 1 per calendar day (UTC)
├─ Session duration: 60 seconds (hard limit)
├─ Message length: 512 characters max
├─ Grid size: 6×22 (fixed, cannot change)
├─ Animations: 5 basic options
├─ Colors: 3 themes (Monochrome, Teal, Vintage)
└─ Saves: None (no account)

Soft Limits (Warnings)
├─ Rate limiting: 10 messages per minute (client-side)
├─ Connection: Session expires after 60 seconds
└─ Reset: Countdown timer shows before expiry
```

### Free/Signed-In User Quotas

```
Session Quotas
├─ Sessions: Unlimited daily
├─ Session duration: 15 minutes (hard timeout)
│                    OR 5 minutes inactivity (soft timeout)
├─ Concurrent sessions: 1 at a time (no parallel sessions)
└─ Connections: Can reconnect unlimited times

Messaging
├─ Message length: 512 characters max
├─ Messages per session: Unlimited
├─ Messages per minute: 10 (client-side rate limit)
├─ Message retention: 30 days

Customization
├─ Grid size: 6×22 fixed (cannot customize)
├─ Animations: 5 basic options only
├─ Color themes: 3 themes (no custom colors)
├─ Grid editor: Limited (can't save custom grids)

Saved Data
├─ Saved boards: 5 maximum
├─ Board versions: 2 versions max (current + 1 previous)
├─ Storage: 100 MB per account
└─ Retention: Until account deleted

Sharing
├─ Share recipients: 3 people per board
├─ Share permissions: View only
├─ Sharing duration: Unlimited (until revoked)
└─ Public links: Not available
```

### Pro User Quotas (Effectively Unlimited)

```
Session Quotas
├─ Sessions: Unlimited daily
├─ Session duration: 15 minutes (hard timeout)
│                    OR 5 minutes inactivity
├─ Concurrent: 1 at a time (same as free)
└─ Reconnects: Unlimited

Messaging
├─ Message length: 512 characters (same limit)
├─ Messages per session: Unlimited
├─ Messages per minute: 100 (higher than free)
├─ Message retention: Lifetime (never deleted)

Customization
├─ Grid size: 4×16 to 10×40 (fully customizable)
├─ Animations: 15+ options including effects
├─ Color themes: 10+ themes + custom colors
├─ Grid editor: Full access to template library

Saved Data
├─ Saved boards: Unlimited
├─ Board versions: 10+ versions with full history
├─ Storage: 10 GB per account
├─ Retention: Lifetime (until manual delete)

Sharing
├─ Share recipients: Unlimited
├─ Permissions: View, Edit, Delete (granular)
├─ Sharing duration: Unlimited
├─ Public links: Shareable permanent URLs

Advanced Features
├─ Scheduled messages: Unlimited
├─ API calls: 10,000 per month
├─ Webhooks: 100 per month
├─ Export: Unlimited (PNG, MP4, JSON, CSV)
└─ Analytics: Full access (30-day rolling window)
```

### Admin User Permissions

```
User Management
├─ View all users: Yes
├─ View user details: Yes
├─ Change user tier: Yes (upgrade/downgrade)
├─ Suspend user: Yes (with reason + audit log)
├─ Delete user: Yes (permanent, with confirmation)
└─ View user activity: Full audit trail

Role Management (NEW)
├─ Grant admin role: Yes (5/min rate limit)
├─ Revoke admin role: Yes (5/min rate limit)
├─ View all admins: Yes
├─ View audit log: Full (all role changes)
├─ Cannot revoke self: Enforced
├─ Cannot grant to non-existent users: Validated
└─ Every action logged: Permanently

Coupon Management
├─ Create coupons: Yes
├─ Set discount: Yes (% or fixed amount)
├─ Set expiry: Yes
├─ Set usage limits: Yes
├─ View redemption: Full stats
├─ Deactivate coupon: Yes
└─ View impact: Revenue calculations

Monitoring
├─ View system health: Yes
├─ View active sessions: Yes (count + IPs)
├─ View error rates: Real-time
├─ View activity logs: Full (searchable)
├─ View audit trails: All role changes + admin actions
└─ Export reports: CSV format

Restrictions
├─ Rate limit: 5 operations per minute
├─ CSRF protection: Every action requires token
├─ Session timeout: 30 minutes inactivity
├─ Email verification: May be required for critical actions
└─ Log retention: All actions logged permanently
```

---

## Common Workflows

### Workflow 1: Anonymous → First Trial

```
Goal: Try the app without account
Time: ~3 minutes

1. Visit http://localhost:3000
2. Click "Get Started"
3. See Control page (Scenario 1: Cold Start)
4. Open /display in second device
5. Enter code from Display
6. Send 2-3 test messages
7. Watch animations
8. Session expires after 60 seconds
9. Decides: "This is cool!" → Sign up
```

### Workflow 2: First-Time Sign Up

```
Goal: Create account + connect display
Time: ~5 minutes

1. Click "Sign Up" on login page
2. Choose: Google OAuth (recommended)
3. Approve permissions
4. Auto-redirect to Dashboard
5. See: "Saved Boards" section (empty)
6. Click: "Start New Session"
7. Navigate to /control
8. See: SessionPairing (Scenario 1: Cold Start)
9. Open /display in second device
10. Connect using code
11. No more 60-second limit!
```

### Workflow 3: Returning User Reconnects

```
Goal: Quick reconnect to previous display
Time: ~2 minutes

1. Open /control (localStorage has lastSessionCode)
2. See: SessionPairing (Scenario 2: Returning)
3. "Welcome back! 👋 Continue with ABC123"
4. Click: "🔄 Continue with ABC123"
5. Connected immediately (no quota used)
6. Display receives messages
7. Can reconnect all day (unlimited sessions)
```

### Workflow 4: Upgrade to Pro

```
Goal: Unlock premium features
Time: ~5 minutes

1. Try Designer tab, see "Upgrade" button
2. Click: "Upgrade to Pro"
3. See: Pricing page with comparison
4. Click: "Subscribe to Pro" button
5. Stripe checkout (card entry)
6. Confirm payment ($9.99)
7. Success: Redirect to Dashboard
8. See: "Welcome to Pro! 🎉"
9. Subscription tier: Updated to "Pro"
10. All tabs now fully available
```

### Workflow 5: Admin Grants Another Admin

```
Goal: Onboard new admin team member
Time: ~3 minutes

1. Admin user clicks: "🔐 Admin" link
2. Navigate to /admin → Admin Dashboard
3. Click: "Role Management" → "Grant Admin"
4. Search: "newadmin@example.com"
5. Select user from results
6. Reason: "New team lead"
7. Click: "Grant Admin Role"
8. CSRF token: Auto-generated + verified
9. Rate limit: Checked (5/min)
10. Success: "Admin role granted"
11. Audit log: Entry created automatically
12. Email: Sent to newadmin@example.com
13. Next time newadmin logs in: "🔐 Admin" link visible
```

### Workflow 6: Admin Views Activity

```
Goal: Check who did what on platform
Time: ~5 minutes

1. Admin navigates to /admin
2. Clicks: "Activity Log" tab
3. Sees: Chronological list of all actions
4. Columns: User, Action, Time, Details
5. Can search by: Email, action type, date range
6. Example filter: "action:login date:today"
7. Results: All logins from today
8. Example filter: "email:john@example.com"
9. Results: All actions by John
10. Can export: "Download activity report" (CSV)
11. Report includes: Timestamps, user info, action details
```

---

## Error Handling & Edge Cases

### Error 1: Quota Exceeded (Anonymous)

```
Scenario: Anonymous user tries to start 2nd session today

Flow:
1. User enters code at /control
2. System checks: freeSessionUsed counter
3. Already used: 1 (from earlier)
4. Today's quota: 1
5. Result: Error dialog appears

Message: "❌ Free session limit reached"
"You have 1 free session per day. Please sign in for unlimited access."

CTAs:
├─ "Sign Up Now" (primary)
└─ "Sign In" (secondary)

Mixpanel: Tracks event "quota_exceeded"
User experience: Clear explanation + path to upgrade
```

### Error 2: CSRF Token Invalid (Admin)

```
Scenario: Admin tries to grant role, token expired (>10 min)

Flow:
1. Admin searches user at 2:00 PM
2. Fills in details
3. Waits... does something else
4. Returns to page at 2:15 PM
5. Clicks: "Grant Admin Role"
6. System checks: Token generated at 2:00 PM (15 min ago)
7. Token TTL: 10 minutes (expired)
8. Result: Error

Message: "🔒 Security token expired"
"For security, tokens expire after 10 minutes. Please refresh the page and try again."

Action: Page refresh auto-generates new token
Mixpanel: Tracks "csrf_token_expired"
Result: User can immediately retry (token renewed)
```

### Error 3: Rate Limited (Admin)

```
Scenario: Admin grants 6 roles in 60 seconds

Flow:
1. Admin grants role #1 - Success
2. Admin grants role #2 - Success
3. Admin grants role #3 - Success
4. Admin grants role #4 - Success
5. Admin grants role #5 - Success
6. Admin grants role #6 at 00:55 - RATE LIMITED
7. System checks: 5 ops in 60s (limit exceeded)

Message: "⏱️ Rate limited"
"You're performing actions too quickly. Try again in 45 seconds."

UI Changes:
├─ Form disabled
├─ Submit button: Gray (disabled)
├─ Countdown timer: Shows "00:45" and counts down
├─ Timer updates: Every 1 second
├─ Auto-enable: After countdown reaches 0

Mixpanel: Tracks "rate_limit_hit"
Expected behavior: This is expected + communicated
```

### Error 4: User Not Found (Admin)

```
Scenario: Admin tries to grant role to non-existent user

Flow:
1. Admin searches: "nobody@example.com"
2. System queries: profiles table
3. No match found
4. Admin selects non-existent user (edge case)
5. Clicks: "Grant Admin Role"
6. Backend validates: User doesn't exist
7. Result: Error

Message: "👤 User not found"
"The selected user doesn't exist in our system. Please verify the email and try again."

What happened: User deleted their account after search
Expected behavior: Clear error + suggest search again
Mixpanel: Tracks "user_not_found_error"
Recovery: User can search again (may find different result)
```

### Error 5: Connection Expired (During Use)

```
Scenario: User's session times out during active use

Flow:
1. User connected at 2:00 PM
2. Actively sending messages
3. At 2:15 PM: 15-minute hard timeout reached
4. System: Expires session automatically
5. Display: Freezes with last message

UI on Control:
├─ MessageInput: Becomes disabled
├─ Message: "⏱️ Session Expired"
├─ Overlay: Shows two options
│  ├─ "🔄 Reconnect to ABC123" (primary, teal)
│  └─ "➕ Enter New Display Code" (secondary, outline)

Duration: 15 minutes OR 5 min inactivity (whichever first)
Warning: Amber icon + pulse at <2 minutes remaining
Reconnect: Doesn't use quota (if anonymous/free)
Mixpanel: Tracks "session_expired" + reason (timeout|inactivity)
```

### Error 6: WebSocket Disconnected (Backend Down)

```
Scenario: Backend server suddenly goes down

Flow:
1. User connected, sending messages
2. Backend server: Crashes or network fails
3. WebSocket: Connection drops
4. Frontend: Tries to send message
5. Timeout: No response after 5 seconds
6. System: Attempts reconnect (exponential backoff)

Initial State:
├─ Message input: Gray (disabled temporarily)
├─ Icon: Red dot → Blinking red (connecting)
├─ Message: "🔄 Reconnecting..."
├─ Countdown: Retry in 3, 2, 1...

Retry Logic:
├─ Attempt 1: Retry after 2 seconds
├─ Attempt 2: Retry after 4 seconds
├─ Attempt 3: Retry after 8 seconds
├─ Attempt 4: Retry after 16 seconds
├─ Attempt 5: Retry after 30 seconds (final attempt)
├─ Max retries: 5 attempts
└─ Total time: ~60 seconds

After 5 failed attempts:
├─ Icon: Red dot (permanent)
├─ Message: "❌ Connection Lost"
├─ CTA: "Reconnect Manually"
├─ User action: Click button to retry
└─ Backend: Message once restored

Mixpanel: Tracks "websocket_disconnected" + recovery
Messages: Queued locally, sent when connected
User experience: Clear communication + recovery path
```

### Error 7: Inactivity Timeout (Anonymous)

```
Scenario: Anonymous user's 60-second session expires from inactivity

But note: Anonymous user's 60-sec timer doesn't pause for inactivity
It's a hard 60-second limit from connection

Flow:
1. User connects at 2:00:00 PM
2. Sends message at 2:00:15
3. Sends another at 2:00:45
4. Does nothing from 2:00:45 - 2:01:00
5. At 2:01:00 exactly: Timer expires
6. Session: Ends (regardless of activity)

Result:
├─ Display: Freezes with last message
├─ Control: Shows "Connection Expired"
├─ Options: Reconnect or new code
└─ Free quota: Exhausted for day

Note: Unlike Free tier (5-min inactivity), 
Anonymous has hard 60-sec timer (no inactivity reset)
```

### Error 8: Invalid Grid Size (Pro User)

```
Scenario: Pro user tries to create grid outside valid range

Flow:
1. User in Designer tab
2. Custom grid editor: Enters "12×50"
3. System checks: Valid range is 4×16 to 10×40
4. 12 > 10 (exceeds max rows)
5. 50 > 40 (exceeds max columns)
6. Validation: FAILS

Message: "⚠️ Grid size out of range"
"Please use between 4-10 rows and 16-40 columns. Example: 8×30"

What happens:
├─ Input field: Highlights in red
├─ Save button: Disabled
├─ Suggestion: Shows valid example (8×30)
├─ User corrects: Clicks OK
└─ Save: Now enabled

Mixpanel: Tracks "invalid_grid_attempted"
Result: Prevents invalid states in database
```

---

## Session Timeout Reference

```
┌─────────────────────────────────────────────────────────────┐
│              SESSION TIMEOUT SUMMARY                         │
├──────────────┬──────────────────┬──────────┬─────────────────┤
│ User Type    │ Hard Timeout     │ Soft     │ Restart Quota   │
│              │ (Max Duration)   │ Timeout  │ Impact          │
├──────────────┼──────────────────┼──────────┼─────────────────┤
│ Anonymous    │ 60 seconds       │ N/A      │ Reconnect uses  │
│              │                  │          │ next daily quota │
├──────────────┼──────────────────┼──────────┼─────────────────┤
│ Free/SignIn  │ 15 minutes       │ 5 min    │ Reconnect FREE  │
│              │                  │ inactivity│ (no quota hit)  │
├──────────────┼──────────────────┼──────────┼─────────────────┤
│ Pro          │ 15 minutes       │ 5 min    │ Reconnect FREE  │
│              │                  │ inactivity│ (unlimited)     │
├──────────────┼──────────────────┼──────────┼─────────────────┤
│ Admin        │ Session + 30 min │ N/A      │ N/A (not a      │
│              │ admin inactivity │          │ feature for     │
│              │                  │          │ admins)         │
└──────────────┴──────────────────┴──────────┴─────────────────┘

Notes:
- Hard timeout: Maximum time session can last
- Soft timeout: Session expires after NO activity
- Reconnect quota: Does it count against daily limit?
  └─ Anonymous: YES (uses 1 of 1 daily)
  └─ Free/Pro: NO (unlimited free reconnects)
```

---

## Security Considerations

### Data Privacy

| User Type | What We Store | Retention | Access |
|-----------|--------------|-----------|--------|
| Anonymous | Session code, messages | 24 hours | Only during session |
| Free/Pro | Account info, boards, messages | Lifetime | User + admin access |
| Admin | Full audit trail | Lifetime | Admin-only (encrypted) |

### Authentication Methods

```
Anonymous
├─ No auth required
├─ Session-based (socket.io session ID)
└─ ~1 hour timeout (server-side)

Free/Pro User
├─ Supabase Auth (passwordless + OAuth)
├─ Magic link (email) or Google OAuth
├─ Session stored: httpOnly cookies (for web) + localStorage
├─ Auto-refresh: 24 hours
└─ Logout: Clears all data

Admin
├─ Must have: Signed-in account + admin role
├─ Role check: isUserAdmin() on login
├─ Session: 30-minute inactivity timeout
├─ Actions: All CSRF-protected + rate-limited
└─ Logout: Revokes admin permissions
```

---

## Support & Help

### For Different User Types

**Anonymous Users**:
- Help page: General features
- FAQ: How sessions work, quotas
- CTA: Sign up for unlimited

**Free/Pro Users**:
- Help page: Full documentation
- Email support: pro@example.com
- Community forum: Stack Overflow tag
- Priority: Pro gets 24h response

**Admin Users**:
- Admin docs: Comprehensive guide (this file)
- Email support: admin-support@example.com
- Slack channel: Internal team
- Priority: Immediate response

---

## Summary Table

```
┌────────────────────────────────────────────────────────────┐
│        QUICK REFERENCE: USER JOURNEY SUMMARY               │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ ANONYMOUS (No Account)                                     │
│ ├─ Best for: Quick trial, demos                           │
│ ├─ Session: 60 seconds, 1 per day                         │
│ ├─ Features: Basic messaging, 5 animations               │
│ └─ Cost: FREE                                             │
│                                                             │
│ SIGNED-IN (Free Account)                                   │
│ ├─ Best for: Regular users, trying platform              │
│ ├─ Sessions: Unlimited daily (15 min each)               │
│ ├─ Features: + saved boards, basic designer              │
│ └─ Cost: FREE forever                                     │
│                                                             │
│ PRO (Premium Subscription)                                 │
│ ├─ Best for: Teams, professional use, integrations       │
│ ├─ Everything: All features enabled                       │
│ ├─ Features: Scheduler, export, API, analytics           │
│ └─ Cost: $9.99/month (or annual)                          │
│                                                             │
│ ADMIN (Superuser)                                          │
│ ├─ Best for: Platform management, user support            │
│ ├─ Access: User management, role grants, audit logs       │
│ ├─ Security: CSRF tokens + rate limiting + logging        │
│ └─ Cost: No additional cost (granted by existing admin)    │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

**Last Updated**: November 25, 2025  
**Version**: 1.0 (Complete)  
**Status**: ✅ Production Ready

See also: [ARCHITECTURE.md](./ARCHITECTURE.md), [SECURITY.md](./SECURITY.md), [00-README.md](./00-README.md)
