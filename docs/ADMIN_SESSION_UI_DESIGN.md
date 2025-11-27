# 🎨 Admin Session Management - Visual UI Design

## 📐 Layout Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Admin Session Management                                          │
│  Monitor active sessions, connected clients, and real-time data    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [ Sessions ] [ Details ]  ← Tab Navigation                        │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  STATS DASHBOARD (Responsive Grid)                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  │ Total        │ │ Active       │ │ Total        │ │ Dead         │
│  │ Sessions     │ │ Sessions     │ │ Clients      │ │ Sessions     │
│  │ 25           │ │ 18 ✓         │ │ 52           │ │ 3            │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CONTROLS                                                           │
│  [ 🔄 Refresh ] [✓ Auto-refresh every 5s] [Status ▼] [Sort ▼]   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SESSIONS LIST                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐
│  │ EDJZN2 [✓ Active]                                  [ View ]    │
│  │ • Clients: 5  • Created: 14:22:17  • Age: 3m 42s              │
│  └─────────────────────────────────────────────────────────────────┘
│  ┌─────────────────────────────────────────────────────────────────┐
│  │ KFGHJ9 [⏱ Idle]                                   [ View ]    │
│  │ • Clients: 2  • Created: 13:15:02  • Age: 1h 8m               │
│  └─────────────────────────────────────────────────────────────────┘
│  ┌─────────────────────────────────────────────────────────────────┐
│  │ XTBLMQ [✗ Dead]                                    [ View ]    │
│  │ • Clients: 0  • Created: 12:00:15  • Age: 2h 30m              │
│  └─────────────────────────────────────────────────────────────────┘
│  ... scroll for more ...                                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Status Badges

### Active Session
```
╔════════════════════════════════════════╗
║ ✓ Active                               ║  Green badge
║ Connected clients, recent activity     ║  CheckCircle icon
╚════════════════════════════════════════╝
```

### Idle Session
```
╔════════════════════════════════════════╗
║ ⏱ Idle                                ║  Yellow badge
║ Has clients but > 30 min old           ║  Clock icon
╚════════════════════════════════════════╝
```

### Dead Session
```
╔════════════════════════════════════════╗
║ ✗ Dead                                 ║  Red badge
║ 0 clients, cleanup candidate           ║  XMark icon
╚════════════════════════════════════════╝
```

---

## 📊 Stats Cards (Responsive)

### Mobile (2 columns)
```
┌──────────────┐ ┌──────────────┐
│ Total Sess.  │ │ Active       │
│ 25           │ │ 18           │
└──────────────┘ └──────────────┘
┌──────────────┐ ┌──────────────┐
│ Total Client │ │ Dead         │
│ 52           │ │ 3            │
└──────────────┘ └──────────────┘
```

### Tablet/Desktop (3-4 columns)
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Total Sess.  │ │ Active       │ │ Total Client │ │ Dead         │
│ 25           │ │ 18           │ │ 52           │ │ 3            │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 🎛️ Control Bar

```
┌─────────────────────────────────────────────────────────────────┐
│ [ 🔄 Refresh ]  [✓ Auto-refresh every 5s]  [Status ▼]  [Sort ▼] │
└─────────────────────────────────────────────────────────────────┘

Filter Dropdown (Status ▼):
  ● All Sessions
  ○ Active Only
  ○ Idle Only
  ○ Dead Only

Sort Dropdown (Sort ▼):
  ● Sort: Most Clients
  ○ Sort: Recently Joined
  ○ Sort: Least Active
```

---

## 📋 Session Card

