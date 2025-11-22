# 🎣 Hooks Documentation

**All 5 Custom Hooks** - Complete Reference  
**Status**: ✅ All Working

---

## Overview

All 5 custom hooks have been validated and are working correctly.

| Hook | Lines | Status | Purpose |
|------|-------|--------|---------|
| useWebSocket | 50 | ✅ Working | Real-time messaging |
| useFeatureGate | 60 | ✅ Working | Premium access control |
| useMixpanel | 35 | ✅ Working | Analytics & tracking |
| useKeyboardShortcuts | 100 | ✅ Working | Keyboard shortcuts |
| useAutoHide | 80 | ✅ Working | UI auto-hide |

---

## 1. useWebSocket

**Purpose**: Real-time message synchronization between Control and Display pages

**Location**: `src/hooks/useWebSocket.js`

**Usage**:
```javascript
import { useWebSocket } from '../hooks/useWebSocket'

function MyComponent() {
  const { sendMessage, isConnected } = useWebSocket()
  
  const handleSend = () => {
    sendMessage('Hello', { 
      animationType: 'flip',
      colorTheme: 'teal'
    })
  }
  
  return (
    <div>
      <div className={isConnected ? 'text-green-500' : 'text-red-500'}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      <button onClick={handleSend}>Send</button>
    </div>
  )
}
```

**Returns**:
```javascript
{
  sendMessage: (message, options) => Promise,
  isConnected: boolean
}
```

**How It Works**:
1. Connects to WebSocket on mount
2. Listens for `message:received` events
3. Updates store with new messages
4. Cleans up on unmount
5. Returns sendMessage function + connection status

**Key Features**:
- ✅ Automatic reconnection (5 attempts)
- ✅ Error handling built-in
- ✅ Rate limiting (10 msg/min client-side)
- ✅ Proper cleanup on unmount

---

## 2. useFeatureGate

**Purpose**: Check premium tier features and enforce limits

**Location**: `src/hooks/useFeatureGate.js`

**Usage**:
```javascript
import { useFeatureGate } from '../hooks/useFeatureGate'

function MyComponent() {
  const { canAccess, isLimitReached, currentUsage, maxLimits } = useFeatureGate()
  
  // Check if user can access a feature
  if (!canAccess('scheduled_messages')) {
    return <UpgradePrompt feature="Scheduled Messages" />
  }
  
  // Check if user hit a limit
  if (isLimitReached('boards')) {
    return <LimitReachedPrompt type="boards" />
  }
  
  return (
    <div>
      <p>Boards: {currentUsage.boards} / {maxLimits.boards}</p>
    </div>
  )
}
```

**Returns**:
```javascript
{
  canAccess: (feature) => boolean,
  isLimitReached: (type) => boolean,
  currentUsage: { boards: 1, designs: 3 },
  maxLimits: { boards: 1, designs: 3 },
  isPremium: boolean
}
```

**Features Available**:
```javascript
FEATURES.UNLIMITED_BOARDS        // Pro/Enterprise only
FEATURES.UNLIMITED_DESIGNS       // Pro/Enterprise only
FEATURES.SCHEDULED_MESSAGES      // Pro/Enterprise only
FEATURES.PREMIUM_WIDGETS         // Pro/Enterprise only
FEATURES.REMOVE_BRANDING         // Pro/Enterprise only
FEATURES.PRIORITY_SUPPORT        // Pro/Enterprise only
```

**Tier Limits**:
```javascript
free: { boards: 1, designs: 3 }
pro: { boards: Infinity, designs: Infinity }
enterprise: { boards: Infinity, designs: Infinity }
```

**How It Works**:
1. Gets user subscription tier from authStore
2. Checks against feature restrictions
3. Counts current usage from stores
4. Returns access/limit status

---

## 3. useMixpanel

**Purpose**: Analytics tracking and user identification

**Location**: `src/hooks/useMixpanel.js`

**Usage**:
```javascript
import { useMixpanel } from '../hooks/useMixpanel'

function MyComponent() {
  const mixpanel = useMixpanel()
  
  const handleClick = () => {
    // Track event
    mixpanel.track('Button Clicked', { 
      button: 'submit',
      page: 'control'
    })
  }
  
  return <button onClick={handleClick}>Click me</button>
}
```

**Available Methods**:
```javascript
mixpanel.track(event, properties)           // Track event
mixpanel.identify(userId)                   // Identify user
mixpanel.people.set(properties)             // Set user properties
mixpanel.trackPageView(pathname, context)   // Track page view
```

**Auto-Tracked**:
- ✅ Page views (pathname, search, hash)
- ✅ User identification (on login)
- ✅ Last login timestamp
- ✅ User email

**How It Works**:
1. Tracks page changes automatically
2. Identifies user on login
3. Sets user properties (email, last login)
4. Returns mixpanel instance for manual tracking

---

## 4. useKeyboardShortcuts

**Purpose**: Handle keyboard shortcuts in fullscreen mode

**Location**: `src/hooks/useKeyboardShortcuts.js`

**Usage**:
```javascript
import { useKeyboardShortcuts, toggleFullscreen } from '../hooks/useKeyboardShortcuts'

function MyComponent() {
  const [showInfo, setShowInfo] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  
  useKeyboardShortcuts({
    onToggleFullscreen: () => toggleFullscreen(),
    onExitFullscreen: () => toggleFullscreen(),
    onShowInfo: () => setShowInfo(!showInfo),
    onShowHelp: () => setShowHelp(!showHelp)
  }, true)  // enabled
  
  return <div>...</div>
}
```

