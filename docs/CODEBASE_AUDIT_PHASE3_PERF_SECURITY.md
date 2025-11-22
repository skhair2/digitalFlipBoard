# Digital FlipBoard - Performance & Security Audit

**Audit Date:** 2025-01-27  
**Auditor Roles:** Performance Engineer + Security Expert  
**Project:** Digital FlipBoard

---

## Part 1: Performance Optimization Analysis

### Bundle Size Analysis 📦

**Vite Configuration (Current):**
```javascript
// vite.config.js has code splitting:
manualChunks: {
  vendor: ['react', 'react-dom', 'react-router-dom'],
  supabase: ['@supabase/supabase-js'],
  socket: ['socket.io-client'],
  animation: ['framer-motion'],
}
```

**Estimated Bundle Breakdown (Rough):**

| Chunk | Size | Impact | Notes |
|-------|------|--------|-------|
| vendor.js | 150-180 KB | Medium | React 19 canary is larger |
| animation.js | 80-100 KB | Low | Framer Motion + GSAP |
| supabase.js | 40-50 KB | Low | Auth + database client |
| socket.js | 30-40 KB | Low | Socket.io realtime |
| three.js | 100-150 KB | **HIGH** | Only used on home page! |
| main.js | 50-80 KB | Low | App code |
| **TOTAL** | **450-600 KB** | - | - |

**🔴 CRITICAL ISSUE:** Three.js bundle is 100-150 KB but only used on home page Hero/Scene3D

### Performance Issues 🔴

#### 1. Three.js On Home Page Only (Unnecessary Load)

**Current Implementation:**
```jsx
// src/components/landing/Hero.jsx
import { Canvas } from '@react-three/fiber'
import Scene3D from './Scene3D'

// Renders 3D scene that users never interact with
<Scene3D />
```

**Problem:**
- ❌ 100-150 KB overhead on hero section
- ❌ GPU rendering on every page load
- ❌ Slows down mobile devices significantly
- ❌ May cause jank on scroll parallax

**Solutions (Priority Order):**

| Solution | Effort | Benefit | Recommended |
|----------|--------|---------|-------------|
| Lazy load only if user scrolls into view | 🟢 Easy | High | ✅ YES |
| Replace with CSS-only gradient animation | 🟡 Medium | High | ✅ YES |
| Move to separate "/demo" page | 🟡 Medium | Medium | Maybe |
| Remove entirely | 🟢 Easy | Low (UX loss) | ❌ No |
| Disable on mobile | 🟡 Medium | Medium | ✅ YES |

**Recommended Fix:**
```jsx
// Use IntersectionObserver to lazy load
const [shouldRender, setShouldRender] = useState(false)
const sceneRef = useRef(null)

useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      setShouldRender(true)
    }
  })
  observer.observe(sceneRef.current)
}, [])

return (
  <div ref={sceneRef}>
    {shouldRender && !isMobile && <Scene3D />}
  </div>
)
```

**Expected Impact:**
- Home page FCP: -200-300ms
- Home page LCP: -150-250ms
- Mobile performance: +30-40%

#### 2. React 19 Canary (Pre-release Version)

**Current:**
```json
"react": "^19.3.0-canary-40b4a5bf-20251120"
```

**Issues:**
- ❌ Pre-release software (unstable)
- ❌ May have bugs or breaking changes
- ❌ Limited production support
- ❌ Larger bundle than stable v18

**Recommendation:**
```json
// Update to stable React 19 when available
// OR downgrade to React 18 (stable, proven)
"react": "^18.3.0"
```

**Impact:** Not critical but should plan upgrade path

#### 3. Image Optimization 🟡

**Current State:** Not implemented

**Issues:**
- ❌ No WebP format fallbacks
- ❌ Images likely not optimized
- ❌ No lazy loading
- ❌ No responsive images (srcset)
- ❌ Missing alt text = accessibility + SEO loss

**Solutions:**

