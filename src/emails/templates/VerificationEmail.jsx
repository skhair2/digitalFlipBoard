import React from 'react';
import { emailStyles } from '../styles';

export const VerificationEmail = ({ code, verificationLink }) => {
    return (
        <div style={emailStyles.main}>
            <div style={emailStyles.container}>
                <div style={emailStyles.logo}>
                    <span style={emailStyles.logoText}>✨ FlipDisplay</span>
                </div>

                <div style={emailStyles.content}>
                    <h1 style={emailStyles.heading}>Confirm Your Email</h1>

                    <p style={{ ...emailStyles.text, fontSize: '16px' }}>
                        Welcome to FlipDisplay! Just one more step to secure your account.
                    </p>

                    {/* Verification Code Section */}
                    <div style={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        padding: '20px',
                        margin: '24px 0',
                        textAlign: 'center',
                        border: '1px solid #334155'
                    }}>
                        <p style={{ ...emailStyles.text, fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
                            Enter this code to verify your email:
                        </p>
                        <span style={{
                            ...emailStyles.code,
                            fontSize: '28px',
                            letterSpacing: '6px',
                            color: '#14b8a6'
                        }}>
                            {code}
                        </span>
                        <p style={{ ...emailStyles.text, fontSize: '12px', color: '#64748b', marginTop: '12px', marginBottom: '0' }}>
                            Code expires in 24 hours
                        </p>
                    </div>

                    {/* Verification Link (if available) */}
                    {verificationLink && (
                        <>
                            <div style={{
                                textAlign: 'center',
                                margin: '16px 0',
                                color: '#64748b',
                                fontSize: '14px'
                            }}>
                                Or click the button below:
                            </div>
                            <div style={emailStyles.buttonContainer}>
                                <a href={verificationLink} style={emailStyles.button}>
                                    Verify Email Address
                                </a>
                            </div>
                        </>
                    )}

                    <hr style={emailStyles.hr} />

                    <p style={{ ...emailStyles.text, fontSize: '14px', color: '#94a3b8' }}>
                        <strong style={{ color: '#cbd5e1' }}>Didn't request this?</strong><br />
                        If you didn't create a FlipDisplay account, you can safely ignore this email. Your account will not be created until you verify.
                    </p>
                </div>

                <div style={emailStyles.footer}>
                    <p style={emailStyles.footerText}>
                        © {new Date().getFullYear()} FlipDisplay.online. All rights reserved.
                    </p>
                    <p style={emailStyles.footerText}>
                        <a href="https://flipdisplay.online/privacy" style={emailStyles.link}>Privacy</a> •
                        <a href="https://flipdisplay.online/terms" style={{ ...emailStyles.link, marginLeft: '8px' }}>Terms</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VerificationEmail;