### Default State
```
┌─────────────────────────────────────────────────────────────────┐
│ EDJZN2                    [✓ Active]                 [ 👁 ]      │
│ • Clients: 5   • Created: 14:22:17   • Age: 3m 42s             │
│ • Status: Connected                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Hover State
```
┌─────────────────────────────────────────────────────────────────┐
│ EDJZN2                    [✓ Active]                 [ 👁 ↗ ]    │
│ • Clients: 5   • Created: 14:22:17   • Age: 3m 42s             │
│ • Status: Connected                                              │
│ (Background slightly lighter, cursor changes to pointer)         │
└─────────────────────────────────────────────────────────────────┘
```

### Selected State
```
┌═════════════════════════════════════════════════════════════════┐
║ EDJZN2                    [✓ Active]                 [ 👁 ]      ║
║ • Clients: 5   • Created: 14:22:17   • Age: 3m 42s             ║
║ • Status: Connected                                              ║
║ (Teal border, highlighted background)                            ║
└═════════════════════════════════════════════════════════════════┘
```

---

## 📱 Details Tab View

```
┌─────────────────────────────────────────────────────────────────┐
│ EDJZN2 (Large, Monospace)                                       │
│ Created 2025-11-26 14:07:02 UTC                    [✓ Active]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Connected Clients: 5 | Auth Rate: 80% | Unique IPs: 2          │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ CONNECTED CLIENTS (5)                                           │
│                                                                  │
│ 🟢 Client #1                                                    │
│    Socket: Yd4LB7cu... [Anonymous]                             │
│    User: N/A                                                    │
│    IP: ::1                         Connected: 14:07:03         │
│    User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)...   │
│                                                                  │
│ 🟢 Client #2                                                    │
│    Socket: 6uQnVuvy... [✓ Authenticated]                       │
│    User: john@example.com                                      │
│    IP: 192.168.1.100               Connected: 14:07:04         │
│    User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_1)...    │
│                                                                  │
│ ... more clients ...                                            │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ ℹ️ Session monitor updates every 5 seconds                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Color Scheme

### Status Colors
```javascript
Active (Green):
  Background: #10b981 (emerald-500)
  Light:      #d1fae5 (emerald-100/20)
  Text:       #6ee7b7 (emerald-400)

Idle (Yellow):
  Background: #f59e0b (amber-500)
  Light:      #fef3c7 (amber-100/20)
  Text:       #fbbf24 (amber-400)

Dead (Red):
  Background: #ef4444 (red-500)
  Light:      #fee2e2 (red-100/20)
  Text:       #f87171 (red-400)
```

### UI Colors
```javascript
Primary:     #14b8a6 (teal-500)      // Accents, selected
Dark:        #1e293b (slate-800)     // Cards
Darker:      #0f172a (slate-900)     // Background
Border:      #334155 (slate-700)     // Dividers
Text:        #f1f5f9 (slate-100)     // Primary text
Text Light:  #cbd5e1 (slate-400)     // Secondary text
```

---

## 🔲 Component Sizes

### Stats Cards
```
Mobile:   Full width, 2 columns, padding: 1rem
Tablet:   Auto, 3 columns, padding: 1rem
Desktop:  Auto, 4 columns, padding: 1rem
```

### Session Cards
```
Height:     Auto-expand (min 80px)
Padding:    1rem (16px)
Gap:        8px
Border:     1px solid
Rounded:    8px (lg)
```

### Detailed View
```
Header:     Full width, gradient background, 1.5rem padding
Clients:    Scrollable, max-height 384px (96*4), margin: 1rem
Cards:      Full width, padding: 1rem, border: 1px
```

---

## ✨ Animations & Interactions

### Button Hover
```
[ Refresh ]  →  opacity: 100%, scale: 1.0 (no change)
               → background: lighter shade
               → cursor: pointer
```

### Badge Animations
```
Status badges: Static, no animation (readability)
```

### List Scroll
```
Sessions list:  Smooth scroll, 600px max height
Clients list:   Smooth scroll, 384px max height
```

### Loading State
```
Refresh button while loading:
  Icon: Rotate 360° over 1s, repeating
  Button: Disabled (opacity: 50%, cursor: not-allowed)
```

### Auto-Refresh Indicator
```
Checkbox:  Standard checkbox, with label
Label:     "Auto-refresh every 5s"
Status:    Checked = enabled, unchecked = disabled
```

---

## 📱 Responsive Breakpoints

### Mobile (375px - 640px)
```
Stats:   2 columns
List:    Full width, no side padding
Controls: Stacked vertically
Tabs:    Full width buttons
```

### Tablet (641px - 1024px)
```
Stats:   3 columns
List:    Full width with padding
Controls: Inline, wrappable
Tabs:    Inline buttons
```

### Desktop (1025px - 1536px)
```
Stats:   4 columns
List:    Full width with max-width
Controls: Inline, no wrap
Tabs:    Inline, fixed width
```

