# Session Inactivity Timeout - Visual Architecture & Diagrams

## 🏗️ System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  Display Page    │         │  Control Page    │             │
│  └────────┬─────────┘         └────────┬─────────┘             │
│           │                            │                       │
│           │ useActivityTracking()      │ useActivityTracking() │
│           │ ('display')                │ ('controller')        │
│           ▼                            ▼                       │
│  ┌────────────────────────────────────────────────┐            │
│  │     ActivityTracker Utility                    │            │
│  │  ────────────────────────────────────────────  │            │
│  │  Monitors:                                     │            │
│  │  - Mouse movement                              │            │
│  │  - Keyboard input                              │            │
│  │  - Clicks                                      │            │
│  │  - Scrolling                                   │            │
│  │  - Touch events (mobile)                       │            │
│  │                                                │            │
│  │  Throttles to 1 event / 5 seconds             │            │
│  └─────────────────┬────────────────────────────┘            │
│                    │                                           │
│                    │ emit('display:activity')                 │
│                    │ emit('controller:activity')              │
│                    ▼                                           │
│           ┌────────────────┐                                  │
│           │ WebSocket      │                                  │
│           │ Service        │                                  │
│           └────────┬───────┘                                  │
│                    │ Socket.io WebSocket                       │
└────────────────────┼───────────────────────────────────────────┘
                     │
                     │ TCP/IP
                     │
┌────────────────────▼───────────────────────────────────────────┐
│                      BACKEND (Node.js)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Socket.io Event Handlers                      │  │
│  │  ──────────────────────────────────────────────────────  │  │
│  │  on('display:activity', data)                            │  │
│  │  on('controller:activity', data)                         │  │
│  │  on('client:activity', data)                             │  │
│  │  on('message:send', data)                                │  │
│  │                                                           │  │
│  │  ↓ All update session activity timestamp                 │  │
│  └───────────────────┬────────────────────────────────────┘  │
│                      │                                         │
│                      ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        Session Activity Map (In-Memory)                  │  │
│  │  ──────────────────────────────────────────────────────  │  │
│  │                                                           │  │
│  │  sessionActivity = Map {                                 │  │
│  │    'EDJZN2' → 1700000422949  (timestamp)                │  │
│  │    'ABC123' → 1700000393851  (timestamp)                │  │
│  │    'XYZ789' → 1700000264120  (timestamp)                │  │
│  │  }                                                        │  │
│  │                                                           │  │
│  │  Each activity event updates the timestamp              │  │
│  └───────────────────┬────────────────────────────────────┘  │
│                      │                                         │
│                      │                                         │
│  ┌───────────────────┴────────────────────────────────────┐  │
│  │                                                         │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │   monitorInactiveSessions() Loop                │  │  │
│  │  │   (Runs every 60 seconds)                       │  │  │
│  │  │                                                 │  │  │
│  │  │   For each session:                             │  │  │
│  │  │   ├─ Calculate inactivity duration              │  │  │
│  │  │   ├─ Get thresholds (10m warning, 15m kill)    │  │  │
│  │  │   │                                             │  │  │
│  │  │   ├─ If >= 10m and !warned:                     │  │  │
│  │  │   │  └─ Send warning event                      │  │  │
│  │  │   │     └─ Set warningNotified = true           │  │  │
│  │  │   │                                             │  │  │
│  │  │   └─ If >= 15m:                                 │  │  │
│  │  │      └─ Terminate session                       │  │  │
│  │  │         ├─ Notify all clients                   │  │  │
│  │  │         ├─ Disconnect sockets                   │  │  │
│  │  │         ├─ Delete from tracking                 │  │  │
│  │  │         └─ Log termination                      │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                      │                                         │
│  ┌───────────────────┼──────────────────────────────────────┐ │
│  │                   │                                      │ │
│  │ Event A: Warning  │   Event B: Termination   Event C:   │ │
│  │ (10 minutes)      │   (15 minutes)           API Call   │ │
│  │                   │                                      │ │
│  └───────────────────┼──────────────────────────────────────┘ │
│                      │                                         │
│                      │ Socket.io events to client               │
│                      │ OR HTTP response to admin API            │
│                      │                                         │
└──────────────────────┼─────────────────────────────────────────┘
                       │
                       │ TCP/IP
                       │
