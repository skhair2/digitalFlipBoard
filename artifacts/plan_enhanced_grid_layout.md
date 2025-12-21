# Plan - Enhanced Grid Responsiveness and Message Layout

Goal: Improve the digital flip-board grid to automatically detect screen size and optimize message layout based on content.

## Proposed Changes

### 1. `packages/web/src/components/display/DigitalFlipBoardGrid.jsx`
- **Dynamic Grid Sizing**: Refine the logic for `defaultRows` and `defaultCols` to better fill various screen aspect ratios (mobile, tablet, desktop, ultrawide).
- **Smart Message Splitting**:
    - Implement a more advanced `splitToLines` that handles long words (breaking them if they exceed `cols`).
    - Add logic to "balance" lines so they have similar lengths when possible.
    - Improve vertical centering to account for the actual number of lines used.
- **Content-Aware Density**: (Optional/Subtle) Slightly adjust grid density if the message is exceptionally long or short, while maintaining a "physical board" feel.

### 2. `packages/web/src/hooks/useScreenResolution.js`
- Ensure `calculateOptimalCharSize` correctly handles all edge cases for aspect ratios.

## Step Checklist
- [ ] Update `DigitalFlipBoardGrid.jsx` with improved `splitToLines`.
- [ ] Refine `defaultRows` and `defaultCols` calculation.
- [ ] Test with various message lengths (short, medium, long, very long words).
- [ ] Test with different screen sizes (simulated via browser dev tools).

## Test Plan
- **Short Message**: "HELLO" -> Should be centered and large.
- **Long Message**: "THIS IS A VERY LONG MESSAGE THAT SHOULD WRAP MULTIPLE LINES AUTOMATICALLY" -> Should wrap cleanly and be centered.
- **Long Word**: "SUPERCALIFRAGILISTICEXPIALIDOCIOUS" -> Should break across lines if it exceeds column count.
- **Mobile View**: Should have fewer columns and more rows to fit the portrait aspect ratio.
- **Ultrawide View**: Should have many columns to fill the width.
