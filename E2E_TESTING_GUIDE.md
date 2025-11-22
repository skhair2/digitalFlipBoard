# End-to-End Testing Guide for Premium Design System

## Test Environment Setup

### Prerequisites
- [ ] Two browser windows or tabs (one for Control, one for Display)
- [ ] Access to Supabase (to verify database operations)
- [ ] Mixpanel dashboard open (to verify events firing)
- [ ] Browser DevTools console open (to check for errors)

### Test Accounts
- [ ] Create a free-tier test account
- [ ] Create a pro-tier test account
- [ ] Test with anonymous user (no account)

---

## Test Suite 1: Free Tier User Journey

### 1.1: Create Session & See Free Tier Limits
**Test Steps:**
1. Log in as free-tier user
2. Go to `/control` page
3. Verify "Session pairing" screen shows
4. Create session code
5. Open Display page with same code
6. Verify boards connected

**Expected Results:**
- [ ] Session code visible in Control page
- [ ] Display page joins session room
- [ ] Both pages show "Connected" status
- [ ] Mixpanel event: `Control Page Viewed`

### 1.2: Send Message on Free Tier
**Test Steps:**
1. From Control page, type "Hello"
2. Click Send (or press Enter)
3. Check Display page for message

**Expected Results:**
- [ ] Message appears on Display with flip animation
- [ ] GridEditor remains visible in Control (not premium-gated)
- [ ] Mixpanel event: `Message Sent` logged
- [ ] No restrictions on sending messages

### 1.3: GridEditor - Save First Design
**Test Steps:**
1. Go to Designer tab
2. Edit grid (click cells to fill)
3. Click "Save Design"
4. Enter name "Test Design 1"
5. Verify save succeeds

**Expected Results:**
- [ ] Design saves successfully
- [ ] Toast shows "Design saved!"
- [ ] DesignList updates showing new design (1/5)
- [ ] Quota display shows "1/5 designs used"
- [ ] Mixpanel event: `Design Saved` with designId
- [ ] Database: `premium_designs` table has new row

### 1.4: Save 5 Designs (Hit Quota)
**Test Steps:**
1. Create and save 5 designs total:
   - Design 2, 3, 4, 5, and verify design count
2. Attempt to save 6th design

**Expected Results:**
- [ ] After 5th design: Quota display shows "5/5 designs used"
- [ ] Save button becomes disabled
- [ ] Design name input becomes disabled (free tier only)
- [ ] 6th save attempt shows error toast: "Design limit reached. Upgrade to Pro..."
- [ ] UpgradeModal appears
- [ ] Mixpanel event: `Design Save Error` with reason: "quota_exceeded"
- [ ] Database: No 6th row inserted (trigger prevents it)

### 1.5: View & Load Saved Designs
**Test Steps:**
1. Go to Saved Designs section
2. Click first design in list
3. Verify grid config updates
4. Verify design layout loads

**Expected Results:**
- [ ] Design list shows all 5 designs
- [ ] Each shows grid dimensions (e.g., "22x6")
- [ ] Load button works, shows "Active" badge on loaded design
- [ ] Toast: "Loaded: [Design Name]"
- [ ] Mixpanel event: `Design Loaded` with designName
- [ ] GridEditor reflects loaded layout
- [ ] GridConfig updates to match design dimensions

### 1.6: Delete Design
**Test Steps:**
1. From DesignList, click trash icon
2. Confirm deletion dialog
3. Verify design removed

**Expected Results:**
- [ ] Confirmation dialog appears
- [ ] After deletion, toast shows "Design deleted"
- [ ] DesignList updates (now shows 4/5)
- [ ] Quota display updates to "4/5 designs used"
- [ ] Save button re-enables (below quota)
- [ ] Mixpanel event: `Design Deleted`
- [ ] Database: Row removed from `premium_designs`

### 1.7: Duplicate Design
**Test Steps:**
1. Click duplicate button on a design
2. Verify new design created with "(Copy)" suffix
3. Check quota updated

**Expected Results:**
- [ ] Duplicate dialog appears or inline creates copy
- [ ] New design appears in list with "(Copy)" name
- [ ] Quota updated (5/5 again)
- [ ] Mixpanel event: `Design Duplicated`
- [ ] Grid config matches original design

### 1.8: Cast Design to Display
**Test Steps:**
1. Load a design
2. Click "Cast to Board" button
3. Check Display page for message

**Expected Results:**
- [ ] Message from design appears on Display
- [ ] Flip animation plays
- [ ] Toast on Control: "Design sent to board"
- [ ] Mixpanel event: `Design Cast`

