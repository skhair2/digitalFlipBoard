# Plan Limits Integration Guide

## Overview

The Digital FlipBoard application now has a comprehensive plan limits system that restricts features based on user subscription tiers. There are three subscription levels:

### Subscription Tiers

#### 1. **Free Plan**
- **Price**: $0/month
- **Displays**: 1
- **Messages/Day**: 50
- **Scheduled Messages**: 0
- **Features**:
  - ✓ Create sessions
  - ✓ Send messages
  - ✓ View boards
  - ✗ Designer tool
  - ✗ Schedule messages
  - ✗ Share boards
  - ✗ Export designs
  - Max Saved Designs: 3

#### 2. **Pro Plan**
- **Price**: $9.99/month
- **Displays**: 5
- **Messages/Day**: 500
- **Scheduled Messages**: 50
- **Features**:
  - ✓ All Free features
  - ✓ Designer tool
  - ✓ Schedule messages
  - ✓ Share boards
  - ✓ Export designs
  - ✓ Analytics
  - Max Saved Designs: 50

#### 3. **Premium Plan**
- **Price**: $29.99/month
- **Displays**: Unlimited (999)
- **Messages/Day**: Unlimited (9999)
- **Scheduled Messages**: Unlimited (9999)
- **Features**:
  - ✓ All Pro features
  - ✓ Priority support
  - ✓ Custom branding
  - ✓ API access
  - ✓ Webhooks
  - Max Saved Designs: Unlimited (9999)

---

## Usage in Components

### Method 1: Using the `usePlanLimits` Hook (Recommended)

```jsx
import { usePlanLimits } from '../hooks/usePlanLimits'

export default function MyComponent() {
  const { plan, limits, isPro, isPremium, isAdmin } = usePlanLimits()

  return (
    <div>
      <p>Your plan: {plan?.name}</p>
      
      {!limits.canUseDesigner && (
        <PlanLimitsBanner 
          feature="designer"
          message="Designer tool is only available on Pro and Premium plans"
        />
      )}

      {limits.canUseDesigner && (
        <DesignerComponent />
      )}

      {!isPro && (
        <button disabled>Designer (Pro only)</button>
      )}

      {isPremium && (
        <button>Advanced Analytics</button>
      )}
    </div>
  )
}
```

### Method 2: Using the Service Directly

```jsx
import { planLimitsService } from '../services/planLimitsService'
import { useAuthStore } from '../store/authStore'

export default function Control() {
  const { user } = useAuthStore()

  const handleCreateSession = async () => {
    const check = await planLimitsService.canCreateSession(user.id, currentSessionCount)
    
    if (!check.allowed) {
      alert(check.reason)
      return
    }

    // Proceed with session creation
  }

  const handleSendMessage = async () => {
    const check = await planLimitsService.canSendMessage(user.id, todayMessageCount)
    
    if (!check.allowed) {
      showNotification(check.reason, 'warning')
      return
    }

    // Proceed with message sending
  }

  const handleUseDesigner = async () => {
    const check = await planLimitsService.canUseDesigner(user.id)
    
    if (!check.allowed) {
      redirectToUpgrade()
      return
    }

    // Open designer
  }
}
```

### Method 3: Display Plan Limits Banner

```jsx
import PlanLimitsBanner from '../components/common/PlanLimitsBanner'

export default function Dashboard() {
  return (
    <div>
      <PlanLimitsBanner 
        feature="scheduling"
        message="Message scheduling is available on Pro and Premium plans"
      />
    </div>
  )
}
```

---

## API Reference

### `planLimitsService.getUserPlan(userId)`
Get user's current subscription plan with all limits.

**Returns**: `{ success, plan, role, subscription }`

```javascript
const { plan, role } = await planLimitsService.getUserPlan(userId)
// plan = { name: 'Pro', max_displays: 5, max_messages_per_day: 500, ... }
```

### `planLimitsService.canCreateSession(userId, currentSessionCount)`
Check if user can create a new session.

**Returns**: `{ allowed, limit, current, reason }`

```javascript
const check = await planLimitsService.canCreateSession(userId, 3)
// { allowed: false, limit: 1, current: 3, reason: "You've reached the limit..." }
```

### `planLimitsService.canSendMessage(userId, messagesCountToday)`
Check if user can send messages today.

**Returns**: `{ allowed, limit, current, remaining, reason }`

```javascript
const check = await planLimitsService.canSendMessage(userId, 47)
// { allowed: true, limit: 50, current: 47, remaining: 3 }
```

### `planLimitsService.canScheduleMessages(userId)`
Check if user can schedule messages (feature gating).

**Returns**: `{ allowed, limit, feature, reason }`

