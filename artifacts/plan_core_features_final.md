# Plan: Finalizing Core Features & Designer UX

## Goal
Complete the implementation of core features (scheduling, animations, library) and ensure the Designer is user-friendly and stable for premium users.

## Completed
- [x] **Designer Stability**: Fixed `handleUndo` and `fetchVersions` errors.
- [x] **Version History**: Implemented `fetchVersions` and `restoreDesignVersion` in `designStore.js`.
- [x] **Enhanced Scheduling**: 
    - Added `layout` and `metadata` columns to `scheduled_messages`.
    - Updated `worker` to process full layouts.
    - Updated `Scheduler.jsx` UI to allow scheduling current designs.
- [x] **Premium Offline Access**: Allowed premium users to design without pairing.
- [x] **Designer UX**: Added drag-to-paint, eraser, fill tools, and keyboard shortcuts.

## Remaining Tasks
- [ ] **Automated Channels**: Implement "Channels" (Weather, Stocks) as requested in the mission.
- [ ] **PWA Manifest**: Ensure the app is installable as a PWA.
- [ ] **Final Verification**: Test the end-to-end flow of scheduling a design and seeing it appear on the display.

## Files Changed
- `packages/web/src/store/designStore.js`
- `packages/web/src/store/boardStore.js`
- `packages/web/src/components/designer/VersionHistory.jsx`
- `packages/web/src/components/control/Scheduler.jsx`
- `packages/worker/src/scheduler.ts`
- `supabase/migrations/012_enhanced_scheduling.sql`

## Test Plan
1. **Version History**: Save a design, make changes, save again. Verify previous versions appear in the history tab and can be restored.
2. **Scheduling**: Schedule a design for 1 minute in the future. Verify the worker picks it up and sends the full layout to the display.
3. **Offline Mode**: Log in as premium, go to Designer without pairing. Verify you can design and save.
