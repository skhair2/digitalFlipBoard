import React from 'react';
import { emailStyles } from '../styles';

/**
 * BaseLayout Component
 * Provides consistent email structure with logo, content, and footer
 * 
 * Props:
 *   - heading: Main heading text
 *   - children: Email content (React components)
 *   - footerText: Optional custom footer text
 */
export const BaseLayout = ({ heading, children, footerText = null }) => {
    const currentYear = new Date().getFullYear();
    
    return (
        <div style={emailStyles.main}>
            <div style={emailStyles.container}>
                {/* Logo */}
                <div style={emailStyles.logo}>
                    <span style={emailStyles.logoText}>✦ FlipDisplay.online ✦</span>
                </div>

                {/* Main Content */}
                <div style={emailStyles.content}>
                    {heading && <h1 style={emailStyles.heading}>{heading}</h1>}
                    {children}
                </div>

                {/* Footer */}
                <div style={emailStyles.footer}>
                    {footerText && (
                        <p style={emailStyles.footerText}>{footerText}</p>
                    )}
                    <p style={emailStyles.footerText}>
                        © {currentYear} FlipDisplay.online. All rights reserved.
                    </p>
                    <p style={emailStyles.footerText}>
                        <a href="https://flipdisplay.online/privacy" style={emailStyles.link}>Privacy Policy</a> •
                        <a href="https://flipdisplay.online/terms" style={{ ...emailStyles.link, marginLeft: '8px' }}>Terms of Service</a> •
                        <a href="https://flipdisplay.online/contact" style={{ ...emailStyles.link, marginLeft: '8px' }}>Contact Support</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BaseLayout;
