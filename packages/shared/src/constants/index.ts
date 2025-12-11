export const ANIMATION_TYPES = [
  'flip',
  'scroll',
  'fade',
  'wave',
  'bounce',
] as const;

export const COLOR_THEMES = [
  'monochrome',
  'teal',
  'vintage',
  'custom',
] as const;

export const SESSION_CODE_LENGTH = 6;
export const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001';
export const WS_URL = process.env.VITE_WEBSOCKET_URL || 'ws://localhost:3001';