### 1.9: Collections Tab (Pro Feature Gate)
**Test Steps:**
1. Scroll to Collections section
2. Verify gate message shows

**Expected Results:**
- [ ] Collections section shows "Pro Only" message
- [ ] Create Collection button disabled or hidden
- [ ] Text: "Upgrade to Pro for unlimited collections"
- [ ] Upgrade CTA visible

### 1.10: Version History Tab (Pro Feature Gate)
**Test Steps:**
1. Scroll to Version History section
2. Verify gate message shows

**Expected Results:**
- [ ] Version History section shows "Pro Only" message
- [ ] "No version history available" or gate message
- [ ] Text: "Upgrade to Pro to track and restore versions"

### 1.11: Upgrade Modal Flows
**Test Steps:**
1. Click "Upgrade" CTA button anywhere
2. Verify modal content

**Expected Results:**
- [ ] Modal shows Pro features and benefits
- [ ] "Upgrade to Pro" button present
- [ ] Pricing shown ($9.99/month or configured amount)
- [ ] Can close modal with X or Cancel
- [ ] Mixpanel event: `Upgrade Modal Shown`

### 1.12: Tab Routing with URL Parameters
**Test Steps:**
1. Navigate to `/control?tab=designer`
2. Verify Designer tab opens
3. Try `/control?tab=sharing`
4. Verify Sharing tab opens

**Expected Results:**
- [ ] `/control?tab=designer` opens Designer tab (selectedTabIndex = 1)
- [ ] `/control?tab=sharing` opens Sharing tab
- [ ] Other tabs still clickable and switchable
- [ ] Tab state persists while in Control page
- [ ] URL param is case-insensitive

---

## Test Suite 2: Pro Tier User Journey

### 2.1: Pro Tier Dashboard Journey
**Test Steps:**
1. Log in as pro-tier user
2. Go to `/dashboard`
3. View onboarding journey

**Expected Results:**
- [ ] Pro journey steps visible (3-4 steps)
- [ ] Step 1: Launch managed display (if boards.length > 0, shows "Completed")
- [ ] Step 2: Save premium design (if savedDesigns.length > 0, shows "Completed")
- [ ] Step 3: Schedule (shows "Pro Feature" if enabled)
- [ ] Step 4: Invite collaborators
- [ ] All action buttons functional (navigate or show feature)

### 2.2: Unlimited Designs (No Quota)
**Test Steps:**
1. Log in as pro user
2. Go to Designer tab
3. Attempt to save 10+ designs

**Expected Results:**
- [ ] Quota display shows "Unlimited" (or no quota indicator)
- [ ] Save button always enabled
- [ ] All 10+ designs save successfully
- [ ] DesignList shows all designs (pagination or scroll)
- [ ] No "Design limit reached" error

### 2.3: Create Collections
**Test Steps:**
1. In Designer tab, go to Collections section
2. Click "New Collection"
3. Enter name "Q1 Promotions"
4. Add description "March-April campaigns"
5. Click "Create Collection"

**Expected Results:**
- [ ] Collections section fully visible (not gated)
- [ ] Form appears with name & description fields
- [ ] Create button submits
- [ ] Toast: "Collection created!"
- [ ] New collection appears in list
- [ ] Mixpanel event: `Collection Created`
- [ ] Database: `design_collections` row inserted with user_id, name, description

### 2.4: Add Designs to Collections
**Test Steps:**
1. From a collection, click "Add designs..."
2. Select one or more designs
3. Add them to collection

**Expected Results:**
- [ ] Can select multiple designs
- [ ] Designs added to collection
- [ ] Collection count updates ("2 designs")
- [ ] Mixpanel event: `Designs Added To Collection`
- [ ] Database: `design_collection_members` rows created

### 2.5: Manage Collections
**Test Steps:**
1. Click collection to expand
2. View designs in collection
3. Remove a design with X button
4. Delete collection with trash icon

**Expected Results:**
- [ ] Collection expands to show member designs
- [ ] Can remove individual designs
- [ ] Trash button deletes entire collection
- [ ] Confirmation dialog on delete
- [ ] Toast: "Collection deleted"
- [ ] Mixpanel event: `Collection Deleted`
- [ ] Member rows removed from database

### 2.6: Version History - Save Multiple Versions
**Test Steps:**
1. Load a design
2. Modify it (edit a few cells)
3. Save design with description "Added top banner"
4. Modify again
5. Save again with description "Centered text"
6. Go to Version History

