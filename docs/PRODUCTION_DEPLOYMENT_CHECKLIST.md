# Digital FlipBoard - Production Deployment Checklist

**Last Updated:** November 22, 2025  
**Version:** 1.0  
**Status:** Ready for Production

---

## ✅ Pre-Deployment Verification (Do This First)

### Code Review
- [ ] All 10 security vulnerabilities documented and fixed
- [ ] No console.error or console.log of sensitive data
- [ ] No hardcoded API keys or tokens anywhere
- [ ] All imports are present (check Character.jsx)
- [ ] No VITE_ prefixed API keys exist
- [ ] `.env.local` does not contain Resend API key

**Verification Command:**
```bash
grep -r "VITE_RESEND\|apiKey\|secret\|password" src/ | grep -v node_modules
# Should return nothing or only safe strings
```

### Security Files Check
- [ ] `server/auth.js` exists and implements authentication
- [ ] `server/validation.js` exists with Zod schemas
- [ ] `server/rateLimiter.js` exists with rate limiting
- [ ] `server/.env.example` exists with instructions
- [ ] All 4 security modules in place

**Verification Command:**
```bash
ls -la server/auth.js server/validation.js server/rateLimiter.js
```

### Dependencies Check
- [ ] No known vulnerabilities: `npm audit`
- [ ] All packages up to date: `npm outdated`
- [ ] Production build succeeds: `npm run build`

**Verification Commands:**
```bash
npm audit
npm run build
npm list --depth=0  # Check main dependencies
```

---

## 🔧 Environment Configuration

### 1. Backend Environment Setup

```bash
cd server
cp .env.example .env
```

**Required Variables in `server/.env`:**
```env
# Core Settings
NODE_ENV=production
PORT=3001

# Database & Auth
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Email Service (🔴 CRITICAL - MUST BE SET)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# CORS Configuration
ALLOWED_ORIGINS=https://flipdisplay.online,https://www.flipdisplay.online

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=10
RATE_LIMIT_WINDOW_MS=60000

# Logging
LOG_LEVEL=info
```

**Checklist:**
- [ ] RESEND_API_KEY set (from Resend dashboard)
- [ ] SUPABASE credentials set
- [ ] ALLOWED_ORIGINS includes your domain(s)
- [ ] NODE_ENV set to `production`
- [ ] No secrets in version control (file in `.gitignore`)

### 2. Frontend Environment Setup

**`.env.local` should have:**
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_WEBSOCKET_URL=wss://api.flipdisplay.online  # or your domain
VITE_API_URL=https://api.flipdisplay.online      # or your domain
VITE_APP_URL=https://flipdisplay.online
VITE_MIXPANEL_TOKEN=xxxxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

**Checklist:**
- [ ] VITE_WEBSOCKET_URL points to production server
- [ ] VITE_API_URL points to production server
- [ ] VITE_APP_URL matches your production domain
- [ ] No VITE_RESEND_API_KEY present
- [ ] All URLs use HTTPS (not HTTP)

### 3. Verify No Exposed Secrets

```bash
# Frontend should have no Resend or service role keys
grep -r "Resend\|SERVICE_ROLE\|re_" src/
# Should return nothing sensitive

# Check what will be bundled
npm run build
grep -r "Resend\|SERVICE_ROLE\|re_" dist/
# Should return nothing sensitive
```

---

## 🚀 Build & Deployment

### Step 1: Production Build
```bash
# Frontend build
npm run build

# Verify build succeeds
ls -la dist/  # Should show index.html and assets

# Verify no sensitive data in build
npm run build && grep "RESEND\|SERVICE_ROLE" dist/**/*.js
# Should return nothing
```

**Checklist:**
- [ ] Build completes without errors
- [ ] No sensitive keys in `dist/` folder
- [ ] Bundle size reasonable (~300-400KB)
- [ ] Sourcemaps disabled in production (security)

### Step 2: Server Deployment

#### Option A: Vercel (Recommended for Node.js)
```bash
# 1. Push code to GitHub
git add .
git commit -m "Security: implement hardening fixes"
git push

# 2. Go to vercel.com and import project
# 3. Set environment variables:
#    - All variables from server/.env
#    - NOT including secrets from .env

# 4. Deploy
vercel --prod
```

#### Option B: Heroku
```bash
# 1. Install Heroku CLI
npm install -g heroku

# 2. Create app
heroku create your-app-name

# 3. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set RESEND_API_KEY=re_xxxxx
heroku config:set SUPABASE_URL=https://xxxxx.supabase.co
# ... set all variables

# 4. Deploy
git push heroku main
```

#### Option C: Self-Hosted (AWS, GCP, Azure)
```bash
# 1. SSH to server
ssh user@your-server.com

# 2. Clone repository
cd /app
git clone https://github.com/yourusername/digitalflipboard.git
cd digitalflipboard/server

# 3. Install and configure
npm install
cp .env.example .env
# Edit .env with your values
nano .env

# 4. Start with PM2 (process manager)
npm install -g pm2
pm2 start index.js --name "flipboard-server"
pm2 save
pm2 startup

# 5. Set up reverse proxy (Nginx)
# Configure Nginx to proxy to localhost:3001
# Enable HTTPS with Let's Encrypt
sudo certbot certonly --standalone -d api.flipdisplay.online
```

