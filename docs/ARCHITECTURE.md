# 🏗️ Architecture Overview

**System Design & Component Relationships**  
**Status**: ✅ Production Ready

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DIGITAL FLIP BOARD                       │
│                   React + Vite Frontend                      │
└─────────────────────────────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         ┌────▼──┐    ┌─────▼────┐    ┌───▼────┐
         │Socket │    │ Supabase │    │Mixpanel│
         │  .io  │    │   Auth   │    │Analytics│
         └───────┘    └──────────┘    └────────┘
              │              │              │
         ┌────▼──────────────▼──────────────▼────┐
         │      Express Backend (Node.js)        │
         │       Real-time WebSocket Server      │
         └─────────────────────────────────────────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
         ┌────▼──┐   ┌────▼──┐  ┌───▼────┐
         │Database│  │Storage│  │Functions│
         │(Postgres)│ (S3)   │  │(Edge)   │
         └────────┘   └───────┘  └────────┘
```

---

## Component Architecture

### Frontend Layers

#### 1. Pages (Top-Level Routes)
```
src/pages/
├── Home.jsx              # Landing page
├── Login.jsx             # Auth page
├── Control.jsx           # Admin + message sender
├── Display.jsx           # Read-only display
├── Dashboard.jsx         # User profile
└── Help.jsx              # Support page
```

**Data Flow**: Routes → Pages → Components → Hooks → Stores

#### 2. Components (Reusable UI)

**Control Components** (Admin interface)
```
src/components/control/
├── RoleManagement.jsx    # Admin role grant/revoke (400 lines)
├── MessageInput.jsx      # Message input form
├── AnimationPicker.jsx   # Animation selector
├── ColorThemePicker.jsx  # Color theme selector
├── SessionPairing.jsx    # Session code entry
└── SharingPanel.jsx      # Board sharing
```

**Display Components** (Board display)
```
src/components/display/
├── DigitalFlipBoardGrid.jsx    # Main grid display
├── Character.jsx               # Single character flip animation
├── SessionCode.jsx             # Show session code on display
├── SettingsPanel.jsx           # Display settings
└── ControlOverlay.jsx          # Control buttons on display
```

**Common Components**
```
src/components/common/
├── PremiumGate.jsx       # Premium feature wrapper
├── ErrorBoundary.jsx     # Error handling boundary
└── Layout.jsx            # Page wrapper
```

#### 3. Hooks (Custom Logic)

**Real-time & State**
```
useWebSocket.js          # WebSocket connection + messaging
useSessionStore()        # Current session data
useAuthStore()           # Auth + user profile
useSessionStore()        # Grid config, animations
```

**Premium Features**
```
useFeatureGate.js        # Premium tier access control
useAuthStore()           # Subscription tier check
```

**Analytics**
```
useMixpanel.js           # Event tracking
useLocation()            # Page view tracking
```

**UX Interactions**
```
useKeyboardShortcuts.js  # F, Esc, I, ? shortcuts
useAutoHide.js           # Hide UI on inactivity
```

#### 4. Stores (State Management)

**Zustand Stores** (with localStorage persistence)
```
src/store/
├── authStore.js         # User auth + profile
├── sessionStore.js      # Current session (grid, animations)
├── boardStore.js        # Saved boards list
├── designStore.js       # Designer state
└── usageStore.js        # Rate limit tracking
```

**Store Structure**:
```javascript
// Example authStore
{
  user: { id, email, ... },
  profile: { subscription_tier: 'pro', ... },
  isPremium: true,
  login: (email, password) => {},
  logout: () => {},
  setUser: (user) => {}
}
```

#### 5. Services (Business Logic)

**Authentication**
```
supabaseClient.js        # Supabase client config + PKCE auth
emailService.js          # Email sending via Resend
```

**Real-time Communication**
```
websocketService.js      # Socket.io singleton
  - connect(sessionCode, userId)
  - sendMessage(msg, options)
  - on(event, callback)
  - off(event, callback)
```

**Admin Features**
```
permissionService.js     # Grant/revoke admin roles
  - grantAdminRole(email, reason)
  - revokeAdminRole(email, reason)
  - getCurrentAdmins()
  - getAuditLog()
