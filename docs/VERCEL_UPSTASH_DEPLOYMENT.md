# Digital FlipBoard - Vercel + Upstash Redis Deployment Guide

## Overview

This guide covers deploying the Digital FlipBoard project to Vercel with Upstash Redis as the backend data store.

**Architecture:**
- **Frontend**: React + Vite → Vercel Static Site
- **Backend**: Express.js → Vercel Serverless Functions (`/api` routes)
- **Database**: Supabase PostgreSQL
- **Cache/Sessions**: Upstash Redis
- **Real-time**: Socket.io (via Vercel Serverless)

## Prerequisites

1. **Vercel Account** - https://vercel.com
2. **Upstash Account** - https://console.upstash.io
3. **Supabase Project** - https://supabase.com
4. **GitHub Repository** - Connected to Vercel

## Step 1: Set Up Upstash Redis

### 1.1 Create Redis Database

1. Go to [Upstash Console](https://console.upstash.io)
2. Click **Create Database**
3. Configure:
   - **Name**: `digital-flipboard-prod`
   - **Region**: Same as your Vercel deployment region (recommended: `us-east-1`)
   - **Type**: Redis
4. Copy the connection string (format: `redis://default:password@host:port`)

### 1.2 Database Details

You'll need:
- **Redis URL**: `redis://default:PASSWORD@HOST:PORT`
- **Connection Host**: `host.upstash.io`
- **Port**: `PORT_NUMBER`

Keep these credentials secure!

## Step 2: Configure Environment Variables on Vercel

### 2.1 Add Environment Variables to Vercel Project

In Vercel Dashboard → Project Settings → Environment Variables, add:

```
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:YOUR_PORT

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_key

RESEND_API_KEY=re_your_key
FROM_EMAIL=noreply@yourdomain.com

GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-domain.com
FRONTEND_URL=https://your-frontend.vercel.app
API_URL=https://your-api.vercel.app

MAGIC_LINK_SECRET=your-secret-key
NODE_ENV=production
```

**Recommended**: Set environment variables separately for staging and production branches.

## Step 3: Update Package.json Scripts

Ensure your `package.json` has these scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "server": "node server/index.js",
    "server:dev": "nodemon server/index.js",
    "server:install": "cd server && npm install"
  }
}
```

## Step 4: Update Server Configuration for Vercel

The backend has been updated to work with Vercel's serverless environment:

### 4.1 Key Changes

1. **API Routes** are in `/api` directory
2. **Express app** is exported for serverless execution
3. **Redis client** uses environment `REDIS_URL` (Upstash)
4. **Socket.io** configured for serverless with proper CORS

### 4.2 Redis Connection

The Redis configuration automatically uses:
- `REDIS_URL` environment variable (Upstash URL)
- Connection pooling with reconnection strategy
- Automatic fallback for local development (redis://localhost:6379)

## Step 5: Deploy to Vercel

### 5.1 Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Select your GitHub repository
4. Click **Import**

### 5.2 Configure Build Settings

- **Build Command**: `npm run build && npm run server:install`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 5.3 Deploy

Click **Deploy** and wait for the deployment to complete.

## Step 6: Verify Deployment

### 6.1 Check Frontend

Visit your Vercel project URL (e.g., `https://your-project.vercel.app`)

### 6.2 Check Backend API

Test the API endpoints:

```bash
# Health check
curl https://your-project.vercel.app/api/health

# Auth endpoints
curl https://your-project.vercel.app/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6.3 Check Redis Connection

Check Vercel logs:

```bash
vercel logs --prod
```

Look for confirmation:
```
✅ Connected to Redis
🟢 Redis client is ready
```

## Step 7: Configure CORS for Production

Update `ALLOWED_ORIGINS` in Vercel environment variables:

```
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app,https://www.yourdomain.com
```

## Monitoring & Troubleshooting

### View Logs

```bash
# Real-time logs
vercel logs --tail

# Production logs
vercel logs --prod

# Specific function logs
vercel logs api --prod
```

### Common Issues

#### 1. Redis Connection Timeout

**Symptoms**: `Redis connection failed` in logs

**Solutions**:
- Verify `REDIS_URL` is correct in Vercel environment variables
- Check Upstash Redis database is active (console.upstash.io)
- Ensure IP whitelisting allows Vercel (usually automatic with Upstash)

#### 2. CORS Errors

**Symptoms**: `CORS not allowed for origin` in logs

**Solutions**:
- Update `ALLOWED_ORIGINS` in Vercel environment
- Ensure frontend URL matches exactly (including protocol)

#### 3. Socket.io Connection Issues

**Symptoms**: Websocket connection fails in browser console

**Solutions**:
- Verify `FRONTEND_URL` matches deployed frontend
- Check that Socket.io server is running
- Enable WebSocket support (usually enabled by default on Vercel)

#### 4. Serverless Function Timeout

**Symptoms**: `504 Gateway Timeout` errors

**Solutions**:
- Increase timeout in `vercel.json` (current: 60 seconds)
- Optimize database queries
- Check Redis performance (Upstash dashboard)

## Performance Optimization

### 1. Redis Optimization

- Use Upstash **Pro** plan for higher throughput
- Monitor command latency in Upstash console
- Enable caching for frequently accessed data

### 2. Serverless Function Optimization

- Keep functions under 50MB
- Optimize dependencies (remove dev dependencies from production)
- Use connection pooling for database

### 3. Frontend Optimization

- Current build size: ~1.8MB (gzipped: ~400KB)
- Tree-shaking reduces bundle by ~30%
- Static assets cached with 1-year expiration

## Scaling Considerations

### Current Limits

- **Vercel**: Up to 3000 concurrent functions (Pro plan)
- **Upstash**: Depends on plan (Redis Free: 10MB, Pro: unlimited)
- **Supabase**: Based on subscription tier

### Scaling Plan

1. **Database**: Upgrade Upstash plan if hitting throughput limits
2. **Functions**: Monitor function execution time; optimize slow queries
3. **Frontend**: Static files are cached globally on Vercel CDN

## Security Considerations

### 1. Environment Variables

✅ **Good**:
- Secrets stored in Vercel environment variables
- Not committed to Git (check `.gitignore`)
- Rotated regularly

❌ **Bad**:
- Hardcoded secrets in code
- Committed `.env` files
- Public API keys in client code

### 2. CORS Configuration

- Only allow trusted origins
- Credentials enabled for same-origin requests
- Review `ALLOWED_ORIGINS` regularly

### 3. Redis Security

- Upstash provides encryption in transit (TLS)
- Use strong passwords (auto-generated by Upstash)
- Don't expose Redis URL to client

## Maintenance & Updates

### Regular Tasks

- **Weekly**: Monitor Upstash dashboard for performance
- **Monthly**: Review Vercel logs for errors/warnings
- **Quarterly**: Update dependencies (`npm update`)

### Deployment Updates

```bash
# Make changes locally
git add .
git commit -m "your changes"
git push origin main

# Vercel auto-deploys on push to main
# Check deployment: https://vercel.com/dashboard
```

## Rollback Procedure

1. Go to Vercel Dashboard → Project → Deployments
2. Find previous stable deployment
3. Click **Promote to Production**

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Upstash Docs**: https://upstash.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Socket.io + Serverless**: https://socket.io/docs/v4/deployment/

## Next Steps

1. ✅ Set up Upstash Redis
2. ✅ Configure Vercel environment variables
3. ✅ Deploy to Vercel (auto-deployment on push)
4. ✅ Verify deployment and logs
5. ✅ Monitor performance
6. ✅ Plan for scaling
