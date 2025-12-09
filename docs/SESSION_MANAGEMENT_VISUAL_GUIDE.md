# 🎨 SessionManagement - Visual Guide & Code Examples

**Component:** `src/components/admin/SessionManagement.jsx`  
**Version:** 2.0 (Premium Redesign)  
**Status:** Production Ready ✅

---

## Visual Layout

### 1. Main Dashboard Layout

```
┌─ SessionManagement Dashboard ──────────────────────────────────────┐
│                                                                     │
│  📊 Session Management                                             │
│  Monitor active sessions, connected clients, and real-time data    │
│                                                                     │
│  ┌─ Sessions Tab ── Details Tab ────────────────────────────────┐  │
│                                                                   │
│  ┌─ Stats Row ────────────────────────────────────────────────┐ │  │
│  │ 📊 Total      🔴 Live       👥 Clients    ⚠️  Dead         │ │  │
│  │  127           45            324           82               │ │  │
│  └─────────────────────────────────────────────────────────────┘ │  │
│                                                                   │  │
│  ┌─ Search & Controls ────────────────────────────────────────┐  │  │
│  │ 🔍 Search by session code...          [Refresh][Export CSV] │  │  │
│  │ ☑ Auto-refresh  [All Sessions ▼] [Sort: Clients ▼]        │  │  │
│  └─────────────────────────────────────────────────────────────┘  │  │
│                                                                   │  │
│  Found 45 sessions                                  [Grid][List]  │  │
│                                                                   │  │
│  ┌─ Session Cards Grid (3 columns) ──────────────────────────┐   │  │
│  │ ┌─ ABC123 ────────┐  ┌─ DEF456 ────────┐  ┌─ GHI789 ────┐ │   │  │
│  │ │ 🟢 Active Live  │  │ 🟡 Idle         │  │ 🔴 Dead     │ │   │  │
│  │ │ Clients: 5      │  │ Clients: 12     │  │ Clients: 0  │ │   │  │
│  │ │ Age: 12m        │  │ Age: 45m        │  │ Age: 2h     │ │   │  │
│  │ │ ✓ Good          │  │ ⚠ Aging         │  │ ✕ Poor      │ │   │  │
│  │ │                 │  │                 │  │             │ │   │  │
│  │ │ Click to view →│  │ Click to view →│  │ Click →    │ │   │  │
│  │ └─────────────────┘  └─────────────────┘  └─────────────┘ │   │  │
│  │ [More cards...]                                             │   │  │
│  └─────────────────────────────────────────────────────────────┘   │  │
│                                                                   │  │
└─────────────────────────────────────────────────────────────────┘  │
```

### 2. Detail Modal (On Card Click)

```
┌─ Detail Modal ─────────────────────────────────────────────────────┐
│                                                                      │
│  ABC123 (SessionCode)         🟢 Active   ✓ Good Health      [X]   │
│  Created: 12/8/25 2:15 PM • Age: 12 minutes                        │
│                                                                      │
│  ┌─ Quick Stats ──────────────────────────────────────────────────┐ │
│  │ Clients: 5  │ Status: Connected │ Type: Session │ Health: Good │ │
│  │ Uptime: 12m │ Mode: Real-time   │ ────────────────────────── │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─ Connected Clients ───┐  ┌─ Activity Log ───────────────────────┐ │
│  │ 🔗 Socket ID 1        │  │ 🟢 Session Created              │     │ │
│  │    📧 user@email.com  │  │    2:15 PM                      │     │ │
│  │    🔌 192.168.1.1     │  │ 🟢 5 Clients Connected          │     │ │
│  │                       │  │    Now                          │     │ │
│  │ 🔗 Socket ID 2        │  │ 🟢 Display Connected            │     │ │
│  │    📧 admin@email.com │  │    Now                          │     │ │
│  │    🔌 192.168.1.2     │  │ 🟢 Controller Connected         │     │ │
│  │                       │  │    Now                          │     │ │
│  │ [More clients...]     │  │ 🟢 Session Health: Healthy      │     │ │
│  │                       │  │    12m old                      │     │ │
│  └───────────────────────┘  └─────────────────────────────────────┘ │
│                                                                      │
│  📋 Session ID: ABC123 | Status: ACTIVE                            │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 3. List View (Alternative)

```
┌─ Session List ────────────────────────────────────────────────────┐
│ Found 45 sessions                                    [Grid] [List] │
│                                                                    │
│ ┌─ ABC123 ──────────────────────────────────────────────────────┐ │
│ │ 🟢 Active  ✓ Live    │  Clients: 5     Created: 2:15 PM      │ │
│ │                       │  Age: 12m        Connected  👁         │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ ┌─ DEF456 ──────────────────────────────────────────────────────┐ │
│ │ 🟡 Idle    ⚠ Aging   │  Clients: 12    Created: 1:30 PM      │ │
│ │                       │  Age: 45m        Connected  👁         │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ ┌─ GHI789 ──────────────────────────────────────────────────────┐ │
│ │ 🔴 Dead    ✕ Poor    │  Clients: 0     Created: 12:30 PM     │ │
│ │                       │  Age: 2h         Offline  👁           │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ [More sessions...]                                               │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Code Examples

