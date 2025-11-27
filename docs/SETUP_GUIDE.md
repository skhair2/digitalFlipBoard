# Digital FlipBoard - Infrastructure Setup Guide

## Quick Start

### Prerequisites
- Node.js 18+ 
- Redis (local or Docker)
- Supabase project (configured)

### Installation

#### Windows
```bash
# Run setup script
.\setup.bat

# Or manual install
npm install
cd server && npm install && cd ..
```

#### macOS/Linux
```bash
# Run setup script
bash setup.sh

# Or manual install
npm install
cd server && npm install
```

### Start Redis

**Option 1: Local Installation**
```bash
# macOS (Homebrew)
brew install redis
redis-server

# Linux (Ubuntu)
sudo apt-get install redis-server
redis-server

# Linux (CentOS)
sudo yum install redis
redis-server
```

**Option 2: Docker (Recommended)**
```bash
docker run -d -p 6379:6379 --name flipboard-redis redis:7-alpine

# Verify
docker exec flipboard-redis redis-cli ping
# Should return: PONG
```

**Option 3: Windows Subsystem for Linux (WSL2)**
```bash
wsl
sudo apt-get install redis-server
sudo service redis-server start

# Verify
redis-cli ping
```

### Start Development Servers

**Terminal 1 - Backend Server:**
```bash
npm run server:dev
# Output: Server running on port 3001
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Output: Local: http://localhost:5173
```

### Test Infrastructure

```bash
# Check server is running
curl http://localhost:3001/health/live

# Check Redis connection
curl http://localhost:3001/health/ready

# Get metrics
curl http://localhost:3001/metrics

# View logs
tail -f logs/$(date +%Y-%m-%d).log | jq .
```

---

## Infrastructure Components

### 1. Redis Session Storage

**Location:** `server/redis.js`

Sessions are now stored in Redis instead of in-memory, enabling:
- Persistence across server restarts
- Distributed state across multiple instances
- Automatic expiration (24-hour default)

```javascript
import { sessionStore } from './redis.js';

// Save session
await sessionStore.save(sessionCode, { /* data */ }, ttl);

// Get session
const session = await sessionStore.get(sessionCode);

// Track activity
await activityStore.updateActivity(sessionCode);
```

### 2. Structured Logging

**Location:** `server/logger.js`

All logs are now JSON-formatted for machine-readability and monitoring integration.

```javascript
import logger from './logger.js';

// Log events
logger.info('message_sent', { session: 'ABC123', recipients: 3 });
logger.warn('rate_limit_exceeded', { user_id: 'user123', retry: 30 });
logger.error('db_error', error, { operation: 'save_session' });
```

**Log Files:** `logs/YYYY-MM-DD.log` (daily rotation)

### 3. Redis-Backed Rate Limiting

**Location:** `server/redisRateLimiter.js`

Distributed rate limiting that works across multiple instances:
- User message limit: 10 per 60 seconds
- IP rate limit: 20 per 60 seconds
- Connection limit: 5 per 60 seconds

### 4. Health Check Endpoints

**Location:** `server/healthCheck.js`

Three health check endpoints for monitoring:

```bash
# Liveness (quick check)
curl http://localhost:3001/health/live

# Readiness (comprehensive check)
curl http://localhost:3001/health/ready

# Metrics (detailed stats)
curl http://localhost:3001/metrics
```

### 5. Database Indexes

**Location:** `supabase/migrations/006_add_performance_indexes.sql`

Optimized queries on:
- Sessions (lookup by code, creator, status)
- Messages (by session, sender, timestamp)
- Profiles (by email, premium status)
- Analytics (by event, user, timestamp)

**Apply migration:**
```bash
supabase db push
```

---

## Environment Configuration

### Required Variables (Backend)

```env
NODE_ENV=development
PORT=3001
REDIS_URL=redis://localhost:6379
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
```

### Optional Variables

```env
# Session Management
INACTIVITY_TIMEOUT=900000              # 15 minutes
INACTIVITY_WARNING_THRESHOLD=600000    # 10 minutes before timeout
CHECK_INTERVAL=60000                   # Check every 1 minute
MAX_SESSION_LIFETIME=86400000           # 24 hours

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=10
RATE_LIMIT_WINDOW_MS=60000

# Logging
LOG_LEVEL=DEBUG                         # DEBUG, INFO, WARN, ERROR, CRITICAL
LOG_DIR=./logs

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## Troubleshooting

### "Cannot find package 'redis'"

**Solution:**
```bash
cd server
npm install redis
npm ci
```

### "Redis connection refused"

**Check if Redis is running:**
```bash
# Local
redis-cli ping

