# Security Implementation

## 1. Authentication
- **Provider**: Supabase Auth.
- **Flow**: PKCE (Proof Key for Code Exchange) for enhanced security.
- **Verification**: The API server verifies JWT tokens during the Socket.io handshake and for protected REST routes.

## 2. Authorization (RLS)
- **Mechanism**: PostgreSQL Row Level Security (RLS).
- **Policies**: Users can only read/write data (boards, profiles, designs) that they own or have been explicitly shared with them.

## 3. API Security
- **CORS**: Strict whitelist-based origin validation. Allowed origins are configured via the `ALLOWED_ORIGINS` environment variable.
- **Rate Limiting**: Redis-backed rate limiting prevents brute-force attacks and API abuse.
- **Input Validation**: All incoming payloads (HTTP and WebSocket) are validated against **Zod** schemas to prevent XSS and injection attacks.

## 4. Infrastructure
- **API Keys**: Critical keys (Resend, Stripe, Supabase Service Role) are stored exclusively on the server and never exposed to the client.
- **Environment Variables**: Managed per-package to ensure isolation.