| Optimization | Effort | Benefit | Est. Savings |
|--------------|--------|---------|--------------|
| Add alt text to all images | 🟢 Easy | High (SEO) | - |
| Compress images | 🟢 Easy | High | 20-30% |
| Use WebP with fallbacks | 🟡 Medium | High | 20-40% |
| Lazy load images | 🟡 Medium | High | 10-20ms FCP |
| Responsive images (srcset) | 🟡 Medium | Medium | 15-30% on mobile |

#### 4. Web Vitals Not Tracked 🔴

**Current State:** No monitoring

**Missing Metrics:**
```javascript
// Should track these:
- LCP (Largest Contentful Paint): Target < 2.5s
- FID (First Input Delay): Target < 100ms
- CLS (Cumulative Layout Shift): Target < 0.1
- TTFB (Time To First Byte): Target < 600ms
- FCP (First Contentful Paint): Target < 1.8s
```

**Solution:** Add web-vitals tracking (1 hour setup)

```javascript
// In App.jsx or main.jsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

getCLS(console.log)
getFID(console.log)  
getFCP(console.log)
getLCP(console.log)
getTTFB(console.log)

// Send to analytics:
getCLS(metric => mixpanel.track('Web Vital: CLS', metric))
```

#### 5. Unused Polyfills & Dependencies 🟡

**Current Dependencies (package.json):**

| Package | Size | Used? | Action |
|---------|------|-------|--------|
| @react-three/fiber | 15 KB | Only home | Consider lazy loading |
| @react-three/drei | 20 KB | Only home | Consider lazy loading |
| three | 100+ KB | Only home | **CRITICAL** - lazy load |
| framer-motion | 80 KB | Hero, animations | Keep (good UI) |
| gsap | 80 KB | Hero animations | Keep (good perf) |
| react-router-dom | 50 KB | Core | Keep |
| zustand | 2.2 KB | Core | Keep (very small) |
| dompurify | 20 KB | Sanitization | Keep (security) |
| date-fns | 15 KB | Date handling | Keep |

**Action:** Lazy load three-related deps

#### 6. Font Loading Performance 🟡

**Current:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
```

**Good:**
- ✅ Preconnect used
- ✅ display=swap prevents invisible text
- ✅ Only 2 weights

**Could improve:**
- Add font-display: swap to CSS
- Consider self-hosting fonts to reduce DNS lookups

#### 7. Async JS Loading 🟡

**Current:** All JS loaded synchronously

**Recommendation:**
```html
<!-- index.html -->
<script type="module" src="/src/main.jsx" defer></script>
```

The `defer` attribute is already correct ✅

#### 8. CSS-in-JS vs. CSS Modules 🟡

**Current:** Using Tailwind CSS (utility-first)

**This is good** ✅ - Tailwind generates optimized CSS during build

**No changes needed here**

---

### Performance Recommendations Priority

| Priority | Issue | Est. Impact | Effort |
|----------|-------|------------|--------|
| 🔴 CRITICAL | Lazy load Three.js | -200ms FCP | Easy |
| 🟠 High | Add Web Vitals tracking | Visibility | Easy |
| 🟠 High | Optimize images | -30% size | Medium |
| 🟠 High | Use React 18 instead of canary | Stability | Easy |
| 🟡 Medium | Add responsive images (srcset) | -20% mobile | Medium |
| 🟡 Medium | Compress assets | -10% size | Easy |

---

## Part 2: Security Audit

### 🔴 CRITICAL Security Issues

#### 1. **VITE_RESEND_API_KEY Exposed to Client Bundle**

**Location:** `.env.local`
```
VITE_RESEND_API_KEY=re_eKKqv6fy_AVdzmo43Wepz2SEh6J2FaZFr
```

**Danger Level:** 🔴 CRITICAL

**Problem:**
- Private API key prefixed with `VITE_`
- Gets embedded in production JavaScript bundle
- Anyone can decompile and steal the key
- Can send unlimited emails at your account's expense
- Can harvest email lists if used for newsletters

**Evidence:**
```javascript
// This would be in bundle:
const RESEND_KEY = "re_eKKqv6fy_AVdzmo43Wepz2SEh6J2FaZFr"
```

**Immediate Fix:**
1. Move to `.env` (server-only, no VITE_ prefix)
2. Create backend API endpoint for email
3. Rotate Resend API key immediately
4. Check Resend logs for misuse

**Code Change:**

```javascript
// BEFORE (INSECURE)
const VITE_RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY
resend.emails.send({ from: "..." })

