# Digital FlipBoard - Architecture Overview

## System Overview
Digital FlipBoard is a real-time, multi-tenant split-flap display platform. It uses a monorepo structure to manage multiple interconnected services and applications.

## Frontend Architecture

### 1. Web Controller (`packages/web`)
- **Role**: The administrative and user interface for managing boards.
- **State Management**: **Zustand** with persistence for session and auth state.
- **Real-time**: **Socket.io-client** for sending message updates.
- **Fallback**: Uses `useDisplayStatus` hook for HTTP polling (30s interval) and heartbeats (10s interval).
- **Auth**: **Supabase Auth** (PKCE flow) for user management.
- **Styling**: **Tailwind CSS** + **Framer Motion** for UI animations.

### 2. Display Application (`packages/display`)
- **Role**: The read-only rendering engine for the split-flap board.
- **Rendering**: Optimized React components simulating mechanical flip animations.
- **Real-time**: Listens for `message:received` events via Socket.io.
- **Pairing**: Does NOT auto-connect to WebSocket; waits for controller pairing.
- **State**: Minimal local state, primarily driven by incoming WebSocket payloads.

### 3. Shared UI (`packages/ui`)
- **Role**: Common React components used by both `web` and `display`.
- **Contents**: Buttons, Modals, and the core `DigitalFlipBoardGrid` component.

## Backend Architecture

### 1. API Server (`packages/api`)
- **Framework**: **Express.js** (Node.js).
- **Real-time**: **Socket.io** with a **Redis Adapter** (`redis-adapter.js`) for horizontal scaling.
- **Hybrid Strategy**: 
  - WebSocket (90%): Primary real-time channel.
  - HTTP (10%): Fallback polling and heartbeat endpoints in `routes/displays.js`.
- **Security**:
  - **CORS**: Strict origin validation.
  - **Rate Limiting**: Redis-backed limits on API and WebSocket events.
  - **Validation**: **Zod** schemas for all incoming payloads.
- **Services**:
  - `presenceTracking.js`: Tracks active users in session rooms.
  - `messageHistory.js`: Manages transient message logs.
  - `payments.js`: Integration with **Stripe** for premium features.

### 2. Background Worker (`packages/worker`)
- **Framework**: **Bull** (Redis-based queue).
- **Tasks**:
  - Email delivery via **Resend**.
  - Scheduled message processing.
  - Long-running maintenance tasks.

### 3. Shared Logic (`packages/shared`)
- **Role**: Single source of truth for types and constants.
- **Contents**: TypeScript interfaces, Socket.io event names, and shared utility functions.

## Data & Infrastructure

### 1. Database (Supabase/PostgreSQL)
- **Persistence**: User profiles, saved boards, and subscription data.
- **Security**: **Row Level Security (RLS)** ensures users only access their own data.

### 2. Real-time & Caching (Redis)
- **Socket.io Adapter**: Synchronizes WebSocket events across multiple API instances.
- **Rate Limiting**: Stores request counts for low-latency validation.
- **Job Queue**: Backs the Bull queues for the worker service.

## Data Flow Diagram (Conceptual)
`[Web Controller] --(Socket.io)--> [API Server] --(Broadcast)--> [Display App]`
`      |                             |                             ^`
`      +----(HTTPS/Auth)-----> [Supabase] <----(HTTPS/DB)---------+`
`                                    |`
`                             [Redis (Pub/Sub)]`
