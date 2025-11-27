import React from 'react';
import { emailStyles } from '../styles';

export const VerificationEmail = ({ code }) => {
    return (
        <div style={emailStyles.main}>
            <div style={emailStyles.container}>
                <div style={emailStyles.logo}>
                    <span style={emailStyles.logoText}>FlipDisplay.online</span>
                </div>

                <div style={emailStyles.content}>
                    <h1 style={emailStyles.heading}>Verify your email</h1>

                    <p style={emailStyles.text}>
                        Thanks for signing up for FlipDisplay. Please use the following verification code to complete your registration:
                    </p>

                    <div style={emailStyles.codeContainer}>
                        <span style={emailStyles.code}>{code}</span>
                    </div>

                    <p style={emailStyles.text}>
                        This code will expire in 15 minutes. If you didn't request this code, you can safely ignore this email.
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

export default VerificationEmail;
