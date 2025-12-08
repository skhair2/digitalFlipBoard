# Infrastructure Improvements - Implementation Guide

**Date Completed:** November 26, 2025  
**Version:** 1.0.0  
**Status:** Ready for Integration Testing

---

## Overview

This document details the infrastructure improvements made to address critical issues:
1. ✅ Session storage moved to Redis (distributed state)
2. ✅ Redis-backed rate limiting (scales horizontally)
3. ✅ Structured logging (machine-readable JSON logs)
4. ✅ Health check endpoints (Kubernetes-ready)
5. ✅ Database query optimization indexes (improved performance)

---

## 1. Redis Session Storage

### What Changed

**Before:** Sessions stored in-memory Map, lost on server restart
**After:** Sessions persisted in Redis with configurable TTL

### Key Files

- `server/redis.js` - Redis client initialization and session store operations
- `server/index.js` - Updated to use `sessionStore` instead of in-memory Map

### Implementation Details

#### Session Storage Operations

```javascript
import { sessionStore, activityStore } from './redis.js';

// Save session
await sessionStore.save(sessionCode, sessionData, ttl);

// Get session
const session = await sessionStore.get(sessionCode);

// Add client to session
await sessionStore.addClient(sessionCode, clientData);

// Remove client
await sessionStore.removeClient(sessionCode, socketId);

// Track activity for inactivity detection
await activityStore.updateActivity(sessionCode);

// Get inactivity duration
const duration = await activityStore.getInactivityDuration(sessionCode);
```

#### Benefits

- **Persistence:** Sessions survive server restarts
- **Scalability:** Multiple server instances share session state
- **Distributed Monitoring:** Inactivity monitoring works across instances
- **Automatic Cleanup:** TTL-based expiration (24 hours default)

### Configuration

```env
# In .env file
REDIS_URL=redis://localhost:6379
MAX_SESSION_LIFETIME=86400000  # 24 hours

# Production with authentication
REDIS_URL=redis://:password@host:port:6379
```

### Usage in Production

```bash
# Local development
redis-server

# Docker
docker run -d -p 6379:6379 redis:7-alpine

# Production (managed Redis)
# Use Upstash, Redis Cloud, or AWS ElastiCache
REDIS_URL=redis://default:password@your-redis.cloud:6379
```

---

## 2. Redis-Backed Rate Limiting

### What Changed

**Before:** In-memory rate limiter resets on server restart, doesn't scale
**After:** Redis-backed distributed rate limiter across all instances

### Key Files

- `server/redisRateLimiter.js` - Redis-backed rate limiting implementation
- `server/index.js` - Updated to use `createRateLimiter()`

### Implementation Details

#### Rate Limiter Usage

```javascript
import { createRateLimiter } from './redisRateLimiter.js';

const rateLimiter = createRateLimiter({
  maxRequests: 10,      // 10 requests per window
  windowMs: 60000,      // Per 60 seconds
  keyPrefix: 'ratelimit:'
});

// Check user rate limit
const userCheck = await rateLimiter.checkUserLimit(userId);
if (!userCheck.allowed) {
  return callback({
    success: false,
    error: `Rate limited: ${userCheck.retryAfter}s remaining`,
    retryAfter: userCheck.retryAfter
  });
}

// Check IP rate limit
const ipCheck = await rateLimiter.checkIpLimit(clientIp);

// Check connection rate limit (prevent connection bombs)
const connCheck = await rateLimiter.checkConnectionLimit(clientIp, maxConnections);

// Get usage stats
const stats = await rateLimiter.getUserStats(userId);
// Returns: { requests, limit, window_ms, ttl_seconds }
```

#### Limits Applied

| Type | Limit | Window | Purpose |
|------|-------|--------|---------|
| User Message | 10 | 60s | Prevent spam |
| IP Message | 20 | 60s | Prevent abuse |
| Connection | 5 | 60s | Prevent connection bomb |

#### Benefits

