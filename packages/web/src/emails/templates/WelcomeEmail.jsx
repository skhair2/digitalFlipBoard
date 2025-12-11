import React from 'react';
import { emailStyles } from '../styles';

export const WelcomeEmail = ({ name = 'Friend' }) => {
    // Extract first name if full name is provided
    const firstName = name?.split(' ')[0] || 'Friend';
    
    return (
        <div style={emailStyles.main}>
            <div style={emailStyles.container}>
                <div style={emailStyles.logo}>
                    <span style={emailStyles.logoText}>✨ FlipDisplay</span>
                </div>

                <div style={emailStyles.content}>
                    <h1 style={emailStyles.heading}>Welcome to FlipDisplay, {firstName}!</h1>

                    <p style={{ ...emailStyles.text, fontSize: '18px', color: '#94a3b8', fontStyle: 'italic' }}>
                        Your retro split-flap message board awaits. Let's make it unforgettable.
                    </p>

                    {/* Feature Highlight */}
                    <div style={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        padding: '16px',
                        margin: '24px 0',
                        borderLeft: '4px solid #14b8a6'
                    }}>
                        <p style={{ ...emailStyles.text, marginBottom: '0', fontSize: '14px', fontWeight: '500' }}>
                            Transform any screen into a stunning, retro-style flip board. Control messages from anywhere, instantly.
                        </p>
                    </div>

                    <h2 style={{ ...emailStyles.heading, fontSize: '18px', marginTop: '28px', marginBottom: '16px' }}>
                        Get Started in 3 Steps
                    </h2>

                    <ol style={{ paddingLeft: '20px', margin: '0 0 24px 0' }}>
                        <li style={{ 
                            marginBottom: '12px',
                            color: '#cbd5e1',
                            fontSize: '16px',
                            lineHeight: '26px'
                        }}>
                            <strong style={{ color: '#14b8a6' }}>Display:</strong> Open FlipDisplay.online on any TV or monitor
                        </li>
                        <li style={{ 
                            marginBottom: '12px',
                            color: '#cbd5e1',
                            fontSize: '16px',
                            lineHeight: '26px'
                        }}>
                            <strong style={{ color: '#14b8a6' }}>Connect:</strong> Scan the QR code with your phone to launch the controller
                        </li>
                        <li style={{ 
                            marginBottom: '12px',
                            color: '#cbd5e1',
                            fontSize: '16px',
                            lineHeight: '26px'
                        }}>
                            <strong style={{ color: '#14b8a6' }}>Create:</strong> Type your message and watch it flip beautifully
                        </li>
                    </ol>

                    <div style={emailStyles.buttonContainer}>
                        <a href="https://flipdisplay.online/control" style={emailStyles.button}>
                            Launch Your Controller
                        </a>
                    </div>

                    {/* Benefits Section */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        margin: '24px 0'
                    }}>
                        <div style={{
                            backgroundColor: '#0f172a',
                            padding: '12px',
                            borderRadius: '6px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '20px', marginBottom: '4px' }}>⚡</div>
                            <p style={{ ...emailStyles.text, fontSize: '13px', marginBottom: '0' }}>Real-time Control</p>
                        </div>
                        <div style={{
                            backgroundColor: '#0f172a',
                            padding: '12px',
                            borderRadius: '6px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '20px', marginBottom: '4px' }}>🎨</div>
                            <p style={{ ...emailStyles.text, fontSize: '13px', marginBottom: '0' }}>Beautiful Design</p>
                        </div>
                        <div style={{
                            backgroundColor: '#0f172a',
                            padding: '12px',
                            borderRadius: '6px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '20px', marginBottom: '4px' }}>📱</div>
                            <p style={{ ...emailStyles.text, fontSize: '13px', marginBottom: '0' }}>Easy to Use</p>
                        </div>
                        <div style={{
                            backgroundColor: '#0f172a',
                            padding: '12px',
                            borderRadius: '6px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '20px', marginBottom: '4px' }}>🌍</div>
                            <p style={{ ...emailStyles.text, fontSize: '13px', marginBottom: '0' }}>Control Anywhere</p>
                        </div>
                    </div>

                    <hr style={emailStyles.hr} />

                    <p style={{ ...emailStyles.text, fontSize: '14px', marginBottom: '8px' }}>
                        <strong>Questions?</strong> Our support team is here to help. Just reply to this email.
                    </p>

                    <p style={{ ...emailStyles.text, fontSize: '14px', color: '#94a3b8' }}>
                        Happy flipping,<br />
                        <strong style={{ color: '#cbd5e1' }}>The FlipDisplay Team</strong>
                    </p>
                </div>

                <div style={emailStyles.footer}>
                    <p style={emailStyles.footerText}>
                        © {new Date().getFullYear()} FlipDisplay.online. All rights reserved.
                    </p>
                    <p style={emailStyles.footerText}>
                        <a href="https://flipdisplay.online/privacy" style={emailStyles.link}>Privacy</a> •
                        <a href="https://flipdisplay.online/terms" style={{ ...emailStyles.link, marginLeft: '8px' }}>Terms</a> •
                        <a href="https://flipdisplay.online/support" style={{ ...emailStyles.link, marginLeft: '8px' }}>Support</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WelcomeEmail;
