import { useAuthStore } from '../store/authStore';

/**
 * Email Service
 * SECURITY: API calls go through secure backend endpoint, NOT client
 * The server validates authentication and handles Resend API key securely
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Helper function to get auth token
 */
async function getAuthToken() {
    const session = useAuthStore.getState().session;
    return session?.access_token;
}

/**
 * Make authenticated request to email API endpoint
 */
async function sendEmailViaApi(endpoint, payload) {
    try {
        const token = await getAuthToken();

        if (!token) {
            return { success: false, error: 'User not authenticated' };
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error || 'Email send failed' };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('Email API error:', error.message);
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
        return sendEmailViaApi('/api/send-email', {
            to: email,
            subject: 'Welcome to FlipDisplay.online!',
            html: `<h1>Welcome, ${name}!</h1><p>We're excited to have you on board.</p>`,
            text: `Welcome, ${name}! We're excited to have you on board.`
        });
    },

    /**
     * Send a verification code to a user
     * @param {string} email - User's email address
     * @param {string} code - Verification code
     */
    sendVerification: async (email, code) => {
        return sendEmailViaApi('/api/send-email', {
            to: email,
            subject: 'Verify your FlipDisplay account',
            html: `<h1>Verify Your Email</h1><p>Your verification code is: <strong>${code}</strong></p>`,
            text: `Your verification code is: ${code}`
        });
    },

    /**
     * Send an invitation to collaborate on a board
     * @param {string} email - Invitee's email address
     * @param {string} inviterName - Name of the person inviting
     * @param {string} boardName - Name of the board
     * @param {string} inviteLink - Link to accept the invitation
     */
    sendInvite: async (email, inviterName, boardName, inviteLink) => {
        return sendEmailViaApi('/api/send-email', {
            to: email,
            subject: `${inviterName} invited you to collaborate on ${boardName}`,
            html: `
                <h1>You're Invited!</h1>
                <p>${inviterName} invited you to collaborate on <strong>${boardName}</strong></p>
                <p><a href="${inviteLink}">Accept Invitation</a></p>
            `,
            text: `${inviterName} invited you to collaborate on ${boardName}. Visit: ${inviteLink}`
        });
    }
};
