/**
 * Email Service Test Script
 * 
 * This script tests the email sending functionality by:
 * 1. Rendering a React email template to HTML
 * 2. Sending it via the backend API
 * 
 * Usage:
 *   node server/testEmail.js your-email@example.com
 */

import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

// Simple HTML email template for testing
const createTestEmail = (name) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <div style="max-width: 560px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 24px; font-weight: bold; color: #ffffff;">FlipDisplay.online</span>
            </div>
            
            <h1 style="font-size: 24px; font-weight: bold; color: #ffffff; margin-bottom: 16px; text-align: center;">
                Welcome to FlipDisplay, ${name}!
            </h1>
            
            <p style="font-size: 16px; line-height: 26px; color: #cbd5e1; margin-bottom: 16px;">
                We're thrilled to have you on board. FlipDisplay transforms any screen into a stunning, retro-style split-flap message board that you can control from anywhere.
            </p>
            
            <p style="font-size: 16px; line-height: 26px; color: #cbd5e1; margin-bottom: 16px;">
                This is a test email to verify that your Resend integration is working correctly! 🎉
            </p>
            
            <div style="text-align: center; margin-top: 32px; margin-bottom: 32px;">
                <a href="https://flipdisplay.online/control" 
                   style="background-color: #14b8a6; border-radius: 8px; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 12px 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    Launch Controller
                </a>
            </div>
            
            <hr style="border-color: #334155; margin: 20px 0;" />
            
            <p style="font-size: 16px; line-height: 26px; color: #cbd5e1;">
                Happy Flipping,<br />
                The FlipDisplay Team
            </p>
        </div>
        
        <div style="margin-top: 32px; text-align: center;">
            <p style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
                © ${new Date().getFullYear()} FlipDisplay.online. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
`;

async function testEmail(recipientEmail) {
    try {
        console.log('🔍 Testing email configuration...\n');
        console.log(`📧 From: ${FROM_EMAIL}`);
        console.log(`📬 To: ${recipientEmail}`);
        console.log(`🔑 API Key: ${process.env.RESEND_API_KEY ? '✅ Configured' : '❌ Missing'}\n`);

        if (!process.env.RESEND_API_KEY) {
            console.error('❌ Error: RESEND_API_KEY not found in environment variables');
            console.log('Please add it to server/.env file');
            process.exit(1);
        }

        console.log('📤 Sending test email...\n');

        const result = await resend.emails.send({
            from: FROM_EMAIL,
            to: recipientEmail,
            subject: '✅ FlipDisplay Email Test - Success!',
            html: createTestEmail('Test User'),
            text: 'This is a test email from FlipDisplay to verify your Resend integration is working correctly!'
        });

        console.log('✅ Email sent successfully!\n');
        console.log('📋 Response:', JSON.stringify(result, null, 2));
        console.log('\n🎉 Email integration is working correctly!');
        console.log('Check your inbox at:', recipientEmail);

    } catch (error) {
        console.error('❌ Error sending email:\n');
        console.error(error.message);

        if (error.message.includes('API key')) {
            console.log('\n💡 Tip: Make sure your RESEND_API_KEY is correct');
        } else if (error.message.includes('domain')) {
            console.log('\n💡 Tip: Make sure your domain is verified in Resend');
            console.log('Visit: https://resend.com/domains');
        }

        process.exit(1);
    }
}

// Get recipient email from command line argument
const recipientEmail = process.argv[2];

if (!recipientEmail) {
    console.log('Usage: node server/testEmail.js your-email@example.com');
    process.exit(1);
}

testEmail(recipientEmail);
