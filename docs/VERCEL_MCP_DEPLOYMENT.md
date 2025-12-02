# Vercel MCP Deployment Guide

This repo now targets a dual deployment on Vercel:
- the **Vite frontend** is hosted as a static build (`dist/`).
- the **Node/Express backend** (WebSocket + Stripe APIs) runs inside Vercel's **MCP server** so it can stay alive and handle Socket.io traffic.

## 1. Static Frontend (Vite)
- `vercel.json` already tells Vercel to run `npm run build` and serve everything under `dist/`.
- When you import the project in the Vercel dashboard, keep the **Root Directory** at the repo root, and the Framework Preset set to `Other` so Vercel picks up `@vercel/static-build` automatically.
- Unless you override the build command, Vercel runs `npm run build` and publishes `dist/`. The SPA fallback is defined in `vercel.json` (`filesystem` handler + fallback to `/dist/index.html`).
- Confirm `VITE_API_URL` and `VITE_WEBSOCKET_URL` are set to your MCP server domain before deploying (see section 3). Otherwise the frontend will keep pointing at `localhost`.

## 2. MCP Backend (Express + Socket.io)
The backend cannot run as a serverless function because it maintains WebSocket rooms. Vercel MCP (`vercel mcp`) lets you deploy a long-lived Node process alongside the static site.

1. **Prepare the server directory:**
   - The `server/` folder already has a `package.json` with `start` (`node index.js`).
   - Ensure `server/package-lock.json` is up to date (`npm run server:install`).
2. **Create the MCP deployment:**
   - Use the Vercel CLI or dashboard to deploy an MCP process (name it `digital-flipboard-server` or similar).
   - Set the entrypoint to `server/index.js` and let Vercel run `npm run start` in that folder.
   - Configure the MCP to keep its `PORT` and `NODE_ENV` environment variables; the server already reads `process.env.PORT`.
3. **Environment variables required for the MCP server:**
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `REDIS_URL`
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `RESEND_API_KEY`, `FROM_EMAIL`
   - `VITE_API_URL` (set to the MCP server’s base URL)
   - Any other `VITE_*` overrides used by the frontend (e.g., `VITE_VOICE_BASE_URL` if added later).
4. **Billing & Webhooks:**
   - Point your Stripe webhook to `https://<mcp-domain>/api/payments/webhook` and supply the secret into `STRIPE_WEBHOOK_SECRET`.
   - MCP express server exposes all `/api/...` routes, so you can keep the same paths.

## 3. Connecting the two services
- After the MCP is deployed, note the root URL (e.g., `https://digital-flipboard-server.vercel.app`).
- Register that URL in Vercel’s Environment Variables for `VITE_API_URL` and `VITE_WEBSOCKET_URL`. 
- The static frontend will then call your MCP endpoints (`/api/*`, `/socket.io/`, `/payments/*`) using that base.

## 4. Local simulation before deploying
1. Start the backend: `npm run server:install && npm run server:dev`.
2. In another terminal run `npm run dev` for the frontend.
3. Set `VITE_API_URL`/`VITE_WEBSOCKET_URL` in a `.env.local` file or via `npm` script to point to `http://localhost:3001` when developing.
4. Once everything looks good, run `npm run build` and `vercel --prod` (for frontend) plus `vercel mcp deploy --prod` for the server.

## 5. Checklist before firing Vercel deploys
- [ ] `npm run build` completes locally (already part of CI).
- [ ] Server environment variables are synced into the MCP deployment.
- [ ] Stripe webhook, Supabase, Redis, and Redis rate limiters are reachable from the MCP.
- [ ] Frontend `VITE_API_URL` points to the MCP domain, not the internal port.
- [ ] The MCP service exposes the `/socket.io` namespace publicly so controllers and displays can pair.

With these pieces in place, the Vercel static deployment plus the MCP backend give you a production-ready Digital FlipBoard experience.