const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Get or create a unique device ID for this browser
 * Used for session idempotency and guest identification
 */
export function getDeviceId() {
  let deviceId = localStorage.getItem('dfb_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('dfb_device_id', deviceId);
  }
  return deviceId;
}

/**
 * Session Service
 * Handles session registration, pairing, and status polling for "Lazy Connections"
 */

export async function registerSession(sessionCode) {
  try {
    const response = await fetch(`${API_URL}/api/sessions/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionCode }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to register session');
    }
    return data;
  } catch (error) {
    console.error('[SessionService] Error registering session:', error);
    throw error;
  }
}

export async function pairSession(sessionCode, userId = null, boardId = null) {
  try {
    const deviceId = getDeviceId();
    console.log('[SessionService] Pairing session:', { sessionCode, userId, deviceId });
    const response = await fetch(`${API_URL}/api/sessions/pair`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        sessionCode, 
        userId, 
        boardId,
        deviceId // Include deviceId for idempotency
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to pair session');
    }
    return data;
  } catch (error) {
    console.error('[SessionService] Error pairing session:', error);
    throw error;
  }
}

export async function getSessionStatus(sessionCode) {
  try {
    const response = await fetch(`${API_URL}/api/sessions/${sessionCode}/status`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get session status');
    }
    return data;
  } catch (error) {
    console.error('[SessionService] Error getting session status:', error);
    throw error;
  }
}
