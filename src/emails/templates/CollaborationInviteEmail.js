import React from 'react';
import { emailStyles } from '../styles';
import BaseLayout from './BaseLayout';

/**
 * CollaborationInviteEmail Component
 * Sent when inviting someone to collaborate on a FlipDisplay team
 * 
 * Props:
 *   - recipientName: Recipient's first name
 *   - invitedByName: Name of person sending the invite
 *   - teamName: Name of the team/organization
 *   - inviteLink: Link to accept the collaboration invite
 *   - role: User's role (e.g., "Editor", "Viewer", "Admin")
 *   - expiryDays: How many days before invite expires
 */
export const CollaborationInviteEmail = ({ 
    recipientName = 'User',
    invitedByName = 'Jane Doe',
    teamName = 'Marketing Team',
    inviteLink = 'https://flipdisplay.online/invites/abc123xyz',
    role = 'Editor',
    expiryDays = 7
}) => {
    const roleDescription = {
        'Viewer': 'View designs and displays',
        'Editor': 'Create, edit, and share designs',
        'Admin': 'Manage team members and settings'
    };

    return (
        <BaseLayout 
            heading={`You're Invited to Join a Team`}
            footerText={`Collaborate on FlipDisplay designs with your team.`}
        >
            <p style={emailStyles.text}>
                Hi {recipientName},
            </p>

            <p style={emailStyles.text}>
                <strong>{invitedByName}</strong> has invited you to join <strong>{teamName}</strong> on FlipDisplay and collaborate on digital display designs!
            </p>

            {/* Team/Role Info Card */}
            <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                padding: '20px',
                marginTop: '24px',
                marginBottom: '24px',
                border: '1px solid #334155'
            }}>
                <div style={{ marginBottom: '16px' }}>
                    <p style={{ color: '#94a3b8', margin: '0 0 4px 0', fontSize: '12px', textTransform: 'uppercase' }}>
                        <strong>Team Name</strong>
                    </p>
                    <p style={{ color: '#cbd5e1', margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                        {teamName}
                    </p>
                </div>

                <div>
                    <p style={{ color: '#94a3b8', margin: '0 0 4px 0', fontSize: '12px', textTransform: 'uppercase' }}>
                        <strong>Your Role</strong>
                    </p>
                    <p style={{ color: '#14b8a6', margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                        {role}
                    </p>
                </div>
            </div>

            <p style={emailStyles.text}>
                <strong>As a {role}, you can:</strong>
            </p>

            <ul style={{
                margin: '12px 0 24px 0',
                paddingLeft: '20px',
                color: '#cbd5e1'
            }}>
                <li style={{ marginBottom: '8px' }}>{roleDescription[role] || roleDescription['Editor']}</li>
                <li style={{ marginBottom: '8px' }}>Access all team displays and designs</li>
                <li style={{ marginBottom: '8px' }}>Collaborate in real-time</li>
                <li>Comment and provide feedback</li>
            </ul>

            <div style={emailStyles.buttonContainer}>
                <a href={inviteLink} style={emailStyles.button}>
                    Accept Invitation
                </a>
            </div>

            <p style={{ ...emailStyles.text, fontSize: '13px', color: '#94a3b8', marginTop: '24px' }}>
                <strong>Invitation expires in {expiryDays} days.</strong> Accept the invitation to join the team. If you don't recognize this request, you can safely ignore this email.
            </p>

            {/* Collaboration Benefits */}
            <div style={{
                backgroundColor: '#1a1f2e',
                borderRadius: '6px',
                padding: '16px',
                marginTop: '24px',
                marginBottom: '24px'
            }}>
                <p style={{ color: '#cbd5e1', margin: '0 0 12px 0', fontSize: '13px', fontWeight: 'bold' }}>
                    Why collaborate with FlipDisplay?
                </p>
                <ul style={{ margin: '0', paddingLeft: '20px', color: '#cbd5e1', fontSize: '13px' }}>
                    <li style={{ marginBottom: '4px' }}>Design once, share everywhere</li>
                    <li style={{ marginBottom: '4px' }}>Control displays in real-time</li>
                    <li style={{ marginBottom: '4px' }}>Sync across your entire team</li>
                    <li>Professional split-flap animations</li>
                </ul>
            </div>

            <hr style={emailStyles.hr} />

            <p style={emailStyles.text}>
                <strong>Need help?</strong> Check out our <a href="https://flipdisplay.online/help#collaboration" style={{ color: '#14b8a6', textDecoration: 'none' }}>collaboration guide</a> or contact support@flipdisplay.online.
            </p>

            <p style={emailStyles.text}>
                Best regards,<br />
                <strong>The FlipDisplay Team</strong>
            </p>
        </BaseLayout>
    );
};

export default CollaborationInviteEmail;
