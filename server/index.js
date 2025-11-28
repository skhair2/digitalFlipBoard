// Check if session code is live (active Socket.io room)
app.get('/api/session/exists/:code', (req, res) => {
  const code = req.params.code?.toUpperCase()
  if (!code || code.length !== 6) {
    return res.json({ exists: false })
  }
  const room = io.sockets.adapter.rooms.get(code)
  res.json({ exists: !!room && room.size > 0 })
})
// Periodically disconnect stale sockets (idle >5 min)
const SOCKET_STALE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
setInterval(() => {
  for (const socket of io.sockets.sockets.values()) {
    if (!socket.lastActivity) continue;
    if (Date.now() - socket.lastActivity > SOCKET_STALE_TIMEOUT) {
      const reason = `Stale socket: idle >${SOCKET_STALE_TIMEOUT / 60000} min`;
      logger.info('socket_stale_disconnect', {
        socket_id: socket.id.substring(0, 12),
        session_code: socket.sessionCode || 'none',
        user_id: socket.userId || 'anonymous',
        user_email: socket.userEmail || 'anonymous',
        client_ip: socket.handshake.address,
        user_agent: socket.handshake.headers['user-agent'] || 'unknown',
        last_activity: socket.lastActivity,
        reason
      });
      socket.emit('session:force-disconnect', { reason });
      socket.disconnect(true);
    }
  }
}, 60 * 1000); // every minute
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// Import security modules
import { createAuthMiddleware, verifyToken } from './auth.js';
import { messageSchema, emailSchema, validatePayload } from './validation.js';

// Import infrastructure modules
import logger from './logger.js';
import { connectRedis, sessionStore, activityStore } from './redis.js';
import { createRateLimiter } from './redisRateLimiter.js';
import { registerHealthCheckRoutes, readinessMiddleware } from './healthCheck.js';

dotenv.config();

const app = express();

// Initialize rate limiter with Redis backend
const rateLimiter = createRateLimiter();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.logApiCall(req.method, req.path, res.statusCode, duration, req.userId);
  });
  next();
});

// Security: CORS Configuration - Only allow specific origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS not allowed for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security: HTTP Headers
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // HSTS (for production HTTPS only)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // In development: allow all origins since they're connecting via pairing code
      // In production: use ALLOWED_ORIGINS env var
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('CORS not allowed'));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST']
  },
  // Security: Strict mode prevents some attacks
  allowEIO3: false
});

// Resend email client
const resend = new Resend(process.env.RESEND_API_KEY);

// Supabase client for fetching user profile data
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Apply readiness middleware to API routes (skip health checks)
app.use((req, res, next) => {
  if (req.path.startsWith('/health') || req.path === '/metrics') {
    return next();
  }
  readinessMiddleware(req, res, next);
});

// Register health check routes before protected routes
registerHealthCheckRoutes(app);

// Security: Apply authentication middleware to all socket connections
io.use(createAuthMiddleware());

const PORT = process.env.PORT || 3001;

// Configuration for session management
const SESSION_CONFIG = {
  // Inactivity timeout in milliseconds (15 minutes default)
  INACTIVITY_TIMEOUT: parseInt(process.env.INACTIVITY_TIMEOUT || '900000', 10),
  // Warning threshold before killing (5 minutes before timeout)
  INACTIVITY_WARNING_THRESHOLD: parseInt(process.env.INACTIVITY_WARNING_THRESHOLD || '600000', 10),
  // Check interval for inactive sessions (1 minute)
  CHECK_INTERVAL: parseInt(process.env.CHECK_INTERVAL || '60000', 10),
  // Max session lifetime (24 hours)
  MAX_SESSION_LIFETIME: parseInt(process.env.MAX_SESSION_LIFETIME || '86400000', 10)
};

// NOTE: Sessions are now stored in Redis instead of in-memory Map
// This allows for distributed session state across multiple server instances

/**
 * Update session activity timestamp using Redis
 */
async function updateSessionActivity(sessionCode) {
  try {
    await activityStore.updateActivity(sessionCode);
  } catch (error) {
    logger.error('Failed to update session activity', error, { session_code: sessionCode });
  }
}

/**
 * Get session inactivity duration using Redis
 */
async function getSessionInactivityDuration(sessionCode) {
  try {
    return await activityStore.getInactivityDuration(sessionCode);
  } catch (error) {
    logger.error('Failed to get inactivity duration', error, { session_code: sessionCode });
    return 0;
  }
}

