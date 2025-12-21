# Plan: Durable History Persistence

## Goal
Ensure that session message history is preserved even after a session expires in Redis. This is achieved by archiving the history to Supabase before the Redis keys are deleted.

## Architecture
- **Worker**: Listens for Redis `expired` events. When a session expires, it fetches the message history from Redis and inserts it into the `session_history` table in Supabase.
- **API**: When history is requested, it first checks Redis. If Redis is empty, it queries the `session_history` table in Supabase to provide archived messages.

## Files to Change
- `supabase/migrations/013_session_history.sql`: New table for archived history.
- `packages/worker/src/index.ts`: Added archiving logic to the cleanup handler.
- `packages/api/src/index.js`: Pass Supabase client to `MessageHistoryService`.
- `packages/api/src/messageHistory.js`: Update `getHistory` to fallback to Supabase.

## Step Checklist
1. [x] Create Supabase migration for `session_history`.
2. [x] Update Worker to archive history on session expiration.
3. [x] Update API to initialize `MessageHistoryService` with Supabase.
4. [x] Update `MessageHistoryService` to fallback to Supabase archive.
5. [ ] Verify archiving with a test script.

## Test Plan
- Create a session and add several messages.
- Set a short TTL on the session key.
- Wait for expiration.
- Verify that the `session_history` table in Supabase contains the messages.
- Request history for the expired session via the API and verify it returns the archived messages.

## Rollback Plan
- Revert changes to `messageHistory.js` and `worker/src/index.ts`.
- The system will continue to function but history will be lost after 24h/expiration.
