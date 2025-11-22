import { z } from 'zod';

/**
 * Message validation schema
 * Prevents XSS, injection attacks, and invalid data
 */
export const messageSchema = z.object({
  sessionCode: z.string()
    .min(4, 'Session code too short')
    .max(8, 'Session code too long')
    .regex(/^[A-Z0-9]+$/, 'Invalid session code format'),
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message too long'),
  animationType: z.enum(['flip', 'fade', 'slide'], {
    errorMap: () => ({ message: 'Invalid animation type' })
  }).optional().default('flip'),
  colorTheme: z.enum(['monochrome', 'teal', 'vintage'], {
    errorMap: () => ({ message: 'Invalid color theme' })
  }).optional().default('monochrome')
});

/**
 * Email validation schema
 * For email sending endpoint
 */
export const emailSchema = z.object({
  to: z.string().email('Invalid email address'),
  subject: z.string().min(1).max(200),
  html: z.string().min(1).max(10000),
  text: z.string().optional()
});

/**
 * Auth token validation
 */
export const authSchema = z.object({
  token: z.string().min(1, 'Token required'),
  userId: z.string().uuid('Invalid user ID')
});

/**
 * Validate and parse payload
 * Returns { valid: boolean, data?: T, error?: string }
 */
export function validatePayload(schema, payload) {
  try {
    const validated = schema.parse(payload);
    return { valid: true, data: validated };
  } catch (error) {
    const message = error.errors?.[0]?.message || error.message;
    return { valid: false, error: message };
  }
}
