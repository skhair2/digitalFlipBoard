/**
 * Message History Service
 * Manages message persistence and pagination for sessions
 */

import logger from './logger.js';

class MessageHistoryService {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  /**
   * Add message to session history
   * @param {string} sessionCode - Session code
   * @param {object} message - Message object
   */
  async addMessage(sessionCode, message) {
    if (!sessionCode || !message) {
      return false;
    }

    const key = `session:${sessionCode}:messages`;
    const messageData = {
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      text: message.text || message,
      animation: message.animation || 'flip',
      color: message.color || 'monochrome',
      timestamp: Date.now(),
      senderType: message.senderType || 'controller' // 'controller' or 'api'
    };

    try {
      // Add message to Redis list (keep last 100 messages)
      await this.redis.lPush(key, JSON.stringify(messageData));
      await this.redis.lTrim(key, 0, 99); // Keep only last 100 messages

      // Set expiration (24 hours)
      await this.redis.expire(key, 24 * 60 * 60);

      logger.debug(`[MessageHistory] Message added to session ${sessionCode}`, {
        messageId: messageData.id,
        text: messageData.text.substring(0, 50)
      });

      return messageData;
    } catch (error) {
      logger.error(`[MessageHistory] Failed to add message to ${sessionCode}:`, error);
      return false;
    }
  }

  /**
   * Get message history for a session
   * @param {string} sessionCode - Session code
   * @param {number} page - Page number (0-based)
   * @param {number} pageSize - Messages per page
   */
  async getHistory(sessionCode, page = 0, pageSize = 20) {
    if (!sessionCode) {
      return { messages: [], total: 0, page, pageSize };
    }

    const key = `session:${sessionCode}:messages`;

    try {
      // Get total count
      const total = await this.redis.lLen(key);

      // Get paginated results
      const start = page * pageSize;
      const stop = start + pageSize - 1;
      const rawMessages = await this.redis.lRange(key, start, stop);

      // Parse messages (they're newest first, so reverse for chronological order)
      const messages = rawMessages
        .map(msg => {
          try {
            return JSON.parse(msg);
          } catch (e) {
            logger.warn(`[MessageHistory] Failed to parse message`);
            return null;
          }
        })
        .filter(msg => msg !== null)
        .reverse(); // Reverse to show oldest first

      logger.debug(`[MessageHistory] Retrieved history for ${sessionCode}`, {
        page,
        pageSize,
        returned: messages.length,
        total
      });

      return {
        messages,
        total,
        page,
        pageSize,
        hasMore: start + pageSize < total
      };
    } catch (error) {
      logger.error(`[MessageHistory] Failed to get history for ${sessionCode}:`, error);
      return { messages: [], total: 0, page, pageSize };
    }
  }

  /**
   * Get latest messages (most recent)
   * @param {string} sessionCode - Session code
   * @param {number} limit - Number of messages to retrieve
   */
  async getLatest(sessionCode, limit = 10) {
    if (!sessionCode) {
      return [];
    }

    const key = `session:${sessionCode}:messages`;

    try {
      const rawMessages = await this.redis.lRange(key, 0, limit - 1);

      const messages = rawMessages
        .map(msg => {
          try {
            return JSON.parse(msg);
          } catch (e) {
            return null;
          }
        })
        .filter(msg => msg !== null);

      return messages;
    } catch (error) {
      logger.error(`[MessageHistory] Failed to get latest for ${sessionCode}:`, error);
      return [];
    }
  }

  /**
   * Clear history for a session
   * @param {string} sessionCode - Session code
   */
  async clearHistory(sessionCode) {
    if (!sessionCode) {
      return false;
    }

    const key = `session:${sessionCode}:messages`;

    try {
      await this.redis.del(key);
      logger.debug(`[MessageHistory] Cleared history for session ${sessionCode}`);
      return true;
    } catch (error) {
      logger.error(`[MessageHistory] Failed to clear history for ${sessionCode}:`, error);
      return false;
    }
  }

  /**
   * Search messages in session
   * @param {string} sessionCode - Session code
   * @param {string} query - Search term
   */
  async search(sessionCode, query) {
    if (!sessionCode || !query) {
      return [];
    }

    const key = `session:${sessionCode}:messages`;
    const searchLower = query.toLowerCase();

    try {
      const rawMessages = await this.redis.lRange(key, 0, -1);

      const matches = rawMessages
        .map(msg => {
          try {
            return JSON.parse(msg);
          } catch (e) {
            return null;
          }
        })
        .filter(msg => msg && msg.text.toLowerCase().includes(searchLower));

      logger.debug(`[MessageHistory] Search in ${sessionCode}`, {
        query,
        matches: matches.length
      });

      return matches;
    } catch (error) {
      logger.error(`[MessageHistory] Failed to search in ${sessionCode}:`, error);
      return [];
    }
  }

  /**
   * Get statistics about message history
   * @param {string} sessionCode - Session code
   */
  async getStats(sessionCode) {
    if (!sessionCode) {
      return null;
    }

    const key = `session:${sessionCode}:messages`;

    try {
      const total = await this.redis.lLen(key);
      const rawMessages = await this.redis.lRange(key, 0, -1);

      if (total === 0) {
        return { total: 0, firstMessageTime: null, lastMessageTime: null };
      }

      const messages = rawMessages
        .map(msg => {
          try {
            return JSON.parse(msg);
          } catch (e) {
            return null;
          }
        })
        .filter(msg => msg !== null);

      const timestamps = messages.map(m => m.timestamp).filter(t => t);
      const firstMessageTime = timestamps.length > 0 ? Math.min(...timestamps) : null;
      const lastMessageTime = timestamps.length > 0 ? Math.max(...timestamps) : null;

      return {
        total,
        firstMessageTime,
        lastMessageTime,
        duration: firstMessageTime && lastMessageTime ? lastMessageTime - firstMessageTime : 0
      };
    } catch (error) {
      logger.error(`[MessageHistory] Failed to get stats for ${sessionCode}:`, error);
      return null;
    }
  }
}

export { MessageHistoryService };
