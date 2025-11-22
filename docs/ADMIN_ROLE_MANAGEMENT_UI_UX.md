# Admin Role Management - UI/UX Design Specification

**Version**: 1.0  
**Date**: November 22, 2025  
**Audience**: Product, Design, Engineering

---

## Design System Integration

### Color Palette

**Primary Actions**:
- Grant/Positive: Indigo-600 (`#4F46E5`)
- Destructive/Revoke: Red-600 (`#DC2626`)
- Warning/Attention: Amber-500 (`#F59E0B`)
- Success: Green-500 (`#10B981`)

**Text**:
- Primary: White (`#FFFFFF`)
- Secondary: Gray-400 (`#9CA3AF`)
- Tertiary: Gray-500 (`#6B7280`)
- Disabled: Gray-600 (`#4B5563`)

**Backgrounds**:
- Card: Gray-800 (`#1F2937`)
- Hover: Gray-750 (`#1A202C`)
- Input: Gray-700 (`#374151`)
- Border: Gray-700 (`#374151`)
- Modal Overlay: Black 50% opacity

**Semantic**:
- Admin Role: Indigo-500 badge
- Revoke Action: Red-400 text
- Audit (GRANT): Green-400 badge
- Audit (REVOKE): Red-400 badge
- Pending/Loading: Gray-500 spinner

### Typography

**Headings**:
- H1: 30px, 900 weight, tight spacing
- H2: 24px, 700 weight
- H3: 20px, 600 weight
- Label: 14px, 500 weight, uppercase tracking

**Body**:
- Regular: 16px, 400 weight (desktop), 14px (mobile)
- Small: 14px, 400 weight
- Tiny: 12px, 400 weight

### Icons

From Heroicons (24px outline style):
- 🔐 Lock (ShieldCheckIcon) - Concept
- 🔍 Search (MagnifyingGlassIcon) - Find users
- ✓ Check (CheckIcon) - Success/confirmed
- ✕ Close (XMarkIcon) - Dismiss
- ⚠️ Warning (ExclamationIcon) - Alert
- 📋 Clock (ClockIcon) - Audit log/history
- 👤 User (UserIcon) - Person/admin
- 📊 Stats (ChartBarIcon) - Metrics

### Spacing System

- 8px base unit
- Padding: 4px, 8px, 12px, 16px, 24px, 32px
- Margin: Same scale
- Border radius: 6px (inputs), 8px (cards), 12px (modals)

### Shadows

- Card: `0 1px 3px rgba(0,0,0,0.1)`
- Modal: `0 25px 50px rgba(0,0,0,0.25)`
- Hover lift: `0 10px 25px rgba(0,0,0,0.15)`

---

## Layout Specifications

### Main Component Layout

```
┌─────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [🔐] Role Management                          Admins: 3    │
│  Manage admin roles and permissions                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ERROR BANNER (if any)                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [🔍 Find & Grant] [👥 All Admins] [📋 Audit Log]   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │ [TAB CONTENT - Varies by selected tab]             │  │
│  │                                                      │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Tab 1: Find & Grant

```
┌──────────────────────────────────────────────────────────────┐
│ Search User by Email                                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ User Email                                                   │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ [jane@example.com                           🔍 spinner] │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ✓ Found 1 result                                             │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Jane Doe                                    [Pro]      │  │
│ │ jane@example.com                                       │  │
│ └────────────────────────────────────────────────────────┘  │
│ (click to select)                                            │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ SELECTED USER                                ✕ Clear   │  │
│ │ Jane Doe                                               │  │
│ │ jane@example.com                                       │  │
│ │                                                        │  │
│ │ Subscription: Pro           Member Since: 11/22/2025  │  │
│ │                                                        │  │
│ │ ┌────────────────────────────────────────────────────┐ │  │
│ │ │ ✓ Grant Admin Role                               │ │  │
│ │ └────────────────────────────────────────────────────┘ │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Tab 2: All Admins