```

**Security**
```
adminRateLimit.js        # Rate limiter for admin ops
  - check(userId)
  - getStatus(userId)
  - reset(userId)
```

**Analytics**
```
mixpanelService.js       # Mixpanel tracking
  - identify(userId)
  - track(event, properties)
  - trackPageView()
```

**Sharing**
```
sharingService.js        # Board sharing + permissions
  - shareBoard(boardId, email)
  - revokeAccess(boardId, email)
  - getSharedWith(boardId)
```

---

## Data Flow

### Message Flow (User sends message)

```
1. USER TYPES IN CONTROL PAGE
   MessageInput.jsx
       ↓
2. COMPONENT SUBMITS
   websocketService.sendMessage(msg, options)
       ↓
3. RATE LIMIT CHECK (client-side)
   messageRateLimiter.check()
       ↓
4. SEND VIA SOCKET.IO
   socket.emit('message:send', {
     message, animationType, colorTheme, ...
   })
       ↓
5. BACKEND RECEIVES
   server/index.js
       ↓
6. SERVER VALIDATES
   Check message, sender, session
       ↓
7. BROADCAST TO ROOM
   io.to(sessionCode).emit('message:received', {
     message, animationType, colorTheme, ...
   })
       ↓
8. DISPLAY PAGE RECEIVES
   useWebSocket hook (Display.jsx)
       ↓
9. UPDATE STORE
   sessionStore.setCurrentMessage(msg)
       ↓
10. GRID UPDATES
    DigitalFlipBoardGrid.jsx
       ↓
11. CHARACTERS ANIMATE
    Character.jsx (flip animation)
       ↓
12. USER SEES MESSAGE
    Visual flip-flap display
```

### Admin Grant Flow

```
1. USER FILLS FORM
   RoleManagement.jsx
       ↓
2. GENERATE CSRF TOKEN
   permissionService.generateCSRFToken()
       ↓
3. RATE LIMIT CHECK
   adminRateLimit.check(userId)
   → If exceeded: show countdown, block submit
       ↓
4. SUBMIT FORM
   permissionService.grantAdminRole(email, reason, csrfToken)
       ↓
5. VALIDATE ON BACKEND
   Check CSRF token (must not be expired)
   Check rate limit (must not exceed 5 ops/min)
   Sanitize input (DOMPurify)
       ↓
6. UPDATE DATABASE
   INSERT INTO admin_roles (user_id, granted_by, reason, status)
       ↓
7. LOG OPERATION
   INSERT INTO audit_log (action, user, status, timestamp)
       ↓
8. RETURN SUCCESS
   "Admin role granted successfully"
       ↓
9. UPDATE UI
   RoleManagement.jsx shows success message
   Refresh current admins list
       ↓
10. SYNC ACROSS TABS
    sessionStore localStorage triggers storage event
    Other tabs see update instantly
```

### Auth Flow

```
1. USER VISITS LOGIN PAGE
   Login.jsx
       ↓
2. INITIALIZE SUPABASE AUTH
   supabaseClient.js (with PKCE)
       ↓
3. USER CLICKS "SIGN IN WITH GOOGLE"
   Supabase OAuth flow
       ↓
4. REDIRECT TO GOOGLE
   User logs in with Google
       ↓
5. REDIRECT BACK TO APP
   Supabase returns auth token
       ↓
6. UPDATE AUTH STORE
   authStore.setUser(user)
   authStore.setProfile(profile)
       ↓
7. IDENTIFY IN MIXPANEL
   useMixpanel hook → mixpanel.identify(userId)
       ↓
8. REDIRECT TO DASHBOARD
   useEffect in App.jsx
       ↓
9. USER SEES DASHBOARD
   Dashboard.jsx (personalized)
