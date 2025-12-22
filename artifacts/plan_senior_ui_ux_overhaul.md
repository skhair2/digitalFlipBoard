# Plan - Senior UI/UX Responsive Overhaul

## Goal
Transform the Digital FlipBoard UI into a professional, responsive, and high-fidelity experience that feels designed by a senior UI/UX engineer.

## Tasks

### 1. Fix Icon Errors
- Replace non-existent `EraserIcon` with `BackspaceIcon`.
- Replace non-existent `PaintRollerIcon` with `AdjustmentsHorizontalIcon`.

### 2. Responsive Layout (Mobile-First)
- **Global Header**: Ensure it's compact on mobile and informative on desktop.
- **Designer (EnhancedGridEditor)**:
    - On mobile: Sidebars should be collapsible or transformed into bottom sheets/tabs.
    - On desktop: Maintain the 3-pane IDE layout but with better spacing and "glassmorphism" effects.
- **Control Page**: Ensure the tab content area scales correctly.

### 3. Animations & Transitions
- Use `framer-motion` for:
    - Page transitions.
    - Sidebar/Drawer slide-ins.
    - Button hover/active states (subtle scaling).
    - Grid cell updates (subtle fade/pop).

### 4. Typography & Visual Polish
- Implement a consistent spacing scale.
- Use "Inter" or "Geist" font (via Google Fonts or system stack).
- Add subtle shadows and borders for depth.
- Ensure all text is legible and has proper contrast.

### 5. Component Sizing
- Use `clamp()` for font sizes and padding where appropriate.
- Ensure the grid canvas is always centered and fits the viewport.

## Implementation Steps
1. Fix icons in `EnhancedGridEditor.jsx`.
2. Update `Control.jsx` for better mobile responsiveness and animations.
3. Refactor `EnhancedGridEditor.jsx` to use `framer-motion` and responsive sidebars.
4. Add global styles for typography and animations.