### 1. Using Export CSV

```jsx
// This function is built-in, triggered by Export CSV button
const exportSessions = useCallback(() => {
  if (filteredSessions.length === 0) {
    alert('No sessions to export')
    return
  }

  // Create CSV format
  const headers = ['Session Code', 'Clients', 'Status', 'Age (min)', 'Created', 'Health']
  const rows = filteredSessions.map(session => [
    session.sessionCode,
    session.clientCount ?? 0,
    session.status,
    Math.round(session.ageMinutes),
    new Date(session.createdAt).toLocaleString(),
    session.clientCount > 0 && session.ageMinutes < 30 ? 'Good' : session.clientCount > 0 ? 'Aging' : 'Poor'
  ])

  // Convert to CSV string
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  // Download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `sessions-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Track in Mixpanel
  mixpanel.track('Sessions Exported', { count: filteredSessions.length })
}, [filteredSessions])
```

### 2. Opening Detail Modal

```jsx
// Click any card to open modal
const handleCardClick = (sessionCode) => {
  setSelectedSessionCode(sessionCode)
  setShowDetailModal(true)
  
  // Track in Mixpanel
  mixpanel.track('Session Details Opened', { sessionCode })
}

// In JSX:
<div
  onClick={() => {
    setSelectedSessionCode(session.sessionCode)
    setShowDetailModal(true)
  }}
  className="cursor-pointer hover:border-teal-500 transition-all"
>
  {/* Card content */}
</div>
```

### 3. Real-time Search

```jsx
// Search updates as user types
const [searchQuery, setSearchQuery] = useState('')

