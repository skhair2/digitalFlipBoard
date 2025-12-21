/**
 * Redis Pub/Sub Service for Frontend
 * Manages message routing between Controller and Display via HTTP REST API
 * (Since browsers cannot directly connect to Redis, we use HTTP endpoints)
 */

class MessageBrokerService {
  constructor(baseUrl = import.meta.env.VITE_API_URL || '') {
    this.baseUrl = baseUrl;
    this.sessionCode = null;
    this.isListening = false;
    this.pollIntervals = new Map();
    this.listeners = new Map();
  }

  /**
   * Set the current session code
   */
  setSessionCode(code) {
    this.sessionCode = code;
  }

  /**
   * Send a message to the Display in this session
   */
  async sendMessage(message, options = {}) {
    if (!this.sessionCode) {
      console.error('[MessageBroker] No session code set');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/session/${this.sessionCode}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          animation: options.animation || 'flip',
          color: options.color || 'monochrome',
          customConfig: options.customConfig || {}
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[MessageBroker] Failed to send message:', error);
        return false;
      }

      console.log('[MessageBroker] ✓ Message sent:', message.substring(0, 50));
      return true;
    } catch (error) {
      console.error('[MessageBroker] Error sending message:', error);
      return false;
    }
  }

  /**
   * Update session configuration
   */
  async updateConfig(config) {
    if (!this.sessionCode) {
      console.error('[MessageBroker] No session code set');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/session/${this.sessionCode}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[MessageBroker] Failed to update config:', error);
        return false;
      }

      const result = await response.json();
      console.log('[MessageBroker] ✓ Config updated');
      return result.config;
    } catch (error) {
      console.error('[MessageBroker] Error updating config:', error);
      return false;
    }
  }

  /**
   * Get current session configuration
   */
  async getConfig() {
    if (!this.sessionCode) {
      console.error('[MessageBroker] No session code set');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/session/${this.sessionCode}/config`);

      if (!response.ok) {
        console.error('[MessageBroker] Failed to get config');
        return null;
      }

      const { config } = await response.json();
      return config;
    } catch (error) {
      console.error('[MessageBroker] Error getting config:', error);
      return null;
    }
  }

  /**
   * Get current session state (message, config, etc.)
   */
  async getState() {
    if (!this.sessionCode) {
      console.error('[MessageBroker] No session code set');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/session/${this.sessionCode}/state`);

      if (!response.ok) {
        console.error('[MessageBroker] Failed to get state');
        return null;
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('[MessageBroker] Error getting state:', error);
      return null;
    }
  }

  /**
   * Start polling for state changes
   * This acts as a fallback when WebSocket is unavailable
   */
  async startPolling(callback, interval = 2000) {
    if (!this.sessionCode) {
      console.error('[MessageBroker] No session code set');
      return false;
    }

    if (this.pollIntervals.has('state')) {
      console.warn('[MessageBroker] Polling already started');
      return false;
    }

    let lastKnownState = null;

    const poll = async () => {
      try {
        const result = await this.getState();
        
        // Check if state changed
        if (result && JSON.stringify(result) !== JSON.stringify(lastKnownState)) {
          lastKnownState = result;
          callback(result);
        }
      } catch (error) {
        console.error('[MessageBroker] Polling error:', error);
      }
    };

    // Initial poll
    await poll();

    // Start interval
    const intervalId = setInterval(poll, interval);
    this.pollIntervals.set('state', intervalId);

    console.log('[MessageBroker] ✓ Started polling for state changes (interval:', interval, 'ms)');
    return true;
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (!this.pollIntervals.has('state')) {
      return false;
    }

    clearInterval(this.pollIntervals.get('state'));
    this.pollIntervals.delete('state');

    console.log('[MessageBroker] ✓ Stopped polling');
    return true;
  }

  /**
   * Register a listener for state changes
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove a listener
   */
  off(event, callback) {
    if (!this.listeners.has(event)) {
      return false;
    }

    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Emit an event to all listeners
   */
  emit(event, data) {
    if (!this.listeners.has(event)) {
      return;
    }

    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[MessageBroker] Error in ${event} listener:`, error);
      }
    });
  }

  /**
   * End/clear session
   */
  async endSession() {
    if (!this.sessionCode) {
      console.error('[MessageBroker] No session code set');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/session/${this.sessionCode}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        console.error('[MessageBroker] Failed to end session');
        return false;
      }

      this.stopPolling();
      console.log('[MessageBroker] ✓ Session ended');
      return true;
    } catch (error) {
      console.error('[MessageBroker] Error ending session:', error);
      return false;
    }
  }
}

// Export singleton instance
export const messageBrokerService = new MessageBrokerService(
  import.meta.env.VITE_API_URL || ''
);
