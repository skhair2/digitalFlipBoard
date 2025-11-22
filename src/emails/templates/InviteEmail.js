import React from 'react';
import { emailStyles } from '../styles';

export const InviteEmail = ({ inviterName, boardName, inviteLink }) => {
    return (
        <div style={emailStyles.main}>
            <div style={emailStyles.container}>
                <div style={emailStyles.logo}>
                    <span style={emailStyles.logoText}>FlipDisplay.online</span>
                </div>

                <div style={emailStyles.content}>
                    <h1 style={emailStyles.heading}>You've been invited!</h1>

                    <p style={emailStyles.text}>
                        <strong>{inviterName}</strong> has invited you to collaborate on the board <strong>"{boardName}"</strong>.
                    </p>

                    <p style={emailStyles.text}>
                        Collaborate in real-time, update messages, and manage the display together.
                    </p>

                    <div style={emailStyles.buttonContainer}>
                        <a href={inviteLink} style={emailStyles.button}>
                            Accept Invitation
                        </a>
                    </div>

                    <p style={emailStyles.text}>
                        Or copy and paste this link into your browser:
                    </p>

                    <p style={{ ...emailStyles.text, wordBreak: 'break-all', fontSize: '14px', color: '#94a3b8' }}>
                        {inviteLink}
                    </p>
                </div>

                <div style={emailStyles.footer}>
                    <p style={emailStyles.footerText}>
                        © {new Date().getFullYear()} FlipDisplay.online. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InviteEmail;
