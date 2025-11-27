/**
 * Structured Logging System
 * Provides consistent, machine-readable logging for all server operations
 */
import fs from 'fs';
import path from 'path';

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

const LOG_COLORS = {
  DEBUG: '\x1b[36m',    // Cyan
  INFO: '\x1b[32m',     // Green
  WARN: '\x1b[33m',     // Yellow
  ERROR: '\x1b[31m',    // Red
  CRITICAL: '\x1b[35m', // Magenta
  RESET: '\x1b[0m'
};

class Logger {
  constructor(options = {}) {
    this.minLevel = LOG_LEVELS[options.minLevel || 'INFO'];
    this.logDir = options.logDir || './logs';
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile !== false;
    this.enableColor = options.enableColor !== false;
    this.service = options.service || 'digitalflipboard';

    // Ensure log directory exists
    if (this.enableFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Format log message as JSON for machine-readability
   */
  formatJson(level, message, data = {}, error = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: this.service,
      message,
      ...data
    };

    if (error) {
      logEntry.error = {
        message: error.message,
        stack: error.stack,
        code: error.code
      };
    }

    return JSON.stringify(logEntry);
  }

  /**
   * Format log message for console output
   */
  formatConsole(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const levelStr = level.padEnd(8);
    const color = this.enableColor ? LOG_COLORS[level] : '';
    const reset = this.enableColor ? LOG_COLORS.RESET : '';

    let output = `${reset}[${timestamp}] ${color}${levelStr}${reset} ${message}`;

    if (Object.keys(data).length > 0) {
      output += ` ${JSON.stringify(data)}`;
    }

    return output;
  }

  /**
   * Write to file
   */
  writeToFile(level, jsonLog) {
    try {
      const date = new Date();
      const filename = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.log`;
      const filepath = path.join(this.logDir, filename);

      fs.appendFileSync(filepath, jsonLog + '\n');
    } catch (error) {
      console.error('Failed to write log to file:', error.message);
    }
  }

  /**
   * Core logging function
   */
  log(level, message, data = {}, error = null) {
    if (LOG_LEVELS[level] < this.minLevel) {
      return;
    }

    const jsonLog = this.formatJson(level, message, data, error);
    const consoleLog = this.formatConsole(level, message, data);

    if (this.enableConsole) {
      console.log(consoleLog);
    }

    if (this.enableFile) {
      this.writeToFile(level, jsonLog);
    }
  }

  /**
   * Convenience methods
   */
  debug(message, data = {}) {
    this.log('DEBUG', message, data);
  }

  info(message, data = {}) {
    this.log('INFO', message, data);
  }

  warn(message, data = {}) {
    this.log('WARN', message, data);
  }

  error(message, error = null, data = {}) {
    this.log('ERROR', message, data, error);
  }

  critical(message, error = null, data = {}) {
    this.log('CRITICAL', message, data, error);
  }

  /**
   * Log Socket.io connection
   */
  logSocketConnection(socket, user = null) {
    this.info('socket_connected', {
      socket_id: socket.id.substring(0, 12),
      user_id: user?.id || 'anonymous',
      user_email: user?.email || null,
      ip: socket.handshake.address,
      user_agent: socket.handshake.headers['user-agent']?.substring(0, 100) || 'unknown'
    });
  }

  /**
   * Log Socket.io disconnection
   */
  logSocketDisconnection(socket, reason = 'client') {
    this.info('socket_disconnected', {
      socket_id: socket.id.substring(0, 12),
      user_id: socket.userId || 'anonymous',
      reason,
      connected_duration_ms: Date.now() - socket.connectedAt
    });
  }

  /**
   * Log message sent
   */
  logMessageSent(sessionCode, userId, content, recipients) {
    this.info('message_sent', {
      session_code: sessionCode,
      user_id: userId || 'anonymous',
      content_length: content.length,
      recipient_count: recipients,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log rate limit exceeded
   */
  logRateLimitExceeded(userId, type = 'message', retryAfter) {
    this.warn('rate_limit_exceeded', {
      user_id: userId || 'anonymous',
      type,
      retry_after_seconds: retryAfter
    });
  }

  /**
   * Log authentication event
   */
  logAuth(type, userId, success, reason = null) {
    this.info(`auth_${type}`, {
      user_id: userId || 'anonymous',
      success,
      reason: reason || (success ? 'success' : 'failed')
    });
  }

  /**
   * Log session termination
   */
  logSessionTermination(sessionCode, reason, clientCount) {
    this.warn('session_terminated', {
      session_code: sessionCode,
      reason,
      client_count: clientCount,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log API endpoint call
   */
  logApiCall(method, path, statusCode, duration, userId = null) {
    const level = statusCode >= 400 ? 'WARN' : 'INFO';
    this.log(level, 'api_call', {
      method,
      path,
      status_code: statusCode,
      duration_ms: duration,
      user_id: userId || 'anonymous'
    });
  }
}

// Create default logger instance
const logger = new Logger({
  minLevel: process.env.LOG_LEVEL || 'INFO',
  logDir: process.env.LOG_DIR || './logs',
  enableConsole: true,
  enableFile: process.env.NODE_ENV === 'production',
  enableColor: process.env.NODE_ENV !== 'production',
  service: 'digitalflipboard-server'
});

export default logger;
