/**
 * Redis-backed rate limiter for Socket.io
 * Provides distributed rate limiting across multiple server instances
 */
import { redisClient } from './redis.js';

class RedisRateLimiter {
  constructor(options = {}) {
    this.maxRequests = options.maxRequests || 10;
    this.windowMs = options.windowMs || 60000; // 1 minute
    this.keyPrefix = options.keyPrefix || 'ratelimit:';
  }

  normalizeIdentifier(value) {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (typeof value === 'object') {
      if (value.toString && value.toString !== Object.prototype.toString) {
        return String(value.toString());
      }
      try {
        return JSON.stringify(value);
      } catch (err) {
        console.error('Failed to normalize identifier for rate limiter', err);
        return null;
      }
    }

    return null;
  }

  /**
   * Check user rate limit
   * Returns { allowed: boolean, remaining: number, reset: timestamp, retryAfter: seconds }
   */
  async checkUserLimit(userId) {
    const normalizedUserId = this.normalizeIdentifier(userId);
    if (!normalizedUserId) {
      return { allowed: false, error: 'No user ID' };
    }

    try {
      const key = `${this.keyPrefix}user:${normalizedUserId}`;
      const now = Date.now();
      const windowStart = now - this.windowMs;

      // Remove old requests outside window (using sorted set with timestamp as score)
      await redisClient.zRemRangeByScore(key, 0, windowStart);

      // Count requests in current window
      const count = await redisClient.zCard(key);

      if (count >= this.maxRequests) {
        // Get oldest request time to calculate reset time
        const oldest = await redisClient.zRange(key, 0, 0, { WITHSCORES: true });
        const oldestTime = oldest.length > 0 ? parseInt(oldest[1]) : now;
        const reset = oldestTime + this.windowMs;
        const retryAfter = Math.ceil((reset - now) / 1000);

        return {
          allowed: false,
          remaining: 0,
          reset,
          retryAfter
        };
      }

      // Add current request
      await redisClient.zAdd(key, { score: now, member: `${now}-${Math.random()}` });
      // Set expiry
      await redisClient.expire(key, Math.ceil(this.windowMs / 1000) + 1);

      return {
        allowed: true,
        remaining: this.maxRequests - count - 1,
        reset: now + this.windowMs,
        retryAfter: 0
      };
    } catch (error) {
      console.error(`Rate limit check failed for user ${userId}:`, error);
      // Fail open in case of Redis error (allow request)
      return { allowed: true, error: error.message };
    }
  }

  /**
   * Check IP rate limit (stricter than user limit)
   */
  async checkIpLimit(ip, multiplier = 2) {
    const normalizedIp = this.normalizeIdentifier(ip);
    if (!normalizedIp) {
      return { allowed: false, error: 'No IP provided' };
    }

    try {
      const key = `${this.keyPrefix}ip:${normalizedIp}`;
      const now = Date.now();
      const windowStart = now - this.windowMs;

      await redisClient.zRemRangeByScore(key, 0, windowStart);
      const count = await redisClient.zCard(key);

      const limit = this.maxRequests * multiplier;

      if (count >= limit) {
        const oldest = await redisClient.zRange(key, 0, 0, { WITHSCORES: true });
        const oldestTime = oldest.length > 0 ? parseInt(oldest[1]) : now;
        const reset = oldestTime + this.windowMs;

        return {
          allowed: false,
          remaining: 0,
          reset,
          retryAfter: Math.ceil((reset - now) / 1000)
        };
      }

      await redisClient.zAdd(key, { score: now, member: `${now}-${Math.random()}` });
      await redisClient.expire(key, Math.ceil(this.windowMs / 1000) + 1);

      return {
        allowed: true,
        remaining: limit - count - 1,
        reset: now + this.windowMs,
        retryAfter: 0
      };
    } catch (error) {
      console.error(`Rate limit check failed for IP ${ip}:`, error);
      return { allowed: true, error: error.message };
    }
  }

  /**
   * Check connection rate limit (prevent connection bomb)
   */
  async checkConnectionLimit(ip, maxConnections = 5) {
    const normalizedIp = this.normalizeIdentifier(ip);
    if (!normalizedIp) {
      return { allowed: false, error: 'No IP provided' };
    }

    try {
      const key = `${this.keyPrefix}conn:${normalizedIp}`;
      const now = Date.now();
      const windowStart = now - (60 * 1000); // 1 minute window

      await redisClient.zRemRangeByScore(key, 0, windowStart);
      const count = await redisClient.zCard(key);

      if (count >= maxConnections) {
        return {
          allowed: false,
          reason: 'Too many connection attempts',
          retryAfter: 60
        };
      }

      await redisClient.zAdd(key, { score: now, member: `${now}-${Math.random()}` });
      await redisClient.expire(key, 61);

      return {
        allowed: true,
        remaining: maxConnections - count - 1
      };
    } catch (error) {
      console.error(`Connection limit check failed for IP ${ip}:`, error);
      return { allowed: true, error: error.message };
    }
  }

  /**
   * Reset rate limit for a user (admin only)
   */
  async resetUserLimit(userId) {
    const normalizedUserId = this.normalizeIdentifier(userId);
    if (!normalizedUserId) {
      return false;
    }

    try {
      const key = `${this.keyPrefix}user:${normalizedUserId}`;
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error(`Failed to reset rate limit for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get current usage stats for a user
   */
  async getUserStats(userId) {
    const normalizedUserId = this.normalizeIdentifier(userId);
    if (!normalizedUserId) {
      return null;
    }

    try {
      const key = `${this.keyPrefix}user:${normalizedUserId}`;
      const count = await redisClient.zCard(key);
      const ttl = await redisClient.ttl(key);

      return {
        requests: count,
        limit: this.maxRequests,
        window_ms: this.windowMs,
        ttl_seconds: ttl > 0 ? ttl : 0
      };
    } catch (error) {
      console.error(`Failed to get stats for user ${userId}:`, error);
      return null;
    }
  }
}

// Export singleton instance with configurable options
export function createRateLimiter(options = {}) {
  return new RedisRateLimiter({
    maxRequests: options.maxRequests || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10'),
    windowMs: options.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    keyPrefix: options.keyPrefix || 'ratelimit:'
  });
}

export default RedisRateLimiter;