### Step 3: Frontend Deployment

#### Option A: Vercel (Recommended)
```bash
# 1. In Vercel dashboard, import frontend repo
# 2. Set environment variables from .env.local
# 3. Deploy
vercel --prod
```

#### Option B: Netlify
```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Build and deploy
netlify deploy --prod

# 3. Configure environment variables in Netlify dashboard
```

#### Option C: Static Hosting (S3 + CloudFront)
```bash
# 1. Build
npm run build

# 2. Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# 3. Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id XXXXX --paths "/*"
```

**Checklist:**
- [ ] Frontend deployed and accessible
- [ ] Backend/server deployed and accessible
- [ ] Environment variables set on hosting platform
- [ ] HTTPS enabled on both frontend and backend
- [ ] Domain DNS pointing to correct servers

---

## 🔒 Security Verification After Deployment

### 1. Security Headers Check
```bash
# Check all security headers present
curl -I https://api.flipdisplay.online | grep -E "X-|Strict-Transport|Content-Security"

# Expected output should include:
# - X-Frame-Options: DENY
# - X-Content-Type-Options: nosniff
# - X-XSS-Protection: 1; mode=block
# - Strict-Transport-Security (if HTTPS)
# - Content-Security-Policy (if production)
```

✅ **Verification:**
- [ ] X-Frame-Options present
- [ ] X-Content-Type-Options present
- [ ] X-XSS-Protection present
- [ ] Strict-Transport-Security present
- [ ] Content-Security-Policy present (production)

### 2. HTTPS Verification
```bash
# Check SSL certificate
curl -I https://api.flipdisplay.online
# Should show 200/301, not connection errors

# Check certificate expiry
openssl s_client -connect api.flipdisplay.online:443 -servername api.flipdisplay.online | grep -A 2 "verify OK"

# Check HTTPS redirect
curl -I http://api.flipdisplay.online
# Should redirect to HTTPS (301/302)
```

✅ **Verification:**
- [ ] HTTPS works without certificate errors
- [ ] HTTP redirects to HTTPS
- [ ] Certificate valid (not self-signed)
- [ ] Certificate doesn't expire soon

### 3. CORS Verification
```bash
# Test CORS from different origin
curl -H "Origin: https://evil.com" \
  -H "Access-Control-Request-Method: POST" \
  https://api.flipdisplay.online

# Should return 403 or no CORS headers

# Test CORS from correct origin
curl -H "Origin: https://flipdisplay.online" \
  -H "Access-Control-Request-Method: POST" \
  https://api.flipdisplay.online

# Should return 200 with CORS headers
```

✅ **Verification:**
- [ ] Requests from unauthorized origins rejected
- [ ] Requests from your domain accepted
- [ ] CORS headers only on allowed origins

### 4. Authentication Verification
```bash
# Test invalid token
curl -X POST https://api.flipdisplay.online/api/send-email \
  -H "Authorization: Bearer invalid-token"

# Should return 401 Unauthorized

# Test valid token
curl -X POST https://api.flipdisplay.online/api/send-email \
  -H "Authorization: Bearer YOUR_VALID_JWT_TOKEN"

# Should return 400 (missing body) or success
```

✅ **Verification:**
- [ ] Invalid tokens rejected with 401
- [ ] Valid tokens accepted
- [ ] No sensitive data in error messages

### 5. Rate Limiting Verification
```javascript
// In browser console, connect to socket and send messages
const socket = io('wss://api.flipdisplay.online', {
    auth: { token: sessionToken, sessionCode: 'TEST' }
})

// Send 11 messages
for (let i = 0; i < 11; i++) {
    socket.emit('message:send', {
        sessionCode: 'TEST',
        content: `Message ${i}`
    }, (response) => {
        console.log(`Message ${i}:`, response)
    })
}

// 11th message should show rate limit error
```

✅ **Verification:**
- [ ] Messages 1-10 succeed
- [ ] Message 11+ shows rate limit error
- [ ] Limit resets after 60 seconds

### 6. Input Validation Verification
```javascript
// Test invalid session code
socket.emit('message:send', {
    sessionCode: 'INVALID_CODE_TOO_LONG_!!!',
    content: 'Test'
}, (response) => {
    console.log(response)
    // Should show validation error
})

// Test message too long
socket.emit('message:send', {
    sessionCode: 'TEST',
    content: 'A'.repeat(1001)  // > 1000 chars
}, (response) => {
    console.log(response)
    // Should show validation error
})
```

✅ **Verification:**
- [ ] Invalid session codes rejected
- [ ] Messages > 1000 chars rejected
- [ ] Invalid animation types rejected
- [ ] Error messages returned to client

---

## 🧪 End-to-End Testing

### Functional Test
```bash
# 1. Open https://flipdisplay.online in browser
# 2. Log in with test account
# 3. Generate session code on control page
# 4. Enter code on display page
# 5. Send message from control → should appear on display
# 6. Verify message displays correctly
```

