# Plan: Auto-Generate Pairing Code for Display

## Goal
Remove the manual "Generate Pairing Code" button on the Display screen and make it auto-generate a code on mount. This improves the user experience by making the display ready for pairing immediately.

## Assumptions
- The "unwanted auto-connection" issue mentioned in comments is manageable or less important than the UX improvement.
- Redis session registration is lightweight enough to handle auto-generation on every mount/refresh.

## Files to Change
- `packages/web/src/pages/Display.jsx`:
  - Update `useEffect` to auto-generate code.
  - Remove the "Waiting for Setup" UI state.
  - Ensure the code is registered with the backend.

## Step Checklist
1. [ ] Modify `Display.jsx` to include `registerSession` in the auto-generation logic.
2. [ ] Remove the conditional rendering that shows the "Generate Pairing Code" button.
3. [ ] Verify that the display shows the code immediately on load.
4. [ ] Verify that the controller can still pair using this code.

## Test Plan
- Open the Display app: It should show a code immediately without clicking any button.
- Open the Controller app: Enter the code and verify connection.
- Refresh the Display: It should generate a new code (or keep the old one if we want persistence, but usually new is fine for a fresh display session).

## Rollback Plan
- Revert changes to `Display.jsx` to restore the manual button.
