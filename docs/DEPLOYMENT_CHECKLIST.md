# Vercel + Upstash Redis Deployment Checklist

## Pre-Deployment Setup (One-time)

### Upstash Redis Setup
- [ ] Create Upstash account at https://console.upstash.io
- [ ] Create Redis database (choose same region as Vercel)
- [ ] Copy Redis URL (redis://default:PASSWORD@HOST:PORT)
- [ ] Keep credentials secure (add to password manager)

### Vercel Project Setup
- [ ] Vercel project is linked to GitHub repository
- [ ] Project settings configured:
  - [ ] Build Command: `npm run build && npm run server:install`
  - [ ] Output Directory: `dist`
  - [ ] Node version: 18.x or 20.x

### Environment Variables on Vercel
Set these in Vercel Dashboard → Settings → Environment Variables:

**Critical (Required for production)**
- [ ] `REDIS_URL` - From Upstash (format: redis://default:PASSWORD@HOST:PORT)
- [ ] `SUPABASE_URL` - Your Supabase project URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - From Supabase Dashboard
- [ ] `ALLOWED_ORIGINS` - Your domain (https://your-domain.com)
- [ ] `FRONTEND_URL` - Frontend URL (https://your-frontend.vercel.app)

**Important (Functional)**
- [ ] `RESEND_API_KEY` - From https://resend.com/api-keys
- [ ] `FROM_EMAIL` - Your email sender address
- [ ] `STRIPE_SECRET_KEY` - From Stripe Dashboard (if using payments)
- [ ] `STRIPE_WEBHOOK_SECRET` - From Stripe (if using payments)
- [ ] `GOOGLE_CLIENT_ID` - From Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` - From Google Cloud Console

**Optional**
- [ ] `MAGIC_LINK_SECRET` - For magic link authentication
- [ ] `LOG_LEVEL` - Set to "info" for production

## Pre-Deployment Verification

### Local Testing
```bash
# Install dependencies
npm install
npm run server:install

# Build frontend
npm run build

# Test backend locally with Upstash Redis
export REDIS_URL="redis://default:PASSWORD@HOST:PORT"
npm run server:dev

# Test API endpoints
curl http://localhost:3001/api/health
```

### Code Quality
- [ ] Run linter: `npm run lint` (0 errors)
- [ ] Run build: `npm run build` (successful, no warnings)
- [ ] No secrets in code (check with `git log -p`)
- [ ] `.env` files in `.gitignore`

## Deployment Process

### Initial Deployment
1. [ ] Ensure all changes are committed: `git status` (clean)
2. [ ] Push to GitHub: `git push origin main`
3. [ ] Monitor Vercel deployment:
   - Go to https://vercel.com/dashboard
   - Watch build progress
   - Check logs if errors occur

### Post-Deployment Verification
- [ ] Frontend loads successfully (https://your-project.vercel.app)
- [ ] API health check passes: `/api/health`
- [ ] Redis connection successful (check Vercel logs for ✅)
- [ ] CORS configured correctly (test cross-origin request)
- [ ] Environment variables are set (check "Environment" in Vercel)

### Testing Features
- [ ] User authentication works (login with email/Google)
- [ ] Session creation and pairing works
- [ ] Messages send and display correctly
- [ ] Real-time updates work (Socket.io connected)
- [ ] Error handling displays properly

## Ongoing Monitoring

### Daily Checks
- [ ] Monitor Vercel dashboard for failed deployments
- [ ] Check error rates in logs: `vercel logs --prod --tail`

### Weekly Checks
- [ ] Review Upstash Redis metrics (console.upstash.io)
- [ ] Check Vercel function execution times
- [ ] Monitor database query performance

### Monthly Checks
- [ ] Review security audit logs
- [ ] Update dependencies: `npm update`
- [ ] Backup important data
- [ ] Review cost (Upstash, Vercel, Stripe)

## Troubleshooting Commands

### View Logs
```bash
# Real-time production logs
vercel logs --prod --tail

# Specific function logs
vercel logs api --prod

# Last 50 lines
vercel logs --prod | tail -50
```

### Test Redis Connection
```bash
# From Upstash console:
# 1. Click "CLI" tab
# 2. Run: PING
# Expected: PONG
```

### Restart Deployment
```bash
# Redeploy current commit
vercel redeploy

# Or push a new commit to GitHub
git commit --allow-empty -m "chore: trigger redeployment"
git push origin main
```

### Check Environment Variables
```bash
# View configured variables (masked)
vercel env ls
```

## Rollback Procedure

If deployment fails:
1. Go to Vercel Dashboard → Deployments
2. Find last successful deployment
3. Click the deployment
4. Click "Promote to Production"

Or manually:
```bash
git revert HEAD
git push origin main
```

## Important Notes

⚠️ **Security**
- Never commit `.env` files
- Rotate API keys monthly
- Monitor Redis for unauthorized access
- Enable Vercel 2FA

⚠️ **Performance**
- Monitor Upstash throughput limits
- Watch function execution time (target < 5s)
- Cache frequently accessed data

⚠️ **Costs**
- Upstash: Free tier = 10MB database
- Vercel: Free tier = unlimited functions, 100GB bandwidth
- Budget for scaling as needed

## Support Links

- Vercel Status: https://www.vercel-status.com
- Upstash Status: https://status.upstash.io
- Vercel Docs: https://vercel.com/docs
- Upstash Docs: https://upstash.com/docs

## Completed Setup Notes

Date Configured: December 8, 2025

✅ Vercel.json updated with API routes
✅ Upstash Redis support configured
✅ Environment variables documented
✅ Deployment guide created
✅ CORS headers configured
✅ Serverless function configuration added

**Next Step**: Add environment variables to Vercel dashboard and redeploy