✅ **Verification:**
- [ ] Login works with Supabase
- [ ] Session code generation works
- [ ] Messages transmit in real-time
- [ ] No console errors
- [ ] Animations display smoothly

### Security Test
```bash
# 1. Test XSS attempt in message
message = '<img src=x onerror="alert(1)">'
# Should display as text, not execute

# 2. Test SQL injection (if applicable)
# Should be handled by Supabase RLS

# 3. Try to access other user's data
# Should be blocked by RLS policies

# 4. Monitor network tab for exposed credentials
# Should see no API keys or secrets
```

✅ **Verification:**
- [ ] No XSS execution
- [ ] No SQL injection
- [ ] No unauthorized data access
- [ ] No credentials in network requests

---

## 📊 Monitoring & Logging

### Set Up Application Monitoring
```bash
# Option 1: Sentry for error tracking
npm install --save @sentry/node
# Configure in server/index.js

# Option 2: LogRocket for session replay
npm install --save logrocket
# Configure in frontend

# Option 3: Simple Winston logging
npm install --save winston
# Configure in server
```

### Set Up Alerts
```bash
# Create alerts for:
# - 5+ authentication failures in 5 minutes
# - 50+ rate limit violations in 1 minute
# - Server error rate > 5%
# - Response time > 2 seconds
# - Memory usage > 80%
# - Database connection errors
```

**Checklist:**
- [ ] Error tracking configured
- [ ] Alerts set up for critical issues
- [ ] Logging enabled and monitoring
- [ ] Performance tracking enabled

---

## 🔄 Post-Deployment Tasks

### Day 1
- [ ] Verify all URLs work correctly
- [ ] Test login flow end-to-end
- [ ] Monitor error logs for issues
- [ ] Test socket connections
- [ ] Verify emails are being sent (if applicable)
- [ ] Check analytics integration

### Week 1
- [ ] Monitor performance metrics
- [ ] Review security logs
- [ ] Check for failed authentication attempts
- [ ] Verify rate limiting is working
- [ ] Monitor database queries
- [ ] Test backup and recovery

### Month 1
- [ ] Review security audit logs
- [ ] Check dependency updates
- [ ] Performance optimization
- [ ] User feedback review
- [ ] Capacity planning
- [ ] Security penetration testing

### Ongoing
- [ ] Monthly security updates
- [ ] Quarterly penetration tests
- [ ] Regular backup verification
- [ ] Dependency updates
- [ ] Performance monitoring
- [ ] User security training

**Checklist:**
- [ ] Monitoring dashboard set up
- [ ] Alert thresholds configured
- [ ] On-call rotation established
- [ ] Incident response plan ready
- [ ] Documentation up to date

---

## 🚨 Rollback Procedure

If something goes wrong after deployment:

### For Frontend
```bash
# Deploy previous version
vercel rollback
# or
git revert <commit-hash>
git push
# Redeploy
```

### For Backend
```bash
# Stop current version
pm2 stop flipboard-server
# or
heroku ps:stop web

# Deploy previous version
git revert <commit-hash>
git push heroku main
# or
git checkout <previous-version>
pm2 restart flipboard-server
```

### Recovery Checklist
- [ ] Previous version deployed
- [ ] Services restarted
- [ ] Monitoring showing normal metrics
- [ ] Users notified of issue
- [ ] Root cause documented
- [ ] Fix tested before redeployment

---

## 📋 Final Deployment Checklist

### Environment & Secrets
- [ ] All environment variables set
- [ ] No hardcoded secrets in code
- [ ] Secrets in `server/.env` (not in version control)
- [ ] Environment properly labeled (production)
- [ ] Database backups configured

### Code Quality
- [ ] No security vulnerabilities (npm audit)
- [ ] No console.log of sensitive data
- [ ] All imports present and correct
- [ ] No VITE_RESEND_API_KEY anywhere
- [ ] Production build succeeds

### Deployment
- [ ] Frontend deployed and accessible
- [ ] Backend deployed and accessible
- [ ] HTTPS enabled on both
- [ ] DNS configured correctly
- [ ] Email service tested

### Security
- [ ] Security headers verified
- [ ] CORS properly configured
- [ ] Rate limiting working
- [ ] Authentication verified
- [ ] Input validation verified

### Monitoring
- [ ] Error tracking enabled
- [ ] Alerts configured
- [ ] Logging enabled
- [ ] Performance monitoring active
- [ ] Backup system tested

### Documentation
- [ ] Deployment documented
- [ ] Emergency procedures documented
- [ ] Incident response plan ready
- [ ] Team trained on security
- [ ] README updated with production info

---

## ✅ Sign-Off

**Deployment By:** ___________________  
**Date:** ___________________  
**Environment:** Production  
**Status:** ✅ Ready for Production

---

**For questions or issues, refer to:**
- `SECURITY_IMPLEMENTATION_COMPLETE.md` - Implementation details
- `SECURITY_QUICK_REFERENCE.md` - Quick troubleshooting
- `.github/copilot-instructions.md` - Architecture overview