```
┌──────────────────────────────────────────────────────────────┐
│ Admin List                                                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Email              │ Granted    │ By         │ Actions │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ admin@company.com  │ 10/1/2025  │ System     │ Revoke  │  │
│ │ you@company.com    │ 11/1/2025  │ Admin      │ (you)   │  │
│ │ jane@example.com   │ 11/22/2025 │ Admin      │ Revoke  │  │
│ └────────────────────────────────────────────────────────┘  │
│  (hover rows to highlight)                                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Tab 3: Audit Log

```
┌──────────────────────────────────────────────────────────────┐
│ Audit Log                                                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ [GRANT] jane@example.com                       11/22, 10:30 │
│ by admin@company.com                                         │
│ "New team member"                                            │
│                                                              │
│ [REVOKE] bob@example.com                        11/20, 14:15│
│ by admin@company.com                                         │
│ "Left the team"                                              │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Load More History                                      │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### Search Input

**Container**: 
- Width: 100% (responsive)
- Padding: 16px

**Input Field**:
- Height: 44px (touch target)
- Padding: 12px 16px
- Border: 1px Gray-600, on focus Indigo-500 + ring
- Border radius: 8px
- Font: 16px regular
- Placeholder: Gray-400
- Background: Gray-700 on focus lightens to Gray-650

**States**:
- Default: Gray border, Gray-400 placeholder
- Focused: Indigo border, ring, cursor visible
- Typing: Spinner icon on right
- Disabled: Gray background, Gray text, cursor not-allowed

**Spinner**:
- Size: 20px
- Position: Absolute right, 12px from edge
- Animation: Rotate 360° / 1s infinite
- Color: Gray-500

### Search Results List

**Container**:
- Background: Transparent
- Spacing: 8px between items
- Max height: 300px (scrollable if > 3 results)

**Result Item**:
- Background: Gray-700
- Border: 1px Gray-600
- Padding: 12px
- Border radius: 8px
- Cursor: Pointer
- Hover: Background Gray-650, border Gray-500
- Click: Selection state (show in selected card)

**Result Content**:
- Name: 16px, white, 600 weight
- Email: 14px, Gray-400
- Badge (right): Tier label (Pro, Free, Enterprise)

### Selected User Card

**Container**:
- Background: Indigo-600/10 (very subtle)
- Border: 2px Indigo-500/50
- Padding: 16px
- Border radius: 12px
- Spacing: 16px between sections

**Header**:
- Flex row, space-between
- Left: "Selected User" label (uppercase, tiny, Gray-400)
- Title: User name (lg, white, 600 weight)
- Subtitle: Email (sm, Gray-400)
- Right: Close button (XMarkIcon, gray, hover red)

**Details Grid**:
- 2 columns on desktop, 1 on mobile
- Label: tiny, Gray-400, uppercase
- Value: white, 600 weight
- Gap: 12px

**Button**:
- Full width
- Height: 44px
- Background: Indigo-600
- Hover: Indigo-700
- Text: white, 600 weight
- Border radius: 8px
- Leading icon: ✓

### Grant Modal

**Container**:
- Max width: 500px (desktop), 90vw (mobile)
- Background: Gray-800
- Border: 1px Gray-700
- Border radius: 12px
- Box shadow: Large (modal style)
- Z-index: 50

**Header**:
- Background: Gray-750
- Border bottom: 1px Gray-700
- Padding: 24px
- Icon: ShieldCheckIcon, Indigo-400
- Title: "Grant Admin Role", 18px, white, 700 weight

**Content**:
- Padding: 24px
- Sections separated by borders
- Spacing: 16px between sections

**User Display**:
- Label: "User", tiny, Gray-400, uppercase
- Value: Email, white, 600 weight

**Email Verification**:
- Label: "Type email to confirm:", 14px, Gray-400
- Input: Same style as search
- Feedback: 
  - On mismatch: Red error text
  - On match: Green success text with checkmark

**Permissions Preview**:
- Label: "Permissions Granted", tiny, uppercase, Gray-400
- List: Checkmark + text
- Items: `✓ View all users`, `✓ Grant/revoke roles`, etc.

**Footer**:
- Background: Gray-750
- Border top: 1px Gray-700
- Padding: 16px 24px
- Two buttons side-by-side
- Gap: 12px

**Buttons**:
- Cancel: Gray-700 bg, hover Gray-600
- Grant: Indigo-600 bg, hover Indigo-700, disabled opacity-50
- Both: 44px height, full-width on mobile (stack vertical)

