import crypto from 'crypto'

const CSRF_EXPIRY_MS = 10 * 60 * 1000
const RATE_LIMIT_CONFIG = {
  grant: { max: 5, windowMs: 60 * 1000 },
  revoke: { max: 5, windowMs: 60 * 1000 },
}

const tokenStore = new Map()
const rateLimitStore = new Map()

class RateLimitError extends Error {
  constructor(message, rateLimit) {
    super(message)
    this.name = 'RateLimitError'
    this.code = 'RATE_LIMITED'
    this.rateLimit = rateLimit
    this.retryAfter = rateLimit?.retryAfter || null
  }
}

function getRateLimitKey(userId, operation) {
  return `${userId}:${operation}`
}

function createRateLimitState(userId, operation) {
  const config = RATE_LIMIT_CONFIG[operation]
  const now = Date.now()
  const key = getRateLimitKey(userId, operation)
  let entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    }
  }

  return { config, entry, key, now }
}

function incrementRateLimit(userId, operation) {
  if (!RATE_LIMIT_CONFIG[operation]) {
    throw new Error(`Unsupported operation for rate limiting: ${operation}`)
  }

  const { config, entry, key, now } = createRateLimitState(userId, operation)

  if (entry.count >= config.max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    const rateLimit = {
      limit: config.max,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
      windowMs: config.windowMs,
      operation,
    }
    rateLimitStore.set(key, entry)
    return { allowed: false, rateLimit }
  }

  entry.count += 1
  rateLimitStore.set(key, entry)

  const remaining = Math.max(0, config.max - entry.count)
  return {
    allowed: true,
    rateLimit: {
      limit: config.max,
      remaining,
      resetAt: entry.resetAt,
      retryAfter: 0,
      windowMs: config.windowMs,
      operation,
    },
  }
}

function cleanupExpiredTokens() {
  const now = Date.now()
  for (const [token, { expiresAt }] of tokenStore) {
    if (now > expiresAt) {
      tokenStore.delete(token)
    }
  }
}

setInterval(cleanupExpiredTokens, 60 * 1000)

export function issueCsrfToken(userId, operation) {
  const normalizedOp = (operation || 'grant').toLowerCase()
  if (!RATE_LIMIT_CONFIG[normalizedOp]) {
    throw new Error('Invalid CSRF operation')
  }

  const { allowed, rateLimit } = incrementRateLimit(userId, normalizedOp)
  if (!allowed) {
    throw new RateLimitError('Rate limited. Try again later.', {
      ...rateLimit,
      retryAfter: rateLimit.retryAfter,
    })
  }

  const token = crypto.randomBytes(24).toString('hex')
  const expiresAt = Date.now() + CSRF_EXPIRY_MS
  tokenStore.set(token, { userId, operation: normalizedOp, expiresAt })

  return {
    token,
    expiresAt,
    rateLimit,
    operation: normalizedOp,
  }
}

export function validateCsrfToken(token, userId, operation) {
  const data = tokenStore.get(token)
  if (!data) return false
  if (data.userId !== userId) return false
  if (data.operation !== operation) return false
  if (Date.now() > data.expiresAt) {
    tokenStore.delete(token)
    return false
  }
  tokenStore.delete(token)
  return true
}

export function getRateLimitStatus(userId, operation) {
  if (!RATE_LIMIT_CONFIG[operation]) {
    return null
  }
  const { config, entry } = createRateLimitState(userId, operation)
  const resetAt = entry.resetAt
  const count = entry.count
  return {
    limit: config.max,
    remaining: Math.max(0, config.max - count),
    resetAt,
    windowMs: config.windowMs,
    operation,
  }
}

export { RateLimitError }