┌──────────────────────▼─────────────────────────────────────────┐
│                   FRONTEND (React)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Event A (Warning):                   Event B (Termination):   │
│  ┌─────────────────────────┐         ┌─────────────────────┐  │
│  │ AMBER Warning Banner    │         │ RED Error Banner    │  │
│  ├─────────────────────────┤         ├─────────────────────┤  │
│  │ ⚠️  Session inactive     │         │ ❌ Session ended     │  │
│  │    for too long.        │         │    due to           │  │
│  │    Disconnecting in     │         │    inactivity       │  │
│  │    5 minutes.           │         │                     │  │
│  │                         │         │ Click to dismiss    │  │
│  │ Keep using to stay      │         └─────────────────────┘  │
│  │ connected.              │                                   │
│  └─────────────────────────┘         + Disable UI              │
│                                       + Show disconnected       │
│  Auto-dismiss in 5 seconds               status                │
│  Auto-hide if user moves mouse                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Activity & Timeout Timeline

```
TIME AXIS →

Session Start (t=0)
│
├─ 🟢 Session created
├─ ⏱️  Activity tracked
├─ 🎯 Activity tracking started
│
├─ 1-5 minutes: Normal activity
│  ├─ 🖱️  Mouse moves → Activity event (throttled)
│  ├─ ⌨️  Key pressed → Activity event (throttled)
│  ├─ 👆 Click detected → Activity event (throttled)
│  │
│  └─ Server: updateSessionActivity(code) → Timer resets ✓
│
├─ 5-10 minutes: Activity continues (timer keeps resetting)
│  │  Each action resets back to t=0
│  │
│  └─ Timer at 0 minutes
│
├─ 10 minutes: NO activity for 10 minutes
│  │
│  ├─ ⏰ Inactivity threshold reached (INACTIVITY_WARNING_THRESHOLD)
│  ├─ Server sends: session:inactivity:warning
│  │
│  ├─ 🟡 AMBER Warning Banner Appears
│  │  ├─ Message: "Session inactive, disconnecting in 5 min"
│  │  └─ Auto-hide after 5 seconds (but banner effect stays)
│  │
│  └─ ⏲️  Countdown: 5 minutes remaining
│
├─ 12 minutes: User moves mouse!
│  │
│  ├─ 🖱️  Mouse movement detected
│  ├─ Activity event sent to server
│  │
│  └─ Server: updateSessionActivity(code)
│     ├─ sessionActivity['EDJZN2'] = NOW
│     ├─ Reset warningNotified = false
│     └─ Timer resets to 0 minutes ✓
│
│     Session saved! Resume normal operation
│
├─ 12-15 minutes: Normal activity continues (timer at 0)
│  │  User actively using display
│  │  Timer keeps resetting with each action
│  │
│  └─ Timer at 0 minutes
│
├─ 15 minutes: NO activity for 15 minutes
│  │  (if user stops interacting)
│  │
│  ├─ 💀 Inactivity timeout reached (INACTIVITY_TIMEOUT)
│  ├─ Server sends: session:terminated
│  │
│  ├─ 🔴 RED Error Banner Appears
│  │  ├─ Message: "Session ended due to inactivity"
│  │  └─ Stays for 10 seconds
│  │
│  ├─ 📴 Force disconnect all sockets
│  ├─ 🗑️  Clean up session data
│  └─ ❌ Session removed from server
│
└─ 15+ minutes: Session is DEAD
   │
   ├─ Display shows "Disconnected"
   ├─ Must create new session to continue
   └─ Server memory freed up

LEGEND:
🟢 = Active/Normal
🟡 = Warning
🔴 = Critical/Error
⏱️  = Timer
✓ = Reset/Success
```

---

## 📊 State Machine Diagram

