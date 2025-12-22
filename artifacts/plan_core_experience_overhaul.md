# Plan - Core Experience Overhaul (Controller & Display)

## Goal
Redesign the core user experience (Controller and Display modes) to meet "Senior UI/UX" professional standards. This includes the message input interface, board settings, and the display's idle/connection states.

## Assumptions
- The underlying WebSocket and state management logic is sound.
- The "Teal/Slate/Glassmorphism" design system should be applied consistently.
- Mobile responsiveness is critical for the Controller mode.

## Files to Change
### Controller Mode
- `packages/web/src/components/ControllerView.jsx`: Main layout and navigation.
- `packages/web/src/components/control/MessageInput.jsx`: The primary interaction point.
- `packages/web/src/components/control/AnimationPicker.jsx`: Visual selection of animations.
- `packages/web/src/components/control/ColorThemePicker.jsx`: Visual selection of themes.
- `packages/web/src/components/control/SessionPairing.jsx`: The onboarding/pairing flow.

### Display Mode
- `packages/web/src/components/DisplayView.jsx`: Main layout and connection states.
- `packages/web/src/components/display/DigitalFlipBoardGrid.jsx`: The actual board rendering (if needed).

## Step Checklist
1.  [x] **Audit ControllerView**: Redesign the main controller layout with a professional "Remote Control" feel.
2.  [x] **Redesign SessionPairing**: Create a high-fidelity onboarding experience with clear instructions and visual feedback.
3.  [x] **Upgrade MessageInput**: Implement a more tactile and responsive input area with character counts and quick-send options.
4.  [x] **Enhance Pickers**: Redesign Animation and Color pickers with visual previews and smooth transitions.
5.  [x] **Audit DisplayView**: Improve the "Waiting for Connection" and "Idle" states of the display with professional motion graphics.
6.  [x] **Verify Responsiveness**: Ensure the controller works perfectly on mobile devices.

## Test Plan
- Verify pairing flow from both Controller and Display perspectives.
- Test message sending with various animations and themes.
- Check mobile layout on simulated devices.
- Ensure smooth transitions between connection states.

## Rollback Plan
- Revert to legacy components using Git.