/**
 * Notify session of upcoming termination
 */
function notifySessionWarning(sessionCode, minutesRemaining) {
  logger.warn('session_inactivity_warning', {
    session_code: sessionCode,
    minutes_remaining: minutesRemaining
  });
  io.to(sessionCode).emit('session:inactivity:warning', {
    message: `Session inactive for too long. Disconnecting in ${minutesRemaining} minutes.`,
    minutesRemaining,
    timestamp: new Date().toISOString()
  });
}

/**
 * Terminate a session and disconnect all clients
 */
function terminateSession(sessionCode, reason = 'inactivity') {
  logger.logSessionTermination(sessionCode, reason, 0);

  const room = io.sockets.adapter.rooms.get(sessionCode);
  if (!room) {
    logger.debug('session_already_terminated', { session_code: sessionCode });
    return;
  }

  const clientSockets = Array.from(room);

  // Notify clients before terminating
  io.to(sessionCode).emit('session:terminated', {
    reason,
    message: 'Session has been terminated due to ' + reason,
    timestamp: new Date().toISOString()
  });

  // Disconnect all sockets in the session
  clientSockets.forEach((socketId) => {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit('session:force-disconnect', {
        reason,
        message: `Session terminated: ${reason}`
      });
      socket.leave(sessionCode);
      socket.disconnect(true);
    }
  });

  // Clean up Redis session data
  sessionStore.delete(sessionCode).catch(err => {
    logger.error('Failed to delete session from Redis', err, { session_code: sessionCode });
  });
}

/**
 * Monitor and terminate inactive sessions
 * Runs periodically to check for stale sessions
 */
async function monitorInactiveSessions() {
  try {
    // Note: In a distributed system, you would query all active sessions
    // For now, we monitor only sessions with active connections
    const rooms = io.sockets.adapter.rooms;

    for (const [sessionCode, clients] of rooms.entries()) {
      // Skip socket.io internal rooms (they start with /)
      if (sessionCode.startsWith('/')) continue;

      // Check if session has clients
      if (!clients || clients.size === 0) continue;

      const inactivityDuration = await getSessionInactivityDuration(sessionCode);
      const inactivityMinutes = Math.floor(inactivityDuration / 60000);

      // Check if session is inactive and send warning
      if (
        inactivityDuration >= SESSION_CONFIG.INACTIVITY_WARNING_THRESHOLD &&
        inactivityDuration < SESSION_CONFIG.INACTIVITY_TIMEOUT
      ) {
        const minutesRemaining = Math.floor(
          (SESSION_CONFIG.INACTIVITY_TIMEOUT - inactivityDuration) / 60000
        );
        notifySessionWarning(sessionCode, minutesRemaining);
      }

      // Terminate inactive session
      if (inactivityDuration >= SESSION_CONFIG.INACTIVITY_TIMEOUT) {
        terminateSession(sessionCode, `inactivity (${inactivityMinutes} minutes idle)`);
      }
    }
  } catch (error) {
    logger.error('Error monitoring inactive sessions', error);
  }
}

/**
 * Start the inactivity monitoring loop
 */
function startInactivityMonitoring() {
  logger.info('session_monitoring_started', {
    inactivity_timeout_minutes: Math.round(SESSION_CONFIG.INACTIVITY_TIMEOUT / 60000),
    warning_threshold_minutes: Math.round(SESSION_CONFIG.INACTIVITY_WARNING_THRESHOLD / 60000),
    check_interval_seconds: Math.round(SESSION_CONFIG.CHECK_INTERVAL / 1000)
  });

  setInterval(monitorInactiveSessions, SESSION_CONFIG.CHECK_INTERVAL);
}

