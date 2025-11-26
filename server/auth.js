import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Verify Supabase JWT token and get user
 * Used for Socket.io authentication
 */
export async function verifyToken(token) {
  try {
    if (!token) {
      return { valid: false, error: 'No token provided' };
    }

    // Verify JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { valid: false, error: 'Invalid token' };
    }

    return { valid: true, user };
  } catch (error) {
    console.error('Token verification error:', error.message);
    return { valid: false, error: 'Token verification failed' };
  }
}

/**
 * Middleware for Socket.io authentication
 * Verifies token on connection handshake if provided
 * Allows fallback to sessionCode-based auth for backward compatibility
 */
export function createAuthMiddleware() {
  return async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const sessionCode = socket.handshake.auth?.sessionCode;
      
      // If token is provided, validate it (strict mode)
      if (token) {
        const { valid, user, error } = await verifyToken(token);

        if (!valid) {
          return next(new Error(error || 'Authentication failed'));
        }

        // Attach user info to socket for later use
        socket.userId = user.id;
        socket.userEmail = user.email;
        socket.isAuthenticated = true;

        return next();
      }

      // Fallback: Allow connection with sessionCode alone (more permissive)
      // This enables display + controller pairing without auth
      if (sessionCode) {
        console.log(`[Auth] Connection allowed via sessionCode: ${sessionCode}`);
        socket.userId = null; // Anonymous connection
        socket.userEmail = null;
        socket.isAuthenticated = false;

        return next();
      }

      // No token and no sessionCode - reject connection
      return next(new Error('No authentication token or session code provided'));
    } catch (error) {
      next(new Error('Authentication middleware error: ' + error.message));
    }
  };
}
