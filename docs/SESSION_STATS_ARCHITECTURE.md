# Session Stats Dashboard - Architecture & Features

## 📐 Component Architecture

```
SessionStats (Main Component - 772 lines)
│
├── State Management (13 state variables)
│   ├── Data: sessions, connections, selectedSession
│   ├── UI: loading, autoRefresh, selectedTabIndex, showFilters
│   ├── Filters: searchQuery, dateRange, sortBy, filterStatus
│   ├── Modals: showTerminateModal, sessionToTerminate, terminateReason
│   └── Error: error
│
├── API Hooks (useCallback)
│   ├── fetchSessions() → Supabase display_sessions
│   ├── fetchConnections(sessionId) → Supabase display_connections
│   ├── terminateSession(id, reason) → DB update
│   └── exportSessions() → CSV file
│
├── Calculations
│   ├── filteredSessions → Apply all filters & sort
│   ├── stats → 6 metrics from sessions
│   └── health → 4-tier health indicator
│
└── Rendering (2 main tabs)
    ├── Tab 1: Sessions Grid
    │   ├── StatsGrid (6 metrics)
    │   ├── Controls (4 buttons)
    │   ├── FilterPanel (4 filters - collapsible)
    │   ├── ErrorBanner (conditional)
    │   ├── SessionsTable (7 columns, sortable)
    │   └── TerminateModal (overlay)
    │
    └── Tab 2: Session Details
        ├── HeaderSection
        │   ├── Session code + created time
        │   ├── Status badge
        │   ├── Health indicator
        │   ├── Terminate button
        │   └── KPI grid (4 metrics)
        │
        ├── ConnectionTimeline
        │   ├── Display device section
        │   └── Controller device section
        │
        └── ClientsList
            ├── Multiple client cards
            └── Scrollable container
```

---

## 🎨 UI Layout

### Desktop View (1024px+)
```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Display Session Statistics                                   │
│  Monitor active display connections, controller pairing...       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┬──────────┬───────────────┬──────────────┬─────────┐
│   TOTAL      │  ACTIVE  │   DISPLAYS    │ CONTROLLERS  │ MESSAGES│
│   SESSIONS   │ SESSIONS │  CONNECTED    │  CONNECTED   │ TOTAL   │
│     150      │   85     │      125      │      95      │  3,240  │
└──────────────┴──────────┴───────────────┴──────────────┴─────────┘

[Refresh] [Auto-refresh ☑] [Export CSV] [Show Filters ▼]

[Search Code...] [Status: All ▼] [Date: All ▼] [Sort: Recent ▼]
Showing 145 of 150 sessions

┌──────────┬──────────────┬──────────┬──────────┬─────────┬──────────────┬────────┐
│ Code     │ Status       │ Health   │ Messages │Duration │ Created      │ Action │
├──────────┼──────────────┼──────────┼──────────┼─────────┼──────────────┼────────┤
│ABC123    │ ✓ Active     │🟢Excellent│   47    │  23m    │12/15 2:45 PM │ View→  │
│XYZ789    │ ✗ Disconnected│🔴Poor    │    0    │  12m    │12/15 1:30 PM │ View→  │
│...more...│              │          │         │        │              │        │
└──────────┴──────────────┴──────────┴──────────┴─────────┴──────────────┴────────┘
```

### Mobile View (< 768px)
```
┌─────────────────────────────────┐
│  📊 Session Statistics          │
└─────────────────────────────────┘

┌─────────────┬──────────────┐
│  TOTAL      │   ACTIVE     │
│  SESSIONS   │  SESSIONS    │
│    150      │     85       │
└─────────────┴──────────────┘

┌─────────────┬──────────────┐
│  DISPLAYS   │ CONTROLLERS  │
│ CONNECTED   │  CONNECTED   │
│    125      │     95       │
└─────────────┴──────────────┘

[Refresh Now]
[Auto-refresh ☑]
[Export CSV]
[Show Filters]

[Session Code...]
[Status]
[Date Range]
[Sort]

[Code] [Status] [Health] 
ABC123 ✓ Active 🟢Good
XYZ789 ✗Disc   🔴Poor
...
```

---

## 🔄 Data Flow

### Initial Load
```
Component Mount
    ↓
Check isAdmin?
    ├─ No → Show "Access Denied"
    └─ Yes ↓
       fetchSessions()
           ↓
       Supabase Query
           ↓
       setSessions(data)
           ↓
       Calculate stats
           ↓
       Set auto-refresh interval
           ↓
       Render SessionsGrid
```

