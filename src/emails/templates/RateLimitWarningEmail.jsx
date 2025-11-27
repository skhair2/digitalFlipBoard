import React from 'react';
import { emailStyles } from '../styles';
import BaseLayout from './BaseLayout';

/**
 * RateLimitWarningEmail Component
 * Sent when user approaches or exceeds rate limits
 * 
 * Props:
 *   - name: User's first name
 *   - limitType: Type of limit ("messages", "sessions", "api-calls")
 *   - currentUsage: Current usage count (e.g., "8 of 10")
 *   - resetTime: When the limit resets (ISO string or readable date)
 *   - planName: Current subscription plan
 *   - hasUpgrade: Boolean - whether user can upgrade
 */
export const RateLimitWarningEmail = ({ 
    name = 'User',
    limitType = 'messages',
    currentUsage = '8 of 10',
    resetTime = null,
    planName = 'Free',
    hasUpgrade = true
}) => {
    const resetDate = resetTime ? 
        new Date(resetTime).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'within 24 hours';

    const limitMessages = {
        'messages': {
            title: 'You\'re Approaching Your Message Limit',
            description: 'You\'re sending a lot of messages! You\'ve reached your rate limit.',
            details: 'Your Free plan allows 10 messages per minute to prevent abuse.'
        },
        'sessions': {
            title: 'Session Limit Approaching',
            description: 'You have active sessions approaching your plan limit.',
            details: 'Your Free plan allows 3 simultaneous display sessions.'
        },
        'api-calls': {
            title: 'API Usage Warning',
            description: 'Your API usage is approaching the limit for your plan.',
            details: 'Your Free plan includes a limited number of API calls per day.'
        }
    };

    const config = limitMessages[limitType] || limitMessages['messages'];

    return (
        <BaseLayout 
            heading={config.title}
            footerText={`Manage your limits from your account settings or upgrade your plan.`}
        >
            <p style={emailStyles.text}>
                Hi {name},
            </p>

            <p style={emailStyles.text}>
                {config.description}
            </p>

            {/* Usage Warning Card */}
            <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                padding: '20px',
                marginTop: '24px',
                marginBottom: '24px',
                border: '2px solid #f97316'
            }}>
                <p style={{ color: '#cbd5e1', margin: '0 0 12px 0', fontSize: '12px', textTransform: 'uppercase' }}>
                    <strong>Current Usage</strong>
                </p>

                {/* Usage Bar */}
                <div style={{
                    backgroundColor: '#0f172a',
                    borderRadius: '4px',
                    height: '24px',
                    marginBottom: '12px',
                    overflow: 'hidden',
                    border: '1px solid #334155'
                }}>
                    <div style={{
                        backgroundColor: '#f97316',
                        height: '100%',
                        width: '80%',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                    }} />
                </div>

                <p style={{ color: '#f97316', margin: '0', fontWeight: 'bold', fontSize: '16px' }}>
                    {currentUsage}
                </p>
                <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '12px' }}>
                    {config.details}
                </p>
            </div>

            {/* Reset Information */}
            <div style={{
                backgroundColor: '#1a1f2e',
                borderLeft: '4px solid #64748b',
                padding: '12px 16px',
                marginBottom: '24px',
                borderRadius: '4px'
            }}>
                <p style={{ color: '#cbd5e1', margin: '0 0 4px 0', fontSize: '12px' }}>
                    <strong>Limit Resets</strong>
                </p>
                <p style={{ color: '#cbd5e1', margin: '0', fontSize: '14px' }}>
                    {resetDate}
                </p>
            </div>

            {/* What You Can Do */}
            <p style={emailStyles.text}>
                <strong>Here's what you can do:</strong>
            </p>

            <ul style={{
                margin: '12px 0 24px 0',
                paddingLeft: '20px',
                color: '#cbd5e1'
            }}>
                <li style={{ marginBottom: '8px' }}>Wait for your limit to reset automatically</li>
                <li style={{ marginBottom: '8px' }}>Spread out your activity over time</li>
                {hasUpgrade && <li style={{ marginBottom: '8px' }}>Upgrade to a higher plan for increased limits</li>}
                <li>Contact support@flipdisplay.online for custom limits</li>
            </ul>

            {hasUpgrade && (
                <div style={emailStyles.buttonContainer}>
                    <a href="https://flipdisplay.online/pricing" style={emailStyles.button}>
                        View Premium Plans
                    </a>
                </div>
            )}

            {/* Plan Comparison */}
            <div style={{
                backgroundColor: '#1a1f2e',
                borderRadius: '6px',
                padding: '16px',
                marginTop: '24px',
                marginBottom: '24px'
            }}>
                <p style={{ color: '#cbd5e1', margin: '0 0 12px 0', fontSize: '13px', fontWeight: 'bold' }}>
                    Your Current Plan: <span style={{ color: '#14b8a6' }}>{planName}</span>
                </p>
                <table style={{ width: '100%', fontSize: '12px' }}>
                    <tbody>
                        <tr style={{ borderBottom: '1px solid #334155' }}>
                            <td style={{ padding: '8px 0', color: '#cbd5e1' }}>Messages/min</td>
                            <td style={{ padding: '8px 0', color: '#cbd5e1', textAlign: 'right' }}>
                                10
                            </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #334155' }}>
                            <td style={{ padding: '8px 0', color: '#cbd5e1' }}>Active Sessions</td>
                            <td style={{ padding: '8px 0', color: '#cbd5e1', textAlign: 'right' }}>
                                3
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: '8px 0', color: '#cbd5e1' }}>Unlimited after upgrade</td>
                            <td style={{ padding: '8px 0', color: '#14b8a6', textAlign: 'right', fontWeight: 'bold' }}>
                                ✓
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <hr style={emailStyles.hr} />

            <p style={emailStyles.text}>
                <strong>Questions?</strong> We're here to help. Reach out to support@flipdisplay.online or check our <a href="https://flipdisplay.online/help#rate-limits" style={{ color: '#14b8a6', textDecoration: 'none' }}>rate limiting guide</a>.
            </p>

            <p style={emailStyles.text}>
                Best regards,<br />
                <strong>The FlipDisplay Team</strong>
            </p>
        </BaseLayout>
    );
};

export default RateLimitWarningEmail;
