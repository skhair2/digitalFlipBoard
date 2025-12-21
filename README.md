# Digital FlipBoard

Transform any screen into a stunning split-flap message board. Control from your phone, display on your TV. No hardware required.

##  Features

- **Split-Flap Display**: Realistic split-flap animation and sound effects.
- **Remote Control**: Control the display from your mobile phone or any browser.
- **Real-time Updates**: Messages update instantly using WebSockets (Socket.io).
- **Customizable**: Choose from various color themes and animations.
- **Monorepo Architecture**: Scalable and modular codebase using Turbo and pnpm.
- **Premium Features**: Designer, Collections, Version History, and Sharing.

##  Monorepo Structure

This project is organized as a monorepo under the `packages/` directory:

- **`web`**: The Controller application (React + Vite).
- **`display`**: The Display application (React + Vite).
- **`api`**: Express backend with Socket.io for real-time communication.
- **`worker`**: Background job processor (Bull + Redis) for async tasks.
- **`shared`**: Shared TypeScript types, constants, and utilities.
- **`ui`**: Shared React UI components (Tailwind + Framer Motion).

##  Data Flow

1.  **Control  API**: The `web` app sends message updates and configuration changes to the `api` via Socket.io.
2.  **API  Display**: The `api` validates the request, applies rate limits, and broadcasts the update to all clients in the session room (primarily the `display` app).
3.  **Persistence**: Critical state (user profiles, saved boards) is persisted in **Supabase**, while transient session data and rate limits are managed in **Redis**.

##  Getting Started

### 1. Prerequisites

- **Node.js** (v18+)
- **pnpm** (v8+)
- **Redis** (Required for Socket.io scaling and background jobs)

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Each package has its own `.env.local` or `.env` file. Refer to the `.env.example` files in each package:

- `packages/web/.env.local`
- `packages/display/.env.local`
- `packages/api/.env.local`
- `packages/worker/.env.local`

### 4. Start the Application

Run all services in parallel using Turbo:

```bash
pnpm dev:monorepo
```

Or start specific services:

```bash
# Start only the API
pnpm server:dev

# Start only the Web Controller
cd packages/web && pnpm dev
```

##  Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Zustand.
- **Backend**: Node.js, Express, Socket.io, Redis.
- **Database & Auth**: Supabase (PostgreSQL + RLS).
- **Infrastructure**: Turbo (Build System), pnpm (Package Manager).
- **Payments**: Stripe.
- **Analytics**: Mixpanel.

##  Security & Quality

- **Row Level Security (RLS)**: Enforced on Supabase to protect user data.
- **CORS**: Strict origin validation in production.
- **Rate Limiting**: Redis-backed rate limiting for API and WebSocket events.
- **Auth**: Supabase Auth with PKCE flow.
- **Artifact-First Development**: We follow a strict artifact-first protocol for all non-trivial changes. See [.github/copilot-instructions.md](.github/copilot-instructions.md) for details.

##  Deployment

- **Frontend**: Optimized for deployment on **Vercel** (see `vercel.json`).
- **Backend/Worker**: Can be containerized using the provided `docker-compose.yml`.

##  Mission

For more details on the project's goals and success criteria, see [mission.md](./mission.md).