// Socket.io connection handler
io.on('connection', (socket) => {
  const userId = socket.userId;
  const userEmail = socket.userEmail;
  const isAuthenticated = socket.isAuthenticated;
  const clientIp = socket.handshake.address;
  const userAgent = socket.handshake.headers['user-agent'] || 'unknown';
  const { sessionCode, role } = socket.handshake.auth;
  const connectionTime = new Date().toISOString();

  socket.connectedAt = Date.now();
  socket.lastActivity = Date.now(); // Track last activity timestamp

  logger.debug('socket_connection_initiated', {
    socket_id: socket.id.substring(0, 12),
    client_ip: clientIp,
    user_agent: userAgent.substring(0, 80),
    has_session_code: !!sessionCode,
    is_authenticated: isAuthenticated,
    user_email: userEmail || 'anonymous'
  });

  logger.logSocketConnection(socket, { id: userId, email: userEmail });

  if (!sessionCode) {
    logger.warn('socket_connection_no_session_code', {
      socket_id: socket.id.substring(0, 12),
      user_id: userId || 'anonymous',
      client_ip: clientIp
    });
    return;
  }

  if (sessionCode) {
    socket.sessionCode = sessionCode;
    socket.role = role || 'display';

    logger.info('socket_joining_session', {
      socket_id: socket.id.substring(0, 12),
      session_code: sessionCode,
      user_id: userId || 'anonymous',
      user_email: userEmail || 'anonymous',
      is_authenticated: isAuthenticated,
      role: socket.role
    });
    if (socket.role === 'controller') {
      logger.info('[CONTROLLER CONNECT] ================================')
      logger.info(`  Socket ID: ${socket.id.substring(0, 12)}`)
      logger.info(`  Session Code: ${sessionCode}`)
      logger.info(`  User ID: ${userId || 'anonymous'}`)
      logger.info(`  User Email: ${userEmail || 'anonymous'}`)
      logger.info(`  Client IP: ${clientIp}`)
      logger.info(`  User Agent: ${userAgent}`)
      logger.info('  Event: connection:status_emit_attempt')
      logger.info('====================================================')
    } else {
      logger.info('[DISPLAY CONNECT] ==================================')
      logger.info(`  Socket ID: ${socket.id.substring(0, 12)}`)
      logger.info(`  Session Code: ${sessionCode}`)
      logger.info(`  User ID: ${userId || 'anonymous'}`)
      logger.info(`  User Email: ${userEmail || 'anonymous'}`)
      logger.info(`  Client IP: ${clientIp}`)
      logger.info(`  User Agent: ${userAgent}`)
      logger.info('  Event: display_joined')
      logger.info('====================================================')
    }

    // Initialize session in Redis
    sessionStore.save(sessionCode, {
      sessionCode,
      createdAt: connectionTime,
      clients: [{
        socketId: socket.id,
        userId,
        userEmail,
        isAuthenticated,
        clientIp,
        joinedAt: connectionTime,
        userAgent,
        role: socket.role
      }]
    }).catch(err => {
      logger.error('Failed to save session to Redis', err, { session_code: sessionCode, socket_id: socket.id.substring(0, 12) });
    });

    socket.join(sessionCode);
    const roomSize = io.sockets.adapter.rooms.get(sessionCode)?.size || 1;

    logger.info('client_joined_session', {
      session_code: sessionCode,
      socket_id: socket.id.substring(0, 12),
      room_size: roomSize,
      total_rooms: io.sockets.adapter.rooms.size,
      user_id: userId || 'anonymous',
      role: socket.role
    });

    // Only emit connection:status when a controller joins
    if (socket.role === 'controller') {
      logger.debug('emitting_connection_status', {
        session_code: sessionCode,
        room_size: roomSize,
        event: 'connection:status',
        role: socket.role
      });
      io.to(sessionCode).emit('connection:status', { connected: true });
    }

    // Fetch and send controller's subscription tier to display (async operation)
    if (userId && socket.role === 'controller') {
      (async () => {
        try {
          logger.debug('fetching_user_profile_tier', {
            user_id: userId,
            session_code: sessionCode
          });

          const { data: profile, error } = await supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('id', userId)
            .single();

          if (error) {
            logger.warn('Failed to fetch user profile for tier info', {
              user_id: userId,
              error: error.message,
              session_code: sessionCode
            });
          } else {
            const tier = profile?.subscription_tier || 'free';
            logger.info('sending_controller_tier', {
              session_code: sessionCode,
              user_id: userId,
              subscription_tier: tier,
              room_size: io.sockets.adapter.rooms.get(sessionCode)?.size || 0
            });
            // Send controller's tier to all clients in the room
            io.to(sessionCode).emit('controller:tier', { tier });
          }
        } catch (error) {
          logger.error('Error fetching controller tier', error, {
            user_id: userId,
            session_code: sessionCode
          });
        }
      })();
    } else {
      logger.debug('no_user_id_skipping_tier_fetch', {
        session_code: sessionCode,
        socket_id: socket.id.substring(0, 12),
        role: socket.role
      });
    }
  }

  // Message send event with validation and rate limiting
  socket.on('message:send', async (payload, callback) => {
    socket.lastActivity = Date.now();
    try {
      logger.debug('message_send_received', {
        socket_id: socket.id.substring(0, 12),
        session_code: payload?.sessionCode,
        content_length: payload?.content?.length || 0,
        user_id: userId || 'anonymous'
      });

      // Update session activity when message is sent
      if (payload?.sessionCode) {
        await updateSessionActivity(payload.sessionCode);
      }

      // Security: Check rate limit
      const rateLimitCheck = await rateLimiter.checkUserLimit(userId || clientIp);
      if (!rateLimitCheck.allowed) {
        logger.logRateLimitExceeded(userId || clientIp, 'message', rateLimitCheck.retryAfter);
        return callback?.({
          success: false,
          error: `Rate limited: ${rateLimitCheck.retryAfter}s remaining`,
          retryAfter: rateLimitCheck.retryAfter
        });
      }

      // Security: Validate input payload
      const validation = validatePayload(messageSchema, payload);
      if (!validation.valid) {
        logger.warn('message_validation_failed', {
          user_id: userId,
          error: validation.error,
          session_code: payload?.sessionCode
        });
        return callback?.({
          success: false,
          error: validation.error
        });
      }

      const { data: validatedPayload } = validation;
      const targetSession = validatedPayload.sessionCode;
      const room = io.sockets.adapter.rooms.get(targetSession);
      const recipients = room ? room.size : 0;

      logger.logMessageSent(targetSession, userEmail || userId, validatedPayload.content, recipients);

      // Broadcast to everyone in the room
      io.to(targetSession).emit('message:received', validatedPayload);

      // Callback to confirm delivery
      callback?.({ success: true });
    } catch (error) {
      logger.error('message:send handler failed', error, { user_id: userId });
      callback?.({ success: false, error: 'Internal server error' });
    }
  });

  // Track activity for any client interaction
  socket.on('client:activity', async (data) => {
    socket.lastActivity = Date.now();
    if (data?.sessionCode) {
      await updateSessionActivity(data.sessionCode);
    }
  });

  // Heartbeat handler to prevent stale connection disconnects
  socket.on('client:heartbeat', async (data) => {
    socket.lastActivity = Date.now();
    if (data?.sessionCode) {
      // Update Redis session activity to prevent session expiration
      await updateSessionActivity(data.sessionCode);

      logger.debug('heartbeat_received', {
        socket_id: socket.id.substring(0, 12),
        session_code: data.sessionCode
      });
    }
  });

  socket.on('disconnect', () => {
    socket.lastActivity = Date.now();
    const roomSize = socket.sessionCode ? (io.sockets.adapter.rooms.get(socket.sessionCode)?.size || 0) : 0;

    logger.info('socket_disconnect', {
      socket_id: socket.id.substring(0, 12),
      session_code: socket.sessionCode || 'none',
      room_size_after: Math.max(0, roomSize - 1),
      user_id: userId || 'anonymous',
      user_email: userEmail || 'anonymous',
      connection_duration_ms: Date.now() - socket.connectedAt
    });

    logger.logSocketDisconnection(socket, 'client');

    // Remove from Redis session
    if (socket.sessionCode) {
      sessionStore.removeClient(socket.sessionCode, socket.id).catch(err => {
        logger.error('Failed to remove client from Redis session', err, {
          session_code: socket.sessionCode,
          socket_id: socket.id.substring(0, 12)
        });
      });
    }
  });
});

