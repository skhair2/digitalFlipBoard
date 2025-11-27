/**
 * Redis client initialization and utilities
 * Used for distributed session storage, caching, and rate limiting
 */
import redis from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis client with connection retry
export const redisClient = redis.createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        console.error('❌ Redis reconnection failed after 5 attempts');
        return new Error('Redis connection failed');
      }
      const delay = Math.min(retries * 100, 3000);
      return delay;
    }
  }
});

// Event handlers
redisClient.on('error', (err) => {
  console.error('Redis error:', err.message);
});

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redisClient.on('ready', () => {
  console.log('🟢 Redis client is ready');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Reconnecting to Redis...');
});

/**
 * Session Storage Operations
 */
export const sessionStore = {
  /**
   * Save session with TTL
   * @param {string} sessionCode - Session identifier
   * @param {object} sessionData - Session data
   * @param {number} ttl - Time to live in seconds (default: 86400 = 24 hours)
   */
  async save(sessionCode, sessionData, ttl = 86400) {
    try {
      const key = `session:${sessionCode}`;
      const value = JSON.stringify(sessionData);
      await redisClient.setEx(key, ttl, value);
      return true;
    } catch (error) {
      console.error(`Failed to save session ${sessionCode}:`, error);
      return false;
    }
  },

  /**
   * Get session data
   * @param {string} sessionCode - Session identifier
   */
  async get(sessionCode) {
    try {
      const key = `session:${sessionCode}`;
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Failed to get session ${sessionCode}:`, error);
      return null;
    }
  },

  /**
   * Update session data (merge with existing)
   * @param {string} sessionCode - Session identifier
   * @param {object} updates - Partial session data to merge
   */
  async update(sessionCode, updates) {
    try {
      const key = `session:${sessionCode}`;
      const existing = await this.get(sessionCode);
      if (!existing) return false;

      const merged = { ...existing, ...updates };
      const ttl = await redisClient.ttl(key);
      await redisClient.setEx(key, ttl > 0 ? ttl : 86400, JSON.stringify(merged));
      return true;
    } catch (error) {
      console.error(`Failed to update session ${sessionCode}:`, error);
      return false;
    }
  },

  /**
   * Delete session
   * @param {string} sessionCode - Session identifier
   */
  async delete(sessionCode) {
    try {
      const key = `session:${sessionCode}`;
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error(`Failed to delete session ${sessionCode}:`, error);
      return false;
    }
  },

  /**
   * Add client to session
   */
  async addClient(sessionCode, client) {
    try {
      const session = await this.get(sessionCode);
      if (!session) return false;

      session.clients = session.clients || [];
      // Prevent duplicates
      session.clients = session.clients.filter(c => c.socketId !== client.socketId);
      session.clients.push(client);

      return await this.update(sessionCode, { clients: session.clients });
    } catch (error) {
      console.error(`Failed to add client to session ${sessionCode}:`, error);
      return false;
    }
  },

  /**
   * Remove client from session
   */
  async removeClient(sessionCode, socketId) {
    try {
      const session = await this.get(sessionCode);
      if (!session) return false;

      session.clients = (session.clients || []).filter(c => c.socketId !== socketId);
      return await this.update(sessionCode, { clients: session.clients });
    } catch (error) {
      console.error(`Failed to remove client from session ${sessionCode}:`, error);
      return false;
    }
  }
};

/**
 * Activity Tracking Operations (for inactivity monitoring)
 */
export const activityStore = {
  /**
   * Update session activity timestamp
   */
  async updateActivity(sessionCode) {
    try {
      const key = `activity:${sessionCode}`;
      await redisClient.set(key, Date.now().toString());
      // Keep activity records for 30 days
      await redisClient.expire(key, 2592000);
      return true;
    } catch (error) {
      console.error(`Failed to update activity for ${sessionCode}:`, error);
      return false;
    }
  },

  /**
   * Get last activity timestamp
   */
  async getLastActivity(sessionCode) {
    try {
      const key = `activity:${sessionCode}`;
      const timestamp = await redisClient.get(key);
      return timestamp ? parseInt(timestamp, 10) : null;
    } catch (error) {
      console.error(`Failed to get activity for ${sessionCode}:`, error);
      return null;
    }
  },

  /**
   * Get inactivity duration in milliseconds
   */
  async getInactivityDuration(sessionCode) {
    try {
      const lastActivity = await this.getLastActivity(sessionCode);
      if (!lastActivity) return 0;
      return Date.now() - lastActivity;
    } catch (error) {
      console.error(`Failed to get inactivity duration for ${sessionCode}:`, error);
      return 0;
    }
  }
};

/**
 * Cache Operations
 */
export const cache = {
  /**
   * Set cache entry
   */
  async set(key, value, ttl = 300) {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to set cache for ${key}:`, error);
      return false;
    }
  },

  /**
   * Get cache entry
   */
  async get(key) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Failed to get cache for ${key}:`, error);
      return null;
    }
  },

  /**
   * Delete cache entry
   */
  async delete(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error(`Failed to delete cache for ${key}:`, error);
      return false;
    }
  },

  /**
   * Clear all cache entries matching pattern
   */
  async clear(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      console.error(`Failed to clear cache for pattern ${pattern}:`, error);
      return false;
    }
  }
};

/**
 * Redis Health Check
 */
export async function checkRedisHealth() {
  try {
    await redisClient.ping();
    return { healthy: true, message: 'Redis is healthy' };
  } catch (error) {
    return { healthy: false, message: `Redis is down: ${error.message}` };
  }
}

/**
 * Connect to Redis
 */
export async function connectRedis() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    console.log('🔴 Redis client initialized');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
}

/**
 * Disconnect from Redis
 */
export async function disconnectRedis() {
  try {
    await redisClient.quit();
    console.log('Redis client disconnected');
  } catch (error) {
    console.error('Error disconnecting from Redis:', error);
  }
}

export default redisClient;
