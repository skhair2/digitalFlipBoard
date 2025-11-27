import React from 'react';
import { emailStyles } from '../styles';

export const WelcomeEmail = ({ name }) => {
    return (
        <div style={emailStyles.main}>
            <div style={emailStyles.container}>
                <div style={emailStyles.logo}>
                    <span style={emailStyles.logoText}>FlipDisplay.online</span>
                </div>

                <div style={emailStyles.content}>
                    <h1 style={emailStyles.heading}>Welcome to FlipDisplay, {name}!</h1>

                    <p style={emailStyles.text}>
                        We're thrilled to have you on board. FlipDisplay transforms any screen into a stunning, retro-style split-flap message board that you can control from anywhere.
                    </p>

                    <p style={emailStyles.text}>
                        Here's how to get started:
                    </p>

                    <ol style={{ ...emailStyles.text, paddingLeft: '24px' }}>
                        <li style={{ marginBottom: '8px' }}>Open <strong>FlipDisplay.online</strong> on your TV or monitor.</li>
                        <li style={{ marginBottom: '8px' }}>Scan the QR code with your phone.</li>
                        <li style={{ marginBottom: '8px' }}>Start typing messages instantly!</li>
                    </ol>

                    <div style={emailStyles.buttonContainer}>
                        <a href="https://flipdisplay.online/control" style={emailStyles.button}>
                            Launch Controller
                        </a>
                    </div>

                    <p style={emailStyles.text}>
                        If you have any questions, our support team is always here to help. Just reply to this email!
                    </p>

                    <hr style={emailStyles.hr} />

                    <p style={emailStyles.text}>
                        Happy Flipping,<br />
                        The FlipDisplay Team
                    </p>
                </div>

                <div style={emailStyles.footer}>
                    <p style={emailStyles.footerText}>
                        © {new Date().getFullYear()} FlipDisplay.online. All rights reserved.
                    </p>
                    <p style={emailStyles.footerText}>
                        <a href="https://flipdisplay.online/privacy" style={emailStyles.link}>Privacy Policy</a> •
                        <a href="https://flipdisplay.online/terms" style={{ ...emailStyles.link, marginLeft: '8px' }}>Terms of Service</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WelcomeEmail;
