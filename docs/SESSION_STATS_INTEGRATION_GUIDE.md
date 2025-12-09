# Session Stats Integration Guide

## Quick Start

The enhanced SessionStats component is now live and **ready to use**. No additional setup required.

### Component Usage

```jsx
import SessionStats from '@/components/admin/SessionStats'

export function AdminDashboard() {
  return (
    <div className="p-8">
      <SessionStats />
    </div>
  )
}
```

## How It Works

### On Component Mount
1. ✅ Checks if user is admin via `authStore`
2. ✅ If admin: Fetches sessions from Supabase
3. ✅ Sets up auto-refresh interval (5s)
4. ✅ Shows stats grid with 6 metrics

### User Interactions

#### View All Sessions
1. Click **"Refresh Now"** to manually fetch
2. Toggle **"Auto-refresh"** to pause/resume 5s updates
3. Use **filters** to search/filter sessions
4. Click any row to view details
5. Click **"View →"** button for details

#### Filter Sessions
1. Click **"Show Filters"** to expand filter panel
2. Enter search term (session code)
3. Pick status (Active, Disconnected, etc.)
4. Pick date range (Today, Week, Month)
5. Pick sort order (Recent, Messages, Duration)
6. Results update instantly

#### Export Sessions
1. Click **"Export CSV"** button
2. Filtered sessions download as `sessions-YYYY-MM-DD.csv`
3. Open in Excel/Google Sheets

#### Terminate Session
1. Click row to select session
2. Go to "Session Details" tab
3. Click **"Terminate"** button
4. Enter optional reason
5. Confirm termination
6. Session status changes to "Terminated"

### Viewing Details

In the "Session Details" tab:
- **Header**: Session code + status + health + terminate button
- **Metrics**: Messages, duration, last activity, reason
- **Timeline**: Display & controller connection times
- **Clients**: All device connections with IP/browser/OS info

---

## Features Overview

| Feature | Location | Purpose |
|---------|----------|---------|
| Stats Grid | Top of Sessions tab | 6 key metrics |
| Search | Filter panel | Find by session code |
| Status Filter | Filter panel | Active/Expired/Terminated |
| Date Filter | Filter panel | Today/Week/Month |
| Sort Options | Filter panel | Recent/Messages/Duration |
| Refresh Button | Control bar | Manual update |
| Auto-refresh | Control bar | 5s auto updates |
| Export CSV | Control bar | Download data |
| Health Indicator | Table & details | 4-tier health status |
| Terminate Action | Details tab | End session |
| Connection Timeline | Details tab | Connection events |
| Client List | Details tab | All connected devices |

---

## Data Flow

```
┌─────────────────┐
│  SessionStats   │
│  Component      │
└────────┬────────┘
         │
         ├─→ fetchSessions()
         │   └─→ Supabase (display_sessions)
         │       └─→ setSessions(data)
         │
         ├─→ Auto-refresh interval (5s)
         │   └─→ fetchSessions()
         │
         ├─→ User filters/sorts
         │   └─→ filteredSessions (client-side)
         │
         ├─→ Click session row
         │   └─→ setSelectedSession()
         │       └─→ fetchConnections(id)
         │           └─→ Supabase (display_connections)
         │               └─→ setConnections(data)
         │
         └─→ Click terminate
             └─→ terminateSession(id, reason)
                 └─→ Supabase update
                     └─→ fetchSessions() refresh
```

---

## Admin Requirements

### User Must Have
- ✅ `authStore.isAdmin === true`
- ✅ Supabase auth session
- ✅ Read access to `display_sessions` table
- ✅ Read access to `display_connections` table
- ✅ Update access to `display_sessions` (for termination)

### If Not Admin
- Component displays: "Access Denied - You must be an admin"

---

## Supabase Tables Required

### display_sessions
```sql
CREATE TABLE display_sessions (
  id UUID PRIMARY KEY,
  session_code VARCHAR(6),
  status VARCHAR (20),
  created_at TIMESTAMP,
  is_active BOOLEAN,
  display_connected_at TIMESTAMP,
  display_disconnected_at TIMESTAMP,
  controller_connected_at TIMESTAMP,
  controller_disconnected_at TIMESTAMP,
  total_messages_sent INTEGER,
  last_activity_at TIMESTAMP,
  disconnect_reason TEXT,
  ended_at TIMESTAMP,
  metadata JSONB
)
```

### display_connections
```sql
CREATE TABLE display_connections (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES display_sessions(id),
  connection_type VARCHAR(20), -- 'display' or 'controller'
  connected_at TIMESTAMP,
  disconnected_at TIMESTAMP,
  duration_seconds INTEGER,
  device_info JSONB,
  ip_address VARCHAR(50),
  email VARCHAR(255),
  message_count INTEGER
)
```

---

## Customization