```

---

## Database Schema

### Key Tables

**profiles**
```sql
{
  id: UUID,              -- User ID
  email: TEXT,           -- Email address
  full_name: TEXT,       -- Display name
  subscription_tier: TEXT -- 'free' | 'pro' | 'enterprise'
}
```

**admin_roles**
```sql
{
  id: UUID,
  user_id: UUID,         -- User being granted role
  granted_by: UUID,      -- Admin who granted
  reason: TEXT,          -- Grant reason
  status: TEXT,          -- 'active' | 'revoked'
  granted_at: TIMESTAMP,
  revoked_at: TIMESTAMP
}
```

**audit_log**
```sql
{
  id: UUID,
  action: TEXT,          -- 'grant_admin' | 'revoke_admin'
  user_id: UUID,         -- Who performed action
  target_user_id: UUID,  -- Who was affected
  reason: TEXT,          -- Operation reason
  status: TEXT,          -- 'success' | 'failed'
  error_message: TEXT,   -- If failed
  ip_address: TEXT,      -- Request IP
  user_agent: TEXT,      -- Browser info
  created_at: TIMESTAMP
}
```

**boards**
```sql
{
  id: UUID,
  user_id: UUID,         -- Owner
  name: TEXT,
  grid_rows: INT,
  grid_cols: INT,
  created_at: TIMESTAMP
}
```

---

## File Organization

### Root Level
```
.
├── src/                 # Frontend code
├── server/              # Backend code
├── public/              # Static assets
├── supabase/            # Database migrations
├── docs/                # Documentation (NEW)
├── package.json         # Frontend dependencies
├── vite.config.js       # Build config
├── tailwind.config.js   # Styling
└── index.html           # Entry point
```

### Frontend Structure
```
src/
├── App.jsx              # Main router
├── main.jsx             # React entry point
├── pages/               # Route pages
├── components/          # Reusable UI
│   ├── control/         # Admin interface
│   ├── display/         # Board display
│   ├── common/          # Shared components
│   ├── layout/          # Page wrappers
│   └── ui/              # Generic UI
├── hooks/               # Custom hooks (5 total)
├── store/               # Zustand stores (5 total)
├── services/            # Business logic (6 total)
├── utils/               # Helpers
├── config/              # Configuration
└── styles/              # Global styles
```

### Backend Structure
```
server/
├── index.js             # Express + Socket.io
├── package.json         # Backend dependencies
└── [future: routes/, middleware/, models/]
```

### Documentation
```
docs/
├── 00-README.md         # Main navigation index
├── HOOKS.md             # All 5 hooks reference
├── SECURITY.md          # CSRF + security
├── TESTING.md           # 6 test procedures
├── DEPLOYMENT.md        # Production deployment (NEW)
└── ARCHITECTURE.md      # This file (NEW)
```

---

## Technology Stack

### Frontend
| Technology | Purpose | Version |
|-----------|---------|---------|
| React | UI framework | 18.x |
| Vite | Build tool | 5.x |
| Zustand | State management | latest |
| Tailwind CSS | Styling | 3.x |
| Socket.io Client | Real-time | 4.x |
| Supabase | Auth + Database | latest |
| DOMPurify | XSS prevention | 3.x |
| Mixpanel | Analytics | latest |

### Backend
| Technology | Purpose | Version |
|-----------|---------|---------|
| Node.js | Runtime | 18.x LTS |
| Express | Web framework | 4.x |
| Socket.io | WebSocket | 4.x |
| Supabase | Database | (cloud) |

### Database
| Service | Purpose |
|---------|---------|
| PostgreSQL | Primary database |
| Row-Level Security | Row-level authorization |
| Functions | Server-side logic |

### External Services
| Service | Purpose |
|---------|---------|
| Supabase Auth | User authentication |
| Google OAuth | OAuth provider |
| Mixpanel | Event analytics |
| Resend | Email sending |

---

## Key Design Patterns

### 1. Singleton Services
```javascript
// websocketService.js - Single instance
export const websocketService = {
  connect: () => {},
  disconnect: () => {},
  on: () => {},
  sendMessage: () => {}
}

