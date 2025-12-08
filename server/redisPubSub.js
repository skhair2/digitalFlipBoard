/**
 * Redis Pub/Sub Service for Message Routing and Configuration Management
 * Provides centralized message queue and state management for Display/Controller pairing
 */

import { createClient } from 'redis';
import logger from './logger.js';

class RedisPubSubService {
  constructor() {
    this.publisher = null;
    this.subscriber = null;
    this.subscriptions = new Map(); // Track active subscriptions
    this.initialized = false;
  }

  /**
   * Initialize Redis Pub/Sub clients
   */
  async initialize(redisUrl = 'redis://localhost:6379') {
    try {
      // Publisher client
      this.publisher = createClient({ url: redisUrl });
      this.publisher.on('error', (err) => {
        logger.error('[RedisPubSub] Publisher error:', err);
      });

      // Subscriber client (separate connection for subscribing)
      this.subscriber = createClient({ url: redisUrl });
      this.subscriber.on('error', (err) => {
        logger.error('[RedisPubSub] Subscriber error:', err);
      });

      // Connect both clients
      await this.publisher.connect();
      await this.subscriber.connect();

      this.initialized = true;
      logger.info('[RedisPubSub] ✓ Initialized successfully', { clients: ['publisher', 'subscriber'] });

      return true;
    } catch (error) {
      logger.error('[RedisPubSub] Failed to initialize:', error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Publish a message to a session channel
   * @param {string} sessionCode - Session code
   * @param {string} eventType - Type of event (message, config, status)
   * @param {object} data - Event data
   */
  async publishMessage(sessionCode, eventType, data) {
    if (!this.initialized) {
      logger.warn('[RedisPubSub] Not initialized, cannot publish');
      return false;
    }

    const channel = `session:${sessionCode}:${eventType}`;
    const payload = JSON.stringify({
      type: eventType,
      timestamp: Date.now(),
      data
    });

    try {
      const numSubscribers = await this.publisher.publish(channel, payload);
      logger.debug(`[RedisPubSub] Published to ${channel}`, { subscribers: numSubscribers, data });
      return true;
    } catch (error) {
      logger.error(`[RedisPubSub] Failed to publish to ${channel}:`, error);
      return false;
    }
  }

  /**
   * Subscribe to session messages
   * @param {string} sessionCode - Session code
   * @param {string} eventType - Type of event to listen for
   * @param {function} callback - Callback function
   */
  async subscribe(sessionCode, eventType, callback) {
    if (!this.initialized) {
      logger.warn('[RedisPubSub] Not initialized, cannot subscribe');
      return null;
    }

    const channel = `session:${sessionCode}:${eventType}`;
    const subscriptionId = `${channel}:${Date.now()}:${Math.random()}`;

    try {
      // Set up message listener
      const messageHandler = async (message, messageChannel) => {
        if (messageChannel === channel) {
          try {
            const parsed = JSON.parse(message);
            callback(parsed.data, parsed.timestamp);
          } catch (error) {
            logger.error(`[RedisPubSub] Error parsing message from ${channel}:`, error);
          }
        }
      };

      // Subscribe to channel
      await this.subscriber.subscribe(channel, messageHandler);
      this.subscriptions.set(subscriptionId, { channel, handler: messageHandler });

      logger.debug(`[RedisPubSub] Subscribed to ${channel}`, { subscriptionId });
      return subscriptionId;
    } catch (error) {
      logger.error(`[RedisPubSub] Failed to subscribe to ${channel}:`, error);
      return null;
    }
  }

  /**
   * Unsubscribe from a channel
   * @param {string} subscriptionId - Subscription ID returned from subscribe()
   */
  async unsubscribe(subscriptionId) {
    if (!this.subscriptions.has(subscriptionId)) {
      return false;
    }

    const { channel } = this.subscriptions.get(subscriptionId);

    try {
      await this.subscriber.unsubscribe(channel);
      this.subscriptions.delete(subscriptionId);
      logger.debug(`[RedisPubSub] Unsubscribed from ${channel}`);
      return true;
    } catch (error) {
      logger.error(`[RedisPubSub] Failed to unsubscribe from ${channel}:`, error);
      return false;
    }
  }

  /**
   * Store session configuration in Redis
   * @param {string} sessionCode - Session code
   * @param {object} config - Configuration object
   */
  async setSessionConfig(sessionCode, config) {
    if (!this.initialized) {
      logger.warn('[RedisPubSub] Not initialized, cannot set config');
      return false;
    }

    const key = `session:${sessionCode}:config`;
    const ttl = 24 * 60 * 60; // 24 hours

    try {
      await this.publisher.setEx(key, ttl, JSON.stringify({
        ...config,
        updatedAt: Date.now()
      }));

      logger.debug(`[RedisPubSub] Config stored for session ${sessionCode}`, { key, config });
      return true;
    } catch (error) {
      logger.error(`[RedisPubSub] Failed to store config for ${sessionCode}:`, error);
      return false;
    }
  }

  /**
   * Retrieve session configuration from Redis
   * @param {string} sessionCode - Session code
   */
  async getSessionConfig(sessionCode) {
    if (!this.initialized) {
      logger.warn('[RedisPubSub] Not initialized, cannot get config');
      return null;
    }

    const key = `session:${sessionCode}:config`;

    try {
      const data = await this.publisher.get(key);
      if (!data) {
        return null;
      }

      const config = JSON.parse(data);
      logger.debug(`[RedisPubSub] Retrieved config for session ${sessionCode}`, { config });
      return config;
    } catch (error) {
      logger.error(`[RedisPubSub] Failed to retrieve config for ${sessionCode}:`, error);
      return null;
    }
  }

  /**
   * Store session state (message history, current message, etc.)
   * @param {string} sessionCode - Session code
   * @param {object} state - State object
   */
  async setSessionState(sessionCode, state) {
    if (!this.initialized) {
      logger.warn('[RedisPubSub] Not initialized, cannot set state');
      return false;
    }

    const key = `session:${sessionCode}:state`;
    const ttl = 24 * 60 * 60; // 24 hours

    try {
      await this.publisher.setEx(key, ttl, JSON.stringify({
        ...state,
        updatedAt: Date.now()
      }));

      logger.debug(`[RedisPubSub] State stored for session ${sessionCode}`);
      return true;
    } catch (error) {
      logger.error(`[RedisPubSub] Failed to store state for ${sessionCode}:`, error);
      return false;
    }
  }

  /**
   * Retrieve session state from Redis
   * @param {string} sessionCode - Session code
   */
  async getSessionState(sessionCode) {
    if (!this.initialized) {
      logger.warn('[RedisPubSub] Not initialized, cannot get state');
      return null;
    }

    const key = `session:${sessionCode}:state`;

    try {
      const data = await this.publisher.get(key);
      if (!data) {
        return null;
      }

      const state = JSON.parse(data);
      logger.debug(`[RedisPubSub] Retrieved state for session ${sessionCode}`);
      return state;
    } catch (error) {
      logger.error(`[RedisPubSub] Failed to retrieve state for ${sessionCode}:`, error);
      return null;
    }
  }

  /**
   * Clear all data for a session
   * @param {string} sessionCode - Session code
   */
  async clearSession(sessionCode) {
    if (!this.initialized) {
      return false;
    }

    const keys = [
      `session:${sessionCode}:config`,
      `session:${sessionCode}:state`,
      `session:${sessionCode}:messageHistory`
    ];

    try {
      await Promise.all(keys.map(key => this.publisher.del(key)));
      logger.debug(`[RedisPubSub] Cleared session data for ${sessionCode}`);
      return true;
    } catch (error) {
      logger.error(`[RedisPubSub] Failed to clear session ${sessionCode}:`, error);
      return false;
    }
  }

  /**
   * Check if a session is active (has subscribers)
   * @param {string} sessionCode - Session code
   */
  async isSessionActive(sessionCode) {
    if (!this.initialized) {
      return false;
    }

    const config = await this.getSessionConfig(sessionCode);
    const state = await this.getSessionState(sessionCode);

    return !!(config || state);
  }

  /**
   * Gracefully shutdown
   */
  async shutdown() {
    try {
      if (this.subscriber) {
        await this.subscriber.quit();
      }
      if (this.publisher) {
        await this.publisher.quit();
      }
      this.initialized = false;
      logger.info('[RedisPubSub] ✓ Shutdown complete');
    } catch (error) {
      logger.error('[RedisPubSub] Error during shutdown:', error);
    }
  }
}

// Export singleton instance
export const redisPubSubService = new RedisPubSubService();
