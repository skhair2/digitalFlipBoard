# Premium Designs System

## Overview

Digital FlipBoard's premium design system is a subscription-gated feature that allows paying customers to create, save, organize, and share custom board designs. This system enforces tier-based limits and provides progressive features based on subscription level.

## Database Schema

### Core Tables

#### `premium_designs`
Stores saved design layouts created by users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to auth.users |
| `name` | TEXT | Design name (required) |
| `description` | TEXT | Optional description |
| `layout` | JSONB | Array of { char, color } objects |
| `grid_rows` | INTEGER | Grid height (default 6) |
| `grid_cols` | INTEGER | Grid width (default 22) |
| `thumbnail_url` | TEXT | Preview image URL |
| `is_template` | BOOLEAN | Mark as reusable template |
| `tags` | TEXT[] | Search/categorization tags |
| `version` | INTEGER | Version number (for tracking changes) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Constraints:**
- `valid_grid_dimensions`: `grid_rows > 0 AND grid_cols > 0`
- Trigger: `enforce_design_limit_on_insert` - Prevents free-tier users from exceeding 5 designs
- Trigger: `update_premium_designs_updated_at` - Auto-updates `updated_at` on changes

#### `design_versions`
Tracks version history of designs (Pro feature).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `design_id` | UUID | FK to premium_designs |
| `version_number` | INTEGER | Version sequence |
| `layout` | JSONB | Design state at this version |
| `changed_by` | UUID | FK to auth.users |
| `change_description` | TEXT | What changed |
| `created_at` | TIMESTAMP | Snapshot time |

#### `design_collections`
Organization structure for designs (Pro feature).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to auth.users |
| `name` | TEXT | Collection name |
| `description` | TEXT | Optional description |
| `is_public` | BOOLEAN | Shareable collection |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Constraints:**
- `unique_user_collection_name`: User can't have duplicate collection names

#### `design_collection_members`
Bridge table linking designs to collections.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `collection_id` | UUID | FK to design_collections |
| `design_id` | UUID | FK to premium_designs |
| `position` | INTEGER | Order in collection |
| `created_at` | TIMESTAMP | Added timestamp |

#### `design_likes`
Social feature tracking liked designs.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `design_id` | UUID | FK to premium_designs |
| `user_id` | UUID | FK to auth.users |
| `created_at` | TIMESTAMP | Like timestamp |

### Profile Extensions

**New columns added to `profiles` table:**

```sql
total_designs INTEGER DEFAULT 0          -- Current design count
max_designs INTEGER DEFAULT 5            -- Tier-based limit
max_collection_size INTEGER DEFAULT 10   -- Pro feature limit
```

## Subscription Tier Limits

### Free Tier
- **Max Designs:** 5
- **Collections:** Not available
- **Sharing:** Not available
- **Templates:** Cannot create
- **Version History:** Not available
- **Storage:** 5MB

### Pro Tier
- **Max Designs:** Unlimited
- **Collections:** Up to 20
- **Sharing:** Yes
- **Templates:** Yes
- **Version History:** Yes
- **Storage:** 500MB

### Enterprise Tier
- **Max Designs:** Unlimited
- **Collections:** Unlimited
- **Sharing:** Yes
- **Templates:** Yes
- **Version History:** Yes
- **Storage:** 5GB

## Enforcement Mechanism

### Database-Level Enforcement

**`check_design_limit()` Trigger:**
```sql
BEFORE INSERT ON premium_designs
```
- Checks user's `profiles.subscription_tier`
- Counts existing designs for free-tier users
- Raises exception if limit exceeded
- Error: "Design limit reached. Upgrade to Pro for unlimited designs."

### Application-Level Enforcement

**`designStore.saveDesign()` method:**
1. Checks `useAuthStore.isPremium` state
2. Calls `canUserSaveDesign()` from `designValidation.js`
3. Returns `{ success: false, requiresUpgrade: true }` if limit hit
4. Tracks via Mixpanel: `Design Save Blocked - Limit Reached`

## API Usage Examples

### Save a Design (with Premium Check)

```javascript
const { saveDesign, designCount, maxDesigns } = useDesignStore()
const { isPremium } = useAuthStore()

const result = await saveDesign('My Board Layout', 'Optional description')

if (!result.success && result.requiresUpgrade) {
  // Show upgrade modal
  showUpgradePrompt()
}
```

### Create a Collection (Pro Only)