### Revoke Modal

**Same layout as Grant Modal**, but:
- Header background: Red-950/50
- Title text: Red-300
- Icon + color: Red theme
- Warning banner: Red-500/10 bg, Red-500/50 border, Red-300 text
- Revoke button: Red-600 bg, hover Red-700
- Reason field: Optional (helpful for tracking)

---

## Interaction Specifications

### Email Search Flow

```
User types 'jane' 
    ↓
300ms debounce
    ↓
API call: searchUsersByEmail('jane')
    ↓
Spinner shows on input
    ↓
Results arrive
    ↓
Spinner removed, results displayed
    ↓
User clicks result
    ↓
selectUser() called
    ↓
Loading spinner on card
    ↓
User details loaded
    ↓
Selected card shown with Grant button
```

**Error case**:
```
User types 'nonexistent'
    ↓
No results found
    ↓
Red error banner: "No users found with that email"
    ↓
User can modify search and retry
```

### Grant Flow

```
User clicks "Grant Admin Role"
    ↓
Grant modal opens
    ↓
User sees: User email, verification field, permissions list
    ↓
User types email in verification field (debounced check)
    ↓
Email matches → Green checkmark, button enabled
    ↓
Email doesn't match → Red error, button disabled
    ↓
User (optionally) types reason
    ↓
User clicks "Grant Admin"
    ↓
Button changes to "Granting..." (disabled)
    ↓
Service call: grantAdminRole()
    ↓
Success: Modal closes, admin list refreshes
        User gets visual feedback (toast or message)
```

**Error cases**:
```
Already admin:
    "User is already an admin" → Pre-grant error in validation
    
Max admins reached:
    "Maximum admins limit reached" → Error message in modal
    
Network error:
    "Failed to grant" → Red error banner in modal, retry button
```

### Revoke Flow

```
User clicks "Revoke" on admin row
    ↓
Confirm modal opens
    ↓
Modal shows: "Are you sure? This cannot be undone."
    ↓
User (optionally) types reason
    ↓
User clicks "Revoke"
    ↓
Button changes to "Revoking..." (disabled)
    ↓
Service call: revokeAdminRole()
    ↓
Success: Modal closes, admin removed from list, audit log updates
        Success message shows
```

**Guard rails**:
```
Can't revoke self:
    Button disabled if row is "You", shows gray
    
Can't revoke last admin:
    If count = 1, error: "Cannot revoke the last admin"
    
Last check before confirming:
    Modal shows warning: "This action cannot be undone"
```

---

## Responsive Design

### Desktop (≥1024px)

**Main layout**:
- Sidebar: 256px fixed left
- Content: Flexible right
- Max content width: 100%

**Search**:
- Input: Full width (min 400px)
- Results: Full width, max 3 visible before scroll

**Admin table**:
- Full table layout
- Columns: Email | Granted | By | Actions
- Rows: 44px height each

**Modals**:
- Centered, max 500px wide
- Overlay: Full viewport

### Tablet (768px - 1023px)

**Main layout**:
- Sidebar: 60px collapsed (icons only)
- Content: Flexible

**Search**:
- Input: Full width minus padding
- Results: Stacked cards, 100% width

**Admin table**:
- Responsive table, scroll horizontally if needed
- OR convert to cards

**Modals**:
- Centered, 90vw max, padding 16px

### Mobile (<768px)

**Main layout**:
- Sidebar: Hamburger menu (hidden by default)
- Content: Full width

**Search**:
- Input: 100% width, padding 12px
- Results: Full width cards
- Selected card: Full width

**Admin table**:
- Convert to cards
- Each card: Email, Role, Granted date, Actions (button)
- Stack vertically

**Modals**:
- Full height, bottom-sheet style
- OR 100% width, centered
- Touch-friendly buttons (48px min height)

**Spacing**:
- Reduce margins: 8px instead of 16px
- Font sizes: Slightly smaller (14px base)
- Touch targets: Minimum 44x44px

---

## Accessibility

