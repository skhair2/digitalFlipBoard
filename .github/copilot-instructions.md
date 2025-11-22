# Digital FlipBoard - Copilot Instructions

## Architecture Overview

**Digital FlipBoard** is a split-flap display simulator built with **React + Vite** (frontend) and **Express + Socket.io** (backend). Users control messages remotely, with real-time synchronization across display and controller screens.

### Key Architecture Decisions

- **Monorepo structure**: Frontend in root `/src`, backend in `/server`
- **State management**: Zustand stores (`authStore`, `sessionStore`, `boardStore`, `designStore`) with localStorage persistence for cross-tab sync
- **Real-time transport**: Socket.io for WebSocket-based message delivery with fallback to polling
- **Auth**: Supabase with PKCE flow for enhanced security; magic links and OAuth supported
- **Analytics**: Mixpanel integrated throughout for user tracking
- **Styling**: Tailwind CSS with custom color theme support (monochrome, teal, vintage)
- **Database**: Supabase PostgreSQL with RLS policies

### Data Flow

1. **Control → Display**: User sends message via Control page → WebSocket emits `message:send` → Server broadcasts to sessionCode room → Display page receives via `message:received` event → Renders in grid
2. **Session Pairing**: Control generates session code → Display joins same Socket.io room → WebSocket validates and synchronizes state
3. **Auth State**: Supabase auth listener updates `authStore` → Profile fetched from `profiles` table → Premium status checked

## Project Commands

```bash
# Frontend
npm run dev          # Start Vite dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint check
npm run preview      # Preview production build

# Backend (from project root)
npm run server       # Start production server (port 3001)
npm run server:dev   # Start with nodemon (auto-reload)
npm run server:install # Install server dependencies
```

## Component & Folder Patterns

### Pages (`src/pages/`)
- **Control.jsx**: Controller interface with session pairing, message input, animation/color pickers, scheduler, designer, sharing
- **Display.jsx**: Read-only display rendering DigitalFlipBoardGrid with real-time message updates
- **Login.jsx**, **Dashboard.jsx**: Auth flow and user management pages

### Stores (Zustand + localStorage)
- **authStore**: User session, premium status, auth methods (magic link, Google, password)
- **sessionStore**: Active session code, board state, animation preferences, grid config (rows/cols), clock mode
- **boardStore**: Saved boards and their metadata
- **designStore**: Designer state for grid editing
- **usageStore**: Rate limiting and quota tracking

### Services (`src/services/`)
- **supabaseClient.js**: Configured Supabase client with PKCE flow, realtime rate limiting
- **websocketService.js**: Singleton WebSocket manager with reconnection logic (5 attempts max), event emitters, client-side rate limiter (10 msg/min)
- **mixpanelService.js**: Analytics tracking (identify, track events, people properties)
- **sharingService.js**: Board sharing and permissions
- **emailService.js**: Email invitations via Resend

### Utils
- **rateLimit.js**: Two rate limiters: `messageRateLimiter` (10 msg/min) and `sessionRateLimiter` (3 sessions/5min)
- **sessionCodeGenerator.js**: Generate short alphanumeric codes
- **textLayouts.js**: Layout algorithms for text positioning on grid
- **sanitizers.js**: DOMPurify for XSS prevention
- **imageProcessor.js**: Image handling for custom designs

## Coding Conventions

### State Updates
- Use Zustand selectors to avoid unnecessary re-renders: `const { sessionCode } = useSessionStore()`
- Store persistence: `persist` middleware auto-syncs localStorage; cross-tab sync via `storage` event listener (in sessionStore)
- Never mutate state directly; use setter functions

### WebSocket Patterns
- **Connect**: `websocketService.connect(sessionCode, userId)` from useWebSocket hook
- **Subscribe**: `websocketService.on(event, callback)` (not standard addEventListener)
- **Send**: `websocketService.sendMessage(message, { animationType, colorTheme })` includes rate limit check
- **Cleanup**: Always unsubscribe in useEffect cleanup to prevent memory leaks
- Events: `connection:status`, `message:received`, `session:paired`, `session:expired`

### Component Patterns
- Use **lazy loading** for pages (see App.jsx) to optimize code splitting
- Wrap auth-required routes in `ProtectedRoute` component
- Use `PremiumGate` for premium-only features (Designer, Sharing tabs)
- Error handling: `ErrorBoundary` wraps entire app; `useFeatureGate` hook gates features by subscription

### Forms & Validation
- Use controlled inputs with state
- Sanitize user input: `DOMPurify.sanitize(userContent)`
- Rate limiting enforced client-side; server validates all payloads
- Color picker and animation picker components manage their own state

### Grid Display
- `DigitalFlipBoardGrid` accepts `rows` and `cols` from `gridConfig` in session store
- `Character` component handles flip animation with staggered delays (row+col)*0.03
- Monochrome vs. color themes applied per character
- Board state priority: if `boardState` array exists, use it; else render `currentMessage` padded

## Integration Points

### Supabase Tables
- **profiles**: User info, subscription_tier, full_name
- **boards**: Saved user designs with grid config
- **designs**: Designer-created patterns
- **sharing**: Board access permissions
- **schedules**: Scheduled messages (if Scheduler tab active)

### External APIs
- **Resend**: Email invitations
- **Mixpanel**: All user actions tracked (auth, messages sent, features used)
- **Supabase Auth**: Magic links, OAuth (Google), password auth

### Socket.io Events
- Server emits: `connection:status`, `message:received`, `session:paired`, `session:expired`
- Client emits: `message:send` (with callback for success/error)

## Testing Locally

1. **Two-browser setup**: Open Control page in one window, Display in another
2. **Session pairing**: Generate code in Control, enter in Display
3. **Send message**: Type in Control's MessageInput, see animation in Display
4. **Cross-tab**: Both pages should update if you open same session in multiple tabs
5. **Offline simulation**: DevTools Network tab → Offline to test reconnection logic
6. **Rate limiting**: Send 11+ messages in 60s to trigger client-side block

## Key Files to Reference

- Architecture: `src/App.jsx` (routing), `src/services/websocketService.js` (real-time)
- State: `src/store/sessionStore.js` (session mgmt), `src/store/authStore.js` (auth)
- UI: `src/components/display/DigitalFlipBoardGrid.jsx` (main display), `src/components/control/MessageInput.jsx` (user input)
- Server: `server/index.js` (Socket.io setup)
- Config: `vite.config.js` (bundling, code splitting), `tailwind.config.js` (custom teal color)

## Common Tasks

### Add New Animation
1. Add keyframe to `tailwind.config.js`
2. Create option in `AnimationPicker.jsx`
3. Pass via `animationType` in message options
4. Update `Character.jsx` to apply animation class

### Add Premium Feature
1. Wrap UI in `<PremiumGate>` component
2. Check `isPremium` in store: `const { isPremium } = useAuthStore()`
3. Track feature access in Mixpanel

### Add New Message Option
1. Update `MessageInput` or create new control component
2. Include option in `websocketService.sendMessage(msg, options)`
3. Broadcast to room via Socket.io
4. Handle in Display's `useWebSocket` hook

### Debug WebSocket Issues
- Check browser console for Socket.io connection logs
- Server logs (if running locally): `socket ${socket.id} joined session ${sessionCode}`
- Use `isConnected()` from WebSocket service to verify connection state
- Max 5 reconnection attempts; after that, `connection:failed` event emitted