# Plan: Fix Message Delivery and LAN Connectivity

## Goal
Ensure messages sent from a controller (especially on a different device on the same network) are correctly received and displayed by the Display application.

## Assumptions
- The user is accessing the app via the host's IP address (e.g., `http://192.168.1.5:5173`).
- The backend is running on port 3001.
- WebSockets might be blocked or failing on some mobile browsers, so the HTTP fallback (Redis Pub/Sub polling) must work perfectly.

## Files to Change
1. `packages/web/src/pages/Display.jsx`: Fix the sync logic between `useMessageBroker` and the session store.
2. `packages/web/src/components/admin/SessionManagement.jsx`: Remove hardcoded `localhost:3001`.
3. `packages/shared/src/constants/index.ts`: Remove hardcoded `localhost:3001`.
4. `packages/web/src/services/websocketService.js`: Ensure it uses the correct protocol and hostname for LAN. (Already looks mostly correct, but I'll double-check).

## Step Checklist
- [ ] Update `Display.jsx` to call `setMessage` when `brokerState` updates.
- [ ] Update `SessionManagement.jsx` to use `import.meta.env.VITE_API_URL || ''`.
- [ ] Update `shared/src/constants/index.ts` to use dynamic resolution.
- [ ] Verify `MessageInput.jsx` sends consistent field names to both WebSocket and HTTP.

## Test Plan
- [ ] Ask user to test message delivery from phone to display.
- [ ] Check console for any remaining `NetworkError` or `404` errors.
- [ ] Verify Admin panel works on LAN.

## Rollback Plan
- Revert changes to `Display.jsx` and `SessionManagement.jsx`.
