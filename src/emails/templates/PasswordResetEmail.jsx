import React from 'react';
import { emailStyles } from '../styles';
import BaseLayout from './BaseLayout';

/**
 * PasswordResetEmail Component
 * Sent when user requests password reset
 * 
 * Props:
 *   - name: User's first name
 *   - resetLink: Password reset URL
 *   - expirationHours: How many hours the link is valid (default: 24)
 */
export const PasswordResetEmail = ({ 
    name = 'User',
    resetLink = 'https://flipdisplay.online/reset-password'
}) => {
    return (
        <BaseLayout 
            heading={`Reset Your FlipDisplay Password`}
            footerText="This password reset link will expire in 24 hours."
        >
            <p style={emailStyles.text}>
                Hi {name},
            </p>

            <p style={emailStyles.text}>
                We received a request to reset the password for your FlipDisplay.online account. If you didn't request this, you can ignore this email.
            </p>

            <p style={emailStyles.text}>
                To reset your password, click the button below:
            </p>

            <div style={emailStyles.buttonContainer}>
                <a href={resetLink} style={emailStyles.button}>
                    Reset Password
                </a>
            </div>

            <p style={emailStyles.text}>
                Or copy this link and paste it in your browser:
            </p>

            <div style={emailStyles.codeContainer}>
                <p style={{ fontSize: '12px', color: '#cbd5e1', wordBreak: 'break-all', margin: '0' }}>
                    {resetLink}
                </p>
            </div>

            <p style={emailStyles.text}>
                <strong>Security Tip:</strong> Never share this link with anyone. FlipDisplay staff will never ask for your password.
            </p>

            <hr style={emailStyles.hr} />

            <p style={emailStyles.text}>
                Best regards,<br />
                <strong>The FlipDisplay Team</strong>
            </p>

            <p style={{ ...emailStyles.footerText, marginTop: '16px' }}>
                Questions? Contact us at support@flipdisplay.online
            </p>
        </BaseLayout>
    );
};

export default PasswordResetEmail;