// Filter sessions in real-time
const filteredSessions = sessions
  .map(session => {
    // Add age and status calculations
    const ageMinutes = (Date.now() - new Date(session.createdAt).getTime()) / 60000
    return { ...session, ageMinutes, status: /* ... */ }
  })
  .filter(session => {
    // Apply search filter
    if (searchQuery && !session.sessionCode.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    // Apply status filter
    if (filterStatus !== 'all' && session.status !== filterStatus) {
      return false
    }
    return true
  })
  .sort((a, b) => {
    // Apply sort
    if (sortBy === 'clients') return b.clientCount - a.clientCount
    if (sortBy === 'joined') return new Date(b.createdAt) - new Date(a.createdAt)
    if (sortBy === 'activity') return a.ageMinutes - b.ageMinutes
    return 0
  })

// In search input:
<input
  type="text"
  placeholder="Search by session code... (e.g., ABC123)"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="w-full px-4 py-3 rounded-lg"
/>
```

### 4. Health Status Calculation

```jsx
// Determine session health based on status and age
const getHealthStatus = (clientCount, ageMinutes) => {
  if (clientCount === 0) return 'Poor'
  if (ageMinutes < 30) return 'Good'
  return 'Aging'
}

// Health colors
const healthColors = {
  Good: { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-300' },
  Aging: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-300' },
  Poor: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-300' }
}

// In component:
const health = getHealthStatus(clientCount, ageMinutes)
<div className={`${healthColors[health].bg} px-3 py-1 rounded-full`}>
  <span className={healthColors[health].text}>{health}</span>
</div>
```

### 5. Auto-Refresh Logic

```jsx
// Auto-refresh state
const [autoRefresh, setAutoRefresh] = useState(true)
const refreshInterval = 5000 // 5 seconds

// Set up auto-refresh
useEffect(() => {
  if (!autoRefresh) return

  fetchSessions() // Initial fetch
  const interval = setInterval(fetchSessions, refreshInterval)
  
  // Cleanup on unmount
  return () => clearInterval(interval)
}, [autoRefresh, refreshInterval, fetchSessions])

// In JSX:
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    checked={autoRefresh}
    onChange={(e) => setAutoRefresh(e.target.checked)}
    className="w-4 h-4 accent-teal-500"
  />
  <span className="text-sm text-gray-300">Auto-refresh</span>
</label>
```

### 6. Modal Component

```jsx
const SessionDetailModal = () => {
  if (!showDetailModal || !selectedSession) return null

  const clientCount = selectedSession.clientCount ?? 0
  const isLive = clientCount > 0

  return (
    // Backdrop with click to close
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="absolute inset-0" onClick={() => setShowDetailModal(false)} />

      {/* Modal Card */}
      <div className="relative bg-slate-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-900/30 to-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold font-mono text-teal-300">
              {selectedSession.sessionCode}
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              Created: {new Date(selectedSession.createdAt).toLocaleString()}
            </p>
          </div>
          <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-800">
            <XMarkIcon className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={selectedSession.status} />
            {isLive && <LiveBadge />}
            <HealthBadge health={getHealthStatus(clientCount, selectedSession.ageMinutes)} />
          </div>

          {/* Stats Grid */}
          {/* Two-Column Layout */}
          {/* Activity Log */}
        </div>
      </div>
    </div>
  )
}
```

---

## Color Reference

### Health Status Colors
```
Good   → Green   (#10b981) → bg-green-500
Aging  → Yellow  (#f59e0b) → bg-yellow-500
Poor   → Red     (#ef4444) → bg-red-500
```

### Status Indicator Colors
```
Active → Green
Idle   → Yellow
Dead   → Red
```

### UI Element Colors
```
Primary    → Teal     (#14b8a6)
Success    → Green    (#10b981)
Warning    → Yellow   (#f59e0b)
Danger     → Red      (#ef4444)
Background → Slate    (#1e293b)
Border     → Slate    (#334155)
```

---

## Usage Patterns

### Pattern 1: Search and Filter
```jsx
// User types in search
setSearchQuery('ABC123')

// Sessions auto-filter
// Display shows: "Found 1 session"

// If no results
// Show: "No sessions found. Try a different search term"
```

### Pattern 2: View Toggle
```jsx
// User clicks "List" button
setViewMode('list')

// Component re-renders with list layout
// Selected card styling persists in list view
```

### Pattern 3: Modal Drill-Down
```jsx
// User clicks any card
setSelectedSessionCode('ABC123')
setShowDetailModal(true)

// Modal opens with full session details
// User can close with X button or backdrop click
// Mixpanel tracks the event
```

### Pattern 4: Export Flow
```jsx
// User clicks "Export CSV"
exportSessions()

// CSV file downloads with current date
// Browser handles download UI
// Mixpanel tracks export count
```

---

## Performance Tips

### Optimize for 100+ Sessions
```jsx
// Memoize filtered sessions
const filteredSessions = useMemo(() => {
  return sessions.filter(/* ... */).sort(/* ... */)
}, [sessions, searchQuery, filterStatus, sortBy])
```

### Lazy Load Modal Content
```jsx
// Only render modal content if visible
if (!showDetailModal) return null

// Modal content renders immediately
// But client list could lazy-load if very large
```

### Debounce Search Input
```jsx
// Optional: Add debounce for large datasets
const [debouncedQuery, setDebouncedQuery] = useState('')

useEffect(() => {
  const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
  return () => clearTimeout(timer)
}, [searchQuery])
```

---

## Accessibility Features

### Keyboard Navigation
- Tab through controls
- Enter to activate buttons
- Checkbox toggle with spacebar
- Escape to close modal

### ARIA Labels
```jsx
<button aria-label="Close session details">
  <XMarkIcon />
</button>

<input
  type="text"
  aria-label="Search sessions by code"
  placeholder="Search..."
/>
```

### Screen Reader Support
- Semantic HTML
- Clear button labels
- Form labels associated
- Status updates announced

---

## Testing Scenarios

### Scenario 1: New Admin Views Sessions
1. Admin opens SessionManagement
2. Grid view loads with cards
3. Search bar ready
4. Stats showing accurate counts

### Scenario 2: Search for Specific Session
1. Admin types "ABC123" in search
2. List filters to matching sessions
3. Counter shows "Found 1 session"
4. Card shows highlighted (teal border)

### Scenario 3: Export Data
1. Admin clicks "Export CSV" button
2. Browser downloads `sessions-2025-12-08.csv`
3. CSV opens in Excel/Sheets
4. All 45 sessions in file

### Scenario 4: View Session Details
1. Admin clicks any card
2. Modal opens with smooth animation
3. Shows all 6 stats
4. Activity log shows recent events
5. Admin clicks X to close

### Scenario 5: Auto-Refresh
1. Auto-refresh checkbox enabled (default)
2. Waits 5 seconds
3. Data refreshes
4. UI updates with new counts
5. Sessions change if clients connect/disconnect

---

## Common Customizations

### Change Refresh Interval
```jsx
const refreshInterval = 10000 // 10 seconds instead of 5
```

### Change Grid Columns
```jsx
// In grid CSS
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
// Change lg:grid-cols-4 to lg:grid-cols-5 for 5 columns
```

### Add More Stats
```jsx
// Add to statCards array
{ 
  key: 'averageAge', 
  label: 'Avg Age', 
  value: Math.round(avgAge), 
  icon: '⏱️' 
}
```

### Change Status Colors
```jsx
const statusColors = {
  active: 'from-green-900 to-green-800',
  idle: 'from-yellow-900 to-yellow-800',
  dead: 'from-red-900 to-red-800'
}
```

---

## Troubleshooting

### Sessions Not Loading
```
Check:
1. Backend API running (port 3001)
2. /api/debug/sessions endpoint exists
3. Response format is correct
4. No CORS errors in console
```

### Modal Won't Open
```
Check:
1. Component state (showDetailModal)
2. Browser console for errors
3. z-index isn't blocked by other elements
4. Click event is firing (use console.log)
```

### Export Not Working
```
Check:
1. filteredSessions has data
2. Browser allows downloads
3. Filename doesn't have invalid chars
4. CSV format is valid
```

---

**Last Updated:** December 8, 2025  
**Version:** 2.0  
**Status:** Production Ready ✅
