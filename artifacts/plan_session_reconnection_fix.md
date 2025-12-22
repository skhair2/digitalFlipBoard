# Plan - Session Reconnection Fix

## Goal
Allow controllers to reconnect to their paired sessions without encountering the "already being controlled by another device" error, specifically for guest users.

## Assumptions
- The issue is caused by the backend's inability to distinguish between the same guest browser and a different guest browser.
- `localStorage` is an acceptable place to store a persistent device identifier.

## Files to Change
- `packages/web/src/services/sessionService.js`: Add device ID generation and inclusion in API calls.
- `packages/api/src/routes/sessions.js`: Update pairing logic to store and verify device IDs.

## Step Checklist
1. [x] Research the error message and locate the failing logic.
2. [x] Implement `getDeviceId` in the frontend service.
3. [x] Update the `pairSession` API call to include `deviceId`.
4. [x] Update the backend `pairSession` route to handle `deviceId`.
5. [x] Refine the idempotency check to support `userId`, `deviceId`, and legacy sessions.
6. [x] Verify the fix.

## Test Plan
- Pair a display as a guest.
- Refresh the controller page.
- Click "Continue with [code]".
- Verify that it connects successfully instead of showing an error.
- Try to connect with the same code from a different browser (incognito) and verify it is blocked.

## Rollback Plan
- Revert changes in `sessionService.js` and `sessions.js`.
- The `deviceId` in `localStorage` can remain as it is harmless.