```
┌────────────────────────────────────────────────────────────┐
│                    SESSION STATES                          │
└────────────────────────────────────────────────────────────┘

                      ┌──────────────┐
                      │   CREATED    │
                      │ t=0, Fresh   │
                      └──────┬───────┘
                             │
                             │ Clients join, start activity
                             │
                       ┌─────▼──────────┐
                       │                │
                       ▼                │
                 ┌──────────────┐       │ (On activity)
                 │   ACTIVE     │◄──────┘
                 │ Inactivity   │
                 │ < 10 minutes │
                 └──────┬───────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
    (No activity for 10m)         (Activity)
         │                             │
         ▼                             │
   ┌──────────────┐                   │
   │   WARNING    │───────────────────┘
   │Inactivity    │
   │10-15 minutes │
   │              │
   │Notify clients│
   │Warn banner   │
   │shown         │
   └──────┬───────┘
          │
    ┌─────┴─────┐
    │            │
(No activity    (Activity)
 for 5m)         │
│                │
▼                │
┌──────────────┐ │
│ TERMINATED   │ │
│Inactivity    │ │
│>= 15 min     │ │
│              │ │
│• Send        │ │
│  session:    │ │  Resets to ACTIVE
│  terminated  │ │  ◄─────────────┘
│• Disconnect  │
│  all sockets │
│• Cleanup     │
│  memory      │
└──────────────┘
      │
      │ Session deleted, removed from tracking
      ▼
   ┌─────────┐
   │  DEAD   │
   │ Memory  │
   │ freed   │
   └─────────┘


STATE TRANSITIONS:
─────────────────
CREATED  → ACTIVE          (Clients join, activity detected)
ACTIVE   → ACTIVE          (Periodic activity resets timer)
ACTIVE   → WARNING         (10 minutes no activity)
WARNING  → ACTIVE          (Activity detected, warning cleared)
WARNING  → TERMINATED      (15 minutes no activity)
TERMINATED → DEAD          (Session cleaned up)

CONDITIONS:
──────────
Inactivity Duration Calculation:
  = Current Time - Last Activity Time

Activity Resets:
  - Mouse movement
  - Keyboard input
  - Clicks
  - Scrolling
  - Touch events
  - Message send
  - Any socket event with activity data

Warning Events:
  - Sent once when inactivity >= 10 minutes
  - Client shows banner
  - Sets warningNotified = true

Termination Events:
  - Sent when inactivity >= 15 minutes
  - Server disconnects all clients in room
  - Client receives disconnect event
  - Session data deleted from memory
```

---

## 🎯 Client-Server Communication

```
CLIENT (Display)              SERVER                    SERVER STATE
─────────────────────────────────────────────────────────────────────

1. WebSocket Connect
   ├─ sessionCode: EDJZN2
   ├─ userId: user-123
   └─ auth: token
                    ──────────►
                              ├─ Create session in tracker
                              ├─ Set sessionActivity['EDJZN2'] = NOW
                              └─ warningNotified = false


2. User moves mouse
   Mouse Event Detected
                              ┌─ Activity Tracker detects
                              ├─ Throttle check (5s passed?)
                              └─ YES → Emit event

   emit('display:activity', {
     sessionCode: 'EDJZN2',
     timestamp: NOW,
     type: 'display'
   })
                    ──────────►
                              ├─ Receive activity event
                              ├─ updateSessionActivity('EDJZN2')
                              ├─ sessionActivity['EDJZN2'] = NOW
                              ├─ Timer reset ✓
                              └─ warningNotified = false


3. 10 minutes with no activity
                              Monitor Loop (every 60s):
                              ├─ Check session inactivity
                              ├─ Duration = NOW - sessionActivity['EDJZN2']
                              ├─ Duration >= 10 min? YES
                              ├─ warningNotified? NO
                              ├─ Send warning event
                              └─ warningNotified = true

   ◄──────── emit('session:inactivity:warning', {
     message: "Session inactive, will terminate in 5 min",
     minutesRemaining: 5,
     timestamp: NOW
   })
   
   Receive warning
   ├─ Dispatch custom event
   ├─ Show amber banner
   └─ Warning visible for 5s


4. 15 minutes with no activity
                              Monitor Loop (every 60s):
                              ├─ Check inactivity
                              ├─ Duration >= 15 min? YES
                              ├─ Terminate session
                              ├─ Notify all clients
                              ├─ Disconnect sockets
                              ├─ Clean up data
                              └─ End

   ◄──────── emit('session:terminated', {
     reason: 'inactivity (15 minutes)',
     message: 'Session terminated due to inactivity',
     timestamp: NOW
   })
   
   Receive termination
   ├─ Dispatch custom event
   ├─ Show red error banner
   ├─ Set isConnected = false
   ├─ Disable UI
   └─ Require new session to continue


5. User recovers with activity (at 12 min)
   Mouse moves
   emit('display:activity', { ... })
                    ──────────►
                              ├─ Update timestamp
                              ├─ sessionActivity['EDJZN2'] = NOW
                              ├─ Reset warningNotified = false
                              └─ Timer back to 0 ✓
   
   Session saved!
```

---

## 📊 Monitoring Dashboard Flow

