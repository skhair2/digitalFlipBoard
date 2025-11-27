# 🚀 Quick Start Guide - Admin Session Management

## ⚡ 30-Second Setup

1. **Servers running?**
   ```bash
   npm run dev          # Frontend (port 3000)
   npm run server:dev   # Backend (port 3001)
   ```

2. **Open Admin page**
   - Navigate to: http://localhost:3000/control
   - Click: **"Admin"** tab (at top)
   - See: Session Management dashboard

3. **Done!** 🎉
   - Watch live session data
   - Click sessions for details
   - Filter/sort as needed

---

## 📍 Where to Find It

### Path in App
```
Control Page (http://localhost:3000/control)
    ↓
    Admin Tab
    ↓
    Session Management (top section)
    ↓
    [ View all active sessions ]
```

### File Structure
```
src/
├── components/admin/
│   └── SessionManagement.jsx        ← Dashboard component
└── pages/
    └── Control.jsx                   ← Integrated here
```

---

## 🎯 Core Features (At a Glance)

### View Live Stats
- Total sessions
- Active connections
- Total clients
- Dead/inactive sessions

### Filter Sessions
```
Status Filter: All | Active | Idle | Dead
Sort By:       Most Clients | Recently Joined | Least Active
Auto-Refresh:  ON (every 5s) | OFF (manual)
```

### Inspect Details
Click any session → See:
- All connected clients
- Client IPs & user-agents
- Authentication status
- Connection times

---

## 🎮 Example Use Cases

### Use Case 1: Quick Health Check (30 sec)
```
1. Open Admin tab
2. Glance at stat cards: "18 active / 25 total"
3. ✓ Looks healthy → Close
```

### Use Case 2: Debug High Load (5 min)
```
1. See spike in "Total Clients" (42 → 87)
2. Click "Sort: Most Clients"
3. Click session with most clients
4. Review connected users
5. Check for bot/spam IPs
6. Identify issue
```

### Use Case 3: Monitor Performance (Ongoing)
```
1. Enable "Auto-refresh"
2. Leave dashboard open
3. Watch metrics update every 5s
4. Track trends
5. Screenshot for reporting
```

---

## 🎯 Key Metrics

| Metric | What It Means | Good | Bad |
|--------|---------------|------|-----|
| **Total Sessions** | How many pairing codes active | 10-50 | >100 |
| **Active Sessions** | Connections with clients | 80%+ | <50% |
| **Total Clients** | Sum of all connected users | 2-5 per session | >10 per session |
| **Dead Sessions** | Sessions with 0 clients | <10% | >30% |

---

## 📊 Status Meanings

### ✓ Active (Green)
- **What**: Session has clients, created < 30 min ago
- **Action**: Normal, monitor

### ⏱ Idle (Yellow)  
- **What**: Session has clients, but > 30 min old
- **Action**: May be zombie, investigate if time increases

### ✗ Dead (Red)
- **What**: Session has 0 connected clients
- **Action**: Cleanup candidate (typically auto-cleaned by server)

---

## 🔍 Debugging Guide

### Problem: "All sessions showing Dead"
```
Cause:    No active connections
Solution: 
  1. Open Display page (http://localhost:3000)
  2. Enter pairing code from Admin dashboard
  3. Sessions should show as "Active"
```

### Problem: "Sessions not updating"
```
Cause:    Auto-refresh disabled or backend down
Solution:
  1. Click "Refresh" button manually
  2. Check auto-refresh is enabled
  3. Verify backend running: npm run server:dev
  4. Check browser console for errors
```

### Problem: "High auth rate (20%)"
```
Cause:    Mostly anonymous users
Solution:
  1. Check if expected (public demo)
  2. Review user-agents (might be bots)
  3. Check IPs for unusual patterns
  4. Consider rate limiting
```

### Problem: "Session with 50 clients"
```
Cause:    Possible connection leak or broadcast test
Solution:
  1. Click to see details
  2. Review client IPs (same IP = same device)
  3. Check if all authenticated
  4. Identify if legitimate or buggy app
```

---

## ⚙️ Configuration

