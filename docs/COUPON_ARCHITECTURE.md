# 🎟️ Coupon System - Technical Architecture

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐        ┌──────────────────────────┐   │
│  │    Admin Panel       │        │   User Checkout          │   │
│  │                      │        │                          │   │
│  │ AdminCouponMgmt      │        │ CouponInput              │   │
│  │ • Generate           │        │ • Validation             │   │
│  │ • Manage             │        │ • Preview                │   │
│  │ • Templates          │        │ • Apply                  │   │
│  │ • Analytics          │        │                          │   │
│  │                      │        │ CompactCouponApplier     │   │
│  │                      │        │ • Collapsible            │   │
│  │                      │        │ • Minimal                │   │
│  └──────────────────────┘        │                          │   │
│           │                      │ CouponBanner             │   │
│           │                      │ • Promotional            │   │
│           │                      └──────────────────────────┘   │
│           │                                    │                 │
└───────────┼────────────────────────────────────┼─────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      STATE MANAGEMENT LAYER                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  useCouponStore (Zustand)                                        │
│  ├─ Admin State:                                                 │
│  │  ├─ coupons: Coupon[]                                        │
│  │  ├─ templates: Template[]                                    │
│  │  ├─ couponAnalytics: Analytics                              │
│  │  └─ filters: { search, status, page }                       │
│  │                                                              │
│  ├─ User State:                                                 │
│  │  ├─ validationResult: ValidationResult                      │
│  │  └─ redemptionLoading: boolean                              │
│  │                                                              │
│  └─ Actions:                                                    │
│     ├─ fetchCoupons()                                           │
│     ├─ generateCoupons()                                        │
│     ├─ validateCoupon()                                         │
│     ├─ redeemCoupon()                                           │
│     └─ fetchCouponAnalytics()                                   │
│                                                                   │
└───────────────────────┬────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  couponService.js (400+ lines)                                   │
│                                                                   │
│  ┌─ Generation Module                                           │
│  │  ├─ generateCoupons(config, adminId)                        │
│  │  ├─ generateCouponCode(prefix)                              │
│  │  └─ generateCouponsFromTemplate()                           │
│  │                                                              │
│  ├─ Validation & Redemption Module                             │
│  │  ├─ validateAndRedeemCoupon(8-point check)                 │
│  │  ├─ redeemCoupon()                                          │
│  │  └─ calculateDiscount()                                     │
│  │                                                              │
│  ├─ Management Module                                          │
│  │  ├─ fetchAllCoupons()                                       │
│  │  ├─ getCouponDetails()                                      │
│  │  ├─ updateCouponStatus()                                    │
│  │  └─ deleteCoupon()                                          │
│  │                                                              │
│  ├─ Template Module                                            │
│  │  ├─ createCouponTemplate()                                  │
│  │  └─ fetchCouponTemplates()                                  │
│  │                                                              │
│  └─ Analytics Module                                           │
│     ├─ getCouponAnalytics()                                     │
│     └─ exportCoupons()                                          │
│                                                                   │
│  All functions:                                                  │
│  • Use Supabase client for DB operations                        │
│  • Track events in Mixpanel                                     │
│  • Return normalized response format                            │
│  • Include error handling & logging                             │
│                                                                   │
└───────────────────────┬────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Supabase PostgreSQL with RLS                                    │
│                                                                   │
│  ┌─ coupons Table (Main)                                        │
│  │  • id: UUID PK                                               │
│  │  • code: TEXT UNIQUE                                         │
│  │  • coupon_type: percentage|fixed                             │
│  │  • discount_value: DECIMAL                                   │
│  │  • current_uses: INT (counter)                               │
│  │  • max_uses: INT (NULL=unlimited)                            │
│  │  • expiry_date: TIMESTAMP                                    │
│  │  • applicable_tier: free|pro|enterprise|all                 │
│  │  • min_purchase_amount: DECIMAL                              │
│  │  • is_active: BOOLEAN                                        │
│  │  • created_by: UUID FK → auth.users                         │
│  │  • Indexes: code, active, expiry, created_by                │
│  │  • RLS: Admin-only read/write                                │
│  │                                                              │
│  ├─ coupon_redemptions Table (Usage Log)                        │
│  │  • id: UUID PK                                               │
│  │  • coupon_id: UUID FK → coupons                             │
│  │  • user_id: UUID FK → auth.users                            │
│  │  • discount_applied: DECIMAL                                 │
│  │  • transaction_id: TEXT (payment ref)                        │
│  │  • redeemed_at: TIMESTAMP                                    │
│  │  • UNIQUE(coupon_id, user_id) - One per user               │
│  │  • Indexes: coupon_id, user_id, redeemed_at                │
│  │  • RLS: User can see own, admins see all                    │
│  │                                                              │
│  └─ coupon_templates Table (Reusable Configs)                   │
│     • id: UUID PK                                               │
│     • template_name: TEXT UNIQUE                                │
│     • coupon_type: percentage|fixed                             │
│     • discount_value: DECIMAL                                   │
│     • max_uses: INT                                             │
│     • applicable_tier: TEXT                                     │
│     • min_purchase_amount: DECIMAL                              │
│     • created_by: UUID FK → auth.users                         │
│     • RLS: Admin-only                                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Admin: Coupon Generation Flow

