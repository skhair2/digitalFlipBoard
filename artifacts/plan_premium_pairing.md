# Plan: Premium Pairing & Account Integration

## Goal
Tie display sessions to user accounts and boards, enforcing premium subscription tiers during pairing.

## Assumptions
- Users can have multiple "Boards" (saved configurations).
- A "Display Session" is a transient connection between a physical display and a controller.
- Premium users have higher limits (e.g., more concurrent displays, longer sessions).
- The "Lazy Connection" protocol is already in place.

## Files to Change
- `packages/api/src/routes/sessions.js`: Update `pairSession` to handle board linking and tier enforcement. (Partially done)
- `packages/web/src/components/control/SessionPairing.jsx`: Update UI to allow board selection during pairing.
- `packages/web/src/store/sessionStore.js`: Add `boardId` to the session state.
- `packages/api/src/displaySessionLogger.js`: Ensure it correctly logs the `board_id`.

## Step Checklist
1. [x] Update `packages/api/src/auth.js` with `getUserProfile`.
2. [x] Update `packages/api/src/routes/sessions.js` to fetch user tier and log to Supabase.
3. [ ] Update `packages/web/src/store/sessionStore.js` to support `boardId`.
4. [ ] Update `packages/web/src/components/control/SessionPairing.jsx` to fetch user boards and allow selection.
5. [ ] Implement tier-based limits in `packages/api/src/routes/sessions.js`.

## Test Plan
- Pair a display as a free user: Verify it works and logs to `display_sessions`.
- Pair a display as a pro user: Verify the `userTier` is correctly set to `pro`.
- Attempt to pair more displays than allowed by tier: Verify it fails with a clear error.

## Rollback Plan
- Revert changes to `sessions.js` and `SessionPairing.jsx`.