// API Endpoints

/**
 * POST /api/send-email
 * Secure endpoint for sending emails via Resend
 * Requires authentication token
 */
app.post('/api/send-email', async (req, res) => {
  try {
    // Security: Verify authentication token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { valid, user } = await verifyToken(token);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Security: Validate email payload
    const validation = validatePayload(emailSchema, req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { data: emailData } = validation;

    // Send email
    const result = await resend.emails.send({
      from: 'noreply@flipdisplay.online',
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    });

    logger.info('email_sent', {
      user_email: user.email,
      recipient: emailData.to,
      email_id: result.id
    });

    res.json({
      success: true,
      id: result.id
    });
  } catch (error) {
    logger.error('Email send failed', error, { recipient: req.body.to });
    res.status(500).json({
      error: 'Failed to send email',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/send-magic-link
 * Generate Supabase magic link and send via Resend with custom template
 */
app.post('/api/auth/send-magic-link', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const redirectUrl = process.env.VITE_APP_URL || 'http://localhost:5173';
    const { data: otpData, error: otpError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${redirectUrl}/auth/callback` }
    });

    if (otpError || !otpData.properties?.action_link) {
      logger.error('Magic link generation failed', otpError, { email });
      return res.status(500).json({ error: 'Failed to generate magic link' });
    }

    const magicLink = otpData.properties.action_link;
    const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"><div style="max-width:560px;margin:0 auto;padding:20px"><div style="text-align:center;margin-bottom:24px"><span style="font-size:24px;font-weight:bold;color:#fff">FlipDisplay.online</span></div><div style="background-color:#1e293b;border-radius:12px;border:1px solid #334155;padding:24px"><h1 style="font-size:24px;font-weight:bold;color:#fff;margin-bottom:16px;text-align:center">Your Magic Link</h1><p style="font-size:16px;line-height:26px;color:#cbd5e1;margin-bottom:16px">Click the button below to sign in to your FlipDisplay account. This link will expire in 1 hour.</p><div style="text-align:center;margin-top:32px;margin-bottom:32px"><a href="${magicLink}" style="background-color:#14b8a6;border-radius:8px;color:#fff;font-size:16px;font-weight:bold;text-decoration:none;display:inline-block;padding:12px 24px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)">Sign In to FlipDisplay</a></div><p style="font-size:14px;line-height:22px;color:#94a3b8;margin-bottom:16px">Or copy and paste this link into your browser:</p><div style="background:#0f172a;border-radius:8px;padding:12px;margin:16px 0;border:1px solid #334155;word-break:break-all"><span style="font-size:12px;color:#2dd4bf;font-family:monospace">${magicLink}</span></div><hr style="border-color:#334155;margin:20px 0"><p style="font-size:16px;line-height:26px;color:#cbd5e1">If you didn't request this link, you can safely ignore this email.</p></div><div style="margin-top:32px;text-align:center"><p style="font-size:12px;color:#64748b;margin-bottom:8px">© ${new Date().getFullYear()} FlipDisplay.online. All rights reserved.</p></div></div></body></html>`;

    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@flipdisplay.online',
      to: email,
      subject: 'Sign in to FlipDisplay',
      html: emailHtml,
      text: `Sign in to FlipDisplay: ${magicLink}`
    });

    logger.info('magic_link_sent_via_resend', { email, email_id: result.id });
    res.json({ success: true, message: 'Magic link sent to your email' });
  } catch (error) {
    logger.error('Magic link send failed', error, { email: req.body.email });
    res.status(500).json({ error: 'Failed to send magic link', message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
});

/**
 * Health check endpoint
 */
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

/**
 * Diagnostic endpoint - Show server state and connection info
 */
app.get('/api/diagnostics', (req, res) => {
  const rooms = io.sockets.adapter.rooms;
  const allSockets = io.sockets.sockets;

  const sessionInfo = [];
  for (const [roomName, clients] of rooms.entries()) {
    if (!roomName.startsWith('/') && clients && clients.size > 0) {
      const socketArray = Array.from(clients);
      sessionInfo.push({
        session_code: roomName,
        client_count: clients.size,
        socket_ids: socketArray.map(id => id.substring(0, 12))
      });
    }
  }

  // Add socket details for diagnostics
  const socketDetails = [];
  for (const socket of allSockets.values()) {
    socketDetails.push({
      socket_id: socket.id.substring(0, 12),
      session_code: socket.sessionCode || 'none',
      user_id: socket.userId || 'anonymous',
      user_email: socket.userEmail || 'anonymous',
      client_ip: socket.handshake.address,
      user_agent: socket.handshake.headers['user-agent'] || 'unknown',
      connected_at: socket.connectedAt,
      last_activity: socket.lastActivity
    });
  }
  res.json({
    server_status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime_seconds: Math.floor(process.uptime()),
    memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    socket_stats: {
      total_connected_sockets: allSockets.size,
      active_sessions: sessionInfo.length,
      sessions: sessionInfo,
      sockets: socketDetails
    },
    redis_status: 'configured',
    websocket_url: `ws://0.0.0.0:${process.env.PORT || 3001}`,
    cors_enabled: true,
    auth_methods: ['token', 'sessionCode']
  });
});

/**
 * Debug endpoint - List all active sessions
 */
app.get('/api/debug/sessions', async (req, res) => {
  try {
    const sessions = [];
    const rooms = io.sockets.adapter.rooms;

    for (const [roomName, clients] of rooms.entries()) {
      // Skip Socket.io internal rooms
      if (roomName.startsWith('/') || !clients || clients.size === 0) continue;

      const sessionData = await sessionStore.get(roomName);
      const inactivityDuration = await getSessionInactivityDuration(roomName);

      sessions.push({
        session_code: roomName,
        client_count: clients.size,
        inactivity_minutes: Math.floor(inactivityDuration / 60000),
        clients: sessionData?.clients || []
      });
    }

    res.json({
      timestamp: new Date().toISOString(),
      total_sessions: sessions.length,
      total_connected_sockets: io.sockets.sockets.size,
      sessions
    });
  } catch (error) {
    logger.error('Failed to fetch sessions debug info', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

/**
 * Debug endpoint - Get specific session details
 */
app.get('/api/debug/sessions/:sessionCode', async (req, res) => {
  try {
    const { sessionCode } = req.params;
    const room = io.sockets.adapter.rooms.get(sessionCode);
    const sessionData = await sessionStore.get(sessionCode);
    const inactivityDuration = await getSessionInactivityDuration(sessionCode);

    if (!sessionData) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      session_code: sessionCode,
      client_count: room?.size || 0,
      inactivity_duration_ms: inactivityDuration,
      inactivity_minutes: Math.floor(inactivityDuration / 60000),
      created_at: sessionData.createdAt,
      clients: sessionData.clients || []
    });
  } catch (error) {
    logger.error('Failed to fetch session details', error, { session_code: req.params.sessionCode });
    res.status(500).json({ error: 'Failed to fetch session details' });
  }
});

/**
 * Admin endpoint to manually terminate a session
 */
app.post('/api/admin/sessions/:sessionCode/terminate', (req, res) => {
  try {
    const { sessionCode } = req.params;
    const { reason = 'admin request' } = req.body;

    const room = io.sockets.adapter.rooms.get(sessionCode);
    if (!room || room.size === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    terminateSession(sessionCode, reason);

    res.json({
      success: true,
      message: `Session ${sessionCode} terminated`,
      reason
    });
  } catch (error) {
    logger.error('Error terminating session', error, { session_code: req.params.sessionCode });
    res.status(500).json({
      error: 'Failed to terminate session',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

/**
 * Error handler
 */
app.use((error, req, res) => {
  console.error('Error:', error.message);

  // CORS error
  if (error.message?.includes('CORS')) {
    return res.status(403).json({ error: 'CORS policy violation' });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Start server
async function startServer() {
  try {
    // Validate required environment variables
    const requiredEnvs = ['SUPABASE_URL', 'REDIS_URL'];
    const missingEnvs = requiredEnvs.filter(env => !process.env[env]);

    if (missingEnvs.length > 0) {
      logger.critical('Missing required environment variables', null, {
        missing: missingEnvs
      });
      process.exit(1);
    }

    // Connect to Redis
    await connectRedis();

    // Start HTTP server on all network interfaces (0.0.0.0) for internet accessibility
    httpServer.listen(PORT, '0.0.0.0', () => {
      logger.info('server_started', {
        port: PORT,
        address: '0.0.0.0',
        environment: process.env.NODE_ENV || 'development',
        redis_url: process.env.REDIS_URL?.split('@')[1] || 'configured',
        features: ['redis-sessions', 'structured-logging', 'health-checks', 'redis-rate-limiting']
      });

      // Start monitoring inactive sessions
      startInactivityMonitoring();
    });
  } catch (error) {
    logger.critical('Failed to start server', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('server_shutting_down', { reason: 'SIGTERM signal' });
  httpServer.close(() => {
    logger.info('server_closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  console.error('Stack:', error.stack);
  logger.critical('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  console.error('Promise:', promise);
  logger.critical('Unhandled rejection', reason);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.critical('Unhandled rejection', new Error(`Promise rejected: ${reason}`), {
    promise: promise.toString()
  });
});

