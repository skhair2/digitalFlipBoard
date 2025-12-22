# Plan: Smart Designer 2.0 Implementation

## Goal
Transform the Designer into a user-friendly, direct-manipulation tool with a "Magic Input", word-block dragging, and hardware-realistic UI.

## Files to Change
- `packages/web/src/utils/textLayouts.js`: Update `createBoardState` to return a 1D array and improve wrapping.
- `packages/web/src/components/designer/EnhancedGridEditor.jsx`: 
    - Add "Magic Input" field.
    - Implement word detection logic.
    - Add drag-and-drop support for words.
    - Update cell styling for skeuomorphic look.
- `packages/web/src/index.css`: Add global animations/styles for the "Split" effect if needed.

## Step Checklist
1. [x] **Refactor `textLayouts.js`**:
    - Change `createBoardState` to return a 1D array of `{ char, color }`.
    - Improve word-wrapping logic.
2. [x] **Update `EnhancedGridEditor.jsx` UI**:
    - Add a text input at the top of the canvas.
    - Add "Quick Layout" buttons (Center, Clear, Border).
3. [x] **Implement Word Detection**:
    - Create a helper to identify contiguous characters in the 1D array.
4. [x] **Implement Drag-and-Drop**:
    - Use `framer-motion` or native drag events to move word blocks.
5. [x] **Skeuomorphic Styling**:
    - Update the cell rendering to include the "hinge" line and gradients.
6. [x] **Responsive Overhaul**:
    - Remove horizontal scrolling.
    - Reorganize settings to maximize canvas space.
7. [x] **Bug Fixes**:
    - Fix accidental painting on hover by defaulting to 'move' tool.

## Test Plan
- Type in the Magic Input and verify the grid updates.
- Drag a word to a different row and verify it moves correctly.
- Check the visual appearance on different screen sizes.
- Verify undo/redo still works with the new input method.

## Rollback Plan
- Revert changes to `EnhancedGridEditor.jsx` and `textLayouts.js`.
