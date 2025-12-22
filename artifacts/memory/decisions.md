# Architectural Decisions Log

This document tracks durable architectural decisions, domain rules, and API assumptions for the Digital FlipBoard project.

## Decision: Monorepo Migration
- **Context**: The project grew from a simple React/Express app into a complex system with multiple frontends (Web, Display) and background services.
- **Decision**: Migrated to a monorepo structure using **Turbo** and **pnpm workspaces**.
- **Consequences**: 
    - Improved code sharing via `@flipboard/shared` and `@flipboard/ui`.
    - Unified build pipeline with Turbo.
    - Isolated dependencies per package.

## Decision: Redis-Backed Socket.io Scaling
- **Context**: Real-time message delivery must be reliable and scalable across multiple API instances.
- **Decision**: Implemented the **Socket.io Redis Adapter**.
- **Consequences**: 
    - Allows horizontal scaling of the `api` package.
    - Enables cross-instance broadcasting.
    - Requires a running Redis instance in all environments.

## Decision: Background Job Processing with Bull
- **Context**: Tasks like email delivery (Resend) and scheduled messages should not block the main API thread.
- **Decision**: Introduced the `worker` package using **Bull** and **Redis**.
- **Consequences**: 
    - Improved API responsiveness.
    - Reliable retries for failed jobs.
    - Decoupled email logic from the core API.

## Decision: Supabase PKCE Auth Flow
- **Context**: Need a secure, modern authentication flow that works well with SSR and various client environments.
- **Decision**: Adopted the **PKCE (Proof Key for Code Exchange)** flow for Supabase Auth.
- **Consequences**: 
    - Enhanced security against authorization code injection.
    - Consistent auth state management across `web` and `api`.

## Decision: Artifact-First Development Protocol
- **Context**: To maintain high quality and context awareness for AI agents and human developers.
- **Decision**: Mandated the creation of plan artifacts, logs, and reports for all non-trivial tasks.
- **Consequences**: 
    - Better traceability of changes.
    - Reduced "hallucination" or context loss during complex tasks.
    - Durable evidence of testing and visual changes.

## Decision: Zod for Payload Validation
- **Context**: API endpoints and WebSocket events need strict schema validation to prevent malformed data.
- **Decision**: Standardized on **Zod** for all schema definitions.
- **Consequences**: 
    - Type-safe validation on both client and server.
    - Automatic error reporting for invalid payloads.

## Decision: Senior UI/UX Design System
- **Context**: The user requested a professional, high-fidelity redesign of the entire platform.
- **Decision**: Adopted a **Teal/Slate/Glassmorphism** design language using Tailwind CSS and Framer Motion.
- **Consequences**:
    - Unified visual identity across `web` and `display` packages.
    - Professional "Command Center" aesthetic for administrative tools.
    - Smooth, animated transitions for all UI state changes.

## Decision: Admin Suite Overhaul
- **Context**: Legacy administrative tools were functional but lacked professional polish and data density.
- **Decision**: Redesigned all 10 major Admin components using the **Sidebar-Detail** and **Tabbed Engine** patterns.
- **Consequences**:
    - Improved administrative efficiency with real-time telemetry.
    - Consistent management experience across Users, Roles, and Sessions.
    - High-fidelity financial and activity audit trails.

## Decision: Active Design Tracking in Store
- **Context**: The `EnhancedGridEditor` needs to know the metadata (ID, name) of the design being edited, but `currentDesign` was only storing the layout array.
- **Decision**: Added `activeDesign` to `useDesignStore` to store the full design object from Supabase.
- **Consequences**: 
    - Enables "Save" (update) functionality for existing designs.
    - Allows "Cast" to include design metadata for better tracking.
    - Decouples the raw layout array from the design metadata.

## Decision: Hybrid WebSocket + HTTP Strategy
- **Context**: WebSocket connections can be unstable in some environments (e.g., corporate firewalls).
- **Decision**: Implemented a hybrid strategy where 90% of traffic is WebSocket and 10% is HTTP polling for fallback and heartbeats.
- **Consequences**: 
    - Improved reliability and uptime.
    - Heartbeats every 10s via HTTP ensure display health is tracked even if WebSocket drops.
    - Polling every 30s as a fallback for status updates.

## Decision: Display Pairing Logic (No Auto-Connect)
- **Context**: Displays were auto-connecting to WebSockets immediately upon code generation, causing confusing "Connected" states before a controller was actually paired.
- **Decision**: Displays now wait for an explicit pairing event from a controller before establishing a WebSocket connection.
- **Consequences**: 
    - Clearer UI states: "Waiting for Setup" -> "Waiting for Controller" -> "Connected".
    - Reduced unnecessary WebSocket connections.

## Decision: Smart Designer 2.0 (Direct Manipulation)
- **Context**: Cell-by-cell editing was high-friction for long messages.
- **Decision**: Implemented a "Magic Input" for real-time grid population and "Word-Block Dragging" for semantic repositioning.
- **Consequences**: 
    - Significantly reduced time-to-design for users.
    - Improved UX by treating text as semantic blocks rather than individual cells.
    - Enhanced visual fidelity with skeuomorphic "flip-disc" styling.

## Decision: Circular Dependency Resolution via Dynamic Imports
- **Context**: `authStore`, `designStore`, and `sessionStore` had circular references that caused initialization deadlocks and "not a function" errors (e.g., `fetchVersions`).
- **Decision**: Moved static imports to dynamic `await import()` calls within store actions.
- **Consequences**: 
    - Resolved runtime `TypeError` during store initialization.
    - Improved module loading reliability.
    - Enabled stores to be initialized independently of their dependencies.

## Decision: Robust Store Initialization Pattern
- **Context**: Standard object-based store creation in Zustand was prone to syntax errors and lacked visibility into initialization.
- **Decision**: Refactored stores to use a functional initialization pattern with internal logging.
- **Consequences**: 
    - Added visibility into store lifecycle via console logs.
    - Ensured all actions are correctly attached before the store is returned.
    - Reduced risk of corrupted store files during edits.