// Usage in hooks
const { isConnected } = useWebSocket();
```

### 2. Custom Hooks for Logic
```javascript
// useWebSocket, useFeatureGate, useMixpanel, etc.
const { sendMessage, isConnected } = useWebSocket();
const { canAccess } = useFeatureGate('premium_feature');
```

### 3. Zustand Stores with Persistence
```javascript
// authStore, sessionStore, boardStore
const store = create(
  persist(
    (set) => ({...}),
    { name: 'auth-store' }  // localStorage key
  )
)
```

### 4. Protected Routes
```javascript
<ProtectedRoute>
  <Control />
</ProtectedRoute>
```

### 5. Feature Gates for Premium
```javascript
<PremiumGate>
  <DesignerTab />
</PremiumGate>
```

---

## Security Layers

### Frontend
1. **Input Validation** - Controlled form inputs
2. **Input Sanitization** - DOMPurify for XSS
3. **CSRF Tokens** - Automatic generation + validation
4. **Rate Limiting** - Client-side checks
5. **Secure Storage** - localStorage + httpOnly cookies

### Backend
1. **Token Validation** - Verify CSRF tokens
2. **Rate Limiting** - Server-side enforcement
3. **Input Sanitization** - Sanitize all inputs
4. **Audit Logging** - Log all operations
5. **Error Messages** - Generic messages (no info leak)

### Database
1. **Row-Level Security** - PostgreSQL RLS policies
2. **Prepared Statements** - Prevent SQL injection
3. **Encryption** - For sensitive data
4. **Access Control** - Fine-grained permissions

---

## Performance Optimizations

### Code Splitting
```javascript
// App.jsx
const Control = lazy(() => import('./pages/Control'))
const Display = lazy(() => import('./pages/Display'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
```

### Lazy Loading Components
```javascript
const DesignerTab = lazy(() => 
  import('./components/designer/DesignerTab')
)
```

### Memoization
```javascript
const Character = memo(CharacterComponent)
const ColorPicker = memo(ColorPickerComponent)
```

### WebSocket Optimization
- Connection pooling
- Message batching
- Reconnection with exponential backoff
- Client-side rate limiting

### Database Optimization
- Indexed columns (user_id, status)
- Efficient queries (select only needed fields)
- Lazy-loaded data (pagination)

---

## Error Handling

### Global Error Boundary
```
ErrorBoundary wrapper
  └─ Catches all React errors
  └─ Displays error UI
  └─ Logs to Mixpanel
```

### Service-Level Errors
```
WebSocket disconnected
  → Retry with exponential backoff
  → Show "Reconnecting..." message
  → Automatic reconnect

Auth token expired
  → Redirect to login
  → Preserve form data
  → Smooth re-auth flow

Rate limit exceeded
  → Show countdown timer
  → Disable submit button
  → Display user-friendly message
```

### User-Facing Errors
```
✅ "Message sent successfully"
❌ "Failed to send message. Please try again"
⚠️  "You're sending too fast. Please wait 5 seconds"
🔒 "Admin role grant failed. Invalid CSRF token"
```

---

## Monitoring & Observability

### Logging
- Browser console for development
- Mixpanel for production events
- Server logs (if self-hosted)
- Supabase logs (auth, database, functions)

### Metrics
- Page load time
- WebSocket latency
- Message send success rate
- Error rate
- User retention
- Feature usage

### Alerts
- > 1% error rate
- > 500ms response time
- WebSocket disconnections
- Database connection failures
- Rate limit abuse

---

## Scalability Considerations

### Current Capacity
```
Users: ~1,000 concurrent
Sessions: ~500 active
Messages/min: ~10,000
Database size: ~1 GB
```

### Scaling Path
```
Phase 1 (Current): Single server
  → 1,000 concurrent users
  
Phase 2 (Load balancer): Multiple backend servers
  → 10,000 concurrent users
  
Phase 3 (Microservices): Separate WebSocket servers
  → 100,000 concurrent users
  
Phase 4 (CDN + Caching): Global distribution
  → Unlimited concurrent users
```

---

## Deployment Architecture

### Development
```
Local development
  ├─ npm run dev (frontend on port 3000)
  └─ npm run server:dev (backend on port 3001)
```

### Staging
```
Staging environment
  ├─ Frontend: Vercel preview branch
  ├─ Backend: Staging server
  └─ Database: Staging Supabase
```

### Production
```
Production environment
  ├─ Frontend: Vercel production
  ├─ Backend: Production server
  ├─ Database: Production Supabase
  ├─ CDN: Vercel Edge Network
  └─ Monitoring: Mixpanel + custom dashboards
```

---

## Integration Points

### With Supabase
- User authentication (OAuth + magic links)
- Profile storage
- Admin roles table
- Audit log table
- RLS policies for security

### With Socket.io
- Real-time message delivery
- Session synchronization
- Presence tracking (who's online)
- Event broadcasting

### With Mixpanel
- User identification
- Event tracking (all actions)
- User properties (subscription, role)
- Custom dashboards

### With External Email
- Invitation emails
- Verification emails
- Welcome emails

---

## Key Responsibilities

### Frontend Components
**Control Page**:
- User input collection
- Admin interface
- Message sending
- Session pairing
- Admin management (NEW)

**Display Page**:
- Message rendering
- Animation playback
- Real-time updates
- Grid display

### Backend Server
- WebSocket management
- Session broadcasting
- Message validation
- Rate limiting
- Audit logging

### Database (Supabase)
- User storage
- Admin roles management
- Audit trail
- RLS enforcement
- Data persistence

---

## Session Management & Connection Lifecycle

### Overview
The system implements a **dual-timeout session management** strategy to balance user experience with resource efficiency.

### Session Lifecycle

#### Stage 1: Session Initiation
1. User clicks "Open Controller" → Navigates to Control page
2. User enters 6-digit display code from Display page
3. `SessionPairing.jsx` validates code format (6 alphanumeric characters)
4. `setSessionCode(code, isReconnecting=false)` called
   - Sets `connectionStartTime` = now
   - Sets `lastActivityTime` = now
   - Sets `lastSessionCode` = code (for reconnect memory)
   - Stores in localStorage via Zustand persist
5. Session marked as connected: `isConnected = true`
6. Mixpanel tracks: `connection_started` event

#### Stage 2: Active Connection (Connected & Monitoring)
**Duration**: 15 minutes OR until 5 minutes of inactivity

**Timeout Logic** (in `SessionPairing.jsx` useEffect):
```javascript
// Hard timeout: 15 minutes max
const remaining = CONNECTION_TIMEOUT_MS - totalElapsed  // 15 * 60 * 1000

// Inactivity timeout: 5 minutes idle
const inactiveElapsed = now - lastActivityTime
const inactivityExpired = inactiveElapsed >= INACTIVITY_TIMEOUT_MS  // 5 * 60 * 1000

// Whichever comes first triggers expiry
if (inactivityExpired) {
    setConnectionExpired(true, 'inactivity')  // Silent disconnect
} else if (remaining <= 0) {
    setConnectionExpired(true, 'timeout')     // Hard limit reached
}
```

**Activity Tracking** (in `useWebSocket.js`):
- `recordActivity()` called on:
  - Message sent (via `sendMessage`)
  - Message received (via WebSocket event)
  - Connection established/reconnected
- Resets `lastActivityTime` to prevent idle timeout

**UI Feedback**:
- Real-time MM:SS countdown displayed
- **Amber warning** at < 2 minutes remaining
  - Icon changes from teal to amber
  - Text: "Connection Expiring Soon"
  - Mixpanel tracks: `connection_expiring_soon` event
- Icon animates: `animate-bounce` (normal) → `animate-pulse` (warning)

#### Stage 3: Connection Expiration
**Triggers**: After 15 min hard timeout OR 5 min inactivity

**UI State**: "Connection Expired" card with two options:

1. **Reconnect to [CODE]** (Primary Button)
   - Calls `setSessionCode(lastSessionCode, isReconnecting=true)`
   - Resets connection timer
   - `recordActivity()` called to reset idle timer
   - **Does NOT increment** session quota (free tier benefit)
   - Mixpanel tracks: `connection_reconnected` with `disconnect_reason` field
   - Message: "Reconnecting won't use another free session"

2. **Enter New Display Code** (Secondary Button)
   - Resets form state
   - User enters different code
   - **DOES increment** session quota (treated as new session)
   - Mixpanel tracks: `connection_started` (new session)

#### Stage 4: Cross-Tab Persistence
**How it works**:
- Zustand `persist` middleware saves to localStorage: `session-storage`
- Browser `storage` event listener (in `sessionStore.js`) syncs across tabs
- If user opens Control page in Tab A and Tab B:
  - Both tabs share same session code
  - Timer starts when first tab connects
  - Disconnection affects all tabs
  - Activity in Tab A resets idle timer for Tab B

**Trade-off**: To enable cross-tab persistence, we don't pause timer when user navigates away (as requested)

---

### State Schema

**sessionStore Fields**:
```javascript
{
  // Basic session data
  sessionCode: string | null,           // Current session code (e.g., "ABC123")
  lastSessionCode: string | null,       // Previous session code (for reconnect)
  isConnected: boolean,                 // Currently paired with display
  
  // Timeout tracking
  connectionStartTime: timestamp | null,  // When current session started
  lastActivityTime: timestamp | null,     // Last user action (send/receive/connect)
  isConnectionExpired: boolean,          // Has session timed out?
  disconnectReason: 'inactivity' | 'timeout' | null,  // Why did it disconnect?
  
  // Session metadata
  isReconnect: boolean,                 // Is current session a reconnect? (for analytics)
  
  // Message data
  currentMessage: string | null,
  boardState: array | null,            // For designer/grid mode
  
  // Grid & display preferences
  gridConfig: { rows: 6, cols: 22 },
  lastAnimationType: string,
  lastColorTheme: string,
  isClockMode: boolean
}
```

---

### Quota System Integration

**Free Tier** (1 session per 24h):
```
New Connection → incrementSession() → quota used
Reconnect      → (no call to incrementSession) → quota preserved
```

**Premium Tier**:
```
Unlimited connections (both new and reconnects)
Same 15-min timeout per connection
```

**Check**: In `handlePair()`, validation:
```javascript
if (!user && freeSessionUsed) {
    setError('Free session limit reached. Please sign in to continue.')
    // Show "Sign In for Unlimited Access" button
}
```

---

### Analytics Tracking (Mixpanel)

**Events Tracked**:
| Event | When | Properties |
|-------|------|-----------|
| `connection_started` | New session begins | `code`, `is_authenticated` |
| `connection_reconnected` | User reconnects | `code`, `disconnect_reason`, `is_authenticated` |
| `connection_expiring_soon` | <2 min remaining | `remaining_seconds` |
| `connection_expired` | Session ends | `reason` ("inactivity" \| "timeout"), `duration_seconds` |

**Segment Definition**:
- **Reconnects**: Tracked separately so you can measure stickiness
- **Inactivity vs. Hard Timeout**: Tracked separately for UX insights
- **Duration**: `duration_seconds` helps identify optimal timeout window

---

### Implementation Files

**Core Changes**:
```
src/store/sessionStore.js              # Added: lastActivityTime, disconnectReason, isReconnect, recordActivity()
src/components/control/SessionPairing.jsx   # Rewritten: dual-timeout logic, amber warning, reconnect UI
src/hooks/useWebSocket.js              # Added: recordActivity() calls on events
```

**No changes needed**:
- Display page (works as-is)
- Backend WebSocket server (sessions unchanged)
- Supabase (no DB schema changes)

---

## Future Architecture Improvements

### Phase 2: Enhanced Features
- Message scheduling
- Custom animations
- Design templates
- Advanced sharing
- Team management

### Phase 3: Scalability
- Message queue (Redis)
- Session clustering
- Database read replicas
- CDN image optimization

### Phase 4: Enterprise
- API for third-party integrations
- Webhooks for external systems
- Advanced analytics
- Custom branding per client

---

**Last Updated**: November 25, 2025  
**Status**: ✅ Connection Timeout Feature Implemented  
**Next Review**: After Phase 2 feature release

See also: [00-README.md](./00-README.md), [DEPLOYMENT.md](./DEPLOYMENT.md), [SECURITY.md](./SECURITY.md)
