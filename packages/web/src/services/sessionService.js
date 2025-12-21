const API_URL = import.meta.env.VITE_API_URL || '';

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
    const response = await fetch(`${API_URL}/api/sessions/pair`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionCode, userId, boardId }),
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