### Change Refresh Rate
Edit `src/components/admin/SessionManagement.jsx` line 23:
```javascript
const [refreshInterval, setRefreshInterval] = useState(5000) // 5 seconds

// Options:
// 1000  = 1 second (real-time, uses more CPU)
// 5000  = 5 seconds (recommended)
// 10000 = 10 seconds (smoother, less frequent)
```

### Change Idle Threshold
Edit `src/components/admin/SessionManagement.jsx` line 57:
```javascript
else if (ageMinutes > 30) status = 'idle' // Mark as idle after 30 min

// Change to:
else if (ageMinutes > 60) status = 'idle' // Mark as idle after 60 min
```

---

## 🧪 Testing Checklist

### ✅ Quick Test (2 min)
```
[ ] Dashboard loads
[ ] Stats cards show numbers
[ ] Click "Refresh" → Updates
[ ] Click session → Shows details
[ ] Close and reopen tab → Works
```

### ✅ Full Test (10 min)
```
[ ] Stats display correctly
[ ] Auto-refresh updates every 5s
[ ] Filter by "Active" → shows only active
[ ] Sort by "Most Clients" → changes order
[ ] Click session → details appear
[ ] Details show client list
[ ] Error handling (turn off backend, refresh)
[ ] Works on mobile/tablet/desktop
```

---

## 🎓 Understanding the Data

### Session Example
```json
{
  "sessionCode": "EDJZN2",
  "createdAt": "2025-11-26T14:07:02.949Z",
  "clientCount": 5,
  "clients": [
    {
      "socketId": "abc123def456ghi789",
      "userEmail": "john@example.com",
      "isAuthenticated": true,
      "clientIp": "192.168.1.100",
      "joinedAt": "2025-11-26T14:07:03.000Z",
      "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1)"
    }
  ]
}
```

### Computed Fields
```javascript
status = 'active'        // Determined by age & client count
ageMinutes = 3.5         // Time since creation
authRate = 80%           // % of authenticated clients
uniqueIps = 2            // Count of unique IP addresses
```

---

## 📚 Related Documentation

| Document | Purpose |
|----------|---------|
| **ADMIN_SESSION_MANAGEMENT_GUIDE.md** | Comprehensive feature guide |
| **ADMIN_SESSION_UI_DESIGN.md** | Visual design system |
| **ADMIN_SESSION_MANAGEMENT_IMPLEMENTATION.md** | Implementation details |
| **server/index.js** | Backend session tracking logic |

---

## 🆘 Common Questions

**Q: Why is the "status" column sometimes empty?**  
A: Status is color-coded (green/yellow/red) - check the badge next to session code.

**Q: Can I terminate a session from here?**  
A: Not yet - planned for Phase 2. Currently view-only.

**Q: Why do the numbers keep changing?**  
A: Auto-refresh is ON - updates every 5 seconds with latest data.

**Q: How do I turn off auto-refresh?**  
A: Uncheck "Auto-refresh every 5s" checkbox, then click "Refresh" manually when needed.

**Q: Can I export the data?**  
A: Not in this version - planned for Phase 2.

**Q: Is this data real-time?**  
A: Yes! Updates every 5 seconds. Backend tracks all WebSocket connections.

---

## 🔗 Quick Links

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Admin Page**: http://localhost:3000/control?tab=admin
- **Display Page**: http://localhost:3000/display
- **Control Page**: http://localhost:3000/control

---

## 📞 Support

### If something isn't working:

1. **Check servers are running**
   ```bash
   npm run dev          # Frontend
   npm run server:dev   # Backend
   ```

2. **Verify backend is responding**
   ```bash
   # In browser console:
   fetch('http://localhost:3001/api/debug/sessions')
     .then(r => r.json())
     .then(d => console.log(d))
   ```

3. **Clear browser cache**
   - Ctrl+Shift+Delete (Windows)
   - Cmd+Shift+Delete (Mac)

4. **Check browser console** (F12 → Console tab)
   - Look for red errors
   - Search for "Session" in logs

---

## ✨ You're Ready!

**Next Steps**:
1. Open Admin tab
2. Play around with filters/sorting
3. Open display page to create real sessions
4. Monitor live data updates
5. Review detailed guides for deeper understanding

**Happy Monitoring! 🚀**
