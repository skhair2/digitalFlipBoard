# Premium Design System - Setup & Deployment Checklist

## ✅ Completed Components

### Database Schema
- [x] Create `premium_designs` table
- [x] Create `design_versions` table (version history)
- [x] Create `design_collections` table
- [x] Create `design_collection_members` table (bridge)
- [x] Create `design_likes` table (social feature)
- [x] Add columns to `profiles` table (max_designs, max_collections, total_designs)
- [x] Set up Row-Level Security (RLS) on all tables
- [x] Create performance indexes
- [x] Create `check_design_limit()` trigger function
- [x] Create `update_premium_designs_updated_at()` trigger function

**Migration File:** `supabase/migrations/006_premium_designs.sql`

### Backend Services
- [x] Create `premiumDesignService.js` with 18+ methods
- [x] Implement design CRUD operations
- [x] Implement collection management
- [x] Implement version history operations
- [x] Implement social features (likes)
- [x] Add error handling & Mixpanel tracking

**File:** `src/services/premiumDesignService.js`

### State Management
- [x] Enhance `designStore.js` with new methods & properties
- [x] Enhance `authStore.js` with subscription tier info
- [x] Add design limit tracking
- [x] Add collection state management
- [x] Add version history state

**Files:** 
- `src/store/designStore.js`
- `src/store/authStore.js`

### Utilities & Validation
- [x] Create design validation utility
- [x] Create permission checking functions
- [x] Create tier limit lookup function
- [x] Create design formatting helpers

**File:** `src/utils/designValidation.js`

### Documentation
- [x] Complete premium designs documentation
- [x] Implementation summary with tier breakdown
- [x] Integration examples for common scenarios
- [x] Setup checklist (this file)

**Files:**
- `PREMIUM_DESIGNS.md`
- `IMPLEMENTATION_SUMMARY.md`
- `INTEGRATION_EXAMPLES.md`

---

## 📋 Next Steps - Component Integration

### Step 1: Apply Database Migration
- [ ] Access Supabase Dashboard
- [ ] Go to SQL Editor
- [ ] Copy `supabase/migrations/006_premium_designs.sql`
- [ ] Paste and execute
- [ ] Verify tables created in Table Editor
- [ ] Check RLS policies are enabled

### Step 2: Update GridEditor Component
**File:** `src/components/designer/GridEditor.jsx`

Requirements:
- [ ] Import `canUserSaveDesign` from `designValidation.js`
- [ ] Show design count quota (free tier): `{designCount}/{maxDesigns}`
- [ ] Call `saveDesign(name)` from designStore
- [ ] Handle `{ requiresUpgrade: true }` response → show UpgradeModal
- [ ] Disable save button when at quota (free tier)
- [ ] Track save actions via Mixpanel

**Reference:** See `INTEGRATION_EXAMPLES.md` - Example 1

### Step 3: Create DesignList Component
**File:** `src/components/designer/DesignList.jsx` (new or update existing)

Requirements:
- [ ] Fetch designs with `fetchDesigns()`
- [ ] Display list with name, grid size, date
- [ ] Load design with `loadDesign(id)` → updates grid config
- [ ] Delete design with permission check
- [ ] Show "No designs" message when empty
- [ ] Show loading spinner during fetch

**Reference:** See `INTEGRATION_EXAMPLES.md` - Example 2

### Step 4: Create Collections Component (Pro Only)
**File:** `src/components/designer/Collections.jsx` (new)

Requirements:
- [ ] Wrap in `<PremiumGate feature="collections">`
- [ ] Create new collection form
- [ ] List user's collections
- [ ] Show design count per collection
- [ ] Load designs in selected collection
- [ ] Remove designs from collection
- [ ] Delete collection

**Reference:** See `INTEGRATION_EXAMPLES.md` - Example 3

### Step 5: Add Version History (Pro Only)
**File:** `src/components/designer/VersionHistory.jsx` (new)

Requirements:
- [ ] Wrap in `<PremiumGate feature="versionHistory">`
- [ ] Fetch versions with `premiumDesignService.getDesignVersions()`
- [ ] Display version list with timestamps
- [ ] Show change descriptions
- [ ] Restore to previous version button
- [ ] Auto-create versions on design save

**Reference:** See `INTEGRATION_EXAMPLES.md` - Example 4

### Step 6: Add Design Quota Indicator
**File:** `src/components/designer/DesignQuota.jsx` (new)

Requirements:
- [ ] Show `{designCount}/{maxDesigns}` for free tier
- [ ] Show "Unlimited" for pro tier
- [ ] Display progress bar
- [ ] Warn when 80%+ full (yellow)
- [ ] Show error when at limit (red)

**Reference:** See `INTEGRATION_EXAMPLES.md` - Example 5

### Step 7: Update Control.jsx Designer Tab
**File:** `src/pages/Control.jsx`

Changes needed:
- [ ] Import GridEditor, DesignList, Collections components
- [ ] Replace placeholder designer section with components
- [ ] Add DesignQuota indicator
- [ ] Wrap Pro features in PremiumGate
- [ ] Test save → load → edit flow

### Step 8: Add Permission Checks Throughout
Locations to add permission checks:
- [ ] MessageInput - before saving to board
- [ ] SharingPanel - check `canShareDesigns`
- [ ] Any export functionality - check premium
- [ ] Scheduler - check tier limits

**Reference:** See `INTEGRATION_EXAMPLES.md` - Example 6

