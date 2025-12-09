# Display Session Stats - Quick Start Guide 🚀

## For Admins: Viewing Display Session Statistics

### Access the Dashboard
1. Open **Control page** (`/control`)
2. Click **Admin** tab
3. You'll see **Display Session Statistics** at the top

### What You Can See

#### Overview Stats (4 Cards)
- **Total Sessions**: All display codes ever created
- **Active Sessions**: Currently connected displays
- **Displays On**: How many displays have active controllers
- **Controllers On**: How many controllers are actively paired
- **Total Messages**: Sum of all messages sent across all sessions

#### Sessions Table
Shows all sessions with these details:

| Column | What It Means |
|--------|---------------|
| Session Code | The 6-character pairing code (e.g., ABC123) |
| Status | Active, Disconnected, Expired, or Terminated |
| Display | ✓ Connected or ✗ Offline |
| Controller | ✓ Connected or ✗ Offline |
| Messages | Total messages sent in this session |
| Created | When the session was created |
| View | Click to see detailed session info |

### How to Filter
- **Filter by Status**: Dropdown to show only active/disconnected/expired/terminated sessions
- **Auto-Refresh**: Toggle to automatically update every 5 seconds
- **Manual Refresh**: Click the refresh button

### View Session Details
Click **"View →"** on any session to see:

1. **Session Header**
   - Session code (large display)
   - Status badge
   - Total messages sent
   - Duration (how long session lasted)
   - Last activity timestamp

2. **Connection Timeline**
   - When display connected/disconnected
   - When controller connected/disconnected
   - Timestamps for debugging

3. **Connected Clients List**
   - Display device info (browser, OS, IP)
   - Controller device info (browser, OS, IP)
   - Connection duration
   - Message count per connection

---

## For Developers: How It Works

### New Database Tables

**display_sessions**
- One row per unique session code
- Tracks both display and controller connection times
- Counts total messages and tracks activity
- RLS: Admins see all, users see only their own

**display_connections**
- Multiple rows per session (one for each connected device)
- Stores client info (browser, OS, IP, user agent)
- Tracks individual connection duration
- RLS: Admins see all, users see only their own

### Backend Integration

When a **display connects**:
```
Socket.io 'connection' event
  ↓
Parse device info from user-agent
  ↓
Call displaySessionLogger.updateDisplayConnected()
  ↓
Creates/updates display_sessions row
  ↓
Stores to Supabase
```

When a **message is sent**:
```
Socket.io 'message:send' event
  ↓
Broadcast message
  ↓
Call displaySessionLogger.recordSessionMessage()
  ↓
Increments total_messages_sent counter
  ↓
Stores to Supabase (non-blocking)
```

When **socket disconnects**:
```
Socket.io 'disconnect' event
  ↓
Check if display or controller
  ↓
Call logDisplayDisconnection() or logControllerDisconnection()
  ↓
Stores disconnect timestamp
  ↓
Updates Supabase
```

### Frontend Component

`SessionStats.jsx` handles:
- Fetching data from Supabase every 5 seconds (if auto-refresh enabled)
- Calculating stats (totals, active count, etc.)
- Rendering stats cards
- Rendering filterable/sortable sessions table
- Rendering detailed session view on click

---

## Common Tasks

### Find All Sessions for a Specific User
1. Open SessionStats
2. Click on any session
3. Look at "Connected Clients" section
4. See which user connected as display/controller

### Debug Connection Issues
1. Click "View" on problem session
2. Check "Connection Timeline" - see when devices connected/disconnected
3. Check "Device Info" - see browser/OS/IP information
4. Check "Message Count" - see if messages were actually sent

### Monitor Active Displays Right Now
1. Filter by Status: **Active Only**
2. Check "Displays On" stat - that's how many are currently running
3. Check each session's display/controller status (✓ or ✗)

### See Historical Session Data
1. Filter by Status: **All Sessions** (or Disconnected/Expired)
2. Check "Created" timestamp
3. Look at "Duration" in details view
4. See message counts and activity logs

---

## Troubleshooting

### Stats not updating?
- Check "Auto-refresh" toggle is ON
- Click "Refresh" button manually
- Check internet connection

### Session shows but no client info?
- Session might be expired or very old
- New sessions might take a few seconds to populate
- Try refreshing

### "Access Denied" message?
- You need admin role to view session stats
- Contact admin to check your role permissions

### Data looks wrong?
- Check timestamps are in correct timezone
- Remember: durations are calculated from created_at to ended_at (or now)
- Message counts are cumulative (never decrease)

---

## Key Metrics Explained

| Metric | Calculation |
|--------|-------------|
| Total Sessions | COUNT(*) from display_sessions |
| Active Sessions | COUNT(*) where is_active = true |
| Displays On | COUNT(*) where display_connected_at != null AND display_disconnected_at = null |
| Controllers On | COUNT(*) where controller_connected_at != null AND controller_disconnected_at = null |
| Total Messages | SUM(total_messages_sent) across all sessions |
| Session Duration | EXTRACT(EPOCH FROM (ended_at - created_at)) or (now() - created_at) |
| Client Duration | EXTRACT(EPOCH FROM (disconnected_at - connected_at)) or (now() - connected_at) |

---

## API Endpoints (For Integration)

**Note**: These return data from Supabase through RLS policies

### List all sessions (admin only)
```
GET /api/admin/display-sessions
Returns: [{id, session_code, status, display_user_id, controller_user_id, ...}]
```

### Get session details
```
GET /api/admin/display-sessions/:sessionCode
Returns: {session info + all connections}
```

### Filter sessions
```
GET /api/admin/display-sessions?status=active&limit=50
```

---

**Last Updated**: 2024
**Component**: `src/components/admin/SessionStats.jsx`
**Database Tables**: `display_sessions`, `display_connections`
**Backend Module**: `server/displaySessionLogger.js`