# Docker
docker exec flipboard-redis redis-cli ping
```

**Start Redis:**
```bash
# Local
redis-server

# Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### "ECONNREFUSED on http://localhost:3001"

**Check if server is running:**
```bash
curl http://localhost:3001/health/live
```

**Start server:**
```bash
npm run server:dev
```

### High Memory Usage

**Check logs:**
```bash
tail -f logs/$(date +%Y-%m-%d).log | grep "memory"
```

**Increase Node heap:**
```bash
NODE_OPTIONS=--max-old-space-size=1024 npm run server:dev
```

### Slow Queries

**Apply database indexes:**
```bash
supabase db push
```

**Check query performance:**
```bash
curl http://localhost:3001/metrics | jq .
```

---

## Docker Development

### Using Docker Compose

```bash
# Build and start all services
docker-compose up

# In another terminal, run migrations
docker exec digitalflipboard-server npm run migrate

# Check health
curl http://localhost:3001/health/ready

# View logs
docker logs -f digitalflipboard-server
docker logs -f digitalflipboard-redis
```

### Building Server Image

```bash
docker build -t digitalflipboard:latest .
docker run -p 3001:3001 -e REDIS_URL=redis://redis:6379 digitalflipboard:latest
```

---

## Monitoring & Observability

### Health Checks

```bash
# Server alive?
curl http://localhost:3001/health/live

# Server ready to serve?
curl http://localhost:3001/health/ready

# Detailed metrics
curl http://localhost:3001/metrics | jq .
```

### Log Viewing

```bash
# View today's logs
tail -f logs/$(date +%Y-%m-%d).log

# Parse JSON logs
tail -f logs/*.log | jq .

# Filter by event
grep "message_sent" logs/*.log | jq .

# Filter by user
grep "user123" logs/*.log | jq .
```

### Rate Limiting

Check if client is rate limited:
```javascript
// In server logs
grep "rate_limit_exceeded" logs/*.log | jq .

// Expected output
{
  "message": "rate_limit_exceeded",
  "user_id": "user123",
  "retry_after_seconds": 30
}
```

---

## Performance Tuning

### Redis Optimization

```bash
# Monitor Redis memory
redis-cli info memory

# Clear cache if needed
redis-cli FLUSHDB

# Check connection count
redis-cli client list | wc -l
```

### Node.js Optimization

```bash
# Increase worker threads
NODE_OPTIONS=--max-workers=4 npm run server:dev

# Enable heap snapshots for memory leaks
node --inspect server/index.js
```

### Database Optimization

```bash
# Analyze tables
supabase sql "ANALYZE;"

# Check index usage
supabase sql "SELECT * FROM pg_stat_user_indexes ORDER BY idx_scan DESC;"
```

---

## Production Deployment

### Environment Setup

```env
# Production Redis (e.g., Upstash, Redis Cloud)
REDIS_URL=redis://:password@your-redis-host:6379
NODE_ENV=production
PORT=3001
```

### Health Checks for Load Balancers

```bash
# AWS ELB/ALB
curl -X GET http://localhost:3001/health/ready

# Kubernetes
livenessProbe:
  httpGet:
    path: /health/live
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 10
```

### Monitoring Tools

- **Logs:** CloudWatch, DataDog, Splunk
- **Metrics:** Prometheus, Grafana
- **Tracing:** Jaeger, DataDog APM
- **Alerts:** PagerDuty, Opsgenie

---

## Common Commands

```bash
# Development
npm run dev              # Start frontend
npm run server:dev       # Start backend with auto-reload

# Production
npm run build            # Build frontend
npm run server           # Start backend (production)

# Testing
npm run test             # Run tests (coming soon)

# Database
supabase db push         # Apply migrations
supabase db reset        # Reset database

# Monitoring
curl http://localhost:3001/health/ready
curl http://localhost:3001/metrics
tail -f logs/$(date +%Y-%m-%d).log | jq .
```

---

## Resources

- [Redis Documentation](https://redis.io/documentation)
- [Supabase Documentation](https://supabase.com/docs)
- [Socket.io Guide](https://socket.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)

---

## Support

For issues or questions:
1. Check logs: `logs/` directory
2. Test health: `GET /health/ready`
3. Check metrics: `GET /metrics`
4. Review documentation: This file and `INFRASTRUCTURE_IMPROVEMENTS.md`

---

**Last Updated:** November 26, 2025  
**Version:** 1.0.0