### User Filtering
```
User changes filter
    ↓
State update (searchQuery, dateRange, etc)
    ↓
filteredSessions recalculation
    ↓
Array.filter() → Apply all conditions
    ↓
Array.sort() → Sort by selected option
    ↓
Re-render table with filtered data
    ↓
Show results count
```

### Session Selection
```
User clicks session row
    ↓
setSelectedSession(session)
    ↓
fetchConnections(sessionId)
    ↓
Supabase Query (display_connections)
    ↓
setConnections(data)
    ↓
Switch to Details tab
    ↓
Render SessionDetails component
```

### Session Termination
```
User clicks Terminate button
    ↓
setShowTerminateModal(true)
    ↓
Render modal with confirmation
    ↓
User enters reason & clicks Terminate
    ↓
terminateSession(id, reason)
    ↓
Supabase UPDATE
    ├─ status = 'terminated'
    └─ disconnect_reason = reason
    ↓
fetchSessions() refresh
    ↓
setSelectedSession(null)
    ↓
Close modal
```

---

## 📊 State Management

### Data States
```
sessions: [
  {
    id: 'uuid',
    session_code: 'ABC123',
    status: 'active',
    created_at: '2024-12-15T14:22:00Z',
    is_active: true,
    display_connected_at: '2024-12-15T14:22:00Z',
    display_disconnected_at: null,
    controller_connected_at: '2024-12-15T14:25:00Z',
    controller_disconnected_at: null,
    total_messages_sent: 47,
    last_activity_at: '2024-12-15T14:45:32Z',
    disconnect_reason: null,
    ended_at: null,
    metadata: {}
  },
  // ... more sessions
]

connections: [
  {
    id: 'uuid',
    session_id: 'uuid',
    connection_type: 'display',
    connected_at: '2024-12-15T14:22:00Z',
    disconnected_at: null,
    duration_seconds: 1392,
    device_info: {
      platform: 'Windows',
      browser: 'Chrome',
      os: 'Win32'
    },
    ip_address: '192.168.1.100',
    email: 'user@example.com',
    message_count: 47
  },
  // ... more connections
]
```

### Filter States
```
searchQuery: 'ABC' // User search
dateRange: 'week' // Time period
sortBy: 'messages' // Sort order
filterStatus: 'active' // Status filter
showOnlyActive: false // Boolean filter
showFilters: true // UI toggle
```

### UI States
```
loading: false // During fetch
autoRefresh: true // Auto-refresh on/off
selectedTabIndex: 0 // Active tab
error: null // Error message
showTerminateModal: false // Modal visibility
selectedSession: null // Selected for details
terminateReason: '' // Modal textarea
```

---

## 📈 Calculated Properties

### Stats Object
```js
stats = {
  totalSessions: 150,           // sessions.length
  activeSessions: 85,           // sessions.filter(s => s.is_active).length
  displayConnected: 125,        // sessions.filter(connected && !disconnected)
  controllerConnected: 95,      // sessions.filter(connected && !disconnected)
  totalMessages: 3240,          // sessions.reduce((sum, s) => sum + messages)
  avgMessages: 21,              // totalMessages / totalSessions
}
```

### Health Score
```js
const getHealth = (session) => {
  const displayOn = session.display_connected_at && !session.display_disconnected_at
  const controllerOn = session.controller_connected_at && !session.controller_disconnected_at
  const hasMessages = session.total_messages_sent > 0
  
  if (displayOn && controllerOn && hasMessages) return 'excellent'
  if (displayOn && controllerOn) return 'good'
  if (displayOn || controllerOn) return 'fair'
  return 'poor'
}
```

### Duration
```js
const getDuration = (session) => {
  if (session.ended_at) {
    // Session ended
    return (new Date(session.ended_at) - new Date(session.created_at)) / 1000 / 60
  } else {
    // Session active
    return (Date.now() - new Date(session.created_at).getTime()) / 1000 / 60
  }
}
```

---

## 🎯 Feature Specifications

### Feature #1: Stats Grid
```
Layout: Grid (responsive: 2/3/4/6 columns)
Cards: 6 total
Content: Label (uppercase) + Number (bold)
Colors: Gradient backgrounds + colored borders
Updates: Real-time with auto-refresh
```

### Feature #2: Controls
```
Buttons: 4 main actions
  - Refresh Now (blue)
  - Auto-refresh toggle (checkbox)
  - Export CSV (gray)
  - Show/Hide Filters (toggles color)
Layout: Flex wrap (responsive)
Position: Below stats grid
```

### Feature #3: Filter Panel
```
Inputs: 4 filters
  1. Search (text input + icon)
  2. Status (select dropdown)
  3. Date Range (select dropdown)
  4. Sort (select dropdown)
Layout: Grid (4 columns on desktop, 1 on mobile)
Toggle: Show/Hide button
Position: Below controls
Effect: Instant client-side filtering
```

