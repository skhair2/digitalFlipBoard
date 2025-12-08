/**
 * Presence Tracking Service
 * Manages user presence (who's online) for sessions
 */

import logger from './logger.js';

class PresenceTrackingService {
  constructor(redisClient) {
    this.redis = redisClient;
    this.activePresence = new Map(); // Local cache of active users
  }

  /**
   * Add user to session presence
   * @param {string} sessionCode - Session code
   * @param {string} userId - User ID or socket ID
   * @param {object} userData - User metadata (type, name, etc.)
   */
  async joinSession(sessionCode, userId, userData = {}) {
    if (!sessionCode || !userId) {
      return false;
    }

    const key = `session:${sessionCode}:presence`;
    const presenceData = {
      userId,
      type: userData.type || 'controller', // 'controller' or 'display'
      name: userData.name || `${userData.type || 'User'} ${Math.random().toString(36).substring(7)}`,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
      metadata: userData.metadata || {}
    };

    try {
      // Add user to Redis set with score (timestamp for sorted set)
      await this.redis.hSet(key, userId, JSON.stringify(presenceData));

      // Set expiration (30 minutes - will be refreshed on activity)
      await this.redis.expire(key, 30 * 60);

      // Track locally
      this.activePresence.set(`${sessionCode}:${userId}`, presenceData);

      logger.debug(`[Presence] User joined session ${sessionCode}`, {
        userId,
        type: userData.type
      });

      return presenceData;
    } catch (error) {
      logger.error(`[Presence] Failed to add user to ${sessionCode}:`, error);
      return false;
    }
  }

  /**
   * Remove user from session presence
   * @param {string} sessionCode - Session code
   * @param {string} userId - User ID or socket ID
   */
  async leaveSession(sessionCode, userId) {
    if (!sessionCode || !userId) {
      return false;
    }

    const key = `session:${sessionCode}:presence`;

    try {
      await this.redis.hDel(key, userId);
      this.activePresence.delete(`${sessionCode}:${userId}`);

      logger.debug(`[Presence] User left session ${sessionCode}`, { userId });

      // Clean up key if empty
      const count = await this.redis.hLen(key);
      if (count === 0) {
        await this.redis.del(key);
      }

      return true;
    } catch (error) {
      logger.error(`[Presence] Failed to remove user from ${sessionCode}:`, error);
      return false;
    }
  }

  /**
   * Update user's last activity timestamp
   * @param {string} sessionCode - Session code
   * @param {string} userId - User ID
   */
  async updateActivity(sessionCode, userId) {
    if (!sessionCode || !userId) {
      return false;
    }

    const key = `session:${sessionCode}:presence`;
    const cacheKey = `${sessionCode}:${userId}`;

    try {
      // Get current user data
      const userData = await this.redis.hGet(key, userId);
      if (!userData) {
        return false;
      }

      const parsed = JSON.parse(userData);
      parsed.lastSeen = Date.now();

      // Update in Redis
      await this.redis.hSet(key, userId, JSON.stringify(parsed));

      // Refresh expiration
      await this.redis.expire(key, 30 * 60);

      // Update local cache
      this.activePresence.set(cacheKey, parsed);

      return true;
    } catch (error) {
      logger.error(`[Presence] Failed to update activity for ${sessionCode}:${userId}:`, error);
      return false;
    }
  }

  /**
   * Get all users in a session
   * @param {string} sessionCode - Session code
   */
  async getSessionUsers(sessionCode) {
    if (!sessionCode) {
      return [];
    }

    const key = `session:${sessionCode}:presence`;

    try {
      const data = await this.redis.hGetAll(key);
      const users = [];

      for (const [userId, userData] of Object.entries(data)) {
        try {
          users.push(JSON.parse(userData));
        } catch (e) {
          logger.warn(`[Presence] Failed to parse user data for ${userId}`);
        }
      }

      return users;
    } catch (error) {
      logger.error(`[Presence] Failed to get users for ${sessionCode}:`, error);
      return [];
    }
  }

