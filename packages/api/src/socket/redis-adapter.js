/**
 * Socket.io Redis Adapter Integration
 * 
 * This module bridges Socket.io with Redis for multi-instance horizontal scaling.
 * When multiple API servers run behind a load balancer, Redis Pub/Sub ensures
 * that socket events are synchronized across all instances.
 * 
 * Key Benefits:
 * - Horizontal scaling (multiple API servers)
 * - Session synchronization across instances
 * - Pub/Sub message broadcasting
 * - Automatic room management
 * 
 * Usage:
 *   import { setupRedisAdapter } from './socket/redis-adapter.js';
 *   await setupRedisAdapter(io, redisClient);
 */

import { createAdapter } from '@socket.io/redis-adapter';
import logger from '../logger.js';

/**
 * Setup Redis adapter for Socket.io server
 * 
 * @param {Server} io - Socket.io server instance
 * @param {RedisClient} redisClient - Connected Redis client
 * @returns {Promise<void>}
 */
export async function setupRedisAdapter(io, redisClient) {
  try {
    // Create pub and sub clients from the main Redis client
    // Both must be connected before creating the adapter
    if (!redisClient || !redisClient.isReady) {
      throw new Error('Redis client must be connected before setting up adapter');
    }

    // Socket.io adapter uses a pub/sub pattern
    // It requires two Redis clients: one for publishing, one for subscribing
    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();

    // Connect the pub/sub clients
    await pubClient.connect();
    await subClient.connect();

    // Create and attach the adapter
    io.adapter(createAdapter(pubClient, subClient));

    logger.info('Redis adapter initialized for Socket.io', {
      pubClient: pubClient.isReady ? 'connected' : 'disconnected',
      subClient: subClient.isReady ? 'connected' : 'disconnected'
    });

    // Handle Redis connection errors
    pubClient.on('error', (error) => {
      logger.error('Redis pub client error in Socket.io adapter', error);
    });

    subClient.on('error', (error) => {
      logger.error('Redis sub client error in Socket.io adapter', error);
    });

    // Handle graceful disconnection
    return { pubClient, subClient };
  } catch (error) {
    logger.error('Failed to setup Redis adapter for Socket.io', error);
    throw error;
  }
}

/**
 * Get adapter information for monitoring
 * 
 * This provides insights into the current state of the Redis adapter,
 * useful for debugging and monitoring multi-instance setups.
 * 
 * @param {Server} io - Socket.io server instance
 * @returns {Object} Adapter information
 */
export function getAdapterInfo(io) {
  try {
    const adapter = io.of('/').adapter;
    
    return {
      type: adapter.constructor.name,
      rooms: Array.from(adapter.rooms.keys()),
      sids: Array.from(adapter.sids.keys()),
      roomCount: adapter.rooms.size,
      socketCount: adapter.sids.size
    };
  } catch (error) {
    logger.error('Failed to get adapter info', error);
    return null;
  }
}

/**
 * Clean up Redis adapter on server shutdown
 * 
 * @param {Server} io - Socket.io server instance
 * @param {Object} clients - Object with pubClient and subClient from setupRedisAdapter
 * @returns {Promise<void>}
 */
export async function cleanupRedisAdapter(io, clients) {
  try {
    if (clients && clients.pubClient) {
      await clients.pubClient.disconnect();
      logger.info('Disconnected Redis pub client');
    }
    if (clients && clients.subClient) {
      await clients.subClient.disconnect();
      logger.info('Disconnected Redis sub client');
    }
  } catch (error) {
    logger.error('Error during Redis adapter cleanup', error);
  }
}
