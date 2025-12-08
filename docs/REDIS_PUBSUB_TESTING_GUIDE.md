# Redis Pub/Sub Message Routing - Testing Guide

## Architecture Overview

The Digital FlipBoard now uses a **hybrid message routing system**:
- **Primary:** WebSocket (real-time, bidirectional)
- **Secondary:** Redis Pub/Sub (via REST API endpoints)
- **Fallback:** HTTP Polling (when WebSocket unavailable)

## Message Flow

```
Controller (HTTP POST)
    ↓
/api/session/:code/message
    ↓
Redis Pub/Sub (server-side)
    ↓
Display (HTTP Polling)
    ↓
DigitalFlipBoardGrid (render message)
```

## Components Integration

### 1. useMessageBroker Hook
**Location:** `src/hooks/useMessageBroker.js`

**Usage in Display:**
```javascript
const { currentState, config } = useMessageBroker()
// Listens to Redis Pub/Sub via polling
```

**Usage in Controller:**
```javascript
const { sendMessage, updateConfig } = useMessageBroker()
// Publishes messages via REST API
```

### 2. Backend Services
**Redis Pub/Sub Service:** `server/redisPubSub.js`
- Manages Redis connections
- Publishes/subscribes to session channels
- Stores/retrieves configuration
- Manages session state

**REST API Endpoints:**
- `POST /api/session/:code/message` - Send message
- `POST /api/session/:code/config` - Update config
- `GET /api/session/:code/config` - Get config
- `GET /api/session/:code/state` - Get current state
- `POST /api/session/:code/end` - End session

### 3. Frontend Services
**Message Broker Service:** `src/services/messageBrokerService.js`
- HTTP REST client for Redis operations
- Polling mechanism for state changes
- Event emitter for reactive updates

## Testing Procedure

### Test 1: Basic Message Sending

**Setup:**
1. Open Display page: `http://localhost:3000/display`
2. Note the session code (e.g., `ABC123`)
3. Open Controller page: `http://localhost:3000/control`
4. Enter the session code to pair

**Test:**
1. In Controller, type a message: "Hello World"
2. Click "Send" button
3. **Expected:** Message appears on Display grid within 2 seconds

**Verification:**
- Browser console should show:
  ```
  [useMessageBroker] Message sent successfully
  [Display] Received message from broker: Hello World
  ```

### Test 2: Configuration Update

**Setup:**
Same as Test 1

**Test:**
1. In Controller, change animation: flip → roll
2. Change color: monochrome → teal
3. Change brightness: 100% → 75%
4. **Expected:** Display updates with new settings

**Verification:**
- Console logs:
  ```
  [useMessageBroker] Config updated successfully
  [Display] Received config from broker: {animation: 'roll', color: 'teal', brightness: 75}
  ```

### Test 3: WebSocket Fallback

**Setup:**
1. Open Display and Controller with session pairing active
2. Open DevTools → Network tab
3. Throttle to "Offline"

**Test:**
1. Type message in Controller: "Offline Test"
2. Click Send
3. **Expected:** Message still sends successfully (via HTTP polling fallback)
4. Resume network
5. **Expected:** Message appears on Display

**Verification:**
- DevTools should show HTTP requests (no WebSocket)
- Polling interval: 2 seconds

### Test 4: Multiple Displays

**Setup:**
1. Display 1: `http://localhost:3000/display` → Session code: `ABC123`
2. Display 2: `http://localhost:3000/display` → Session code: `XYZ789`
3. Controller: Pair with `ABC123`

**Test:**
1. Send message from Controller
2. **Expected:** Message appears only on Display 1, not Display 2

**Verification:**
- Redis channels are session-specific
- Console shows correct channel: `session:ABC123:message`

### Test 5: State Persistence

**Setup:**
1. Display and Controller paired with session code `ABC123`
2. Send message: "Test Message"

**Test:**
1. Refresh Display page (F5)
2. **Expected:** Last message is still visible
3. Refresh Controller page
4. **Expected:** Session code is restored

**Verification:**
- Redis stores state with 24-hour TTL
- Session state persists across page refreshes

### Test 6: Configuration Persistence

**Setup:**
1. Display and Controller paired
2. Change display settings: brightness 50%, animation "roll"