  /**
   * Get users by type (e.g., only controllers)
   * @param {string} sessionCode - Session code
   * @param {string} type - User type ('controller' or 'display')
   */
  async getUsersByType(sessionCode, type) {
    if (!sessionCode || !type) {
      return [];
    }

    const users = await this.getSessionUsers(sessionCode);
    return users.filter(user => user.type === type);
  }

  /**
   * Count users in session by type
   * @param {string} sessionCode - Session code
   */
  async getSessionStats(sessionCode) {
    if (!sessionCode) {
      return { total: 0, controllers: 0, displays: 0 };
    }

    const users = await this.getSessionUsers(sessionCode);
    const controllers = users.filter(u => u.type === 'controller');
    const displays = users.filter(u => u.type === 'display');

    return {
      total: users.length,
      controllers: controllers.length,
      displays: displays.length,
      users
    };
  }

  /**
   * Check if user is online
   * @param {string} sessionCode - Session code
   * @param {string} userId - User ID
   */
  async isUserOnline(sessionCode, userId) {
    if (!sessionCode || !userId) {
      return false;
    }

    const key = `session:${sessionCode}:presence`;

    try {
      const exists = await this.redis.hExists(key, userId);
      return exists === 1;
    } catch (error) {
      logger.error(`[Presence] Failed to check if user online:`, error);
      return false;
    }
  }

  /**
   * Get idle users (no activity for specified duration)
   * @param {string} sessionCode - Session code
   * @param {number} idleTimeMs - Idle time in milliseconds
   */
  async getIdleUsers(sessionCode, idleTimeMs = 5 * 60 * 1000) {
    if (!sessionCode) {
      return [];
    }

    const users = await this.getSessionUsers(sessionCode);
    const now = Date.now();

    return users.filter(user => now - user.lastSeen > idleTimeMs);
  }

  /**
   * Clean up idle users
   * @param {string} sessionCode - Session code
   * @param {number} idleTimeMs - Idle time in milliseconds
   */
  async cleanupIdleUsers(sessionCode, idleTimeMs = 30 * 60 * 1000) {
    if (!sessionCode) {
      return false;
    }

    const idleUsers = await this.getIdleUsers(sessionCode, idleTimeMs);

    for (const user of idleUsers) {
      await this.leaveSession(sessionCode, user.userId);
    }

    if (idleUsers.length > 0) {
      logger.info(`[Presence] Cleaned up ${idleUsers.length} idle users from ${sessionCode}`);
    }

    return true;
  }

  /**
   * Broadcast presence update to all connected clients (via Socket.io)
   * Note: This is called by Socket.io integration
   * @param {object} io - Socket.io instance
   * @param {string} sessionCode - Session code
   */
  async broadcastPresenceUpdate(io, sessionCode) {
    if (!io || !sessionCode) {
      return false;
    }

    try {
      const stats = await this.getSessionStats(sessionCode);

      io.to(sessionCode).emit('presence:update', {
        sessionCode,
        stats,
        timestamp: Date.now()
      });

      logger.debug(`[Presence] Broadcast update for ${sessionCode}`, stats);
      return true;
    } catch (error) {
      logger.error(`[Presence] Failed to broadcast presence update:`, error);
      return false;
    }
  }

  /**
   * Get presence summary (quick stats)
   * @param {string} sessionCode - Session code
   */
  async getSummary(sessionCode) {
    if (!sessionCode) {
      return null;
    }

    const stats = await this.getSessionStats(sessionCode);
    const key = `session:${sessionCode}:presence`;

    try {
      const ttl = await this.redis.ttl(key);

      return {
        sessionCode,
        ...stats,
        ttl: ttl > 0 ? ttl : null,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`[Presence] Failed to get summary for ${sessionCode}:`, error);
      return null;
    }
  }
}

export { PresenceTrackingService };