- **Distributed:** Rate limits persist across server restarts
- **Scalable:** Works with multiple server instances
- **Configurable:** Easy to adjust limits per environment
- **Multi-layer:** User, IP, and connection-level protection

### Configuration

```env
RATE_LIMIT_MAX_REQUESTS=10      # Messages per user per window
RATE_LIMIT_WINDOW_MS=60000       # Time window in milliseconds
```

---

## 3. Structured Logging

### What Changed

**Before:** Console.log with timestamps, not machine-readable
**After:** JSON-formatted structured logs with levels and rotation

### Key Files

- `server/logger.js` - Structured logging system
- `server/index.js` - All console.log replaced with logger calls

### Implementation Details

#### Logger Usage

```javascript
import logger from './logger.js';

// Basic logging
logger.info('server_started', { port: 3001, environment: 'production' });
logger.warn('rate_limit_exceeded', { user_id, retry_after: 30 });
logger.error('database_connection_failed', error, { database: 'supabase' });

// Socket-specific logging
logger.logSocketConnection(socket, user);
logger.logSocketDisconnection(socket, 'client');
logger.logMessageSent(sessionCode, userId, content, recipientCount);
logger.logRateLimitExceeded(userId, 'message', retryAfter);
logger.logSessionTermination(sessionCode, reason, clientCount);

// API logging
logger.logApiCall(method, path, statusCode, duration, userId);
```

#### Log Output

**Console (development):**
```
[2025-11-26T10:30:45.123Z] INFO     server_started {"port":3001,"environment":"development"}
[2025-11-26T10:30:46.234Z] INFO     socket_connected {"socket_id":"abc123...","user_email":"user@example.com"}
[2025-11-26T10:30:47.345Z] WARN     rate_limit_exceeded {"user_id":"user123","retry_after_seconds":30}
```

**File (production, daily rotation):**
```json
{"timestamp":"2025-11-26T10:30:45.123Z","level":"INFO","service":"digitalflipboard-server","message":"server_started","port":3001,"environment":"production"}
{"timestamp":"2025-11-26T10:30:46.234Z","level":"INFO","service":"digitalflipboard-server","message":"socket_connected","socket_id":"abc123","user_id":"user123","user_email":"user@example.com"}
```

#### Features

- **Structured JSON:** Machine-readable for log aggregation
- **Daily Rotation:** Logs split by date (YYYY-MM-DD.log)
- **Configurable Levels:** DEBUG, INFO, WARN, ERROR, CRITICAL
- **PII Masking:** Logs truncated for privacy
- **Color Output:** Development console has colors, production uses plain text

#### Configuration

```env
LOG_LEVEL=INFO                # Minimum log level
LOG_DIR=./logs               # Directory for log files
NODE_ENV=production          # File logging enabled in production
```

#### Viewing Logs

```bash
# Development (console)
npm run server:dev

# Production (files in ./logs/)
tail -f logs/2025-11-26.log | jq .

# Filter by event type
grep "message_sent" logs/*.log | jq .
```

---

## 4. Health Check Endpoints

### What Changed

**Before:** No health checks, no way to detect unhealthy instances
**After:** Kubernetes-ready liveness, readiness, and metrics endpoints

### Key Files

- `server/healthCheck.js` - Health check endpoints
- `server/index.js` - Registered health check routes

### Implementation Details

#### Endpoints

##### Liveness Probe - `GET /health/live`
Quick check to see if server is alive
```bash
curl http://localhost:3001/health/live
```
Response:
```json
{
  "status": "alive",
  "uptime_seconds": 123,
  "memory_usage_percent": "45.32",
  "timestamp": "2025-11-26T10:30:45.123Z"
}
```

##### Readiness Probe - `GET /health/ready`
Deep check if server is ready to serve traffic
```bash
curl http://localhost:3001/health/ready
```
Response:
```json
{
  "status": "ready",
  "checks": {
    "redis": { "status": "healthy" },
    "database": { "status": "healthy" },
    "config": { "status": "healthy" },
    "memory": { "status": "healthy", "usage_percent": "45.32" }
  },
  "timestamp": "2025-11-26T10:30:45.123Z"
}
```

