# Plan - Fix Pairing Code Layout

Goal: Show the pairing code on the line below "DISPLAY CODE" on the flip-board grid.

## Proposed Changes

### 1. `packages/web/src/components/display/DigitalFlipBoardGrid.jsx`
- Update the message processing logic to support explicit line breaks (`\n`).
- Alternatively, add a specific split rule for "DISPLAY CODE" to ensure the code follows on a new line.
- I will implement `\n` support as it's more generic and useful.

### 2. `packages/web/src/pages/Display.jsx`
- Update the `overrideMessage` prop for `DigitalFlipBoardGrid` to include a newline: `DISPLAY CODE\n${sessionCode}`.

## Step Checklist
- [ ] Modify `DigitalFlipBoardGrid.jsx` to handle `\n` in `messageToShow`.
- [ ] Modify `Display.jsx` to use `\n` in the pairing code message.
- [ ] Verify the layout in the UI.

## Test Plan
- Refresh the Display page.
- Observe the pairing code layout.
- It should show "DISPLAY CODE" centered on one line and the code centered on the line immediately below it.
