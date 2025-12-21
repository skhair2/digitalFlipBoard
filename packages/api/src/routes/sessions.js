/**
 * Session Management HTTP Endpoints
 * 
 * Implements "Lazy" connection logic for displays and controllers.
 * Displays register a code without opening a WebSocket.
 * Controllers pair with the code via HTTP.
 */

import logger from '../logger.js';
import { sessionStore } from '../redis.js';
import { createDisplaySession, countActiveSessions } from '../displaySessionLogger.js';
import { getUserProfile } from '../auth.js';

/**
 * POST /api/sessions/register
 * Display registers a pairing code in "waiting" state.
 */
async function registerSession(req, res) {
  const { sessionCode } = req.body;

  if (!sessionCode) {
    return res.status(400).json({ error: 'sessionCode is required' });
  }

  try {
    const success = await sessionStore.save(sessionCode, {
      sessionCode,
      status: 'waiting',
      createdAt: new Date().toISOString(),
      displayConnected: false,
      controllerConnected: false
    }, 600); // 10 minute TTL for pairing

    if (success) {
      logger.info('session_registered_waiting', { sessionCode });
      
      // Log to Supabase for analytics
      await createDisplaySession(sessionCode, {
        metadata: { source: 'lazy_registration' }
      });

      return res.status(201).json({ message: 'Session registered, waiting for pairing', sessionCode });
    } else {
      throw new Error('Failed to save session to Redis');
    }
  } catch (error) {
    logger.error('Failed to register session', error, { sessionCode });
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/sessions/pair
 * Controller pairs with a waiting session code.
 */
async function pairSession(req, res) {
  const { sessionCode, userId, boardId } = req.body;

  if (!sessionCode) {
    return res.status(400).json({ error: 'sessionCode is required' });
  }

  try {
    const session = await sessionStore.get(sessionCode);

    if (!session) {
      return res.status(404).json({ error: 'Session code not found or expired' });
    }

    if (session.status !== 'waiting') {
      // If already paired, check if it's the same user (idempotency)
      // This allows controllers to refresh or reconnect without error
      if (session.status === 'paired' && (userId === session.controllerId || (!userId && !session.controllerId))) {
        logger.info('session_already_paired_idempotent', { sessionCode, userId });
        return res.status(200).json({ 
          message: 'Session already paired', 
          sessionCode, 
          userTier: session.userTier || 'free',
          boardId: session.boardId
        });
      }
      
      return res.status(400).json({ error: 'Session is already paired or in an invalid state', status: session.status });
    }

    // Premium Logic: Check user's subscription tier and limits
    let userTier = 'free';
    if (userId) {
      const profile = await getUserProfile(userId);
      if (profile) {
        userTier = profile.subscription_tier || 'free';
        
        // Enforce limits based on tier
        const activeCount = await countActiveSessions(userId);
        const maxDisplays = userTier === 'free' ? 1 : (userTier === 'pro' ? 5 : 20);
        
        if (activeCount >= maxDisplays) {
          logger.warn('pairing_limit_reached', { userId, userTier, activeCount, maxDisplays });
          return res.status(403).json({ 
            error: `Display limit reached for ${userTier} plan (${maxDisplays}). Please upgrade or disconnect another display.`,
            limit: maxDisplays,
            current: activeCount
          });
        }

        logger.info('pairing_with_user_tier', { userId, userTier, activeCount });
      }
    }

    const success = await sessionStore.update(sessionCode, {
      status: 'paired',
      controllerId: userId,
      boardId,
      userTier,
      pairedAt: new Date().toISOString()
    });

    if (success) {
      logger.info('session_paired_successfully', { sessionCode, userId, userTier, boardId });
      
      // Log the pairing to Supabase
      await createDisplaySession(sessionCode, {
        displayUserId: userId, // In this context, the controller is the "owner"
        boardId,
        metadata: { 
          paired_by: userId,
          user_tier: userTier,
          source: 'http_pairing',
          board_id: boardId
        }
      });

      // Broadcast pairing event if any sockets are already listening
      if (global.io) {
        global.io.to(sessionCode).emit('session:paired', { 
          sessionCode, 
          userId,
          userTier,
          boardId
        });
      }

      return res.status(200).json({ 
        message: 'Session paired successfully', 
        sessionCode,
        userTier,
        boardId
      });
    } else {
      throw new Error('Failed to update session in Redis');
    }
  } catch (error) {
    logger.error('Failed to pair session', error, { sessionCode, userId, boardId });
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/sessions/:sessionCode/status
 * Check the status of a session (used by Display to detect pairing).
 */
async function getSessionStatus(req, res) {
  const { sessionCode } = req.params;

  try {
    const session = await sessionStore.get(sessionCode);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.status(200).json(session);
  } catch (error) {
    logger.error('Failed to get session status', error, { sessionCode });
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Register all session management endpoints
 * 
 * @param {Express} app
 */
export function registerSessionEndpoints(app) {
  app.post('/api/sessions/register', registerSession);
  app.post('/api/sessions/pair', pairSession);
  app.get('/api/sessions/:sessionCode/status', getSessionStatus);

  logger.info('Session management endpoints registered', {
    endpoints: [
      'POST /api/sessions/register',
      'POST /api/sessions/pair',
      'GET /api/sessions/:sessionCode/status'
    ]
  });
}
