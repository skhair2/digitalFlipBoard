import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import logger from './logger.js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Registers the magic link endpoint on the provided Express app instance.
 */
export function registerMagicLinkEndpoint(app) {
    app.post('/api/auth/send-magic-link', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // 1. Generate Supabase magic link using admin API
        const redirectUrl = process.env.VITE_APP_URL || 'http://localhost:5173';
        const callbackUrl = `${redirectUrl}/auth/callback`;

        const { data: otpData, error: otpError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email,
            options: {
                redirectTo: callbackUrl
            }
        });

        if (otpError) {
            logger.error('Error generating magic link', otpError, { email });
            return res.status(500).json({ error: 'Failed to generate magic link' });
        }

        // 2. Extract the magic link URL
        const magicLink = otpData.properties?.action_link;

        if (!magicLink) {
            logger.error('No magic link in response', null, { email });
            return res.status(500).json({ error: 'Failed to generate magic link' });
        }

        // 3. Create email HTML with FlipDisplay branding
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <div style="max-width: 560px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 24px; font-weight: bold; color: #ffffff;">FlipDisplay.online</span>
        </div>
        
        <div style="background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 24px;">
            <h1 style="font-size: 24px; font-weight: bold; color: #ffffff; margin-bottom: 16px; text-align: center;">
                Your Magic Link
            </h1>
            
            <p style="font-size: 16px; line-height: 26px; color: #cbd5e1; margin-bottom: 16px;">
                Click the button below to sign in to your FlipDisplay account. This link will expire in 1 hour.
            </p>
            
            <div style="text-align: center; margin-top: 32px; margin-bottom: 32px;">
                <a href="${magicLink}" 
                   style="background-color: #14b8a6; border-radius: 8px; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 12px 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    Sign In to FlipDisplay
                </a>
            </div>
            
            <p style="font-size: 14px; line-height: 22px; color: #94a3b8; margin-bottom: 16px;">
                Or copy and paste this link into your browser:
            </p>
            
            <div style="background: #0f172a; border-radius: 8px; padding: 12px; margin: 16px 0; border: 1px solid #334155; word-break: break-all;">
                <span style="font-size: 12px; color: #2dd4bf; font-family: monospace;">${magicLink}</span>
            </div>
            
            <hr style="border-color: #334155; margin: 20px 0;" />
            
            <p style="font-size: 16px; line-height: 26px; color: #cbd5e1;">
                If you didn't request this link, you can safely ignore this email.
            </p>
        </div>
        
        <div style="margin-top: 32px; text-align: center;">
            <p style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
                © ${new Date().getFullYear()} FlipDisplay.online. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
    `;

        // 4. Send email via Resend
        const result = await resend.emails.send({
            from: process.env.FROM_EMAIL || 'noreply@flipdisplay.online',
            to: email,
            subject: 'Sign in to FlipDisplay',
            html: emailHtml,
            text: `Sign in to FlipDisplay: ${magicLink}`
        });

        logger.info('magic_link_sent_via_resend', {
            email,
            email_id: result.id
        });

        res.json({
            success: true,
            message: 'Magic link sent to your email'
        });

    } catch (error) {
        logger.error('Magic link generation failed', error, { email: req.body.email });
        res.status(500).json({
            error: 'Failed to send magic link',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
    });
}