```
┌──────────────────────┐
│ AdminCouponMgmt      │
│ Form Submit          │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│ useCouponStore.generateCoupons(config, adminId)              │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Validate Config:                                       │  │
│ │ • Type: 'percentage' or 'fixed'                        │  │
│ │ • Value: 0-100% or > $0                                │  │
│ │ • Quantity: 1-1000                                     │  │
│ │ • Dependencies valid (tier, min purchase)              │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Generate Unique Codes:                                 │  │
│ │ • Loop 1000 times or until quantity reached           │  │
│ │ • generateCouponCode(prefix) → "FLIP-XXXX-YYYY"       │  │
│ │ • Store in Set to prevent duplicates                   │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Build Coupon Objects:                                  │  │
│ │ • code, coupon_type, discount_value, max_uses         │  │
│ │ • applicable_tier, min_purchase_amount                 │  │
│ │ • expiry_date, description, is_active, created_by     │  │
│ └────────────────────────────────────────────────────────┘  │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │ couponService.js          │
        │ generateCoupons()         │
        └──────────┬───────────────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │ Supabase Insert           │
        │ INSERT INTO coupons       │
        │ VALUES (...)              │
        └──────────┬───────────────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │ mixpanel.track()          │
        │ "Coupons Generated"       │
        │ { quantity, value, admin} │
        └──────────┬───────────────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │ Return Response:          │
        │ {                         │
        │   success: true,          │
        │   coupons: [...],         │
        │   codes: [...]            │
        │ }                         │
        └──────────┬───────────────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │ Update useCouponStore     │
        │ Prepend to coupons array  │
        │ Show codes toast          │
        └──────────────────────────┘
```

### User: Coupon Validation & Redemption Flow

