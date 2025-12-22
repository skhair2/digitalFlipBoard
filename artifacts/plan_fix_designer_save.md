# Plan: Fix Designer Save Functionality and UI/UX Refinement

## Goal
Resolve the critical bugs preventing users from saving designs in the Designer and ensure the UI/UX meets senior standards for responsiveness and functionality.

## Assumptions
- The `ReferenceError: toast is not defined` is caused by `react-hot-toast` missing from `packages/web/package.json`.
- The `401 Unauthorized` error is caused by an invalid Supabase session in `OAuthCallbackDirect.jsx` (using Google access token instead of Supabase JWT).
- The UI/UX overhaul is mostly complete but needs functional stability.

## Files to Change
- `packages/web/package.json`: Add missing dependencies (`react-hot-toast`, `clsx`, `@heroicons/react`, `@headlessui/react`).
- `packages/web/src/pages/OAuthCallbackDirect.jsx`: Fix OAuth session flow using `signInWithIdToken`.
- `packages/web/src/store/authStore.js`: Robust initialization and session sync.
- `packages/web/src/components/designer/EnhancedGridEditor.jsx`: Ensure all imports and references are correct.

## Step Checklist
1. [x] Update `packages/web/package.json` with missing dependencies.
2. [x] Fix `OAuthCallbackDirect.jsx` to use `supabase.auth.signInWithIdToken`.
3. [x] Refactor `authStore.js` `initialize` to rely on Supabase's native session persistence.
4. [x] Verify `EnhancedGridEditor.jsx` imports and logic.
5. [ ] (Optional) Run a build to ensure no lint/type errors.

## Test Plan
- Verify that `toast` notifications appear when actions are performed in the Designer.
- Verify that saving a design no longer returns a 401 error.
- Verify that the session persists after a page refresh.

## Rollback Plan
- Revert changes to `OAuthCallbackDirect.jsx` and `authStore.js`.
- Remove added dependencies from `package.json`.
