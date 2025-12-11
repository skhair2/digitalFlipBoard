/**
 * Admin Rate Limiting Service
 * Prevents abuse of admin operations (grant, revoke, search)
 * Enforces per-admin rate limits to prevent brute force attacks
 */

const adminOperationLimits = new Map();

/**
 * Rate limit configuration for different operations
 * key: operation type
 * max: maximum operations allowed
 * window: time window in milliseconds
 */
const ADMIN_LIMITS = {
  grant: { max: 5, window: 60000 }, // 5 grants per minute
  revoke: { max: 5, window: 60000 }, // 5 revokes per minute
  search: { max: 30, window: 60000 }, // 30 searches per minute
};

/**
 * Check if an admin operation is within rate limits
 * @param {string} adminId - Admin user ID
 * @param {string} operation - Operation type: 'grant', 'revoke', 'search'
 * @returns {Object} { allowed: boolean, retryAfter?: number }
 */
export function checkAdminRateLimit(adminId, operation) {
  // Validate operation type
  if (!ADMIN_LIMITS[operation]) {
    throw new Error(`Unknown operation type: ${operation}`);
  }

  const key = `${adminId}:${operation}`;
  const now = Date.now();
  const limits = ADMIN_LIMITS[operation];

  // Initialize if first request
  if (!adminOperationLimits.has(key)) {
    adminOperationLimits.set(key, {
      count: 1,
      resetTime: now + limits.window,
    });
    return { allowed: true };
  }

  const limit = adminOperationLimits.get(key);

  // Reset if window expired
  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + limits.window;
    return { allowed: true };
  }

  // Check if limit exceeded
  if (limit.count >= limits.max) {
    const retryAfter = Math.ceil((limit.resetTime - now) / 1000);
    return {
      allowed: false,
      retryAfter,
      message: `Rate limited. Try again in ${retryAfter} seconds.`,
    };
  }

  // Increment counter
  limit.count++;
  return { allowed: true };
}

/**
 * Get remaining quota for admin operation
 * @param {string} adminId - Admin user ID
 * @param {string} operation - Operation type
 * @returns {Object} { remaining: number, resetTime: number }
 */
export function getAdminQuota(adminId, operation) {
  const key = `${adminId}:${operation}`;
  const now = Date.now();
  const limits = ADMIN_LIMITS[operation];

  if (!adminOperationLimits.has(key)) {
    return {
      remaining: limits.max,
      resetTime: now + limits.window,
    };
  }

  const limit = adminOperationLimits.get(key);

  // Reset if window expired
  if (now > limit.resetTime) {
    return {
      remaining: limits.max,
      resetTime: now + limits.window,
    };
  }

  return {
    remaining: Math.max(0, limits.max - limit.count),
    resetTime: limit.resetTime,
  };
}

/**
 * Reset rate limit for admin (admin action reset by system)
 * @param {string} adminId - Admin user ID
 * @param {string} operation - Operation type (or 'all' for all operations)
 */
export function resetAdminRateLimit(adminId, operation = 'all') {
  if (operation === 'all') {
    // Remove all keys for this admin
    for (const [key] of adminOperationLimits) {
      if (key.startsWith(`${adminId}:`)) {
        adminOperationLimits.delete(key);
      }
    }
  } else {
    const key = `${adminId}:${operation}`;
    adminOperationLimits.delete(key);
  }
}

/**
 * Get rate limit status for admin
 * Useful for displaying in UI or logging
 * @param {string} adminId - Admin user ID
 * @returns {Object} Status for each operation type
 */
export function getAdminRateLimitStatus(adminId) {
  const status = {};

  for (const operation of Object.keys(ADMIN_LIMITS)) {
    const quota = getAdminQuota(adminId, operation);
    const isLimited = quota.remaining === 0;

    status[operation] = {
      remaining: quota.remaining,
      total: ADMIN_LIMITS[operation].max,
      resetTime: quota.resetTime,
      isLimited,
    };
  }

  return status;
}

/**
 * Cleanup old entries (call periodically)
 * Removes entries from map that are no longer needed
 * Should be called via setInterval (e.g., every 5 minutes)
 */
export function cleanupExpiredLimits() {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, limit] of adminOperationLimits) {
    if (now > limit.resetTime + 60000) { // Keep for 1 minute after reset
      adminOperationLimits.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[Admin Rate Limit] Cleaned up ${cleaned} expired entries`);
  }

  return cleaned;
}

// Start cleanup interval (runs every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
setInterval(() => {
  cleanupExpiredLimits();
}, CLEANUP_INTERVAL);

export default {
  checkAdminRateLimit,
  getAdminQuota,
  resetAdminRateLimit,
  getAdminRateLimitStatus,
  cleanupExpiredLimits,
  ADMIN_LIMITS,
};