```
┌─────────────────────────────┐
│ User enters coupon code      │
│ "FLIP-SUMMER-2024"          │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ CouponInput: handleValidateCoupon(code)                     │
└──────────┬───────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ useCouponStore.validateCoupon(code, userId, amount, tier)   │
└──────────┬───────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│ couponService.validateAndRedeemCoupon()                      │
│                                                              │
│ VALIDATION PIPELINE (8-point check):                        │
│                                                              │
│ 1️⃣  CODE_EXISTS                                             │
│    SELECT * FROM coupons WHERE code = 'FLIP-SUMMER-2024'    │
│    → if (!coupon) return { valid: false, error: "..." }     │
│                                                              │
│ 2️⃣  IS_ACTIVE                                               │
│    if (!coupon.is_active) throw "Coupon inactive"           │
│                                                              │
│ 3️⃣  NOT_EXPIRED                                             │
│    if (expiry_date < now()) throw "Coupon expired"          │
│                                                              │
│ 4️⃣  USAGE_LIMIT_NOT_EXCEEDED                                │
│    if (current_uses >= max_uses) throw "Limit reached"      │
│                                                              │
│ 5️⃣  USER_HASN'T_REDEEMED                                    │
│    SELECT COUNT(*) FROM coupon_redemptions                  │
│    WHERE coupon_id = ? AND user_id = ?                      │
│    if (count > 0) throw "Already used"                      │
│                                                              │
│ 6️⃣  TIER_MATCH                                              │
│    if (tier !== 'all' && tier !== user.tier)                │
│    throw "Not applicable to your tier"                      │
│                                                              │
│ 7️⃣  MIN_PURCHASE_MET                                        │
│    if (amount < min_purchase) throw "Min purchase required" │
│                                                              │
│ 8️⃣  CALCULATION                                             │
│    if (coupon_type === 'percentage')                        │
│      discount = (amount * value) / 100                      │
│    else                                                      │
│      discount = min(value, amount)                          │
│    finalPrice = amount - discount                           │
│                                                              │
│ ✓ ALL PASSED → Return:                                      │
│ {                                                            │
│   valid: true,                                              │
│   coupon: {                                                 │
│     id, code, type, discountValue, discountAmount,         │
│     finalPrice, description                                │
│   }                                                          │
│ }                                                            │
└──────────┬───────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ CouponInput: Display Discount Preview                       │
│                                                              │
│ Original Price:    $99.00                                   │
│ Discount (20%):    -$19.80                                  │
│ ─────────────────────────                                   │
│ Final Price:       $79.20                                   │
│                                                              │
│ [Apply Coupon] button enabled                               │
└──────────┬───────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Apply Coupon"                                  │
└──────────┬───────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│ useCouponStore.redeemCoupon(couponId, userId, amount)        │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Record Redemption:                                     │  │
│ │ INSERT INTO coupon_redemptions                         │  │
│ │ (coupon_id, user_id, discount_applied, transaction_id) │  │
│ │ VALUES (?, ?, ?, NULL)                                 │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Increment Usage Counter:                               │  │
│ │ UPDATE coupons                                         │  │
│ │ SET current_uses = current_uses + 1                    │  │
│ │ WHERE id = ?                                           │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Track Event:                                           │  │
│ │ mixpanel.track('Coupon Redeemed', {                    │  │
│ │   couponId, userId, discountApplied                    │  │
│ │ })                                                      │  │
│ └────────────────────────────────────────────────────────┘  │
└──────────┬───────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ Return { success: true, redemption: {...} }                 │
└──────────┬───────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ CouponInput: Show Success Message                           │
│ "✓ Applied!"                                                │
│ Disable input, show "Change Code" button                    │
└──────────┬───────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ Callback: onApply({                                         │
│   couponCode: "FLIP-SUMMER-2024",                           │
│   discount: 19.80,                                          │
│   finalPrice: 79.20                                         │
│ })                                                          │
│                                                              │
│ Parent component (Checkout) processes payment with          │
│ finalPrice = $79.20                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## State Flow

### Zustand Store Structure

```javascript
useCouponStore = {
  // ===== ADMIN STATE =====
  coupons: Coupon[],                    // Paginated list
  couponsLoading: boolean,              // Loading state
  selectedCoupon: Coupon | null,        // Currently viewing
  couponDetails: {                      // Deep view
    coupon: Coupon,
    redemptions: Redemption[],
    stats: { totalRedemptions, totalDiscounted, utilizationRate }
  },
  templates: Template[],                // Saved templates
  templatesLoading: boolean,
  couponAnalytics: {                    // Dashboard metrics
    totalRedemptions: number,
    totalDiscounted: number,
    averageDiscount: number,
    activeCoupons: number,
    totalCoupons: number,
    utilizationRate: number,
    topCoupons: Coupon[]
  },

  // ===== USER STATE =====
  validationResult: {                   // From validation
    valid: boolean,
    coupon?: { id, code, type, discountValue, discountAmount, finalPrice },
    error?: string
  },
  redemptionLoading: boolean,

  // ===== FILTERS & UI =====
  couponSearch: string,
  couponStatusFilter: 'all' | 'active' | 'inactive',
  currentPage: number,
  couponsPerPage: number,

  // ===== ACTIONS (Admin) =====
  generateCoupons: async (config, adminId) => {},
  fetchCoupons: async (options) => {},
  getCouponDetails: async (couponId) => {},
  updateCouponStatus: async (couponId, isActive) => {},
  deleteCoupon: async (couponId) => {},
  fetchTemplates: async () => {},
  createTemplate: async (config, adminId) => {},
  generateCouponsFromTemplate: async (templateId, quantity, adminId) => {},
  fetchCouponAnalytics: async (dateRange) => {},
  exportCoupons: async (couponIds) => {},

  // ===== ACTIONS (User) =====
  validateCoupon: async (code, userId, amount, tier) => {},
  redeemCoupon: async (couponId, userId, discountApplied, transactionId) => {},

  // ===== UI ACTIONS =====
  setSelectedCoupon: (coupon) => {},
  setCouponSearch: (query) => {},
  setCouponStatusFilter: (status) => {},
  setCurrentPage: (page) => {},
  clearCouponState: () => {}
};
```

---

## Validation Pipeline

```
Input: code, userId, purchaseAmount, userTier
       ↓
   ┌───────────────────────────────────────┐
   │ Fetch Coupon from Database            │
   │ SELECT * FROM coupons WHERE code = ?  │
   └───────────┬───────────────────────────┘
               │
        ┌──────▼──────┐
        │ Code exists?│
        └──────┬──────┘
               │
         ┌─────▼─────┐
         │ Is active?│  (is_active = true)
         └─────┬─────┘
               │
       ┌───────▼────────┐
       │ Not expired?   │  (expiry_date IS NULL OR expiry_date > now())
       └───────┬────────┘
               │
       ┌───────▼───────────────┐
       │ Usage limit OK?       │  (current_uses < max_uses)
       └───────┬───────────────┘
               │
       ┌───────▼──────────────────────────────────┐
       │ User hasn't redeemed?                    │
       │ SELECT COUNT(*) FROM coupon_redemptions  │
       │ WHERE coupon_id = ? AND user_id = ?      │
       │ (must be 0)                              │
       └───────┬──────────────────────────────────┘
               │
       ┌───────▼──────────────┐
       │ Tier matches?        │  (applicable_tier = 'all' OR = user.tier)
       └───────┬──────────────┘
               │
       ┌───────▼──────────────┐
       │ Min purchase met?    │  (purchaseAmount >= min_purchase_amount)
       └───────┬──────────────┘
               │
       ┌───────▼──────────┐
       │ ✓ All Checks OK! │
       └───────┬──────────┘
               │
     ┌─────────▼─────────┐
     │ Calculate Discount│
     │                   │
     │ if percentage:    │
     │  discount =       │
     │  (amount * %) / 100
     │                   │
     │ if fixed:         │
     │  discount =       │
     │  min(amount, $)   │
     │                   │
     │ finalPrice =      │
     │  amount - discount│
     └─────────┬─────────┘
               │
     ┌─────────▼──────────────────┐
     │ Return ValidationResult {  │
     │   valid: true,            │
     │   coupon: {               │
     │     id, code, type,       │
     │     discountValue,        │
     │     discountAmount,       │
     │     finalPrice,           │
     │     description           │
     │   }                        │
     │ }                          │
     └────────────────────────────┘
