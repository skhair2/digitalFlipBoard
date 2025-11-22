# 🎟️ Coupon System - Complete Implementation Guide

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [API Reference](#api-reference)
4. [Admin UI Guide](#admin-ui-guide)
5. [User UI Guide](#user-ui-guide)
6. [Validation Logic](#validation-logic)
7. [Business Rules](#business-rules)
8. [Testing Scenarios](#testing-scenarios)
9. [Deployment Checklist](#deployment-checklist)

---

## System Architecture

### Component Hierarchy
```
┌─ AdminCouponManagement (Admin Panel)
│  ├─ Generate Tab (couponService.generateCoupons)
│  ├─ Manage Tab (couponService.fetchAllCoupons, updateStatus, delete)
│  ├─ Templates Tab (couponService.createCouponTemplate, fetchTemplates)
│  └─ Analytics Tab (couponService.getCouponAnalytics)
│
└─ CouponInput (User Checkout)
   ├─ CouponInput (Full component with preview)
   ├─ CompactCouponApplier (Minimal version)
   └─ CouponBanner (Promotional display)
```

### Data Flow

#### Admin Coupon Generation
```
AdminCouponManagement
  → generateCoupons(config, adminId)
    → Validate config (type, discount, quantity)
    → Generate unique codes (FLIP-XXXX-YYYY)
    → Insert into coupons table
    → Track in Mixpanel
    → Return generated codes
```

#### User Coupon Validation
```
CouponInput
  → validateCoupon(code, userId, purchaseAmount, userTier)
    → Fetch coupon from DB
    → Check: active, expiry, usage limit, user redemptions
    → Check: applicable tier, min purchase amount
    → Calculate discount (% or fixed)
    → Return validation result with preview
  → redeemCoupon(couponId, userId, discountApplied)
    → Record in coupon_redemptions
    → Increment usage counter
    → Track in Mixpanel
```

---

## Database Schema

### Table: `coupons`
```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,              -- FLIP-1234-ABCD
  coupon_type TEXT CHECK (type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2),
  max_uses INTEGER,                       -- NULL = unlimited
  current_uses INTEGER DEFAULT 0,
  expiry_date TIMESTAMP,                  -- NULL = never expires
  applicable_tier TEXT,                   -- free, pro, enterprise, all
  min_purchase_amount DECIMAL(10, 2),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes (performance optimization)
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active);
CREATE INDEX idx_coupons_expiry ON coupons(expiry_date);
```

### Table: `coupon_redemptions`
```sql
CREATE TABLE coupon_redemptions (
  id UUID PRIMARY KEY,
  coupon_id UUID REFERENCES coupons(id),
  user_id UUID REFERENCES auth.users(id),
  redeemed_at TIMESTAMP DEFAULT NOW(),
  discount_applied DECIMAL(10, 2),
  transaction_id TEXT,                    -- Payment gateway reference
  UNIQUE(coupon_id, user_id)              -- One redemption per user
);
```

### Table: `coupon_templates`
```sql
CREATE TABLE coupon_templates (
  id UUID PRIMARY KEY,
  template_name TEXT UNIQUE NOT NULL,    -- "Summer20", "BlackFriday"
  coupon_type TEXT,
  discount_value DECIMAL(10, 2),
  max_uses INTEGER,
  applicable_tier TEXT,
  min_purchase_amount DECIMAL(10, 2),
  description TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP
);
```

---

## API Reference

### Coupon Service (`src/services/couponService.js`)

#### Generation Functions

**`generateCoupons(config, adminId)`**
- Generates batch of unique coupon codes
- Parameters:
  - `config.couponType`: 'percentage' or 'fixed'
  - `config.discountValue`: 0-100 for %, any positive for fixed
  - `config.quantity`: 1-1000
  - `config.prefix`: 4-char code prefix
  - `config.maxUses`: Uses per coupon (default: 1)
  - `config.applicableTier`: 'free', 'pro', 'enterprise', 'all'
  - `config.minPurchaseAmount`: Minimum purchase required
  - `config.expiryDate`: ISO date string (optional)
  - `config.description`: Marketing text
- Returns: `{ success, coupons: [...], count, codes: [...] }`
- Validation: Ensures valid discount values, quantity limits
- Performance: Generates unique codes via Set deduplication

**`generateCouponsFromTemplate(templateId, quantity, adminId)`**
- Quick generation using saved template
- Returns: Same as `generateCoupons()`

#### Validation Functions

**`validateAndRedeemCoupon(code, userId, purchaseAmount, userTier)`**
- Comprehensive coupon validation with 8-point check:
  1. Code exists and is valid format
  2. Coupon is active
  3. Not expired
  4. Usage limit not exceeded
  5. User hasn't already redeemed
  6. User tier matches
  7. Min purchase amount met
- Returns: `{ valid: bool, coupon?: {...}, error?: string }`
- If valid, includes discount calculation and final price

**`redeemCoupon(couponId, userId, discountApplied, transactionId?)`**
- Records redemption and increments counter
- Atomicity: Uses SQL transaction (RLS policies prevent race conditions)
- Returns: `{ success, redemption: {...} }`

#### Management Functions

**`fetchAllCoupons(options)`**
- Paginated coupon listing
- Parameters:
  - `limit`: Results per page (default: 50)
  - `offset`: Pagination offset
  - `isActive`: Filter by status
  - `searchQuery`: Search code/description
- Returns: `{ success, coupons: [...], totalCount }`

**`getCouponDetails(couponId)`**
- Full coupon info with redemption history
- Returns: `{ coupon, redemptions: [...], stats: { totalRedemptions, totalDiscounted, utilizationRate } }`

**`updateCouponStatus(couponId, isActive)`**
- Toggle coupon active/inactive without deletion
- Use case: Pause coupon, extend, etc.

**`deleteCoupon(couponId)`**
- Soft delete via status flag (no permanent removal recommended)

#### Analytics Functions

**`getCouponAnalytics(dateRange?)`**
- Campaign performance metrics
- Parameters: `dateRange` (default: 30 days)
- Returns:
  ```javascript
  {
    totalRedemptions: 150,
    totalDiscounted: 3750.50,
    averageDiscount: 25,
    activeCoupons: 8,
    totalCoupons: 15,
    utilizationRate: "53.33",
    topCoupons: [...]
  }
  ```

**`exportCoupons(couponIds?)`**
- Export data for CSV/reporting
- Returns: `{ data: [...], totalExported }`

#### Template Functions

**`createCouponTemplate(config, adminId)`**
- Save coupon configuration as reusable template
- Returns: `{ template }`

**`fetchCouponTemplates()`**
- List all templates for quick generation

---

## Admin UI Guide

### Tab 1: Generate Coupons

#### Simple Generation
1. Click "➕ Create New Coupons"
2. Configure:
   - **Type**: Percentage (%) or Fixed Amount ($)
   - **Discount Value**: 10% or $10
   - **Quantity**: 1-1000 codes
   - **Prefix**: Code prefix (FLIP, SALE, etc.)
   - **Max Uses**: How many times each code can be used
   - **Applicable Tier**: Which subscription tiers qualify
   - **Min Purchase**: Minimum order amount
   - **Expiry Date**: (Optional) When code expires
   - **Description**: "20% off, summer sale"
3. Click "Generate"
4. View generated codes and copy to clipboard
5. Share codes via email, marketing, etc.

#### Template-Based Generation
1. Select template from dropdown
2. Enter quantity
3. Click "Generate X Coupons"
- Benefits: Consistency, faster bulk generation, preset rules

#### Create New Template
1. Click "🎨 Create Template"
2. Name it: "Summer20", "BlackFriday", "Loyalty10"
3. Set discount rules once
4. Reuse for bulk generation

### Tab 2: Manage Coupons

#### View All Coupons
- Filter by: All / Active / Inactive
- Table columns:
  - Code (copyable)
  - Discount (shows % or $)
  - Uses (current/max)
  - Status (color-coded badge)
  - Expiry (date or "Never")
  - Actions (View/Disable/Delete)

#### View Coupon Details
- Click "View" on any code
- See:
  - Redemption count
  - Total discount given
  - User who redeemed
  - Utilization rate
  - Redemption history with timestamps

#### Manage Status
- Click "Disable" to pause coupon (reversible)
- Use cases: Pause if budget exceeded, pause for business hours, etc.

#### Delete Coupon
- Click "Delete" (with confirmation)
- Permanently removes code from circulation

#### Export as CSV
- Click "📥 Export CSV"
- Opens file with: Code, Type, Value, Uses, Active, Expiry, Description
- Use for: Reporting, archive, integration with marketing tools

### Tab 3: Templates

- Create reusable coupon configurations
- Quick reference of all saved templates
- Edit or clone templates for variations

### Tab 4: Analytics

#### Key Metrics (30-day rolling)
- **Total Redemptions**: How many codes were used
- **Total Discounted**: Revenue lost to coupons
- **Avg Discount**: Average discount per redemption
- **Utilization Rate**: % of active coupons being used
- **Top Performers**: Which codes drove the most redemptions

#### Use Cases
- Monitor coupon ROI
- Identify underperforming codes
- Plan seasonal campaigns
- Budget impact analysis

---

## User UI Guide

### CouponInput Component (Full Checkout Flow)

**When to show:**
- Pricing page
- Checkout modal
- Cart page (before payment)
- Upgrade page

**User Flow:**
1. Enter coupon code → system validates in real-time
2. See discount preview:
   - Original Price: $99
   - Discount (20%): -$19.80
   - **Final Price: $79.20**
3. Click "Apply Coupon"
4. Confirmation: "✓ Applied!"
5. Proceed to payment

**Error Messages (user-friendly):**
- "❌ Coupon not found" → Try another code
- "❌ This coupon has expired" → Show expiry date
- "❌ This coupon is no longer available" → Suggest alternatives
- "❌ You've already redeemed this coupon" → One per user limit
- "❌ This coupon is for Pro users only" → Suggest upgrade
- "❌ Minimum purchase of $50 required" → Show required amount

### CompactCouponApplier (Collapsible)

**Minimal footprint for pricing tables:**
```
[🎟️ Have a coupon code?] ▼
  [_______Coupon code_______]
  [Apply]
```

**When collapsed:** Just shows summary text
**When expanded:** Input field + Apply button

### CouponBanner (Promotional)

**Auto-display of active coupons:**
```
┌─────────────────────────────────────┐
│ 🎉 Limited Time Offer!              │ ✨
│ Use code FLIP-SUMMER-2024           │
│ for 20% off!                        │
└─────────────────────────────────────┘
```

**Features:**
- Shows 1 featured coupon
- Auto-updates for latest offer
- Eye-catching gradient background
- Copy-to-clipboard on code click

---

## Validation Logic

### 8-Point Validation System

```javascript
// All checks must pass for valid redemption

1. CODE_EXISTS
   if (!coupon) throw "Coupon not found"

2. IS_ACTIVE
   if (!coupon.is_active) throw "Coupon inactive"

3. NOT_EXPIRED
   if (coupon.expiry_date < now()) throw "Coupon expired"

4. USAGE_LIMIT_NOT_EXCEEDED
   if (coupon.current_uses >= coupon.max_uses) 
     throw "Usage limit reached"

5. USER_HASN'T_REDEEMED
   if (user_has_redeemed_before) throw "Already used"

6. TIER_MATCH
   if (coupon.applicable_tier !== 'all' && 
       coupon.applicable_tier !== user.tier) 
     throw "Not applicable to your tier"

7. MIN_PURCHASE_MET
   if (purchase_amount < coupon.min_purchase_amount)
     throw "Minimum purchase not met"

8. FORMAT_VALID
   if (!code.matches(/^[A-Z0-9\-]+$/)) 
     throw "Invalid format"
```

### Discount Calculation

**Percentage:**
```javascript
discount = (purchaseAmount * discountValue) / 100
finalPrice = purchaseAmount - discount
```

**Fixed Amount:**
```javascript
discount = min(discountValue, purchaseAmount)
finalPrice = purchaseAmount - discount
```

**Edge Cases:**
- Discount capped at purchase amount (no "cash back")
- Negative prices prevented
- Rounding: Math.round(amount * 100) / 100 (2 decimals)

---

## Business Rules

### Generation Rules

| Rule | Limit | Rationale |
|------|-------|-----------|
| Quantity per batch | 1-1000 | Prevent performance issues |
| Percentage discount | 0-100% | Prevent negative discounts |
| Fixed discount | > $0 | No free/invalid coupons |
| Max uses per code | 1-∞ | Support single-use or unlimited |
| Code length | 12-16 chars | Business-friendly format |
| Code uniqueness | Required | Prevent duplicates |

### Redemption Rules

| Rule | Enforcement | Effect |
|------|-------------|--------|
| One per user | DB constraint | Prevents double-dipping |
| Max uses limit | Usage counter | Prevents over-usage |
| Expiry check | Timestamp | Prevents old codes |
| Tier match | Enum validation | Prevents wrong tier usage |
| Min purchase | Amount check | Prevents abuse of small orders |

### Security Rules

| Rule | Implementation | Rationale |
|------|-----------------|-----------|
| Admin-only creation | RLS policy | Prevent user-generated codes |
| Code obfuscation | Random generation | Prevent brute force |
| Unique constraints | DB level | Enforce uniqueness |
| Audit logging | Activity log | Track all changes |
| Rate limiting | Client-side check | Prevent abuse |

---

## Testing Scenarios

### Admin Scenarios

**Test 1: Generate Single Coupon**
```
Input: Type=Percentage, Value=20, Quantity=1
Expected: 1 code generated, format FLIP-XXXX-YYYY
```

**Test 2: Generate Bulk with Template**
```
Input: Template="Summer20", Quantity=100
Expected: 100 unique codes with summer discount rules
```

**Test 3: Update Coupon Status**
```
Input: Active coupon → Click Disable
Expected: Coupon appears in "Inactive" filter, users can't use it
```

**Test 4: View Analytics**
```
Input: Navigate to Analytics tab
Expected: Dashboard shows top coupons, total discounted, utilization %
```

### User Scenarios

**Test 1: Valid Code Application**
```
Steps: 
1. Enter valid code "FLIP-PROMO-2024"
2. See discount preview: $10 off
3. Click Apply
4. See ✓ Applied message
Expected: Coupon applied to purchase
```

**Test 2: Expired Code**
```
Steps:
1. Enter expired code
2. See error "This coupon has expired"
Expected: Code rejected, user can try another
```

**Test 3: Already Redeemed**
```
Steps:
1. User already used code once
2. Try to apply again
3. See error "You've already redeemed this coupon"
Expected: Code rejected
```

**Test 4: Tier Mismatch**
```
Steps:
1. Pro-only coupon, user is Free tier
2. Apply code
3. See error "This coupon is for Pro users"
Expected: Code rejected
```

**Test 5: Min Purchase Not Met**
```
Steps:
1. Code requires $50 minimum
2. Cart total is $30
3. Apply code
4. See error "Minimum purchase of $50 required"
Expected: Code rejected, suggest upsell
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Database migration applied (Supabase)
  ```bash
  mcp_supabase_apply_migration create_coupon_system
  ```
- [ ] Coupon service created (`couponService.js`)
- [ ] Coupon store created (`couponStore.js`)
- [ ] Admin component created (`AdminCouponManagement.jsx`)
- [ ] User component created (`CouponInput.jsx`)
- [ ] AdminLayout.jsx updated with coupon route
- [ ] AdminSidebar.jsx updated with coupon nav

### Testing

- [ ] Admin: Generate single coupon
- [ ] Admin: Generate bulk (100+) coupons
- [ ] Admin: Create template
- [ ] Admin: Generate from template
- [ ] Admin: View coupon details
- [ ] Admin: Toggle coupon status
- [ ] Admin: Delete coupon
- [ ] Admin: Export as CSV
- [ ] Admin: View analytics
- [ ] User: Valid coupon flow
- [ ] User: Error handling (expired, duplicate, tier mismatch)
- [ ] User: Discount preview calculation
- [ ] User: CompactCouponApplier collapse/expand
- [ ] User: CouponBanner display
- [ ] Cross-tab sync (localStorage + store)
- [ ] Mixpanel tracking verified

### Production Deployment

- [ ] Backup Supabase database
- [ ] Deploy backend (if applicable)
- [ ] Deploy frontend code
- [ ] Verify RLS policies in Supabase
- [ ] Create initial coupon templates
- [ ] Test end-to-end in production
- [ ] Monitor error logs
- [ ] Announce to marketing team

### Post-Deployment

- [ ] Monitor Mixpanel for redemption rate
- [ ] Track discount impact on revenue
- [ ] Get user feedback (via Help section)
- [ ] Optimize based on utilization metrics
- [ ] Document FAQ for support team

---

## Advanced: Custom Implementations

### Bulk Redemption (Internal Use)
```javascript
// Admin credits user with discount without full purchase
await redeemCoupon(couponId, userId, discountAmount, 'INTERNAL-CREDIT')
```

### Campaign Tracking
```javascript
// Add campaign_id to coupons for attribution
const config = {
  ...baseConfig,
  metadata: { campaign_id: 'summer-2024' }
}
```

### Referral Rewards
```javascript
// Create one-time use codes for referral bonuses
const referralCode = await generateCoupons({
  discountValue: 25,
  maxUses: 1,
  applicableTier: 'free'
}, adminId)
// Send code via email to referred user
```

---

## Support & Troubleshooting

### Common Issues

**Issue: "Duplicate coupon code"**
- Cause: Code generation race condition
- Fix: Increase code uniqueness with longer length

**Issue: "Users can't redeem valid coupon"**
- Check: Is coupon active?
- Check: Has expiry passed?
- Check: User tier matches?
- Check: Purchase amount ≥ minimum?

**Issue: "Discount not applying to final price"**
- Check: Calculation logic in validateAndRedeemCoupon
- Check: Rounding (should be to 2 decimals)

**Issue: "Analytics showing wrong numbers"**
- Check: Redemption table populated?
- Check: Date range in analytics query correct?

---

**Created**: November 22, 2025  
**Version**: 1.0  
**Maintained by**: Development Team
