import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

// Lazy-load Supabase client to ensure env vars are loaded
let supabase = null;

function getSupabaseClient() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
    }
    
    supabase = createClient(url, key);
  }
  return supabase;
}

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
    const supabase = getSupabaseClient();
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
      const clientIp = socket.handshake.address;
      
      logger.debug('auth_middleware_checking', {
        has_token: !!token,
        has_session_code: !!sessionCode,
        client_ip: clientIp
      });

      // If token is provided, validate it (strict mode)
      if (token) {
        logger.debug('auth_middleware_validating_token', {
          client_ip: clientIp
        });

        const { valid, user, error } = await verifyToken(token);

        if (!valid) {
          logger.warn('auth_token_validation_failed', {
            error: error || 'Authentication failed',
            client_ip: clientIp
          });
          return next(new Error(error || 'Authentication failed'));
        }

        logger.info('auth_token_validated_success', {
          user_id: user.id,
          user_email: user.email,
          client_ip: clientIp
        });

        // Attach user info to socket for later use
        socket.userId = user.id;
        socket.userEmail = user.email;
        socket.isAuthenticated = true;

        return next();
      }

      // Fallback: Allow connection with sessionCode alone (more permissive)
      // This enables display + controller pairing without auth
      if (sessionCode) {
        logger.info('auth_session_code_connection_allowed', {
          session_code: sessionCode,
          client_ip: clientIp
        });
        socket.userId = null; // Anonymous connection
        socket.userEmail = null;
        socket.isAuthenticated = false;

        return next();
      }

      // No token and no sessionCode - reject connection
      logger.warn('auth_connection_rejected_no_credentials', {
        client_ip: clientIp,
        has_auth_object: !!socket.handshake.auth
      });
      return next(new Error('No authentication token or session code provided'));
    } catch (error) {
      logger.error('auth_middleware_error', error, {
        client_ip: socket.handshake.address
      });
      next(new Error('Authentication middleware error: ' + error.message));
    }
  };
}