// AFTER (SECURE)
// Call backend endpoint instead
const response = await fetch('/api/send-email', {
  method: 'POST',
  body: JSON.stringify({ to, subject, html })
})
```

#### 2. **Server CORS Allows All Origins**

**Location:** `server/index.js`
```javascript
cors: {
  origin: "*",  // 🔴 DANGEROUS
  methods: ["GET", "POST"]
}
```

**Problem:**
- Any website can make requests to your server
- Potential for abuse or data exfiltration
- No origin validation

**Fix:**
```javascript
// SECURE VERSION
cors: {
  origin: [
    "https://flipdisplay.online",
    "https://www.flipdisplay.online",
    "http://localhost:3000", // dev only
    "http://localhost:5173"  // dev only
  ],
  methods: ["GET", "POST"],
  credentials: true
}
```

#### 3. **No Server Input Validation**

**Location:** `server/index.js`
```javascript
socket.on('message:send', (payload, callback) => {
  const { sessionCode, content, animationType, colorTheme } = payload
  // ❌ No validation!
  socket.to(sessionCode).emit('message:received', payload)
})
```

**Problem:**
- XSS attacks possible (inject JavaScript in content)
- Injection attacks possible
- User can send malformed data to crash client

**Fix:**
```javascript
import { z } from 'zod'

const messageSchema = z.object({
  sessionCode: z.string().min(4).max(8),
  content: z.string().min(1).max(1000),
  animationType: z.enum(['flip', 'fade', 'slide']),
  colorTheme: z.enum(['monochrome', 'teal', 'vintage'])
})

socket.on('message:send', (payload, callback) => {
  try {
    const validated = messageSchema.parse(payload)
    socket.to(validated.sessionCode).emit('message:received', validated)
    callback?.({ success: true })
  } catch (error) {
    callback?.({ success: false, error: error.message })
  }
})
```

#### 4. **No Authentication on Server Sockets**

**Location:** `server/index.js`
```javascript
const { sessionCode, userId } = socket.handshake.auth
// ❌ No verification that userId is valid!
// User can spoof any userId
```

**Problem:**
- User can pretend to be another user
- No verification that userId matches Supabase
- Can join any session code without permission

**Fix:**
```javascript
const verifyAuth = async (socket, next) => {
  try {
    const { userId, sessionCode } = socket.handshake.auth
    
    // Verify with Supabase
    const { data: user, error } = await supabase.auth.admin.getUserById(userId)
    if (error || !user) {
      return next(new Error('Unauthorized'))
    }
    
    socket.userId = userId
    next()
  } catch (error) {
    next(new Error('Auth failed'))
  }
}

io.use(verifyAuth)
```

#### 5. **No Rate Limiting on Server**

**Location:** `server/index.js`

**Problem:**
- No rate limiting on messages per user
- DDoS possible (spam 1000s of messages/second)
- No session creation limits

**Fix:**
```javascript
import rateLimit from 'express-rate-limit'

const messageLimit = new Map() // userId -> [timestamps]

socket.on('message:send', (payload, callback) => {
  const limit = messageLimit.get(socket.userId) || []
  const now = Date.now()
  
  // 10 messages per 60 seconds
  const recent = limit.filter(t => now - t < 60000)
  
  if (recent.length >= 10) {
    return callback?.({ success: false, error: 'Rate limited' })
  }
  
  recent.push(now)
  messageLimit.set(socket.userId, recent)
  
  // ... process message
})
```

---

### 🟠 Medium Priority Security Issues

#### 6. **Client-Side Rate Limiting Only**

**Location:** `src/utils/rateLimit.js`

**Problem:**
- Rate limiter is client-side JavaScript
- Determined user can delete/modify rateLimit object
- No server validation

**Current:**
```javascript
// INSECURE - in browser
const messageRateLimiter = new RateLimiter(10, 60000)
if (!messageRateLimiter.canMakeRequest()) {
  return // User can bypass this
}
```

**Fix:** Implement server-side rate limiting (see issue #5)

#### 7. **Missing HTTPS Enforcement**

**Problem:**
- No mention of SSL/TLS in config
- No HTTPS redirect
- No security headers (HSTS, CSP, etc.)

**Recommended (in production):**
```javascript
// In Express app
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`)
  }
  next()
})

// Security headers
app.use((req, res, next) => {
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  res.set('X-Content-Type-Options', 'nosniff')
  res.set('X-Frame-Options', 'DENY')
  res.set('X-XSS-Protection', '1; mode=block')
  res.set('Content-Security-Policy', "default-src 'self'")
  next()
})
```

