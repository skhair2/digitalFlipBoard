import { randomUUID } from 'crypto'
import logger from './logger.js'

const MAX_EVENTS = parseInt(process.env.SESSION_EVENT_BUFFER || '500', 10)
const events = []

function pruneBuffer() {
  while (events.length > MAX_EVENTS) {
    events.shift()
  }
}

export function recordSessionEvent(event = {}) {
  const entry = {
    eventId: randomUUID(),
    timestamp: new Date().toISOString(),
    ...event,
  }

  events.push(entry)
  pruneBuffer()

  // Mirror to structured logs for long-term retention
  try {
    logger.info('session_event', entry)
  } catch (_) {
    // No-op: logging should never break tracking
  }

  return entry
}

export function getRecentSessionEvents(limit = 100) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), MAX_EVENTS)
  return events.slice(-safeLimit).reverse()
}

export function getSessionEvents(sessionCode, limit = 100) {
  if (!sessionCode) {
    return []
  }
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), MAX_EVENTS)
  const filtered = []

  for (let i = events.length - 1; i >= 0 && filtered.length < safeLimit; i -= 1) {
    if (events[i].sessionCode === sessionCode.toUpperCase()) {
      filtered.push(events[i])
    }
  }

  return filtered
}