**Expected Results:**
- [ ] Version History section visible (not gated)
- [ ] Timeline shows 2 versions
- [ ] Latest version labeled "Latest" (green)
- [ ] Version 1 shows older timestamp
- [ ] Change descriptions visible
- [ ] Restore buttons appear on old versions
- [ ] Database: Multiple rows in `design_versions` table

### 2.7: Restore Previous Version
**Test Steps:**
1. In Version History, click "Restore" on old version
2. Confirm dialog
3. Verify design reverts

**Expected Results:**
- [ ] Confirmation dialog appears
- [ ] Toast: "Version restored!"
- [ ] GridEditor reflects old version content
- [ ] New "Latest" version created (not overwriting)
- [ ] Mixpanel event: `Design Version Restored`
- [ ] Database: New version row created with restored state

### 2.8: Tab Routing (Same as Free)
**Test Steps:**
1. Test `/control?tab=designer` 
2. Test `/control?tab=collections` (if applicable)
3. Test `/control?tab=sharing`

**Expected Results:**
- [ ] All tabs route correctly
- [ ] Deep links work for pro features

---

## Test Suite 3: Database & RLS Verification

### 3.1: RLS Policy - Free Tier Can't See Pro Collections
**Test Steps:**
1. In Supabase console, as free user, query: `SELECT * FROM design_collections WHERE user_id = [pro_user_id]`
2. Attempt to fetch pro user's collections via app API

**Expected Results:**
- [ ] Query returns empty (RLS blocks)
- [ ] App call returns no collections for other users
- [ ] User can only see own collections

### 3.2: Trigger - Free Tier Design Limit Enforced
**Test Steps:**
1. As free user with 5 designs, directly insert 6th via SQL
2. Monitor trigger execution

**Expected Results:**
- [ ] Trigger `check_design_limit()` fires on INSERT
- [ ] 6th insert fails with error: "Design limit exceeded for free tier"
- [ ] Database constraint prevents overflow
- [ ] App shows graceful error to user

### 3.3: Cascade Delete - Collection Cleanup
**Test Steps:**
1. Create collection with 3 designs
2. Delete collection
3. Check `design_collection_members` table

**Expected Results:**
- [ ] Collection deleted
- [ ] All member rows automatically deleted (cascade)
- [ ] No orphaned records in `design_collection_members`

---

## Test Suite 4: Mixpanel & Analytics

### 4.1: Event Tracking - All Design Operations
**Test Steps:**
1. Save a design (Check Mixpanel for event)
2. Load a design
3. Delete a design
4. Duplicate a design
5. Cast design to board

**Expected Results:**
- [ ] Mixpanel shows `Design Saved` event with: designId, name, timestamp
- [ ] Mixpanel shows `Design Loaded` event
- [ ] Mixpanel shows `Design Deleted` event
- [ ] Mixpanel shows `Design Duplicated` event
- [ ] Mixpanel shows `Design Cast` event
- [ ] All events have user context (userId, email)

### 4.2: Quota & Upgrade Events
**Test Steps:**
1. As free user, hit quota limit
2. Click upgrade button

**Expected Results:**
- [ ] Mixpanel shows `Design Save Error` with reason: "quota_exceeded"
- [ ] Mixpanel shows `Upgrade Modal Shown`
- [ ] If user clicks upgrade link, shows `Upgrade Initiated`

### 4.3: Feature Gate Tracking
**Test Steps:**
1. As free user, view Collections section
2. View Version History section

**Expected Results:**
- [ ] Mixpanel tracks feature gate impressions (or optional)
- [ ] Check "user properties" to confirm subscription_tier = "free" or "pro"

---

## Test Suite 5: UI/UX Edge Cases

### 5.1: Empty States
**Test Steps:**
1. As new free user, go to DesignList
2. Check Collections (if pro user with no collections)
3. Check Version History (if design loaded but no versions)

**Expected Results:**
- [ ] DesignList shows: "No designs yet. Create one to get started!"
- [ ] Collections shows: "No collections yet. Create one..."
- [ ] Version History shows: "No versions yet. Start editing..."
- [ ] All have appropriate icons and CTAs

### 5.2: Loading States
**Test Steps:**
1. Go to DesignList, trigger fetch on mount
2. Watch for Spinner

**Expected Results:**
- [ ] Spinner appears while loading
- [ ] Spinner disappears once data loads
- [ ] No console errors during loading

### 5.3: Error Handling
**Test Steps:**
1. Simulate network error (DevTools offline mode)
2. Try to save design
3. Try to load design
4. Try to delete design