**Test:**
1. Refresh Display page
2. **Expected:** Settings are preserved

**Verification:**
- Redis stores config with 24-hour TTL
- `GET /api/session/:code/config` returns saved config

## API Testing (Manual)

### Send Message via cURL

```bash
curl -X POST http://localhost:3001/api/session/ABC123/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello from API",
    "animation": "flip",
    "color": "teal"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "published": true
}
```

### Get Session State via cURL

```bash
curl http://localhost:3001/api/session/ABC123/state
```

**Expected Response:**
```json
{
  "state": {
    "currentMessage": "Hello from API",
    "lastMessageTime": 1733596800000,
    "animation": "flip",
    "color": "teal"
  },
  "config": {
    "brightness": 100,
    "clockMode": false,
    "animation": "flip",
    "color": "teal"
  }
}
```

### Update Configuration via cURL

```bash
curl -X POST http://localhost:3001/api/session/ABC123/config \
  -H "Content-Type: application/json" \
  -d '{
    "brightness": 75,
    "animation": "roll",
    "color": "teal"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "config": {
    "brightness": 75,
    "animation": "roll",
    "color": "teal",
    "updatedAt": 1733596800000
  }
}
```

## Debugging

### Enable Debug Logging

**In Browser Console:**
```javascript
// Watch message broker events
localStorage.setItem('debug', 'true')
```

**Expected Console Output:**
```
[useMessageBroker] Connected to session: ABC123
[MessageBroker] ✓ Message sent: Hello World
[MessageBroker] ✓ Started polling for state changes (interval: 2000 ms)
[Display] Received message from broker: Hello World
```

### Check Redis State

**Using Redis CLI:**
```bash
redis-cli

# List all session keys
KEYS session:*

# Get session config
GET session:ABC123:config

# Get session state
GET session:ABC123:state

# Subscribe to message channel (live)
SUBSCRIBE session:ABC123:message
```

### Monitor API Requests

**Backend Logs:**
```
[2025-12-08T02:00:00.000Z] message_sent_via_pubsub {"session_code":"ABC123","message":"Hello World","animation":"flip","color":"monochrome"}

[2025-12-08T02:00:01.000Z] session_config_updated {"session_code":"ABC123","config":{"brightness":75,"animation":"roll"}}
```

## Troubleshooting

### Issue: Message not appearing on Display

**Possible Causes:**
1. Session code mismatch between Controller and Display
2. Redis Pub/Sub service not initialized
3. Polling interval too long (increase frequency in hook)

**Fix:**
```bash
# Verify Redis is running
redis-cli ping
# Expected: PONG

# Check session data exists
redis-cli GET session:ABC123:config
```

### Issue: WebSocket and Redis both used (duplicate messages)

**Solution:**
Use WebSocket only when available, Redis only for fallback. Check:
```javascript
// In MessageInput.jsx
// Only send via Redis if WebSocket fails
if (!sendMessage(message)) {
  await sendMessageViaRedis(message)
}
```

### Issue: Polling too slow / consuming bandwidth

**Optimization:**
Adjust polling interval in `useMessageBroker()`:
```javascript
messageBrokerService.startPolling(callback, 5000) // 5 seconds instead of 2
```

## Performance Metrics

### Expected Latencies
- WebSocket message: 50-100ms
- Redis Pub/Sub: 100-200ms
- HTTP polling: 500-2000ms (depends on interval)

### Redis Memory Usage
- Per session: ~2-5KB (config + state)
- 1000 sessions: ~2-5MB
- TTL cleanup: 24 hours

## Production Checklist

- [ ] Redis deployed with proper memory limits
- [ ] Session TTL set to 24 hours
- [ ] Error handling implemented for offline scenarios
- [ ] Logging enabled for debugging
- [ ] Rate limiting enabled on REST endpoints
- [ ] CORS properly configured
- [ ] WebSocket connection preferred over polling
- [ ] Graceful degradation when services unavailable

## Next Steps

1. **Add real-time updates** using Socket.io + Redis adapter
2. **Implement message history** with pagination
3. **Add presence tracking** (who's connected)
4. **Optimize polling** with incremental state updates
5. **Add encryption** for sensitive configurations