```

---

## Error Handling

```
Validation Errors (User-Facing):
├─ CODE_NOT_FOUND
│  └─ "Coupon code 'INVALID' not found"
├─ NOT_ACTIVE
│  └─ "This coupon is no longer active"
├─ EXPIRED
│  └─ "This coupon expired on December 31, 2024"
├─ USAGE_LIMIT_EXCEEDED
│  └─ "This coupon has been used 5 times (limit: 3)"
├─ ALREADY_REDEEMED
│  └─ "You've already redeemed this coupon"
├─ TIER_MISMATCH
│  └─ "This coupon is only for Pro tier users"
├─ MIN_PURCHASE_NOT_MET
│  └─ "Minimum purchase of $50 required (your cart: $30)"
└─ SYSTEM_ERROR
   └─ "An error occurred while validating. Try again."

Database Errors (Admin-Facing):
├─ DUPLICATE_CODE
│  └─ "This coupon code already exists"
├─ INVALID_DISCOUNT
│  └─ "Discount must be 0-100% for percentage type"
├─ INVALID_QUANTITY
│  └─ "Quantity must be between 1 and 1000"
├─ TIER_MISMATCH
│  └─ "Invalid subscription tier"
└─ RLS_VIOLATION
   └─ "You don't have permission to create coupons"
