import { useAuthStore } from '../store/authStore';
import { renderToStaticMarkup } from 'react-dom/server';
import {
    WelcomeEmail,
    VerificationEmail,
    InviteEmail
} from '../emails/templates';

/**
 * Email Service
 * Sends emails via backend API which uses Resend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

export const emailService = {
    /**
     * Send a welcome email to a new user
     * @param {string} email - User's email address
     * @param {string} name - User's name
     */
    sendWelcome: async (email, name) => {
        return sendEmail(
            email,
            'Welcome to FlipDisplay.online!',
            <WelcomeEmail name={name} />
        );
    },

    /**
     * Send a verification code to a user
     * @param {string} email - User's email address
     * @param {string} code - Verification code
     */
    sendVerification: async (email, code) => {
        return sendEmail(
            email,
            'Verify your FlipDisplay account',
            <VerificationEmail code={code} />
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
