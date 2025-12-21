# Deployment Strategy

## Infrastructure Requirements
- **Node.js**: v18+ for all packages.
- **Redis**: Required for Socket.io scaling (Redis Adapter), rate limiting, and background jobs (Bull).
- **Supabase**: Required for authentication and PostgreSQL database.

## Deployment Targets
- **Frontend (`web`, `display`)**: Optimized for **Vercel**.
  - Configuration: `vercel.json` in the root.
  - Environment variables must be set in the Vercel dashboard.
- **Backend (`api`, `worker`)**: Can be deployed to any Node.js environment (e.g., Railway, Render, AWS, DigitalOcean).
  - **Docker**: A `docker-compose.yml` is provided for containerized deployment.
  - **Scaling**: The `api` package is horizontally scalable thanks to the Redis Socket.io adapter.

## Pre-Deployment Checklist
1. **Environment Variables**: Ensure all `.env` variables are set for the target environment (Supabase URL/Key, Redis URL, Stripe Keys, etc.).
2. **CORS**: Update `ALLOWED_ORIGINS` in the `api` package to include the production frontend domains.
3. **Build**: Run `pnpm build:monorepo` to verify all packages compile correctly.
4. **Tests**: Run `cd packages/api && pnpm test` to ensure the hybrid strategy and core logic are functional.

## Production Monitoring
- **Logging**: The `api` package uses a custom logger (`logger.js`) that should be integrated with a log management service.
- **Analytics**: **Mixpanel** tracks user interactions and feature usage.
- **Health Checks**: The API provides health check endpoints (see `packages/api/src/healthCheck.js`).
