# Redis Pub/Sub Integration - Quick Reference

## What Was Implemented

### Backend (Node.js/Express)
1. **Redis Pub/Sub Service** - `server/redisPubSub.js`
   - Manages Redis connections and messaging
   - Stores session configurations and state
   - Handles pub/sub channels for real-time messaging

2. **REST API Endpoints** - Added to `server/index.js`
   ```
   POST   /api/session/:code/message   - Send message
   GET    /api/session/:code/config    - Get configuration
   POST   /api/session/:code/config    - Update configuration
   GET    /api/session/:code/state     - Get current state
   POST   /api/session/:code/end       - End session
   ```

### Frontend (React)
1. **Message Broker Service** - `src/services/messageBrokerService.js`
   - HTTP REST client for browser
   - Polling mechanism for state changes
   - Event emitter for reactive UI

2. **useMessageBroker Hook** - `src/hooks/useMessageBroker.js`
   - Manages message sending
   - Handles polling and state synchronization
   - Provides configuration management

3. **Component Integration**
   - **Display.jsx** - Listens to messages via polling
   - **Control.jsx** - Sends messages via REST API
   - **MessageInput.jsx** - Sends messages via both WebSocket + Redis

## Key Features

✅ **Dual Transport**
- Primary: WebSocket (real-time)
- Fallback: HTTP REST + Polling

✅ **Decoupled Architecture**
- Controller and Display operate independently
- No direct connection required
- Works through proxies and firewalls

✅ **Configuration Management**
- Centralized state in Redis
- 24-hour persistence
- Atomic updates

✅ **Graceful Degradation**
- WebSocket unavailable? Uses polling
- Redis unavailable? Falls back to WebSocket
- Network offline? Queues and retries

## Usage Examples

### Controller - Send Message

```javascript
import { useMessageBroker } from '../hooks/useMessageBroker'

export function ControlComponent() {
  const { sendMessage, isLoading } = useMessageBroker()

  const handleSend = async () => {
    await sendMessage('Hello Display', {
      animation: 'flip',
      color: 'teal'
    })
  }

  return <button onClick={handleSend} disabled={isLoading}>Send</button>
}
```

### Display - Listen to Messages

```javascript
import { useMessageBroker } from '../hooks/useMessageBroker'

export function DisplayComponent() {
  const { currentState, config } = useMessageBroker()

  return (
    <div>
      <p>Message: {currentState?.state?.currentMessage}</p>
      <p>Brightness: {config?.brightness}%</p>
    </div>
  )
}
```

### Update Configuration

```javascript
const { updateConfig } = useMessageBroker()

await updateConfig({
  brightness: 75,
  animation: 'roll',
  color: 'teal',
  clockMode: false
})
```

## Architecture Diagram

```
┌─────────────────┐                    ┌──────────────────┐
│   Controller    │                    │     Display      │
│   (Browser)     │                    │   (Browser)      │
└────────┬────────┘                    └────────┬─────────┘
         │                                      │
         │ HTTP POST                            │ HTTP GET
         │ /api/session/:code/message           │ /api/session/:code/state
         │                                      │
         └──────────────┬───────────────────────┘
                        │
                  ┌─────▼─────┐
                  │  Express   │
                  │   Server   │
                  │  :3001     │
                  └─────┬──────┘
                        │
              ┌─────────▼──────────┐
              │  Redis Pub/Sub     │
              │  :6379             │
              │                    │
              │  - Messaging       │
              │  - State Storage   │
              │  - Config Manager  │
              └────────────────────┘
```

## Message Flow Example

### Step 1: Controller sends message
```
Controller → POST /api/session/ABC123/message
  body: {
    message: "Hello World",
    animation: "flip",
    color: "monochrome"
  }
```

### Step 2: Backend processes
```
Backend:
  1. Validate session code
  2. Publish to Redis: session:ABC123:message
  3. Store state in Redis: session:ABC123:state
  4. Return success response
```

### Step 3: Display receives (polling)
```
Display → GET /api/session/ABC123/state (every 2 seconds)
  response: {
    state: {
      currentMessage: "Hello World",
      animation: "flip",
      color: "monochrome"
    },
    config: {...}
  }
```

### Step 4: UI updates
```
Display renders:
  - Message on flip board grid
  - Applies animation style
  - Applies color theme
```

## Configuration Options

### Polling Interval
**File:** `src/hooks/useMessageBroker.js` (line ~60)
```javascript
messageBrokerService.startPolling(handleStateChange, 2000) // milliseconds
```
- Faster = more responsive but more bandwidth
- Slower = less responsive but less bandwidth
- Optimal: 2000-5000ms for most use cases

### Session TTL
**File:** `server/redisPubSub.js` (line ~82)
```javascript
const ttl = 24 * 60 * 60 // seconds
```
- Default: 24 hours
- Adjust based on session requirements

### Rate Limiting
**File:** `server/index.js` (uses existing rate limiter)
- Prevents message spam
- Per-session limits configurable

## Testing Quick Commands

### Send test message via API
```bash
curl -X POST http://localhost:3001/api/session/ABC123/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Test", "animation": "flip", "color": "teal"}'
```

### Get session state
```bash
curl http://localhost:3001/api/session/ABC123/state
```

### Watch Redis messages (in Redis CLI)
```bash
redis-cli
SUBSCRIBE session:ABC123:message
```

## Monitoring

### Backend Logs
Look for:
```
[RedisPubSub] ✓ Initialized successfully
message_sent_via_pubsub
session_config_updated
```

### Browser Console
Look for:
```
[useMessageBroker] Message sent successfully
[MessageBroker] ✓ Started polling for state changes
[Display] Received message from broker
```

### Redis Memory
```bash
redis-cli
INFO memory
```

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Messages not appearing | Redis not running | Start Redis: `redis-server` |
| Duplicate messages | Both WebSocket and Redis send | Use one transport at a time |
| Slow polling | Interval too long | Decrease interval (1000-3000ms) |
| High bandwidth | Polling too frequent | Increase interval (5000ms+) |
| Session lost | TTL expired | Extend TTL in config |
| Offline not working | No fallback | Implement proper error handling |

## Performance Benchmarks

| Metric | Expected | Notes |
|--------|----------|-------|
| Message latency | 50-200ms | WebSocket < HTTP |
| Polling overhead | ~0.5KB/request | ~30 requests/min at 2s interval |
| Redis memory/session | 2-5KB | 1000 sessions = 2-5MB |
| Throughput | 100+ msg/sec | Per session, depends on rate limit |

## Troubleshooting Commands

### Test Redis connection
```bash
redis-cli ping
# Expected: PONG
```

### Check session data
```bash
redis-cli KEYS "session:*"
redis-cli GET session:ABC123:config
redis-cli GET session:ABC123:state
```

### Monitor messages in real-time
```bash
redis-cli SUBSCRIBE "session:*"
```

### Check backend logs
```bash
# In terminal where server is running
# Look for [RedisPubSub] and message_sent_via_pubsub logs
```

## Next Steps

1. ✅ **Implement** - Redis Pub/Sub routing
2. ✅ **Test** - Message flow between components
3. 🔄 **Monitor** - Performance and reliability
4. 📊 **Optimize** - Polling intervals and TTL
5. 🔐 **Secure** - Add encryption if needed
6. 📈 **Scale** - Add load balancing if needed