##### Metrics - `GET /metrics`
Detailed metrics for monitoring dashboards
```bash
curl http://localhost:3001/metrics
```
Response:
```json
{
  "server": {
    "uptime_seconds": 3600,
    "environment": "production",
    "version": "1.0.0"
  },
  "memory": {
    "rss_mb": 128,
    "heap_total_mb": 64,
    "heap_used_mb": 32,
    "heap_used_percent": "50.00"
  },
  "cpu": {
    "user_ms": 1234,
    "system_ms": 567
  }
}
```

### Kubernetes Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: digitalflipboard-server
spec:
  template:
    spec:
      containers:
      - name: server
        image: digitalflipboard:latest
        ports:
        - containerPort: 3001
        
        # Liveness probe - restart if dead
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 30
        
        # Readiness probe - remove from LB if not ready
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 10
          failureThreshold: 3
```

---

## 5. Database Query Optimization

### What Changed

**Before:** No indexes, N+1 query problems, slow pagination
**After:** Comprehensive indexes and optimized queries

### Migration File

- `supabase/migrations/006_add_performance_indexes.sql`

### Indexes Added

| Table | Index | Purpose |
|-------|-------|---------|
| sessions | idx_sessions_code | Fast lookup by code |
| sessions | idx_sessions_creator | Sessions per user |
| sessions | idx_sessions_active | Active sessions only |
| sessions | idx_sessions_expires_at | Session cleanup |
| messages | idx_messages_session | Messages per session |
| messages | idx_messages_sent_at | Recent messages first |
| messages | idx_messages_session_sent | Combined query |
| profiles | idx_profiles_email | Fast auth lookup |
| profiles | idx_profiles_premium | Premium users |
| analytics | idx_analytics_event | Event filtering |

### Applying the Migration

```bash
# Development
npx supabase db push

# Production
# Use Supabase dashboard or CLI
supabase db push --db-url postgresql://...
```

### Performance Improvements

**Before Migration:**
```
SELECT * FROM messages WHERE session_id = $1 
ORDER BY sent_at DESC LIMIT 50
→ Full table scan (slow)
```

**After Migration:**
```
SELECT * FROM messages WHERE session_id = $1 
ORDER BY sent_at DESC LIMIT 50
→ Index scan on idx_messages_session_sent (fast)
```

### Monitoring Query Performance

```sql
-- Find slow queries
SELECT query, calls, mean_time, max_time 
FROM pg_stat_statements 
WHERE mean_time > 100 
ORDER BY mean_time DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

---

## 6. Integration Checklist

### Prerequisites
- [ ] Redis instance running (local or managed)
- [ ] Node.js 18+ installed
- [ ] Supabase project configured

### Setup Steps

```bash
# 1. Install dependencies
cd server
npm install

# 2. Copy and configure .env
cp ../.env.example ../.env
# Edit .env with Redis URL and other configs

# 3. Apply database migrations
supabase db push

# 4. Start Redis (if local)
redis-server

# 5. Start server
npm run dev

# 6. Test endpoints
curl http://localhost:3001/health/ready
curl http://localhost:3001/metrics
```

### Testing Improvements

```bash
# Test Redis session storage
# 1. Connect two clients to same session
# 2. Restart server
# 3. Verify session data persisted

# Test rate limiting
# 1. Send 11 messages in 60 seconds
# 2. Verify rate limit triggered
# 3. Check logs for structured events

# Test health checks
curl http://localhost:3001/health/live
curl http://localhost:3001/health/ready
curl http://localhost:3001/metrics

# View structured logs
tail -f logs/$(date +%Y-%m-%d).log | jq .
```

---

## 7. Migration Path from Old to New

### For Existing Deployments

1. **Prepare Redis** (1-2 hours)
   - Set up Redis instance
   - Test connection from server
   - Configure backups

2. **Deploy Code** (1 hour)
   - Deploy updated server code
   - Verify health checks pass
   - Monitor logs for errors