### Change Auto-Refresh Interval
File: `src/components/admin/SessionStats.jsx` (line 56)

```jsx
const refreshInterval = 5000 // Change to desired milliseconds
```

### Change Session Limit
File: `src/components/admin/SessionStats.jsx` (line 74)

```jsx
.limit(100) // Change to desired number
```

### Add New Metric to Stats Grid
1. Calculate metric in stats object
2. Add new card to StatsGrid component
3. Copy existing card HTML and change values

### Change Color Scheme
Search and replace color classes:
- `bg-teal-` → Change primary accent color
- `bg-green-` → Change success color
- `bg-red-` → Change danger color
- `bg-slate-` → Change background

### Add New Filter Option
1. Add state variable for filter
2. Add UI input in filter panel
3. Add filter logic in filteredSessions calculation
4. Test filtering

---

## Troubleshooting

### Sessions Not Loading
1. Check browser console for errors
2. Verify admin access: `console.log(useAuthStore.getState().isAdmin)`
3. Verify Supabase connection: Check network tab
4. Check RLS policies on `display_sessions` table

### Auto-refresh Not Working
1. Open DevTools Console
2. Check for interval errors
3. Verify autoRefresh toggle is ON
4. Check Supabase quota

### Can't Terminate Sessions
1. Verify admin role
2. Check database permissions
3. Look for error message in UI
4. Check Supabase logs

### CSV Export Not Working
1. Check browser popup blocker
2. Verify session data exists
3. Check file size (may take time for large exports)
4. Try different browser

### Health Indicator Incorrect
1. Verify display/controller connection status in DB
2. Check message count is accurate
3. Ensure timestamp columns are populated

---

## Performance Notes

### Large Datasets
- Component limits to 100 sessions per fetch
- Client-side filtering/sorting (instant)
- Connection fetch only on demand
- No N+1 queries

### Optimization Tips
1. Keep auto-refresh ON for real-time updates
2. Use filters to reduce on-screen data
3. Close details tab when not needed
4. Archive old sessions in DB

### Memory Usage
- Stores max 100 sessions in state
- Connections only loaded per session
- Cleanup on unmount
- No memory leaks from intervals

---

## Testing Checklist

Use this to verify everything works:

```
Session Viewing:
☐ Page loads without errors
☐ Stats show correct counts
☐ Sessions table displays data
☐ Clicking row shows details
☐ Details tab shows all info

Filtering:
☐ Search by code works
☐ Status filter works
☐ Date range filter works
☐ Sort options work
☐ Results count updates

Refresh:
☐ Manual refresh button works
☐ Auto-refresh toggles on/off
☐ 5-second auto-update works
☐ Loading spinner shows

Export:
☐ CSV button exports
☐ File downloads
☐ Contains filtered data
☐ File is readable in Excel

Termination:
☐ Terminate button visible
☐ Modal appears
☐ Cancel works
☐ Confirm terminates
☐ Status updates to Terminated

Admin Check:
☐ Admins see full interface
☐ Non-admins see "Access Denied"
```

---

## Mixpanel Events

The component tracks these events:

```
Display Sessions Fetched
  └─ count: number

Session Terminated by Admin
  └─ sessionId: string
  └─ reason: string

Sessions Exported
  └─ count: number
```

View in Mixpanel dashboard under "Insights".

---

## Support & Issues

### Report Issues
1. Check browser console for errors
2. Check Supabase logs
3. Verify admin permissions
4. Check database connectivity

### Common Questions

**Q: Why 5-second refresh?**
A: Balances real-time updates with server load. Customizable via `refreshInterval`.

**Q: Can I export more than 100 sessions?**
A: Update `.limit(100)` in fetchSessions() to load more at once.

**Q: How do I see deleted sessions?**
A: Filter by status "Terminated" - they're soft deleted (not removed from DB).

**Q: Why doesn't health show "Connected" for fresh sessions?**
A: Refresh data to see latest status. Auto-refresh works every 5 seconds.

---

## File Reference

**Main Component**:
- `src/components/admin/SessionStats.jsx` (772 lines)

**Documentation**:
- `docs/SESSION_STATS_ENHANCEMENT.md` (Detailed guide)
- `docs/SESSION_STATS_FEATURE_SUMMARY.md` (Feature overview)
- This file (Integration guide)

**Dependencies**:
- React 18.2.0
- Zustand (authStore)
- Supabase
- Tailwind CSS
- Heroicons

---

## Next Steps

1. ✅ Review component in `src/components/admin/SessionStats.jsx`
2. ✅ Test with admin account
3. ✅ Try filtering and exporting
4. ✅ Try terminating test session
5. ✅ Monitor Mixpanel events
6. ✅ Deploy to production

---

**Status**: Ready to Use  
**Version**: 2.0 (Enhanced)  
**Last Updated**: [Current Date]
