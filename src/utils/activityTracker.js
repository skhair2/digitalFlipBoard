/**
 * Activity Tracker Utility
 * 
 * Tracks user activity on Display and Controller pages
 * and emits activity events to the server to prevent
 * session termination due to inactivity
 */

class ActivityTracker {
  constructor(sessionCode, websocketService, type = 'client') {
    this.sessionCode = sessionCode;
    this.websocketService = websocketService;
    this.type = type; // 'display', 'controller', or 'client'
    this.lastActivityTime = Date.now();
    this.activityThrottle = 5000; // Only emit activity every 5 seconds max
    this.listeners = [];
    this.isListening = false;
  }

  /**
   * Start tracking user activity
   */
  start() {
    if (this.isListening) return;
    
    this.isListening = true;
    console.log(`🎯 Activity tracker started for session: ${this.sessionCode}`);

    // Track mouse movement
    const handleMouseMove = this.throttledEmitActivity.bind(this);
    document.addEventListener('mousemove', handleMouseMove);
    this.listeners.push({ event: 'mousemove', handler: handleMouseMove });

    // Track keyboard input
    const handleKeyDown = this.throttledEmitActivity.bind(this);
    document.addEventListener('keydown', handleKeyDown);
    this.listeners.push({ event: 'keydown', handler: handleKeyDown });

    // Track clicks
    const handleClick = this.throttledEmitActivity.bind(this);
    document.addEventListener('click', handleClick);
    this.listeners.push({ event: 'click', handler: handleClick });

    // Track scroll
    const handleScroll = this.throttledEmitActivity.bind(this);
    document.addEventListener('scroll', handleScroll, true);
    this.listeners.push({ event: 'scroll', handler: handleScroll });

    // Track touch events (for mobile)
    const handleTouch = this.throttledEmitActivity.bind(this);
    document.addEventListener('touchstart', handleTouch);
    this.listeners.push({ event: 'touchstart', handler: handleTouch });
    document.addEventListener('touchmove', handleTouch);
    this.listeners.push({ event: 'touchmove', handler: handleTouch });

    // Emit initial activity
    this.emitActivity();
  }

  /**
   * Stop tracking user activity
   */
  stop() {
    if (!this.isListening) return;

    this.isListening = false;
    console.log(`🛑 Activity tracker stopped for session: ${this.sessionCode}`);

    // Remove all event listeners
    this.listeners.forEach(({ event, handler }) => {
      if (event === 'scroll') {
        document.removeEventListener(event, handler, true);
      } else {
        document.removeEventListener(event, handler);
      }
    });

    this.listeners = [];
  }

  /**
   * Throttled activity emission
   * Only emits if enough time has passed since last emission
   */
  throttledEmitActivity() {
    const now = Date.now();
    if (now - this.lastActivityTime >= this.activityThrottle) {
      this.emitActivity();
    }
  }

  /**
   * Emit activity event to server
   */
  emitActivity() {
    if (!this.websocketService || !this.sessionCode) return;

    this.lastActivityTime = Date.now();

    // Build event payload
    const eventName = this.type === 'display' 
      ? 'display:activity'
      : this.type === 'controller'
      ? 'controller:activity'
      : 'client:activity';

    const payload = {
      sessionCode: this.sessionCode,
      timestamp: new Date().toISOString(),
      type: this.type
    };

    // Emit activity event without expecting a response
    this.websocketService.emit(eventName, payload);
  }

  /**
   * Manually emit activity (called during message send or other major interactions)
   */
  recordActivity() {
    this.lastActivityTime = Date.now();
    this.emitActivity();
  }

  /**
   * Destroy tracker and clean up resources
   */
  destroy() {
    this.stop();
    this.sessionCode = null;
    this.websocketService = null;
    this.listeners = [];
  }
}

export default ActivityTracker;