**Shortcuts**:
| Key | Action | Handler |
|-----|--------|---------|
| `F` | Toggle Fullscreen | `onToggleFullscreen` |
| `Esc` | Exit Fullscreen | `onExitFullscreen` |
| `I` | Show Info | `onShowInfo` |
| `?` | Show Help | `onShowHelp` |

**Helper Functions**:
```javascript
// Check if fullscreen supported
isFullscreenSupported()  // Returns boolean

// Toggle fullscreen
await toggleFullscreen()  // Returns true/false
```

**How It Works**:
1. Listens for keydown events
2. Prevents default for handled keys
3. Ignores shortcuts if typing in input
4. Calls appropriate handler
5. Cleans up on unmount

**Key Features**:
- ✅ Input-aware (doesn't trigger while typing)
- ✅ Fullscreen-aware (Esc only in fullscreen)
- ✅ Cross-browser support
- ✅ Proper cleanup

---

## 5. useAutoHide

**Purpose**: Auto-hide UI elements on mouse inactivity

**Location**: `src/hooks/useAutoHide.js`

**Usage**:
```javascript
import { useAutoHide } from '../hooks/useAutoHide'

function MyComponent() {
  const { isVisible, show, hide, toggle } = useAutoHide(3000, true)
  
  return (
    <div className={`transition ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div onMouseMove={() => show()}>
        Hover to show controls
      </div>
    </div>
  )
}
```

**Returns**:
```javascript
{
  isVisible: boolean,          // Is UI visible?
  show: () => void,           // Show UI
  hide: () => void,           // Hide UI
  toggle: () => void          // Toggle visibility
}
```

**Parameters**:
- `timeout` (number, ms) - Delay before hiding (default: 3000)
- `enabled` (boolean) - Is auto-hide enabled? (default: true)

**How It Works**:
1. Starts visible
2. Resets timer on mouse movement
3. Hides after timeout seconds of inactivity
4. Shows again on movement
5. Cleans up timers on unmount

**Key Features**:
- ✅ Automatic timer management
- ✅ Mouse movement tracking
- ✅ Manual show/hide controls
- ✅ Proper cleanup
- ✅ Enables/disables cleanly

---

## Testing Hooks

### useWebSocket
```javascript
// ✅ Connects to WebSocket
// ✅ Receives messages
// ✅ Sends messages
// ✅ Updates on disconnect
```

### useFeatureGate
```javascript
// ✅ Free tier: limited access
// ✅ Pro tier: unlimited access
// ✅ Tracks usage accurately
// ✅ Enforces limits
```

### useMixpanel
```javascript
// ✅ Tracks page views
// ✅ Identifies users
// ✅ Sets properties
// ✅ Tracks events
```

### useKeyboardShortcuts
```javascript
// ✅ F key toggles fullscreen
// ✅ Esc exits fullscreen
// ✅ I shows info
// ✅ ? shows help
// ✅ Ignores in inputs
```

### useAutoHide
```javascript
// ✅ Hides after timeout
// ✅ Resets on mouse move
// ✅ Manual show/hide works
// ✅ Cleans up properly
```

---

## Common Issues & Solutions

### Hook State Not Updating
**Problem**: Hook returns old value  
**Solution**: Check dependency array in useEffect  
**See**: React hooks documentation

### Memory Leaks
**Problem**: Event listeners not cleaned up  
**Solution**: All hooks properly clean up in useEffect return  
**Status**: ✅ All hooks have proper cleanup

### Double Firing
**Problem**: Hook effect runs twice in dev  
**Solution**: Normal in React 18 Strict Mode  
**Status**: ✅ This is expected behavior

---

## All Hooks Status

```
✅ useWebSocket           Working - Real-time messaging
✅ useFeatureGate         Working - Access control
✅ useMixpanel            Working - Analytics
✅ useKeyboardShortcuts   Working - Keyboard shortcuts
✅ useAutoHide            Working - UI auto-hide

Total: 5/5 hooks working perfectly
```

---

## Integration Points

### Control.jsx
- Uses: useWebSocket, useMixpanel
- Tracks: Page view, message sends

### Display.jsx
- Uses: useWebSocket, useAutoHide, useKeyboardShortcuts
- Tracks: Page view, fullscreen toggle

### DigitalFlipBoardGrid.jsx
- Uses: useFeatureGate (indirectly via props)

### RoleManagement.jsx (NEW)
- Uses: useMixpanel (event tracking)

---

## Best Practices

1. **Always include dependencies**: useEffect dependency array
2. **Clean up properly**: Return cleanup function
3. **Don't call in conditions**: Always call hooks at top level
4. **Use appropriate hook**: Pick hook for your needs
5. **Test thoroughly**: Verify expected behavior

---

## Next Steps

✅ All hooks verified and working  
⏳ Deploy with confidence  
⏳ Monitor performance in production  

---

**Last Updated**: November 22, 2025  
**Status**: ✅ All Working  
**Confidence**: 🟢 Very High

See also:
- [SECURITY.md](./SECURITY.md) - Security implementation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
