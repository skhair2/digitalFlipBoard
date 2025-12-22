# Plan: Final Admin Suite Overhaul

Goal: Redesign the remaining Admin components to match the high-fidelity "Senior UI/UX" design system (Teal/Slate, Framer Motion, Sidebar-Detail layout).

## Components to Redesign

### 1. Activity Log (`ActivityLog.jsx`)
- **Goal**: Professional audit trail with status badges and event icons.
- **Layout**: 12-column grid with a detailed event sidebar.
- **Features**:
  - Event type filtering (User, System, Security).
  - Search by admin or target user.
  - Detailed JSON view for event metadata.

### 2. Content Moderation (`MessageLog.jsx`)
- **Goal**: Real-time message monitoring with moderation controls.
- **Layout**: Feed-style layout with board context.
- **Features**:
  - Auto-refresh toggle with visual countdown.
  - Board owner details.
  - Quick moderation actions (Delete, Flag).

### 3. Global Settings (`GlobalSettings.jsx`)
- **Goal**: Clean, organized configuration interface.
- **Layout**: Sectioned cards with high-fidelity toggles and inputs.
- **Features**:
  - Maintenance mode control.
  - Global announcement editor.
  - Registration toggles.
  - Audit trail of setting changes.

### 4. Invoice Ledger (`InvoiceLedger.jsx`)
- **Goal**: Financial monitoring dashboard.
- **Layout**: Metric cards + detailed transaction table.
- **Features**:
  - Revenue metrics (MRR, ARPU).
  - Stripe invoice links.
  - Customer email filtering.

### 5. Coupon Management (`AdminCouponManagement.jsx`)
- **Goal**: Advanced promotional toolset.
- **Layout**: Tabbed interface (Generate, Manage, Templates, Analytics).
- **Features**:
  - Bulk generation.
  - Usage analytics.
  - Template system.

### 6. Session Management (`SessionManagement.jsx`)
- **Goal**: Low-level socket/session monitoring.
- **Layout**: Grid/List view toggle.
- **Features**:
  - Real-time client counts.
  - Session health indicators.
  - Force-disconnect controls.

## Implementation Strategy
1. **ActivityLog & MessageLog**: Focus on event visualization and filtering.
2. **GlobalSettings**: Focus on form UX and safety (confirmation modals).
3. **InvoiceLedger**: Focus on financial clarity and Stripe integration.
4. **Coupon & Session Management**: Handle large file refactors with care, preserving complex logic while upgrading the UI.

## Quality Gates
- Mobile responsiveness for all tables and sidebars.
- Consistent use of `framer-motion` for transitions.
- Error handling and loading states for all async operations.
- Proper icon usage from `heroicons/24/outline`.