```javascript
const { createCollection } = useDesignStore()
const { canAccess, requiresUpgrade } = canUserAccessCollections()

if (!canAccess) {
  showUpgradePrompt('Design Collections are a Pro feature')
  return
}

await createCollection('Work Boards', 'Designs for office displays')
```

### Add Design to Collection

```javascript
const result = await addDesignToCollection(collectionId, designId)
```

### Load Design for Editing

```javascript
const result = await loadDesign(designId)
if (result.success) {
  // Design now in currentDesign state
}
```

### Delete Design

```javascript
const result = await deleteDesign(designId)
// Also updates designCount automatically
```

## Row-Level Security (RLS) Policies

All tables have RLS enabled. Key policies:

1. **premium_designs**
   - Users can only view/edit/delete their own designs
   - Public templates visible to all

2. **design_versions**
   - Only owners of parent design can access versions

3. **design_collections**
   - Users can only access their own collections
   - Public collections visible to all

4. **design_collection_members**
   - Only accessible through parent collection ownership

5. **design_likes**
   - Anyone can like; only owners can unlike

## Validation Utilities

**File:** `src/utils/designValidation.js`

```javascript
// Check if user can save
const { canSave, requiresUpgrade } = canUserSaveDesign()

// Check collections access
const { canAccess, requiresUpgrade } = canUserAccessCollections()

// Validate design data
const { valid, errors } = validateDesign(designData)

// Get tier limits
const limits = getDesignTierLimits('pro')
// Returns: { maxDesigns, maxCollections, canShareDesigns, ... }

// Check if operation requires premium
const requiresPremium = isPremiumOperation('create_collection')
```

## Integration with Premium Gate Component

Use `<PremiumGate>` to wrap UI that requires premium:

```jsx
<PremiumGate feature="designer">
  <GridEditor />
</PremiumGate>
```

## Tracking & Analytics

Design operations tracked via Mixpanel:

- `Design Saved` - Successful save
- `Design Save Blocked - Limit Reached` - Quota exceeded
- `Design Fetch Error` - Data fetch failure
- `Design Updated` - Design modified
- `Design Deleted` - Design removed
- `Collection Created` - New collection
- `Collection Deleted` - Collection removed

## Migration Details

**File:** `supabase/migrations/006_premium_designs.sql`

Includes:
- Table creation (5 tables)
- RLS policy setup (20+ policies)
- Index creation (8 performance indexes)
- Trigger functions (2 triggers)
- Design limit enforcement

**Run via Supabase CLI:**
```bash
supabase db push
```

## Common Implementation Patterns

### Pattern: Gated Feature Save

```javascript
const handleSaveDesign = async () => {
  const { canSave, reason, requiresUpgrade } = canUserSaveDesign()
  
  if (!canSave) {
    if (requiresUpgrade) {
      showUpgradeModal(reason)
    } else {
      showError(reason)
    }
    return
  }

  const result = await saveDesign(designName)
  if (result.success) {
    toast.success('Design saved!')
  }
}
```

### Pattern: Conditional UI Based on Tier

```javascript
const { isPremium, subscriptionTier } = useAuthStore()
const { designCount, maxDesigns } = useDesignStore()

return (
  <div>
    {!isPremium && (
      <div className="text-sm text-yellow-600">
        {designCount}/{maxDesigns} designs used
      </div>
    )}
    
    {isPremium && (
      <button onClick={createCollection}>
        New Collection
      </button>
    )}
  </div>
)
```

### Pattern: Version History (Pro Only)

```javascript
const { versionHistory } = useAuthStore().designLimits

if (versionHistory) {
  const { data: versions } = await supabase
    .from('design_versions')
    .select('*')
    .eq('design_id', designId)
}
```

## Future Enhancements

- Design sharing with specific users (permissions)
- Public gallery/marketplace for templates
- Bulk import/export designs
- Design collaboration/concurrent editing
- AI-powered design suggestions
- Template marketplace with revenue sharing

## Troubleshooting

### "Design limit reached" Error
- Check user's subscription_tier in profiles table
- Verify count in premium_designs table
- Run: `SELECT COUNT(*) FROM premium_designs WHERE user_id = 'xxx'`

### RLS Policy Errors
- Ensure user is authenticated (JWT token valid)
- Check that user owns the design/collection
- Verify `auth.uid()` matches `user_id` in database

### Performance Issues
- Indexes are created for common queries
- Use `EXPLAIN ANALYZE` for query optimization
- Consider paginating large design lists
