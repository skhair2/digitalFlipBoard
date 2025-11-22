import React from 'react';
import { emailStyles } from '../styles';
import BaseLayout from './BaseLayout';

/**
 * DesignShareEmail Component
 * Sent when a user shares a board design with others
 * 
 * Props:
 *   - recipientName: Recipient's first name
 *   - senderName: Name of person sharing the design
 *   - designName: Name of the shared design
 *   - shareMessage: Custom message from sender (optional)
 *   - accessLink: Link to view the shared design
 *   - expiryDays: How many days the share link is valid
 */
export const DesignShareEmail = ({ 
    recipientName = 'User',
    senderName = 'A FlipDisplay User',
    designName = 'Sales Dashboard',
    shareMessage = null,
    accessLink = 'https://flipdisplay.online/shared/design/abc123',
    expiryDays = 30
}) => {
    return (
        <BaseLayout 
            heading={`${senderName} Shared a Design with You`}
            footerText={`View and duplicate this design to use it in your own displays.`}
        >
            <p style={emailStyles.text}>
                Hi {recipientName},
            </p>

            <p style={emailStyles.text}>
                <strong>{senderName}</strong> has shared a FlipDisplay design with you!
            </p>

            {/* Design Preview Card */}
            <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                padding: '20px',
                marginTop: '24px',
                marginBottom: '24px',
                border: '1px solid #334155',
                textAlign: 'center'
            }}>
                <div style={{
                    backgroundColor: '#0f172a',
                    borderRadius: '6px',
                    padding: '40px 20px',
                    marginBottom: '16px',
                    minHeight: '100px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed #334155'
                }}>
                    <p style={{ color: '#64748b', margin: '0', fontSize: '14px' }}>
                        Design Preview: <strong>{designName}</strong>
                    </p>
                </div>
                <p style={{ color: '#cbd5e1', margin: '0', fontWeight: 'bold', marginBottom: '4px' }}>
                    {designName}
                </p>
                <p style={{ color: '#94a3b8', margin: '0', fontSize: '13px' }}>
                    Shared {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
            </div>

            {shareMessage && (
                <div style={{
                    backgroundColor: '#1a1f2e',
                    borderLeft: '4px solid #14b8a6',
                    padding: '12px 16px',
                    marginBottom: '24px',
                    borderRadius: '4px'
                }}>
                    <p style={{ color: '#cbd5e1', margin: '0 0 8px 0', fontSize: '12px', textTransform: 'uppercase' }}>
                        <strong>Message from {senderName}</strong>
                    </p>
                    <p style={{ color: '#cbd5e1', margin: '0', fontStyle: 'italic' }}>
                        "{shareMessage}"
                    </p>
                </div>
            )}

            <p style={emailStyles.text}>
                You can now:
            </p>

            <ul style={{
                margin: '12px 0 24px 0',
                paddingLeft: '20px',
                color: '#cbd5e1'
            }}>
                <li style={{ marginBottom: '8px' }}>View the design and how it's configured</li>
                <li style={{ marginBottom: '8px' }}>Duplicate it to create your own version</li>
                <li style={{ marginBottom: '8px' }}>See animation settings and color themes</li>
                <li>Use it as a template for your displays</li>
            </ul>

            <div style={emailStyles.buttonContainer}>
                <a href={accessLink} style={emailStyles.button}>
                    View Shared Design
                </a>
            </div>

            <p style={{ ...emailStyles.text, fontSize: '12px', color: '#94a3b8', marginTop: '24px' }}>
                <strong>Share Link Expires:</strong> This link will expire in {expiryDays} days. Save or duplicate the design before then if you want to keep it.
            </p>

            <hr style={emailStyles.hr} />

            <p style={emailStyles.text}>
                <strong>Pro Tip:</strong> Create your own designs and share them with your team using FlipDisplay's collaboration features. <a href="https://flipdisplay.online/features#sharing" style={{ color: '#14b8a6', textDecoration: 'none' }}>Learn more</a>.
            </p>

            <p style={emailStyles.text}>
                Best regards,<br />
                <strong>The FlipDisplay Team</strong>
            </p>
        </BaseLayout>
    );
};

export default DesignShareEmail;