### Wide (1537px+)
```
Stats:   4 columns with wider spacing
List:    Centered, max-width: container
Controls: Inline with more spacing
Tabs:    Inline with extra padding
```

---

## 🎭 Empty States

### No Sessions
```
┌────────────────────────────────────┐
│                                    │
│          No sessions found         │
│     Try adjusting your filters     │
│                                    │
│  [🔄 Refresh]  [Reset Filters]    │
│                                    │
└────────────────────────────────────┘
```

### Select a Session to View Details
```
┌────────────────────────────────────┐
│                                    │
│  Select a session to view details  │
│                                    │
│  Click on any session in the list  │
│     to see connected clients       │
│                                    │
└────────────────────────────────────┘
```

### Loading
```
┌────────────────────────────────────┐
│  Loading sessions...               │
│  [🔄 spinning]                     │
└────────────────────────────────────┘
```

### Error State
```
┌────────────────────────────────────┐
│ ⚠️  Error loading sessions          │
│                                    │
│ Failed to fetch from backend       │
│ Please check if server is running  │
│                                    │
│ [🔄 Retry]  [Learn More]          │
└────────────────────────────────────┘
```

---

## 🎨 Typography

### Headings
```
Page Title:    28px, bold, slate-100
Section:       18px, semibold, white
Label:         12px, medium, slate-400
Metric:        24px, bold, white
```

### Text
```
Primary:       14px, regular, white
Secondary:     13px, regular, slate-400
Detail:        12px, regular, slate-500
Monospace:     14px, mono, teal-300 (for codes)
```

---

## 🎯 Accessibility Features

### Keyboard Navigation
```
Tab:     Move between elements
Enter:   Click buttons/select
Space:   Toggle checkboxes
Arrow:   Navigate dropdowns
Esc:     Close dropdowns
```

### Screen Reader
```
Stats Cards:   "25 total sessions" (aria-label)
Status Badge:  "Active, 3 clients" (semantically clear)
Buttons:       "Refresh sessions" (descriptive)
Links:         "View session EDJZN2 details"
```

### Visual Accessibility
```
Color Contrast:  AAA standard (4.5:1 minimum)
Focus Indicators: Visible, 2px outline
Font Size:       14px minimum
Icon + Text:     Always together (not icon-only)
```

---

## 📐 Spacing System

### Consistent Spacing (8px grid)
```
xs:  4px
sm:  8px
md:  12px
lg:  16px
xl:  24px
2xl: 32px
```

### Cards
```
Padding:     lg (16px)
Gap:         md (12px)
Border:      1px
Rounded:     lg (8px)
```

### Lists
```
Item Gap:        sm (8px)
Section Gap:     lg (16px)
Padding:         lg (16px)
Max Height:      Scrollable
```

---

## 🎪 Dashboard Summary

| Aspect | Value |
|--------|-------|
| **Tabs** | 2 (Sessions, Details) |
| **Stats Cards** | 4 (Total, Active, Clients, Dead) |
| **Filters** | 4 (All, Active, Idle, Dead) |
| **Sort Options** | 3 (Clients, Joined, Activity) |
| **Max Columns** | 4 (responsive down to 1) |
| **Refresh Rate** | 5 seconds (configurable) |
| **Max Visible Sessions** | ~10 (with scrolling) |
| **Max Visible Clients** | ~5 (with scrolling) |
| **Color States** | 3 (Active/Idle/Dead) |
| **Accessibility** | WCAG AA compliant |

---

## 🔄 State Flow

```
User Opens Admin Tab
        ↓
SessionManagement Component Mounts
        ↓
Check isAdmin Flag
        ↓
Initialize State (empty sessions, auto-refresh on)
        ↓
Set Auto-Refresh Interval (5s)
        ↓
Fetch Sessions from Backend
        ↓
Process & Store Sessions
        ↓
Filter & Sort (client-side)
        ↓
Render Stats, Controls, Sessions List
        ↓
User Clicks Session
        ↓
Select Session Code
        ↓
Switch to Details Tab
        ↓
Display Detailed Client Breakdown
        ↓
Auto-Refresh Updates All Data Every 5s
```

---

## 🎓 Design Philosophy

**From PM**: Solve real operational problems  
**From UX**: Make complex data glanceable  
**From Dev**: Keep it maintainable and performant  

**Result**: A professional dashboard that works for all stakeholders ✨
