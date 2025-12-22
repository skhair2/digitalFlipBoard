# Plan: Full-screen Layout Fix

Goal: Ensure the display grid takes up the entire screen in full-screen mode, hiding the navigation bar.

## Assumptions
- The full-screen mode is triggered via a button or API call in the `display` package.
- The navigation bar is likely a global component or part of the main layout that needs to be conditionally hidden.
- The grid layout needs to be responsive to the container size.

## Files to Change
- `packages/display/src/App.tsx` (or equivalent main entry point)
- `packages/display/src/components/DisplayGrid.tsx` (or equivalent grid component)
- Possibly a layout component in `packages/display/src/layouts/`

## Step Checklist
1. [ ] Identify the full-screen trigger and state management.
2. [ ] Modify the layout to hide the navigation bar when in full-screen mode.
3. [ ] Ensure the display grid container expands to `100vh` and `100vw`.
4. [ ] Test the transition between normal and full-screen modes.

## Test Plan
- Open the display application.
- Enter full-screen mode.
- Verify the navigation bar is gone.
- Verify the grid fills the entire screen.
- Exit full-screen mode and verify the navigation bar returns.

## Rollback Plan
- Revert changes to the layout and grid components.
