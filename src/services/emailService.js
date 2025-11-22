import { Resend } from 'resend';
import { WelcomeEmail } from '../emails/templates/WelcomeEmail';
import { VerificationEmail } from '../emails/templates/VerificationEmail';
import { InviteEmail } from '../emails/templates/InviteEmail';

// Initialize Resend with API key from environment variables
// Note: In a production environment, this should ideally be handled server-side
// to avoid exposing the API key in the client bundle.
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

const FROM_EMAIL = 'FlipDisplay <onboarding@resend.dev>'; // Default Resend testing domain

export const emailService = {
    /**
     * Send a welcome email to a new user
     * @param {string} email - User's email address
     * @param {string} name - User's name
     */
    sendWelcome: async (email, name) => {
        try {
            const data = await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: 'Welcome to FlipDisplay.online!',
                react: WelcomeEmail({ name }),
            });
            return { success: true, data };
        } catch (error) {
            console.error('Failed to send welcome email:', error);
            return { success: false, error };
        }
    },

    /**
     * Send a verification code to a user
     * @param {string} email - User's email address
     * @param {string} code - Verification code
     */
    sendVerification: async (email, code) => {
        try {
            const data = await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: 'Verify your FlipDisplay account',
                react: VerificationEmail({ code }),
            });
            return { success: true, data };
        } catch (error) {
            console.error('Failed to send verification email:', error);
            return { success: false, error };
        }
    },

    /**
     * Send an invitation to collaborate on a board
     * @param {string} email - Invitee's email address
     * @param {string} inviterName - Name of the person inviting
     * @param {string} boardName - Name of the board
     * @param {string} inviteLink - Link to accept the invitation
     */
    sendInvite: async (email, inviterName, boardName, inviteLink) => {
        try {
            const data = await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: `${inviterName} invited you to collaborate on ${boardName}`,
                react: InviteEmail({ inviterName, boardName, inviteLink }),
            });
            return { success: true, data };
        } catch (error) {
            console.error('Failed to send invite email:', error);
            return { success: false, error };
        }
    }
};