```
┌─────────────────────────────────────────────────┐
│  Admin Dashboard (Control page, Admin tab)      │
└─────────────────────────────────────────────────┘
         │
         │ Auto-fetch every 5 seconds
         │ GET /api/admin/sessions/with-inactivity
         │
         ▼
┌─────────────────────────────────────────────────┐
│         Backend API Endpoint                    │
│ ─────────────────────────────────────────────   │
│                                                 │
│ For each session in sessionTracker:             │
│ {                                               │
│   sessionCode: 'EDJZN2',                        │
│   inactivityMinutes: 9,                         │
│   inactivityStatus: 'warning',  ←─ Computed    │
│   clientCount: 2,                               │
│   timeRemaining: { minutes: 6 }                 │
│ }                                               │
│                                                 │
│ Status determination:                           │
│ - If >= 15min: 'terminated'                     │
│ - Else if >= 10min: 'warning'                   │
│ - Else: 'active'                                │
└─────────────────────────────────────────────────┘
         │
         │ Response
         │
         ▼
┌─────────────────────────────────────────────────┐
│      Frontend Display (React)                   │
│ ─────────────────────────────────────────────   │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  KPI Stats Cards (4 columns)              │  │
│  ├──────────────────────────────────────────┤  │
│  │ Total Sessions │ Active │ Total │ Dead   │  │
│  │      25        │   18   │ Clts  │   3    │  │
│  │                │        │  52   │        │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Filter & Sort Controls                   │  │
│  ├──────────────────────────────────────────┤  │
│  │ Filter: [All ▼] [Active ▼] [Warning ▼]  │  │
│  │ Sort:   [Clients ▼] [Joined ▼]           │  │
│  │ Refresh: [● Auto-refresh] [🔄 Refresh]  │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Sessions List (scrollable)               │  │
│  ├──────────────────────────────────────────┤  │
│  │ Session Code │ Status │ Clients │ Idle   │  │
│  ├──────────────────────────────────────────┤  │
│  │ EDJZN2       │ 🟡     │ 2       │ 9m     │  │
│  │ ABC123       │ 🟢     │ 1       │ 2m     │  │
│  │ XYZ789       │ 🔴     │ 0       │ 18m    │  │
│  └──────────────────────────────────────────┘  │
│  (Click any row → Show details)                │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Session Details (when selected)          │  │
│  ├──────────────────────────────────────────┤  │
│  │ Session: EDJZN2                           │  │
│  │ Status: 🟡 WARNING (will terminate in 6m)│  │
│  │ Created: 2:07 PM                          │  │
│  │ Idle: 9 minutes                           │  │
│  │ Clients: 2                                │  │
│  │                                           │  │
│  │ Clients:                                  │  │
│  │ 1. user@example.com (Display)            │  │
│  │    └─ IP: 192.168.1.100, Connected      │  │
│  │ 2. user@example.com (Controller)         │  │
│  │    └─ IP: 192.168.1.101, Connected      │  │
│  │                                           │  │
│  │ [Terminate Session] (red button)          │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘

COLOR SCHEME:
─────────────
🟢 ACTIVE   = Green  = Inactivity < 10 min
🟡 WARNING  = Amber  = 10 min <= Inactivity < 15 min
🔴 DEAD     = Red    = Inactivity >= 15 min (terminated)
```

---

## 🔌 WebSocket Events Sequence Diagram

```
Display Client          Server              Control Client
     │                   │                        │
     │ connect()         │                        │
     ├──────────────────►│                        │
     │                   │ (auth verified)        │
     │                   │ sessionActivity set    │
     │                   │ monitoring started     │
     │                   │                        │
     │           ◄──connection:status(true)       │
     │                   │                        │
     │                   │                        │
     │  (User inactive)  │                        │
     │                   │ [Monitoring check #1]  │
     │                   │ ├─ 5 min: still ok     │
     │                   │                        │
     │                   │                        │
     │                   │ [Monitoring check #2]  │
     │                   │ ├─ 10 min: WARNING!    │
     │◄──────session:inactivity:warning           │
     │    (Show amber banner)                      │
     │                   │                        │
     │  (User moves)     │                        │
     ├─ display:activity►│                        │
     │    (event)        │                        │
     │                   │ (timer reset)          │
     │◄────session:status(active)                 │
     │    (Banner removed)                        │
     │                   │                        │
     │  (New inactivity) │                        │
     │                   │ [Monitoring check #3]  │
     │                   │ ├─ 10 min: WARNING!    │
     │◄──────session:inactivity:warning           │
     │    (Show amber banner again)                │
     │                   │                        │
     │  (Still inactive) │                        │
     │                   │ [Monitoring check #4]  │
     │                   │ ├─ 15 min: TERMINATE!  │
     │◄─────session:terminated                    │
     │    (Show red banner)                        │
     │                   │ (socket disconnected)  │
     │   (disconnect)    │                        │
     ├──────────────────►│                        │
     │                   │ (cleanup complete)     │
     │                   │                        │

Legend:
───────
► = Event from left to right
◄ = Event from right to left
[text] = Server-side processing
(text) = Client-side rendering
```

---

## 📈 Resource Usage Timeline

