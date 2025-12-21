import { useAuthStore } from '../store/authStore';
import { renderToStaticMarkup } from 'react-dom/server';
import {
    WelcomeEmail,
    VerificationEmail,
    InviteEmail,
    MagicLinkEmail
} from '../emails/templates';

/**
 * Email Service
 * Sends emails via backend API which uses Resend
 */

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Send email via backend API
 */
async function sendEmail(to, subject, template) {
    try {
        // Get auth token
        const session = useAuthStore.getState().session;
        const token = session?.access_token;

        if (!token) {
            return { success: false, error: 'User not authenticated' };
        }

        // Render React template to HTML
        const html = renderToStaticMarkup(template);

        // Call backend API
        const response = await fetch(`${API_URL}/api/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                to,
                subject,
                html,
                text: 'Please view this email in a client that supports HTML.'
            })
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error || 'Failed to send email' };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('Email service error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send email without authentication (for magic links, password resets, etc.)
 */
async function sendPublicEmail(to, subject, template) {
    try {
        // Render React template to HTML
        const html = renderToStaticMarkup(template);

        // Call backend API without auth
        const response = await fetch(`${API_URL}/api/send-public-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to,
                subject,
                html,
                text: 'Please view this email in a client that supports HTML.'
            })
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error || 'Failed to send email' };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('Email service error:', error);
        return { success: false, error: error.message };
    }
}

export const emailService = {
    /**
     * Send a welcome email to a new user
     * @param {string} email - User's email address
     * @param {string} name - User's name
     */
    sendWelcome: async (email, name) => {
        return sendPublicEmail(
            email,
            'Welcome to FlipDisplay.online!',
            <WelcomeEmail name={name} />
        );
    },

    /**
     * Send a verification code to a user
     * @param {string} email - User's email address
     * @param {string} code - Verification code
     * @param {string} verificationLink - Optional verification link (instead of code)
     */
    sendVerification: async (email, code, verificationLink) => {
        return sendPublicEmail(
            email,
            'Confirm Your FlipDisplay Email',
            <VerificationEmail code={code} verificationLink={verificationLink} />
        );
    },

    /**
     * Send a magic link to a user
     * @param {string} email - User's email address
     * @param {string} magicLink - Magic link URL
     */
    sendMagicLink: async (email, magicLink) => {
        return sendPublicEmail(
            email,
            'Sign in to FlipDisplay',
            <MagicLinkEmail email={email} magicLink={magicLink} />
        );
    },

    /**
     * Send an invitation to collaborate on a board
     * @param {string} email - Invitee's email address
     * @param {string} inviterName - Name of the person inviting
     * @param {string} boardName - Name of the board
     * @param {string} inviteLink - Link to accept the invitation
     */
    sendInvite: async (email, inviterName, boardName, inviteLink) => {
        return sendEmail(
            email,
            `${inviterName} invited you to collaborate on ${boardName}`,
            <InviteEmail
                inviterName={inviterName}
                boardName={boardName}
                inviteLink={inviteLink}
            />
        );
    }
};