```javascript
const check = await planLimitsService.canScheduleMessages(userId)
// { allowed: true, limit: 50, feature: 'Schedule Messages' }
```

### `planLimitsService.canUseDesigner(userId)`
Check if user can use the designer tool (feature gating).

**Returns**: `{ allowed, feature, reason }`

### `planLimitsService.canShareBoards(userId)`
Check if user can share boards (feature gating).

**Returns**: `{ allowed, feature, reason }`

### `planLimitsService.canSaveDesign(userId, currentDesignCount)`
Check if user can save more designs.

**Returns**: `{ allowed, limit, current, remaining, reason }`

### `planLimitsService.isAdmin(userId)`
Check if user has admin role.

**Returns**: `{ isAdmin, role }`

### `planLimitsService.getSubscriptionStatus(userId)`
Get detailed subscription status including expiry and auto-renewal.

**Returns**: `{ plan, status, expiresAt, autoRenew, isExpiring, daysUntilExpiry }`

### `planLimitsService.getAllPlans()`
Get all available subscription plans.

**Returns**: `{ success, plans }`

### `planLimitsService.formatPlanLimits(plan)`
Format plan data for display in UI.

**Returns**: `{ name, displayLimit, messagesPerDay, designCount, features: {...} }`

---

## Common Implementation Patterns

### Pattern 1: Feature Gating (Disable/Hide Features)

```jsx
const { limits } = usePlanLimits()

// Hide entire component
{limits.canUseDesigner && <DesignerButton />}

// Disable button
<button disabled={!limits.canUseDesigner}>
  Open Designer
</button>

// Show tooltip on hover
{!limits.canUseDesigner && (
  <Tooltip message="Pro plan required" />
)}
```

### Pattern 2: Usage Limits (Rate Limiting)

```jsx
const handleSendMessage = async (message) => {
  const check = await planLimitsService.canSendMessage(user.id, todayCount)
  
  if (!check.allowed) {
    alert(`You've reached your daily limit of ${check.limit} messages`)
    return
  }

  // Send message
  await sendMessage(message)
  setTodayCount(check.current + 1)
}
```

### Pattern 3: Upgrade Prompts

```jsx
const { isPro } = usePlanLimits()

{!isPro && (
  <motion.div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 rounded-lg">
    <p>Upgrade to Pro to unlock advanced features</p>
    <a href="/pricing">View Plans</a>
  </motion.div>
)}
```

### Pattern 4: Admin-Only Access

```jsx
const { isAdmin } = usePlanLimits()

{isAdmin && (
  <a href="/admin/dashboard">Admin Dashboard</a>
)}
```

---

## Database Schema Reference

### `subscription_plans`
```sql
id UUID PRIMARY KEY
name TEXT (Free, Pro, Premium)
slug TEXT (free, pro, premium)
price DECIMAL
billing_cycle TEXT (monthly, yearly)
max_displays INTEGER
max_messages_per_day INTEGER
max_scheduled_messages INTEGER
features JSONB (feature flags + limits)
is_active BOOLEAN
```

### `user_subscriptions`
```sql
id UUID PRIMARY KEY
user_id UUID (FK to auth.users)
plan_id UUID (FK to subscription_plans)
role_id SMALLINT (FK to user_roles)
status TEXT (active, paused, cancelled, expired)
stripe_subscription_id TEXT
started_at TIMESTAMP
expires_at TIMESTAMP
auto_renew BOOLEAN
```

### `profiles` (relevant columns)
```sql
subscription_id UUID (FK to user_subscriptions)
role_id SMALLINT (FK to user_roles)
role VARCHAR (user, admin)
tier TEXT (free, pro) - DEPRECATED, use subscription_plans instead
```

---

## Testing Checklist

- [ ] Free tier users can only create 1 display
- [ ] Pro tier users can create up to 5 displays
- [ ] Premium users can create unlimited displays
- [ ] Daily message limits are enforced
- [ ] Designer tool is only accessible to Pro/Premium
- [ ] Scheduling is only available to Pro/Premium
- [ ] Board sharing requires Pro/Premium
- [ ] Design save limits are enforced per tier
- [ ] Admin users have access to all features
- [ ] Upgrade prompts appear for unavailable features
- [ ] Plan limits refresh correctly when user upgrades

---

## Future Enhancements

1. **Usage Analytics**: Track usage per user per day
2. **Soft Limits**: Allow temporary overage before hard limit
3. **Plan Recommendation**: Suggest upgrades based on usage
4. **Trial Periods**: Free trial for Pro/Premium
5. **Custom Plans**: Enterprise/custom tiers
6. **Usage Alerts**: Notify users when approaching limits
