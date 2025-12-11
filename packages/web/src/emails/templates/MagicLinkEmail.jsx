import React from 'react';
import { emailStyles } from '../styles';

export const MagicLinkEmail = ({ magicLink }) => {
    return (
        <div style={emailStyles.main}>
            <div style={emailStyles.container}>
                <div style={emailStyles.logo}>
                    <span style={emailStyles.logoText}>FlipDisplay.online</span>
                </div>

                <div style={emailStyles.content}>
                    <h1 style={emailStyles.heading}>Your Magic Link</h1>

                    <p style={emailStyles.text}>
                        Click the button below to sign in to your FlipDisplay account. This link will expire in 15 minutes.
                    </p>

                    <div style={emailStyles.buttonContainer}>
                        <a href={magicLink} style={emailStyles.button}>
                            Sign In to FlipDisplay
                        </a>
                    </div>

                    <p style={emailStyles.text}>
                        Or copy and paste this link into your browser:
                    </p>

                    <div style={{
                        ...emailStyles.codeContainer,
                        wordBreak: 'break-all',
                        padding: '12px'
                    }}>
                        <span style={{
                            ...emailStyles.text,
                            fontSize: '12px',
                            color: '#2dd4bf'
                        }}>{magicLink}</span>
                    </div>

                    <hr style={emailStyles.hr} />

                    <p style={emailStyles.text}>
                        If you didn't request this link, you can safely ignore this email.
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

export default MagicLinkEmail;