```
SESSIONS & MEMORY USAGE (No Session Inactivity System)
─────────────────────────────────────────────────────

Memory ▲
   GB │     ╭─────────────────────────────────────╮
     │    /│                                       │
  8  │   / │ Zombie sessions accumulating         │
     │  /  │ Memory growing unbounded             │
  6  │ /   │                                       ╱
     │/    │                                   ╱
  4  │─────┼──────────────────────────────────╱───  (Never cleaned up)
     │     │                               ╱
  2  │     │                           ╱
     │     │                       ╱
  0  └─────┴───────────────────────────────────────► Days
     0     7     14    21    28    35    42    49


SESSIONS & MEMORY USAGE (With Session Inactivity System)
──────────────────────────────────────────────────────

Memory ▲
   GB │    ┌─────────┐    ┌─────────┐    ┌─────────┐
     │   ╱│ Normal  │╲   │ Normal  │╲   │ Normal  │╲
  2  │  / │ Usage   │ ╲ ╱│ Usage   │ ╲ ╱│ Usage   │ ╲
     │ /  │(grows   │  ╲/ (grows   │  ╲/ (grows   │
     │/   │slightly)│    slightly) │     slightly) │
     │    │         │    │         │    │         │
  1  │    └─────────┴────┴─────────┴────┴─────────┴─── (Stable)
     │
     │ Cleanup happens every 15 minutes
     │ ↓         ↓         ↓         ↓
  0  └─────────────────────────────────────────────► Days
     0     7     14    21    28    35    42    49

KEY DIFFERENCES:
────────────────
Before:
├─ Memory grows unbounded
├─ Accumulation of zombie sessions
├─ No cleanup mechanism
└─ Server eventually runs out of memory

After:
├─ Memory stabilizes at predictable level
├─ Sessions auto-cleaned after 15 minutes idle
├─ Guaranteed cleanup process
└─ Server memory stays healthy indefinitely
```

---

## 🎯 Use Case Flows

### Use Case 1: Retail Display (All Day Running)

```
9:00 AM:  Display turns on, session created
          └─ Timer: 0 minutes
          
9:00-5:00 PM: Customers interact throughout day
          ├─ 10:30 AM: Someone reads for 2 min → Activity resets
          ├─ 12:00 PM: Lunch, no activity for 30 min
          │           └─ Timer: 30 min (still OK, < 15 min)
          ├─ 2:00 PM: More activity → Timer resets
          └─ ...more activity throughout day

5:00 PM:  Store closes, but display left on
          └─ Timer: 0 minutes (activity stopped)

5:00-5:15 PM: No activity
          └─ Timer: 15 minutes → SESSION TERMINATED
             (Server cleanup, memory freed)

Next morning:
6:00 AM:  Admin starts new session for next day
          └─ Process repeats

Result: Automatic daily cleanup! ✓
```

### Use Case 2: Conference Demo

```
9:00 AM Demo 1:
├─ Presenter pairs display and controller
├─ Live demo for 20 minutes (lots of activity)
├─ Demo ends at 9:20 AM

9:20 AM - 10:00 AM: Break between demos
├─ No one touches display (40 minutes of inactivity)
├─ At 40 minutes → ⚠️  Warning sent! (after 10 min idle)
│                   (Already past timeout, but never received activity)
│                   → 💀 Session auto-terminates
├─ Display shows: "Session ended due to inactivity"
└─ Memory freed up

10:00 AM Demo 2:
├─ Fresh session created for next demo
├─ New pairing required (but simple, just enter code)
└─ Demo runs again with clean state

Result: Prevents cross-demo pollution! ✓
```

### Use Case 3: Development/Testing

```
Dev Testing with 2-minute timeout:

9:00:00 AM:  Create session (INACTIVITY_TIMEOUT=120000)
             └─ Timer: 0 seconds

9:00:30 AM:  Manual mouse move
             └─ Timer resets to 0 seconds

9:01:00 AM:  Still idle
             └─ Timer: 30 seconds

9:01:30 AM:  Still idle
             └─ Timer: 60 seconds

9:02:00 AM:  Still idle (90 seconds passed)
             └─ ⚠️  Warning! Timer: 90 seconds
                    "Will disconnect in 30 seconds"

9:02:15 AM:  User moves mouse!
             └─ Activity detected, timer resets
             └─ Warning dismissed

Result: Rapid iteration with quick timeout! ✓
```

---

**These diagrams provide complete visual understanding of:**
- ✅ System architecture
- ✅ Activity flow
- ✅ State machine
- ✅ Client-server communication
- ✅ Admin monitoring dashboard
- ✅ WebSocket event sequence
- ✅ Resource usage patterns
- ✅ Real-world use cases
