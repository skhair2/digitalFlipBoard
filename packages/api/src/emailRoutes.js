import { Resend } from 'resend';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

let resend = null;

function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

// Validation schema for email requests
const emailSchema = z.object({
    to: z.string().email(),
    subject: z.string().min(1).max(200),
    html: z.string().min(1),
    text: z.string().optional(),
});

/**
 * POST /api/send-email
 * Send an email via Resend
 */
export const sendEmail = async (req, res) => {
    try {
        // Validate request body
        const validatedData = emailSchema.parse(req.body);

        // Send email via Resend
        const data = await resend.emails.send({
            from: FROM_EMAIL,
            to: validatedData.to,
            subject: validatedData.subject,
            html: validatedData.html,
            text: validatedData.text || 'Please view this email in a client that supports HTML.',
        });

        res.json({ success: true, data });
    } catch (error) {
        console.error('Email send error:', error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }

        res.status(500).json({
            success: false,
            error: error.message || 'Failed to send email'
        });
    }
};