---

## 🧪 Testing Checklist

### Free Tier Testing
- [ ] Create free account
- [ ] Save design #1 → Success
- [ ] Save designs #2-5 → Success
- [ ] Attempt design #6 → Error: "Upgrade to Pro"
- [ ] Verify Mixpanel: `Design Save Blocked - Limit Reached`
- [ ] Cannot access Collections
- [ ] Cannot access Version History
- [ ] Storage limit shown (5MB)

### Pro Tier Testing
- [ ] Create pro account (set `subscription_tier = 'pro'` in profiles)
- [ ] Save unlimited designs
- [ ] Create collections → Success
- [ ] Add designs to collection
- [ ] Version history available
- [ ] Can share designs
- [ ] Can duplicate designs
- [ ] Storage limit shown (500MB)

### RLS Security Testing
- [ ] Attempt to access another user's design via API → 403
- [ ] Attempt to modify another user's design → 403
- [ ] Can access own designs → 200
- [ ] Can view public templates → 200

### Data Flow Testing
- [ ] Save design → appears in savedDesigns array
- [ ] Load design → currentDesign updates
- [ ] Grid config applies when loading
- [ ] Delete design → removed from list & designCount updates
- [ ] Version history creates snapshots

### UI/UX Testing
- [ ] Quota indicator updates correctly
- [ ] Upgrade modal shows when hitting limit
- [ ] Collections UI functional
- [ ] Version history accessible
- [ ] All error messages clear
- [ ] Loading states show spinners

---

## 📊 Deployment Steps

### Pre-Production
1. [ ] Run database migration on staging
2. [ ] Test all features on staging environment
3. [ ] Verify RLS policies work correctly
4. [ ] Test with real Supabase project
5. [ ] Load test: 100+ concurrent saves
6. [ ] Check Mixpanel events firing correctly

### Production
1. [ ] Backup production database
2. [ ] Run migration on production
3. [ ] Verify tables exist with correct structure
4. [ ] Deploy updated frontend code
5. [ ] Monitor for errors in Sentry
6. [ ] Check Mixpanel events starting
7. [ ] Monitor API/database performance

### Post-Deployment
1. [ ] Announce feature to users
2. [ ] Monitor support tickets
3. [ ] Track conversion to Pro tier
4. [ ] Analyze usage patterns in Mixpanel
5. [ ] Gather user feedback

---

## 📝 Configuration Files to Update

### Environment Variables
Ensure these are set in `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_WEBSOCKET_URL=your_websocket_url
VITE_MIXPANEL_TOKEN=your_mixpanel_token
```

### Supabase Configuration
No special config needed - RLS handled in migration.

---

## 🚨 Rollback Plan

If issues occur:

1. **Database Rollback**
   - Supabase: Can revert migration via SQL Editor
   - SQL: Drop new tables manually
   
2. **Code Rollback**
   - Revert file changes to designStore.js, authStore.js
   - Revert new component additions
   - Keep old saved_designs table for compatibility

3. **User Communication**
   - Notify users of issue
   - Provide workaround (use old designer)
   - Estimated fix time

---

## 📞 Support & Troubleshooting

### Common Issues & Solutions

**"Design limit reached" but count shows wrong**
- Check: `SELECT COUNT(*) FROM premium_designs WHERE user_id = 'xxx'`
- Check: `profiles.max_designs` and `subscription_tier`
- Fix: Manually update count in profiles table

**Cannot save designs - 403 Forbidden**
- Check: User is authenticated (JWT token valid)
- Check: RLS policies - user_id must match
- Check: profiles table has entry for user

**Collections not showing (Pro user)**
- Verify: `subscription_tier = 'pro'` in profiles
- Verify: Table `design_collections` exists
- Check: `authStore.designLimits.maxCollections > 0`

**Version history not creating**
- Verify: User is Pro tier
- Check: Trigger `enforce_design_limit_on_insert` is enabled
- Check: design_versions table exists

**Performance degradation**
- Check: Indexes created properly
  ```sql
  SELECT schemaname, tablename, indexname FROM pg_indexes 
  WHERE tablename LIKE 'design%';
  ```
- Run: `ANALYZE premium_designs;`
- Monitor: Query performance in Supabase

---

## 📚 Reference Files

| File | Purpose |
|------|---------|
| `supabase/migrations/006_premium_designs.sql` | Complete database schema |
| `src/store/designStore.js` | Design state management |
| `src/store/authStore.js` | Auth + tier info |
| `src/services/premiumDesignService.js` | Advanced DB operations |
| `src/utils/designValidation.js` | Validation & permissions |
| `PREMIUM_DESIGNS.md` | Complete documentation |
| `IMPLEMENTATION_SUMMARY.md` | Overview & architecture |
| `INTEGRATION_EXAMPLES.md` | Code examples & patterns |

---

## ✨ Success Criteria

When complete, the following should be true:

- ✅ Free tier users can save max 5 designs
- ✅ Pro tier users can save unlimited designs
- ✅ Designs stored securely in database (RLS enforced)
- ✅ Users can load, edit, delete saved designs
- ✅ Collections available only to Pro users
- ✅ Version history available only to Pro users
- ✅ All operations tracked in Mixpanel
- ✅ UI shows clear upgrade prompts when hitting limits
- ✅ No breaking changes to existing functionality
- ✅ All tests passing

---

**Last Updated:** 2025-11-22
**Status:** Ready for Integration