3. **Verify Session Persistence** (30 min)
   - Test with multiple clients
   - Verify sessions survive restart
   - Check rate limiting works

4. **Apply Database Indexes** (30 min, low risk)
   - Run migration during maintenance window
   - Verify query performance improved
   - Monitor database load

### Rollback Plan

If issues occur:
1. Keep old server image available
2. Revert to previous version (in-memory session fallback available)
3. Disable Redis temporarily with feature flag
4. Debug and fix issues

---

## 8. Performance Benchmarks

### Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Message Latency | 150ms | 50ms | 3x faster |
| Database Query | 500ms | 50ms | 10x faster |
| Memory Per Session | 1KB | Shared Redis | Scalable |
| Max Concurrent Sessions | ~1000 | 10,000+ | 10x+ |
| Restart Persistence | 0% | 100% | Critical |

### Load Testing

```bash
# Install Artillery
npm install -g artillery

# Create load-test.yml
# Run test
artillery run load-test.yml

# Expected results:
# - 1000 concurrent connections
# - 100 messages/sec
# - <100ms p95 latency
# - 0% errors
```

---

## 9. Troubleshooting

### Redis Connection Failed

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Fix:**
```bash
# Check if Redis running
redis-cli ping
# Should return "PONG"

# If not, start Redis
redis-server

# Or check REDIS_URL in .env
echo $REDIS_URL
```

### Rate Limiting Too Strict

```
Error: Rate limited: 45s remaining
```

**Fix (in .env):**
```env
RATE_LIMIT_MAX_REQUESTS=20      # Increase from 10
RATE_LIMIT_WINDOW_MS=120000     # Increase window to 2 min
```

### High Memory Usage

```
Memory: 512MB / 524MB (97%)
```

**Fixes:**
- Increase Node heap: `NODE_OPTIONS=--max-old-space-size=1024`
- Check for memory leaks in logs
- Reduce `MAX_SESSION_LIFETIME`

### Slow Queries

```
SELECT * FROM messages... (took 5000ms)
```

**Fix:**
- Run migration: `supabase db push`
- Verify indexes created: `\di` in psql
- Check query plan: `EXPLAIN SELECT ...`

---

## 7. Message History & Presence Tracking (NEW)

### Message History Service

**Purpose**: Persist messages with pagination and search capabilities

**Implementation** (`server/messageHistory.js`, 200 lines):
```javascript
class MessageHistoryService {
  // Store messages in Redis list: session:{code}:messages
  async addMessage(sessionCode, message) {
    // Store with auto-incremented ID, timestamp
    // Limit to 100 messages per session
    // Set 24-hour TTL
  }
  
  // Retrieve paginated messages
  async getHistory(sessionCode, page, pageSize) {
    // Default: 20 messages per page
    // Return: { messages, pagination }
  }
  
  // Search across messages
  async search(sessionCode, query) {
    // Full-text search matching
    // Return: matching messages
  }
  
  // Statistics
  async getStats(sessionCode) {
    // Count, duration, first/last timestamp
  }
}
```

**Features**:
- ✅ Pagination (configurable page size)
- ✅ Full-text search
- ✅ Auto-cleanup after 24 hours
- ✅ 100-message limit per session
- ✅ Timestamp and metadata storage

**REST API** (5 endpoints):
```
GET    /api/session/:code/history                  # Paginated
GET    /api/session/:code/history/latest           # Recent
GET    /api/session/:code/history/search?q=query   # Search
GET    /api/session/:code/history/stats            # Stats
DELETE /api/session/:code/history                  # Clear
```

**Frontend Integration**:
```javascript
// useMessageHistory hook
const {
  messages,
  pagination,
  search,
  fetchHistory,
  nextPage,
  previousPage
} = useMessageHistory();
```

### Presence Tracking Service

**Purpose**: Track online users and their activity

