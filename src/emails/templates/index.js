/**
 * Email Templates Index
 * Central export point for all email templates
 * 
 * All templates inherit structure and styling from BaseLayout
 * and emailStyles for consistent branding across all communications
 */

export { default as BaseLayout } from './BaseLayout';
export { default as WelcomeEmail } from './WelcomeEmail';
export { default as VerificationEmail } from './VerificationEmail';
export { default as InviteEmail } from './InviteEmail';
export { default as PasswordResetEmail } from './PasswordResetEmail';
export { default as PaymentConfirmationEmail } from './PaymentConfirmationEmail';
export { default as DesignShareEmail } from './DesignShareEmail';
export { default as CollaborationInviteEmail } from './CollaborationInviteEmail';
export { default as RateLimitWarningEmail } from './RateLimitWarningEmail';
