# Plan: Responsive Controller Design

## Goal
Make the controller (Control.jsx) responsive so it uses the full space of the display and adjusts the layout accordingly.

## Assumptions
- The user wants the controller to expand on larger screens (desktops/tablets) while remaining usable on mobile.
- The `max-w-2xl` constraint in `Control.jsx` is the primary bottleneck.
- The `Tab.List` might need to be more flexible.

## Files to Change
- `packages/web/src/pages/Control.jsx`: Remove `max-w-2xl`, adjust container classes, and potentially reorganize the layout for larger screens.
- `packages/web/src/components/designer/EnhancedGridEditor.jsx`: Ensure it handles the extra space well (it already has some grid logic).

## Step Checklist
1. [ ] Modify `Control.jsx` to use a wider container (e.g., `max-w-7xl` or no max-width with padding).
2. [ ] Update `Control.jsx` layout to use a two-column layout on larger screens (e.g., sidebar for tabs or settings).
3. [ ] Make `Tab.List` responsive (e.g., scrollable or vertical on large screens).
4. [ ] Verify the layout on different screen sizes.

## Test Plan
- Open the controller on a desktop browser and resize the window.
- Verify that the content expands to fill the space.
- Verify that the layout remains functional on mobile.

## Rollback Plan
- Revert changes to `Control.jsx`.