**Implementation** (`server/presenceTracking.js`, 350 lines):
```javascript
class PresenceTrackingService {
  // Store users in Redis hash: session:{code}:presence
  async joinSession(sessionCode, userId, userData) {
    // Add user with type, name, timestamps
    // Set 30-minute TTL
  }
  
  async updateActivity(sessionCode, userId) {
    // Refresh lastSeen timestamp
    // Extend TTL
  }
  
  async getSessionStats(sessionCode) {
    // Return: { total, controllers, displays }
  }
  
  async cleanupIdleUsers(sessionCode, idleTimeMs) {
    // Auto-remove users inactive >30 min
  }
}
```

**Features**:
- ✅ Real-time user tracking
- ✅ User type differentiation (controller/display)
- ✅ Activity timestamp tracking
- ✅ Auto-cleanup of idle users
- ✅ Online statistics per type

**REST API** (7 endpoints):
```
GET    /api/session/:code/presence                # Summary
GET    /api/session/:code/presence/users          # List
POST   /api/session/:code/presence/join           # Join
POST   /api/session/:code/presence/leave          # Leave
POST   /api/session/:code/presence/activity       # Update
POST   /api/session/:code/presence/cleanup        # Cleanup
```

**Frontend Integration**:
```javascript
// usePresence hook
const {
  users,
  stats,
  joinSession,
  leaveSession,
  onlineCount,
  controllerCount,
  displayCount
} = usePresence();
```

### Socket.io Integration

**Connection Handler**:
```javascript
io.on('connection', async (socket) => {
  // Auto-add user to presence tracking
  await presenceTrackingService.joinSession(sessionCode, socket.id, {
    type: socket.role,
    name: userEmail,
    metadata: { userId, clientIp }
  });
  
  // Broadcast to all clients in session
  await presenceTrackingService.broadcastPresenceUpdate(io, sessionCode);
});
```

**Disconnection Handler**:
```javascript
socket.on('disconnect', () => {
  // Auto-remove user from presence
  presenceTrackingService.leaveSession(sessionCode, socket.id);
  
  // Broadcast updated presence
  presenceTrackingService.broadcastPresenceUpdate(io, sessionCode);
});
```

**Message Send Handler**:
```javascript
socket.on('message:send', async (payload) => {
  // ... validate and send ...
  
  // Auto-save to history
  if (global.messageHistoryService) {
    await global.messageHistoryService.addMessage(sessionCode, {
      content: payload.content,
      animation: payload.animation,
      timestamp: Date.now()
    });
  }
});
```

---

## 10. Future Enhancements

1. **Redis Cluster** - High availability for Redis
2. **Metrics Export** - Prometheus format for monitoring
3. **Distributed Tracing** - OpenTelemetry integration
4. **Cache Warming** - Pre-load hot data at startup
5. **Session Replication** - Backup to secondary Redis
6. **Query Caching** - Redis-backed query cache layer

---

## Quick Reference

### Important Files

```
server/
├── redis.js              # Redis client & session store
├── redisRateLimiter.js   # Redis-backed rate limiting
├── logger.js             # Structured logging
├── healthCheck.js        # Health check endpoints
└── index.js              # Updated main server

supabase/
└── migrations/006_...    # Database indexes
```

### Key Environment Variables

```env
REDIS_URL=redis://localhost:6379
LOG_LEVEL=INFO
LOG_DIR=./logs
RATE_LIMIT_MAX_REQUESTS=10
INACTIVITY_TIMEOUT=900000
```

### Common Commands

```bash
# Start server with Redis
npm run server:dev

# View logs
tail -f logs/2025-11-26.log | jq .

# Check health
curl http://localhost:3001/health/ready

# Get metrics
curl http://localhost:3001/metrics

# Test rate limit
for i in {1..15}; do curl http://localhost:3001/api/test; done
```

---

## Support & Questions

- Check logs: `logs/` directory
- View metrics: `/metrics` endpoint
- Test health: `/health/ready` endpoint
- Review implementation: `server/` files

---

**Last Updated:** December 7, 2025  
**Next Review:** After initial production deployment
