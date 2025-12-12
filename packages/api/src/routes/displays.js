/**
 * Display Status HTTP Endpoints
 * 
 * Provides HTTP-based status polling for displays (10% fallback traffic).
 * Used when WebSocket connection is unavailable or degraded.
 * 
 * Endpoints:
 * - GET /api/displays/:displayId/status - Get display status and metrics
 * - POST /api/displays/:displayId/status - Update display status (heartbeat)
 * - GET /api/designs/:designId/status - Get all displays for a design
 */

import logger from '../logger.js';
import { verifyToken } from '../auth.js';
import { redisClient } from '../redis.js';

const STATUS_CACHE_TTL = 30; // 30 seconds - short TTL for real-time status

/**
 * Get or create display status key in Redis
 * @param {string} displayId 
 * @returns {string} Redis key
 */
function getDisplayStatusKey(displayId) {
  return `display:status:${displayId}`;
}

/**
 * Get or create design displays index in Redis
 * @param {string} designId 
 * @returns {string} Redis key
 */
function getDesignDisplaysKey(designId) {
  return `design:displays:${designId}`;
}

/**
 * Initialize display status with default values
 */
function createDefaultStatus(displayId) {
  return {
    displayId,
    status: 'online',
    metrics: {
      fps: 60,
      cpuUsage: 0,
      memoryUsage: 0,
      latency: 0,
      lastMessageReceivedAt: Date.now(),
      messageCount: 0
    },
    timestamp: Date.now(),
    httpFallback: false // Initially set to false; becomes true if reported via HTTP
  };
}

/**
 * GET /api/displays/:displayId/status
 * Retrieve current status and metrics for a display
 * 
 * Response: 200 OK with status object, 404 if not found
 */
async function getDisplayStatus(req, res) {
  const { displayId } = req.params;

  try {
    const statusKey = getDisplayStatusKey(displayId);
    const statusData = await redisClient.get(statusKey);

    if (!statusData) {
      // Display not yet reported status - return default
      const defaultStatus = createDefaultStatus(displayId);
      return res.status(200).json({
        ...defaultStatus,
        found: false,
        message: 'Display not yet reported status'
      });
    }

    const status = JSON.parse(statusData);
    return res.status(200).json({
      ...status,
      found: true
    });
  } catch (error) {
    logger.error('Failed to get display status', error, { displayId });
    res.status(500).json({
      error: 'Failed to retrieve display status',
      displayId
    });
  }
}

/**
 * POST /api/displays/:displayId/status
 * Update display status via HTTP (used as WebSocket fallback)
 * 
 * Expected body:
 * {
 *   "status": "online|offline|animating|idle",
 *   "metrics": { fps, cpuUsage, memoryUsage, latency, ... },
 *   "designId": "optional-design-id"
 * }
 * 
 * Response: 200 OK with updated status
 */
async function updateDisplayStatus(req, res) {
  const { displayId } = req.params;
  const { status, metrics, designId } = req.body;

  try {
    // Validate status value
    const validStatuses = ['online', 'offline', 'animating', 'idle'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status value',
        valid: validStatuses
      });
    }

    // Get current status or create new one
    const statusKey = getDisplayStatusKey(displayId);
    let currentStatus = createDefaultStatus(displayId);

    const existingData = await redisClient.get(statusKey);
    if (existingData) {
      currentStatus = JSON.parse(existingData);
    }

    // Update with new values
    const updatedStatus = {
      ...currentStatus,
      status: status || currentStatus.status,
      metrics: metrics ? { ...currentStatus.metrics, ...metrics } : currentStatus.metrics,
      timestamp: Date.now(),
      httpFallback: true // Mark this as HTTP fallback status
    };

    // Store in Redis with TTL
    await redisClient.setEx(
      statusKey,
      STATUS_CACHE_TTL,
      JSON.stringify(updatedStatus)
    );

    // If designId provided, add to design's display index
    if (designId) {
      const designKey = getDesignDisplaysKey(designId);
      
      // Add display to design's set (for tracking which displays are active for a design)
      await redisClient.sAdd(designKey, displayId);
      
      // Set TTL on the design set as well
      await redisClient.expire(designKey, STATUS_CACHE_TTL);
    }

    logger.debug('Display status updated via HTTP', {
      displayId,
      status: updatedStatus.status,
      designId,
      timestamp: updatedStatus.timestamp
    });

    return res.status(200).json({
      ...updatedStatus,
      updated: true
    });
  } catch (error) {
    logger.error('Failed to update display status', error, { displayId });
    res.status(500).json({
      error: 'Failed to update display status',
      displayId
    });
  }
}

/**
 * GET /api/designs/:designId/status
 * Get status of all displays for a design
 * 
 * Response: Array of display statuses
 */
async function getDesignDisplaysStatus(req, res) {
  const { designId } = req.params;

  try {
    const designKey = getDesignDisplaysKey(designId);
    
    // Get all display IDs for this design
    const displayIds = await redisClient.sMembers(designKey);

    if (displayIds.length === 0) {
      return res.status(200).json({
        designId,
        displays: [],
        count: 0,
        timestamp: Date.now()
      });
    }

    // Fetch status for each display
    const displays = await Promise.all(
      displayIds.map(async (displayId) => {
        const statusKey = getDisplayStatusKey(displayId);
        const statusData = await redisClient.get(statusKey);
        
        if (statusData) {
          return JSON.parse(statusData);
        } else {
          return createDefaultStatus(displayId);
        }
      })
    );

    return res.status(200).json({
      designId,
      displays,
      count: displays.length,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Failed to get design displays status', error, { designId });
    res.status(500).json({
      error: 'Failed to retrieve design displays status',
      designId
    });
  }
}

/**
 * Health check endpoint for displays
 * Lightweight heartbeat without full metrics
 */
async function displayHeartbeat(req, res) {
  const { displayId } = req.params;

  try {
    const statusKey = getDisplayStatusKey(displayId);
    const statusData = await redisClient.get(statusKey);

    // Just verify existence and update timestamp
    const current = statusData 
      ? JSON.parse(statusData)
      : createDefaultStatus(displayId);

    const updated = {
      ...current,
      timestamp: Date.now(),
      httpFallback: true
    };

    await redisClient.setEx(
      statusKey,
      STATUS_CACHE_TTL,
      JSON.stringify(updated)
    );

    return res.status(200).json({
      displayId,
      alive: true,
      timestamp: updated.timestamp
    });
  } catch (error) {
    logger.error('Display heartbeat failed', error, { displayId });
    res.status(500).json({
      error: 'Heartbeat failed',
      displayId
    });
  }
}

/**
 * Register all display status endpoints
 * 
 * @param {Express} app
 */
export function registerDisplayEndpoints(app) {
  // Lightweight heartbeat endpoint (no auth required - for display-side)
  app.post('/api/displays/:displayId/heartbeat', displayHeartbeat);

  // Status endpoints (require auth - for controller-side queries)
  app.get('/api/displays/:displayId/status', getDisplayStatus);
  app.post('/api/displays/:displayId/status', updateDisplayStatus);
  app.get('/api/designs/:designId/status', getDesignDisplaysStatus);

  logger.info('Display status endpoints registered', {
    endpoints: [
      'POST /api/displays/:displayId/heartbeat',
      'GET /api/displays/:displayId/status',
      'POST /api/displays/:displayId/status',
      'GET /api/designs/:designId/status'
    ]
  });
}

export {
  getDisplayStatus,
  updateDisplayStatus,
  getDesignDisplaysStatus,
  displayHeartbeat,
  createDefaultStatus,
  getDisplayStatusKey,
  getDesignDisplaysKey
};
