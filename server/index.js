import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { Resend } from 'resend';

// Import security modules
import { createAuthMiddleware, verifyToken } from './auth.js';
import rateLimiter from './rateLimiter.js';
import { messageSchema, emailSchema, validatePayload } from './validation.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST']
  },
  // Security: Strict mode prevents some attacks
  allowEIO3: false
});

// Resend email client
const resend = new Resend(process.env.RESEND_API_KEY);

// Security: Apply authentication middleware to all socket connections
io.use(createAuthMiddleware());

const PORT = process.env.PORT || 3001;

// Socket.io connection handler
io.on('connection', (socket) => {
  const userId = socket.userId;
  const userEmail = socket.userEmail;
  const isAuthenticated = socket.isAuthenticated;
  const clientIp = socket.handshake.address;
  const { sessionCode } = socket.handshake.auth;

  console.log(`[${new Date().toISOString()}] ✅ User connected: ${socket.id}`);
  console.log(`   └─ IP: ${clientIp}`);
  console.log(`   └─ Auth: ${isAuthenticated ? `✓ ${userEmail}` : '✗ Anonymous'}`);
  console.log(`   └─ Session: ${sessionCode || 'pending'}`);

  if (sessionCode) {
    socket.join(sessionCode);
    console.log(`[${new Date().toISOString()}] 🔗 Socket joined session: ${sessionCode}`);
    console.log(`   └─ Room size: ${io.sockets.adapter.rooms.get(sessionCode)?.size || 1} clients`);

    // Notify room of connection
    io.to(sessionCode).emit('connection:status', { connected: true });
  }

  // Message send event with validation and rate limiting
  socket.on('message:send', (payload, callback) => {
    // Security: Check rate limit
    const rateLimitCheck = rateLimiter.checkUserLimit(userId);
    if (!rateLimitCheck.allowed) {
      const error = `Rate limited: ${rateLimitCheck.retryAfter}s remaining`;
      console.warn(`[RATE_LIMIT] User ${userId} exceeded message limit`);
      return callback?.({
        success: false,
        error,
        retryAfter: rateLimitCheck.retryAfter
      });
    }

    // Security: Validate input payload
    const validation = validatePayload(messageSchema, payload);
    if (!validation.valid) {
      console.warn(`[VALIDATION_ERROR] User ${userId}: ${validation.error}`);
      return callback?.({
        success: false,
        error: validation.error
      });
    }

    const { data: validatedPayload } = validation;
    
    // Security: Verify sessionCode matches user's authorized sessions
    // (could check against database if needed)
    
    console.log(`[${new Date().toISOString()}] 📨 Message in session ${validatedPayload.sessionCode}`);
    console.log(`   └─ From: ${userEmail || 'Anonymous'} (${socket.id})`);
    console.log(`   └─ Content: "${validatedPayload.content.substring(0, 50)}..."`);
    console.log(`   └─ Recipients: ${io.sockets.adapter.rooms.get(validatedPayload.sessionCode)?.size || 0} clients`);

    // Broadcast to everyone in the room
    io.to(validatedPayload.sessionCode).emit('message:received', validatedPayload);

    // Callback to confirm delivery
    callback?.({ success: true });
  });

  socket.on('disconnect', () => {
    console.log(`[${new Date().toISOString()}] 👋 User disconnected: ${socket.id}`);
    console.log(`   └─ Auth: ${isAuthenticated ? userEmail : 'Anonymous'}`);
    console.log(`   └─ Session: ${sessionCode || 'none'}`);
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

    console.log(`[${new Date().toISOString()}] Email sent by ${user.email} to ${emailData.to}`);

    res.json({
      success: true,
      id: result.id
    });
  } catch (error) {
    console.error('Email send error:', error.message);
    res.status(500).json({
      error: 'Failed to send email',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
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
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Digital FlipBoard Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Security: Auth enabled, input validation active, rate limiting enabled\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