**Expected Results:**
- [ ] Toast shows appropriate error message
- [ ] No crashes or white screens
- [ ] Mixpanel tracks error event
- [ ] Console shows helpful error logs

### 5.4: Form Validation
**Test Steps:**
1. Try to create design with blank name
2. Try to create collection with blank name
3. Try to duplicate design without name

**Expected Results:**
- [ ] Validation shows error toast: "Name is required"
- [ ] Submit button disabled until valid
- [ ] User gets clear feedback

### 5.5: Confirmation Dialogs
**Test Steps:**
1. Click delete design → Check confirm dialog
2. Click delete collection → Check confirm dialog
3. Click restore version → Check confirm dialog

**Expected Results:**
- [ ] All confirmations use `window.confirm()` or modal
- [ ] Cancel option present and functional
- [ ] Clear messaging: "This action cannot be undone"

---

## Test Suite 6: Dark Mode & Responsive

### 6.1: Dark Mode Support
**Test Steps:**
1. Toggle dark mode in settings
2. Go through Collections, VersionHistory sections
3. Check all text contrast and colors

**Expected Results:**
- [ ] All components have `dark:` variants
- [ ] Text is readable in both light and dark
- [ ] Borders, backgrounds, text colors correct
- [ ] No white text on white backgrounds
- [ ] No dark text on dark backgrounds

### 6.2: Mobile Responsiveness
**Test Steps:**
1. Open Control page on mobile (or use DevTools responsive)
2. Try Designer tab on mobile
3. Attempt to save design on mobile

**Expected Results:**
- [ ] GridEditor adapts to mobile screen
- [ ] Forms stack vertically
- [ ] Buttons remain clickable
- [ ] No horizontal scroll on mobile
- [ ] Collections list responsive

---

## Test Suite 7: Performance & Optimization

### 7.1: Design List Performance
**Test Steps:**
1. As pro user with 50+ designs, open DesignList
2. Scroll through list
3. Check DevTools Performance tab

**Expected Results:**
- [ ] List renders smoothly (no stuttering)
- [ ] Scroll FPS is 60 (or close)
- [ ] Mixpanel events fire without lag
- [ ] No memory leaks in console

### 7.2: Version History Performance
**Test Steps:**
1. Design with 20+ versions, open VersionHistory
2. Expand/collapse versions

**Expected Results:**
- [ ] Timeline renders without lag
- [ ] Expand/collapse is smooth
- [ ] No re-renders of entire list on single expand

---

## Test Suite 8: Integration with Display Page

### 8.1: Cast Design to Display
**Test Steps:**
1. Control: Load design → Click "Cast"
2. Display: Verify message shown
3. Control: Load different design → Cast again
4. Display: Verify new message shown

**Expected Results:**
- [ ] Design content transfers to display
- [ ] Grid config (rows/cols) matches
- [ ] Animation plays on display
- [ ] Flip effect synchronized
- [ ] No flicker or glitches

### 8.2: Display with GridEditor Changes
**Test Steps:**
1. Control: Edit grid directly
2. Control: Click "Cast to Board"
3. Display: See live grid update

**Expected Results:**
- [ ] GridEditor direct edits cast immediately
- [ ] Display updates with new layout
- [ ] Both saved designs and ad-hoc designs cast

---

## Summary Checklist

- [ ] All test suites passed
- [ ] No console errors
- [ ] Mixpanel events firing correctly
- [ ] Database operations verified
- [ ] RLS policies working
- [ ] Quota enforcement working (free & pro)
- [ ] Collections fully functional (pro only)
- [ ] Version history fully functional (pro only)
- [ ] Tab routing working
- [ ] Dark mode supported
- [ ] Responsive on mobile
- [ ] Performance acceptable
- [ ] Error handling graceful
- [ ] User feedback clear (toasts, confirmations)
- [ ] Integration with Display page working

---

## Known Limitations (v1)

- [ ] Collections: Can't add designs inline yet (requires "Add designs..." workflow)
- [ ] Version history: Auto-save versions not implemented (manual save only)
- [ ] Collections: Sharing/permissions not fully wired (phase 2)
- [ ] Version history: Export/import not implemented (phase 2)

---

## Debug Tips

**Enable verbose logging:**
```javascript
// In browser console
localStorage.setItem('DEBUG', 'true')
```

**Check Supabase logs:**
- Supabase Console → Logs → Check API, PostgreSQL, Auth tabs

**Monitor WebSocket:**
- Control Inspector → Network → WS (filter for websocket)
- Check messages being sent/received

**Verify Mixpanel:**
- Mixpanel dashboard → Events → Search for design-related events
- Filter by user ID or email