```

---

## Performance Considerations

### Indexing Strategy
```sql
-- High-traffic queries
CREATE INDEX idx_coupons_code ON coupons(code);        -- For validation
CREATE INDEX idx_coupons_active ON coupons(is_active); -- For filtering

-- Analytics queries
CREATE INDEX idx_coupon_redemptions_redeemed_at ON coupon_redemptions(redeemed_at);
CREATE INDEX idx_coupons_expiry ON coupons(expiry_date);

-- Admin queries
CREATE INDEX idx_coupons_created_by ON coupons(created_by);
CREATE INDEX idx_coupon_redemptions_coupon_id ON coupon_redemptions(coupon_id);
```

### Query Optimization
```javascript
// ✓ GOOD: Fetch once, filter in memory
const { data } = await supabase.from('coupons').select().limit(1000);
const active = data.filter(c => c.is_active);

// ✗ BAD: Multiple round trips
for (let coupon of coupons) {
  const { data } = await supabase.from('coupons').select().eq('id', coupon.id);
}
```

### Caching Strategy
```javascript
// Cache coupon lookup for 30 seconds
const couponCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

function getCachedCoupon(code) {
  const cached = couponCache.get(code);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }
  return null;
}
```

---

## Security Architecture

### Row-Level Security (RLS)

```sql
-- Coupons: Admins only (read/write)
CREATE POLICY "Admins can view coupons" ON coupons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'admin')
  );

-- Redemptions: Users see own, admins see all
CREATE POLICY "Users view own redemptions" ON coupon_redemptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins view all redemptions" ON coupon_redemptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'admin')
  );

-- Templates: Admins only
CREATE POLICY "Admins manage templates" ON coupon_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'admin')
  );
```

### Input Validation

```javascript
// Coupon code: alphanumeric + hyphens only
if (!/^[A-Z0-9\-]+$/.test(code)) {
  throw new Error("Invalid coupon code format");
}

// Discount percentage: 0-100
if (discountValue < 0 || discountValue > 100) {
  throw new Error("Percentage must be 0-100");
}

// Quantity: 1-1000
if (quantity < 1 || quantity > 1000) {
  throw new Error("Quantity must be 1-1000");
}

// Email validation (if applicable)
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("Invalid email format");
}
```

### Attack Prevention

1. **Brute Force**: No validation on unmatched codes (fast fail)
2. **Race Conditions**: DB UNIQUE constraints on code & (coupon_id, user_id)
3. **Privilege Escalation**: RLS policies prevent unauthorized access
4. **SQL Injection**: Using Supabase client (parameterized queries)
5. **Data Leakage**: Only expose necessary fields to client

---

## Monitoring & Analytics

### Mixpanel Events

```javascript
// Admin actions
mixpanel.track('Coupons Generated', {
  quantity,
  couponType,
  discountValue,
  adminId,
  timestamp: new Date()
});

mixpanel.track('Coupon Status Updated', {
  couponId,
  isActive,
  adminId
});

// User actions
mixpanel.track('Coupon Redeemed', {
  couponId,
  userId,
  discountApplied,
  couponCode
});

mixpanel.track('Coupon Validation Attempted', {
  code,
  valid,
  userId
});
```

### Dashboard Metrics

```javascript
// In getCouponAnalytics()
{
  totalRedemptions: 150,           // How many used
  totalDiscounted: 3750.50,        // Revenue impact ($)
  averageDiscount: 25.00,          // Avg per redemption
  activeCoupons: 8,                // Still usable
  totalCoupons: 15,                // All created
  utilizationRate: 53.33,          // % being used
  topCoupons: [                    // Best performers
    { code: 'FLIP-SUMMER', uses: 85 },
    { code: 'FLIP-WELCOME', uses: 65 }
  ]
}
```

---

**Architecture Version**: 1.0  
**Last Updated**: November 22, 2025  
**Status**: Production Ready