### Color Contrast
- All text: WCAG AAA (4.5:1 minimum)
- Indigo on gray: 4.8:1
- Red on gray: 5.2:1
- Gray-400 on dark: 4.6:1

### Keyboard Navigation
- Tab order: Left to right, top to bottom
- Focus visible: 2px indigo ring on all interactive elements
- Modals: Focus trap (tab wraps within modal)
- Close: Escape key dismisses modals
- Shortcuts: Optional (?, /, S for search)

### Screen Readers
- Semantic HTML: `<button>`, `<input>`, `<label>` 
- ARIA labels: Buttons with icons have text or aria-label
- Live regions: Error messages use role="alert"
- Table headers: `<th>` with scope="col"

### Motor / Usability
- Button min size: 44x44px (mobile), 32x32px (desktop)
- Clickable area padding: 8px around icons
- Loading states: Clear feedback (spinner + disabled state)
- Error messages: In context, red color + icon

---

## Design Review Checklist

### Visual Design
- [ ] Colors match brand palette
- [ ] Icons are consistent (Heroicons)
- [ ] Typography hierarchy clear
- [ ] Spacing follows 8px grid
- [ ] Shadows applied correctly
- [ ] Dark mode optimized
- [ ] No harsh contrast issues

### Interaction Design
- [ ] Clear primary/secondary actions
- [ ] Confirmation on destructive actions
- [ ] Loading states shown
- [ ] Error messages helpful
- [ ] Success feedback provided
- [ ] Keyboard navigable
- [ ] Touch-friendly targets

### Responsive Design
- [ ] Mobile layout tested
- [ ] Tablet layout tested
- [ ] Desktop layout tested
- [ ] No horizontal scroll (except tables)
- [ ] Text readable at small sizes
- [ ] Images/icons scale properly

### Accessibility
- [ ] Color contrast checked (WCAG AAA)
- [ ] Focus visible
- [ ] Screen reader tested
- [ ] Keyboard navigation works
- [ ] Modal focus trap works
- [ ] No color-only indicators

### UX Quality
- [ ] User flow makes sense
- [ ] Error states are clear
- [ ] Help text provided
- [ ] Confirmation prevents accidents
- [ ] No dead-ends
- [ ] Success is obvious

---

## Implementation Notes for Engineers

### CSS Classes to Create
```css
/* Utilities */
.admin-search-input         /* Input with spinner support */
.admin-result-item          /* Clickable search result */
.admin-user-card            /* Selected user display */
.admin-grant-modal          /* Modal styling */
.admin-revoke-modal         /* Red-themed modal */
.admin-audit-entry          /* Audit log row */
.admin-badge-action         /* GRANT/REVOKE badge */
.admin-button-disabled       /* Disabled state styling */

/* Components */
.user-lookup-panel          /* Search + results container */
.admins-list-table          /* Admin table wrapper */
.audit-log-container        /* Scrollable audit log */
```

### Tailwind Classes Used
```
/* Layout */
flex, flex-col, grid, grid-cols-2

/* Spacing */
px-4, py-3, gap-3, mb-4, mt-2, space-y-2

/* Colors */
bg-gray-800, text-white, border-gray-700, text-indigo-400
bg-red-500/20, text-red-300, border-red-500/50

/* Interactive */
hover:bg-gray-750, focus:outline-none, focus:ring-1
disabled:opacity-50, transition-colors, cursor-pointer

/* Typography */
text-lg, font-semibold, uppercase, tracking-wider

/* Borders & Shadows */
border, rounded-lg, shadow-lg
```

### Animations
```
/* Spinner */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide In */
@keyframes slideIn {
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

---

## Design Assets

### Figma Link
(Add Figma prototypes here when available)

### Design Tokens
Export as JSON for consistency across projects:
- Color: `$admin-primary-indigo-600`
- Spacing: `$spacing-8, $spacing-16, $spacing-24`
- Typography: `$text-lg-semibold`
- Shadows: `$shadow-modal`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 11/22/2025 | Initial design spec for MVP |
| — | Future | Mobile refinements |
| — | Future | Animations/transitions |

---

**Design by**: Product Design Team  
**Engineering**: Frontend Team  
**Review Date**: November 22, 2025  
**Next Review**: December 6, 2025
