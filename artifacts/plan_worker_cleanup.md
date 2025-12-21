# Plan: Worker Package & Session Cleanup (Redis Keyspace Notifications)

## Goal
Implement a background worker to handle session lifecycle events, specifically cleaning up transient data (presence, history) when a session expires in Redis.

## Assumptions
- Redis is configured to allow keyspace notifications (`notify-keyspace-events Ex`).
- Sessions are stored with a TTL in Redis (e.g., `session:<code>`).
- The worker will run as a separate process in the monorepo.

## Files to Create/Change
- `packages/worker/package.json`: Define dependencies (redis, dotenv, logger).
- `packages/worker/src/index.js`: Entry point for the worker.
- `packages/worker/src/redis.js`: Redis client setup with keyspace notification support.
- `packages/worker/src/handlers/sessionCleanup.js`: Logic for cleaning up session-related keys.
- `packages/api/src/redisPubSub.js`: (Optional) Add support for system-wide events if not already present.
- `packages/api/src/index.js`: Ensure it listens for cleanup events to disconnect sockets.

## Step Checklist
1. [ ] Initialize `packages/worker/package.json`.
2. [ ] Create Redis client utility in worker.
3. [ ] Implement keyspace notification listener for `__keyevent@0__:expired`.
4. [ ] Implement cleanup logic for `presence:<code>` and `history:<code>`.
5. [ ] Add "session:expired" broadcast to notify API instances.
6. [ ] Update API `index.js` to handle the broadcast and disconnect relevant Socket.io clients.

## Test Plan
- Create a session with a short TTL (e.g., 10 seconds).
- Verify that `presence` and `history` keys are deleted automatically after 10 seconds.
- Verify that Socket.io clients receive a disconnect/expired event.

## Rollback Plan
- Disable the worker process.
- Revert changes to API `index.js`.
