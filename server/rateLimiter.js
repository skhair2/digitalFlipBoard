/**
 * Simple in-memory rate limiter for Socket.io
 * Tracks requests per user/ip and enforces limits
 */
class SocketRateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.userLimits = new Map(); // userId -> array of timestamps
    this.ipLimits = new Map(); // ip -> array of timestamps
  }

  /**
   * Check if request is allowed for user
   * Returns { allowed: boolean, remaining: number, reset: number }
   */
  checkUserLimit(userId) {
    if (!userId) {
      return { allowed: false, error: 'No user ID' };
    }

    const now = Date.now();
    const userKey = `user:${userId}`;
    let times = this.userLimits.get(userKey) || [];

    // Remove old timestamps outside window
    times = times.filter(t => now - t < this.windowMs);

    if (times.length >= this.maxRequests) {
      const oldestTime = Math.min(...times);
      const reset = oldestTime + this.windowMs;
      const remaining = 0;

      return {
        allowed: false,
        remaining,
        reset,
        retryAfter: Math.ceil((reset - now) / 1000)
      };
    }

    // Add current request
    times.push(now);
    this.userLimits.set(userKey, times);

    return {
      allowed: true,
      remaining: this.maxRequests - times.length,
      reset: now + this.windowMs
    };
  }

  /**
   * Check rate limit by IP address
   */
  checkIpLimit(ip) {
    if (!ip) {
      return { allowed: false, error: 'No IP provided' };
    }

    const now = Date.now();
    const ipKey = `ip:${ip}`;
    let times = this.ipLimits.get(ipKey) || [];

    // Remove old timestamps
    times = times.filter(t => now - t < this.windowMs);

    if (times.length >= this.maxRequests * 2) {
      // Stricter limit for IPs
      const oldestTime = Math.min(...times);
      const reset = oldestTime + this.windowMs;

      return {
        allowed: false,
        remaining: 0,
        reset,
        retryAfter: Math.ceil((reset - now) / 1000)
      };
    }

    times.push(now);
    this.ipLimits.set(ipKey, times);

    return {
      allowed: true,
      remaining: this.maxRequests - times.length,
      reset: now + this.windowMs
    };
  }

  /**
   * Reset limiter (for testing)
   */
  reset() {
    this.userLimits.clear();
    this.ipLimits.clear();
  }
}

// Create global instance
const limiter = new SocketRateLimiter(
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10'),
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')
);

export default limiter;
