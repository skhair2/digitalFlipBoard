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

## Decision: CORS Whitelist Enforcement
- **Context**: Open CORS policies posed a security risk (DDoS/abuse).
- **Decision**: Enforced a strict whitelist-based CORS policy in production.
- **Consequences**: 
    - Only authorized domains (`flipdisplay.online`, etc.) can interact with the API.
    - Development origins are permitted only in non-production environments.
