# Implementation Report: Premium Pairing & Account Integration

## Changes Made

### Backend (API)
- **`packages/api/src/auth.js`**: Added `getUserProfile(userId)` to fetch user subscription data from Supabase.
- **`packages/api/src/displaySessionLogger.js`**: Added `countActiveSessions(userId)` to track concurrent displays.
- **`packages/api/src/routes/sessions.js`**:
    - Updated `pairSession` to enforce tier-based limits (Free: 1, Pro: 5, Enterprise: 20).
    - Linked sessions to `board_id` and `display_user_id` in Supabase.
    - Broadcasted `userTier` and `boardId` to connected clients.

### Frontend (Web)
- **`packages/web/src/services/boardService.js`**: Created new service to fetch user boards.
- **`packages/web/src/services/sessionService.js`**: Updated `pairSession` to accept `boardId`.
- **`packages/web/src/store/sessionStore.js`**: Updated `setSessionCode` to persist `boardId`.
- **`packages/web/src/components/control/SessionPairing.jsx`**:
    - Added board selection UI during pairing for authenticated users.
    - Fetches user boards on mount if logged in.
    - Passes selected `boardId` to the pairing endpoint.

## Verification Steps
1. **Free User Pairing**:
    - Log in as a free user.
    - Pair a display.
    - Verify it works and shows up in `display_sessions`.
    - Attempt to pair a second display; verify it fails with a "limit reached" error.
2. **Board Linking**:
    - Create multiple boards in the dashboard.
    - Go to the pairing screen.
    - Verify you can select which board to link the display to.
    - Verify the display shows the content of the selected board.

## Known Limitations
- The `maxDisplays` limits are currently hardcoded in the API (`1`, `5`, `20`). These should ideally be fetched from the `subscription_plans` table in the future.
- "Enterprise" tier is assumed to have a limit of 20; this can be adjusted.
