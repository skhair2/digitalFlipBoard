# Plan: Controller Redesign & Smart Designer 2.0 Refinement

## Goal
Redesign the `Control.jsx` page for professional mobile/desktop responsiveness and refine the `EnhancedGridEditor.jsx` for a more semantic, icon-driven workflow.

## Assumptions
- Users want a "Senior UI/UX" feel with clear navigation.
- Mobile users benefit from a bottom navigation bar.
- Desktop users benefit from a sidebar with persistent status information.
- The "Magic Input" should be a deliberate action (manual apply).
- Word-based dragging is more intuitive than character-based dragging for messages.

## Files to Change
- `packages/web/src/pages/Control.jsx`: Implement responsive layout (Sidebar vs Bottom Nav).
- `packages/web/src/components/designer/EnhancedGridEditor.jsx`: Refine Magic Input, add Quick Icons, and enforce uppercase.
- `packages/web/src/components/control/MessageInput.jsx`: Remove fixed positioning to avoid mobile UI conflicts.

## Step Checklist
1. [x] Update `Control.jsx` with Heroicons and icon-aware tab metadata.
2. [x] Refactor `Control.jsx` JSX for dual-layout (Sidebar/Bottom Nav).
3. [x] Add "Status Card" to Desktop Sidebar in `Control.jsx`.
4. [x] Refactor `EnhancedGridEditor.jsx` to use manual Magic Input apply.
5. [x] Add `QuickIconToolbar` to `EnhancedGridEditor.jsx`.
6. [x] Implement "Word Dragging" logic in `EnhancedGridEditor.jsx`.
7. [x] Enforce uppercase in all designer inputs.
8. [x] Fix `MessageInput.jsx` positioning to be inline.

## Test Plan
- Verify mobile layout (< 1024px) shows bottom navigation.
- Verify desktop layout (>= 1024px) shows sidebar.
- Verify "Magic Input" only updates grid on "Apply" click or Enter.
- Verify dragging a character moves the entire word it belongs to.
- Verify quick icons correctly paint symbols onto the grid.

## Rollback Plan
- Revert `Control.jsx` to the previous 12-column grid layout.
- Revert `EnhancedGridEditor.jsx` to character-based dragging and auto-apply Magic Input.
