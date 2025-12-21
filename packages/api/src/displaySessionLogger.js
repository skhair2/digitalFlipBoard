/**
 * displaySessionLogger.js - Logs display and controller connections to Supabase
 * Tracks session metadata, connection events, and client information
 */

import { createClient } from '@supabase/supabase-js';
import logger from './logger.js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
  logger.info('displaySessionLogger Supabase client initialized');
} else {
  logger.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY - displaySessionLogger disabled');
}

/**
 * Create or update a display session record
 */
export async function createDisplaySession(sessionCode, options = {}) {
  try {
    if (!supabase) {
      logger.warn('Supabase not initialized for displaySessionLogger');
      return null;
    }

    const {
      displayUserId = null,
      boardId = null,
      metadata = {},
    } = options;

    const { data, error } = await supabase
      .from('display_sessions')
      .upsert(
        {
          session_code: sessionCode,
          display_user_id: displayUserId,
          board_id: boardId,
          status: 'active',
          is_active: true,
          created_at: new Date().toISOString(),
          metadata,
        },
        { onConflict: 'session_code' }
      )
      .select()
      .single();

    if (error) {
      logger.error('Failed to create display session', error, { session_code: sessionCode });
      return null;
    }

    logger.debug('Created display session', { session_code: sessionCode, session_id: data.id });
    return data;
  } catch (err) {
    logger.error('Exception creating display session', err, { session_code: sessionCode });
    return null;
  }
}

/**
 * Count active display sessions for a user
 */
export async function countActiveSessions(userId) {
  try {
    if (!supabase) return 0;

    const { count, error } = await supabase
      .from('display_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('display_user_id', userId)
      .eq('is_active', true);

    if (error) {
      logger.error('Failed to count active sessions', error, { userId });
      return 0;
    }

    return count || 0;
  } catch (err) {
    logger.error('Exception counting active sessions', err, { userId });
    return 0;
  }
}

/**
 * Log a device connection (display or controller) to a session
 */
export async function logDisplayConnection(sessionCode, connectionType, options = {}) {
  try {
    if (!supabase) {
      logger.warn('Supabase not initialized for displaySessionLogger');
      return null;
    }

    const {
      userId = null,
      email = null,
      deviceInfo = {},
      ipAddress = null,
      socketId = null,
      metadata = {},
    } = options;

    // First, get or create the display session
    let sessionId = null;
    const { data: sessionData } = await supabase
      .from('display_sessions')
      .select('id')
      .eq('session_code', sessionCode)
      .single();

    if (sessionData) {
      sessionId = sessionData.id;
    } else {
      // Create session if it doesn't exist
      const newSession = await createDisplaySession(sessionCode);
      if (newSession) {
        sessionId = newSession.id;
      } else {
        logger.warn('Could not create session for connection log', { session_code: sessionCode });
        return null;
      }
    }

    // Log the connection
    const { data, error } = await supabase
      .from('display_connections')
      .insert({
        session_id: sessionId,
        connection_type: connectionType,
        user_id: userId,
        email,
        device_info: deviceInfo,
        ip_address: ipAddress,
        socket_id: socketId,
        connected_at: new Date().toISOString(),
        metadata,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to log display connection', error, {
        session_code: sessionCode,
        connection_type: connectionType,
      });
      return null;
    }

    logger.debug('Logged display connection', {
      session_code: sessionCode,
      connection_id: data.id,
      connection_type: connectionType,
    });

    return data;
  } catch (err) {
    logger.error('Exception logging display connection', err, {
      session_code: sessionCode,
      connection_type: connectionType,
    });
    return null;
  }
}

/**
 * Update display connected status
 */
export async function updateDisplayConnected(sessionCode, options = {}) {
  try {
    if (!supabase) return null;

    const {
      userId = null,
      deviceInfo = {},
    } = options;

    const { data, error } = await supabase
      .from('display_sessions')
      .update({
        display_user_id: userId,
        display_connected_at: new Date().toISOString(),
        display_device_info: deviceInfo,
        is_active: true,
      })
      .eq('session_code', sessionCode)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update display connected', error, { session_code: sessionCode });
      return null;
    }

    logger.debug('Updated display connected', { session_code: sessionCode });
    return data;
  } catch (err) {
    logger.error('Exception updating display connected', err, { session_code: sessionCode });
    return null;
  }
}

/**
 * Update controller connected status
 */