### Feature #4: Sessions Table
```
Columns: 7
  1. Session Code (font-mono, teal)
  2. Status (badge with icon)
  3. Health (indicator dot + label)
  4. Messages (number, white)
  5. Duration (calculated, gray)
  6. Created (timestamp, gray)
  7. Action (View button, teal link)
Rows: Hover effect (highlight)
Click: Selects row, shows details
Responsive: Horizontal scroll on mobile
Sorting: Via filter panel sort dropdown
```

### Feature #5: Session Details
```
Tabs: 2 tabs total
  1. All Sessions (main listing)
  2. Session Details (selected session)
Sections: 4 main areas
  1. Header (code + status + actions)
  2. Timeline (display + controller)
  3. Clients (connection list)
  4. Metadata (if available)
Modal: Overlay for termination
Button: Terminate (if not terminated)
```

### Feature #6: Termination Modal
```
Type: Fixed overlay modal
Content:
  - Title "Terminate Session?"
  - Session code display
  - Reason textarea (optional)
  - Cancel & Terminate buttons
Styling: Dark theme, red danger button
Behavior: Blocks other interaction
Callback: Updates DB, refreshes data
```

### Feature #7: CSV Export
```
Format: CSV (comma-separated)
Columns: 7
  1. Session Code
  2. Status
  3. Created Timestamp
  4. Messages
  5. Duration (minutes)
  6. Display Status
  7. Controller Status
Rows: Filtered sessions only
Filename: sessions-YYYY-MM-DD.csv
Download: Auto-triggered to Downloads
```

---

## 🔗 Dependencies Map

```
SessionStats
│
├── React
│   ├── useState (14 state vars)
│   ├── useEffect (2 effects)
│   └── useCallback (4 functions)
│
├── Zustand
│   └── useAuthStore() → isAdmin
│
├── Supabase
│   ├── supabase.from('display_sessions')
│   └── supabase.from('display_connections')
│
├── @headlessui/react
│   └── Tab component
│
├── clsx
│   └── Conditional class names
│
├── @heroicons/react
│   └── 27 icons for UI
│
├── Tailwind CSS
│   └── All styling
│
└── Mixpanel
    └── Analytics tracking
```

---

## ⚙️ Configuration

### Auto-Refresh Interval
```js
const refreshInterval = 5000 // milliseconds
// Change to desired interval (e.g., 3000 for 3 seconds)
```

### Session Limit
```js
.limit(100) // Line 74
// Increase to load more sessions (e.g., .limit(500))
```

### Stats Calculation
```js
// Calculate stats in stats object
// Change calculation methods if needed
```

### Filter Options
```js
// Add/remove filter options by modifying:
// - Select dropdown options
// - Filter logic in filteredSessions
// - Filter UI in FilterPanel
```

---

## 🎨 Color Scheme

### Status Badges
- Active: Green 500/20 bg, 300 text
- Disconnected: Gray 500/20 bg, 300 text
- Expired: Yellow 500/20 bg, 300 text
- Terminated: Red 500/20 bg, 300 text

### Health Indicators
- Excellent: Green (#22C55E)
- Good: Blue (#3B82F6)
- Fair: Yellow (#EAB308)
- Poor: Red (#EF4444)

### Main Colors
- Background: Slate 900/800
- Accent: Teal 600
- Text: White/Gray
- Borders: Slate 700/600
- Hover: Slate 700

---

## 📐 Responsive Breakpoints

| Screen | Stats Grid | Controls | Table | Filters |
|--------|-----------|----------|-------|---------|
| Mobile (<768px) | 2 cols | Stack | Scroll | 1 col |
| Tablet (768-1024) | 3-4 cols | Wrap | Scroll | 2 cols |
| Desktop (>1024px) | 6 cols | Row | Full | 4 cols |

---

## ✅ Feature Checklist

- [x] Stats grid (6 metrics)
- [x] Search filter
- [x] Status filter
- [x] Date range filter
- [x] Sort options
- [x] Auto-refresh
- [x] Manual refresh
- [x] Sessions table
- [x] Health indicator
- [x] Session selection
- [x] Session details
- [x] Connection timeline
- [x] Client list
- [x] Terminate action
- [x] Modal confirmation
- [x] CSV export
- [x] Error handling
- [x] Empty states
- [x] Responsive design
- [x] Accessibility
- [x] Admin check
- [x] Mixpanel tracking

---

**Total Features**: 10+  
**Total State Variables**: 13  
**Total Callbacks**: 4  
**Total Components Rendered**: 15+  
**Total Lines**: 772  
**Status**: ✅ Production Ready
