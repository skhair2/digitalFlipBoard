# Code Changes - Exact Diff

## File 1: src/components/control/SessionPairing.jsx

### Added Import (Line 6)
```javascript
import { useWebSocket } from '../../hooks/useWebSocket'
```

### Added Hook Call (After Line 22, before useSessionStore destructure)
```javascript
// Call useWebSocket hook to establish and maintain WebSocket connection
useWebSocket()
```

**Before:**
```jsx
export default function SessionPairing() {
    const [code, setCode] = useState('')
    const [error, setError] = useState('')
    // ... more state
    const navigate = useNavigate()
    const { setSessionCode, lastSessionCode, ... } = useSessionStore()
```

**After:**
```jsx
export default function SessionPairing() {
    const [code, setCode] = useState('')
    const [error, setError] = useState('')
    // ... more state
    const navigate = useNavigate()
    
    // Call useWebSocket hook to establish and maintain WebSocket connection
    useWebSocket()
    
    const { setSessionCode, lastSessionCode, ... } = useSessionStore()
```

---

## File 2: src/pages/Control.jsx

### Added Import (Line 12)
```javascript
import { useWebSocket } from '../hooks/useWebSocket'
```

### Added Hook Call (After Line 29, before useEffect)
```javascript
// Call useWebSocket hook to establish and maintain WebSocket connection
useWebSocket()
```

**Before:**
```jsx
export default function Control() {
    const { sessionCode, isConnected, setSessionCode, ... } = useSessionStore()
    const [searchParams] = useSearchParams()
    const [message, setMessage] = useState('')
    const [selectedTabIndex, setSelectedTabIndex] = useState(0)

    // Check for boardId in URL
    useEffect(() => {
```

**After:**
```jsx
export default function Control() {
    const { sessionCode, isConnected, setSessionCode, ... } = useSessionStore()
    const [searchParams] = useSearchParams()
    const [message, setMessage] = useState('')
    const [selectedTabIndex, setSelectedTabIndex] = useState(0)

    // Call useWebSocket hook to establish and maintain WebSocket connection
    useWebSocket()

    // Check for boardId in URL
    useEffect(() => {
```

---

## File 3: src/pages/Display.jsx

### Added Import (Line 10)
```javascript
import { useWebSocket } from '../hooks/useWebSocket'
```

### Added Hook Call (After Line 24, before Display settings state)
```javascript
// Call useWebSocket hook to establish and maintain WebSocket connection
useWebSocket()
```

**Before:**
```jsx
export default function Display() {
    const { isConnected, setSessionCode, setBoardId, ... } = useSessionStore()
    const [searchParams] = useSearchParams()
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [timeString, setTimeString] = useState('')
    const [showInfo, setShowInfo] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [showPairingCode, setShowPairingCode] = useState(true)

    // Display settings state
    const [displaySettings, setDisplaySettings] = useState({
```

**After:**
```jsx
export default function Display() {
    const { isConnected, setSessionCode, setBoardId, ... } = useSessionStore()
    const [searchParams] = useSearchParams()
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [timeString, setTimeString] = useState('')
    const [showInfo, setShowInfo] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [showPairingCode, setShowPairingCode] = useState(true)

    // Call useWebSocket hook to establish and maintain WebSocket connection
    useWebSocket()

    // Display settings state
    const [displaySettings, setDisplaySettings] = useState({
```

---

## Summary

| File | Changes | Type |
|------|---------|------|
| SessionPairing.jsx | Import + function call | 2 lines |
| Control.jsx | Import + function call | 2 lines |
| Display.jsx | Import + function call | 2 lines |
| **Total** | **3 files** | **6 lines** |

## Impact
- ✅ Enables WebSocket connection on page load
- ✅ Registers event listeners
- ✅ Processes connection:status events
- ✅ Updates isConnected state
- ✅ Red dot becomes interactive

## No Breaking Changes
- Backwards compatible
- No logic changes
- Just invoking what was already there
- All cleanup handled by hook