export async function updateControllerConnected(sessionCode, options = {}) {
  try {
    if (!supabase) return null;

    const {
      userId = null,
      deviceInfo = {},
    } = options;

    const { data, error } = await supabase
      .from('display_sessions')
      .update({
        controller_user_id: userId,
        controller_connected_at: new Date().toISOString(),
        controller_device_info: deviceInfo,
        is_active: true,
        last_activity_at: new Date().toISOString(),
      })
      .eq('session_code', sessionCode)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update controller connected', error, { session_code: sessionCode });
      return null;
    }

    logger.debug('Updated controller connected', { session_code: sessionCode });
    return data;
  } catch (err) {
    logger.error('Exception updating controller connected', err, { session_code: sessionCode });
    return null;
  }
}

/**
 * Log display disconnection
 */
export async function logDisplayDisconnection(sessionCode) {
  try {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('display_sessions')
      .update({
        display_disconnected_at: new Date().toISOString(),
      })
      .eq('session_code', sessionCode)
      .select()
      .single();

    if (error) {
      logger.error('Failed to log display disconnection', error, { session_code: sessionCode });
      return null;
    }

    logger.debug('Logged display disconnection', { session_code: sessionCode });
    return data;
  } catch (err) {
    logger.error('Exception logging display disconnection', err, { session_code: sessionCode });
    return null;
  }
}

/**
 * Log controller disconnection
 */
export async function logControllerDisconnection(sessionCode, disconnectReason = 'manual') {
  try {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('display_sessions')
      .update({
        controller_disconnected_at: new Date().toISOString(),
        disconnect_reason: disconnectReason,
      })
      .eq('session_code', sessionCode)
      .select()
      .single();

    if (error) {
      logger.error('Failed to log controller disconnection', error, { session_code: sessionCode });
      return null;
    }

    logger.debug('Logged controller disconnection', { session_code: sessionCode, reason: disconnectReason });
    return data;
  } catch (err) {
    logger.error('Exception logging controller disconnection', err, { session_code: sessionCode });
    return null;
  }
}

/**
 * Record message sent in session
 */
export async function recordSessionMessage(sessionCode) {
  try {
    if (!supabase) return null;

    const { data: sessionData } = await supabase
      .from('display_sessions')
      .select('total_messages_sent, last_message_at')
      .eq('session_code', sessionCode)
      .single();

    if (!sessionData) return null;

    const { data, error } = await supabase
      .from('display_sessions')
      .update({
        total_messages_sent: (sessionData.total_messages_sent || 0) + 1,
        last_message_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      })
      .eq('session_code', sessionCode)
      .select()
      .single();

    if (error) {
      logger.error('Failed to record session message', error, { session_code: sessionCode });
      return null;
    }

    return data;
  } catch (err) {
    logger.error('Exception recording session message', err, { session_code: sessionCode });
    return null;
  }
}

/**
 * Update connection activity timestamp
 */
export async function updateConnectionActivity(connectionId) {
  try {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('display_connections')
      .update({
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', connectionId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update connection activity', error, { connection_id: connectionId });
      return null;
    }

    return data;
  } catch (err) {
    logger.error('Exception updating connection activity', err, { connection_id: connectionId });
    return null;
  }
}

/**
 * Increment message count for connection
 */
export async function incrementConnectionMessageCount(connectionId) {
  try {
    if (!supabase) return null;

    const { data: connData } = await supabase
      .from('display_connections')
      .select('message_count')
      .eq('id', connectionId)
      .single();

    if (!connData) return null;

    const { data, error } = await supabase
      .from('display_connections')
      .update({
        message_count: (connData.message_count || 0) + 1,
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', connectionId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to increment connection message count', error, { connection_id: connectionId });
      return null;
    }

    return data;
  } catch (err) {
    logger.error('Exception incrementing connection message count', err, { connection_id: connectionId });
    return null;
  }
}

/**
 * Log connection disconnection
 */
export async function logConnectionDisconnection(connectionId) {
  try {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('display_connections')
      .update({
        disconnected_at: new Date().toISOString(),
      })
      .eq('id', connectionId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to log connection disconnection', error, { connection_id: connectionId });
      return null;
    }

    logger.debug('Logged connection disconnection', { connection_id: connectionId });
    return data;
  } catch (err) {
    logger.error('Exception logging connection disconnection', err, { connection_id: connectionId });
    return null;
  }
}

export default {
  createDisplaySession,
  logDisplayConnection,
  updateDisplayConnected,
  updateControllerConnected,
  logDisplayDisconnection,
  logControllerDisconnection,
  recordSessionMessage,
  updateConnectionActivity,
  incrementConnectionMessageCount,
  logConnectionDisconnection,
};