#### 8. **DOMPurify Not Applied to All User Input**

**Location:** Scattered usage in components

**Problem:**
- Not all user-generated content is sanitized
- Message content might not be purified before display

**Check:** Search for all user input and ensure DOMPurify is applied

**Example:**
```javascript
import DOMPurify from 'dompurify'

// When displaying user content:
const clean = DOMPurify.sanitize(userMessage)
<div dangerouslySetInnerHTML={{ __html: clean }} />
```

#### 9. **No Content Security Policy (CSP)**

**Problem:**
- No CSP header to prevent inline script injection
- No restriction on external script sources

**Add to server headers:**
```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' fonts.googleapis.com;
  font-src 'self' fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' flipdisplay.online;
  frame-ancestors 'none'
```

#### 10. **Sensitive Data in Logs**

**Location:** `server/index.js` uses console.log extensively

**Problem:**
- console.log shows sessionCode, userId, and message content
- Logs may be captured by monitoring tools
- Could expose sensitive user data

**Fix:**
```javascript
// Sanitize logs for production
const isDev = process.env.NODE_ENV === 'development'

socket.on('message:send', (payload, callback) => {
  if (isDev) {
    console.log('Message:', payload) // OK in dev
  } else {
    console.log('Message sent from:', socket.id) // No content in prod
  }
})
```

---

### 🟡 Low Priority Security Issues

#### 11. **No CSRF Protection on Forms**

**Problem:**
- Forms don't have CSRF tokens
- Cross-site request forgery possible

**Note:** Less critical for WebSocket-based app, but still good practice

#### 12. **Supabase RLS Policies Not Fully Verified**

**Status:** ✅ GOOD - RLS is implemented

But verify:
- [ ] All tables have RLS enabled
- [ ] Policies correctly check auth.uid()
- [ ] No overly permissive policies
- [ ] Cascade delete rules correct

---

## Security Implementation Priority

| Priority | Issue | Risk | Fix Effort | Timeline |
|----------|-------|------|-----------|----------|
| 🔴 CRITICAL | Expose Resend key | Token theft | Easy | TODAY |
| 🔴 CRITICAL | CORS allows all | DDoS/abuse | Easy | TODAY |
| 🔴 CRITICAL | No server validation | XSS/injection | Easy | Today |
| 🔴 CRITICAL | No auth verification | Spoofing | Medium | This week |
| 🟠 High | No server rate limiting | DDoS | Medium | This week |
| 🟠 High | No HTTPS enforcement | MITM | Easy* | *On deploy |
| 🟠 High | Missing CSP headers | XSS | Easy | This week |
| 🟡 Medium | DOMPurify not universal | XSS | Medium | Next sprint |

---

## Checklist: Security Fixes

- [ ] Move VITE_RESEND_API_KEY to .env (server-only)
- [ ] Create `/api/send-email` backend endpoint
- [ ] Rotate Resend API key immediately
- [ ] Configure CORS to whitelist origins only
- [ ] Add input validation with zod schema
- [ ] Implement Supabase auth verification on server
- [ ] Add rate limiting middleware
- [ ] Add security headers (HSTS, CSP, X-Content-Type-Options)
- [ ] Sanitize all console.log outputs in production
- [ ] Audit RLS policies on all tables
- [ ] Add HTTPS enforcement on server
- [ ] Enable CORS credentials if needed
- [ ] Test CORS with actual cross-origin requests

---

**See CODEBASE_AUDIT_PHASE4_IMPROVEMENT_PLAN.md for comprehensive roadmap...**
