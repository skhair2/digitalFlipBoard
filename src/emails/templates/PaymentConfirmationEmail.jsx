import React from 'react';
import { emailStyles } from '../styles';
import BaseLayout from './BaseLayout';

/**
 * PaymentConfirmationEmail Component
 * Sent when user successfully completes a payment/subscription upgrade
 * 
 * Props:
 *   - name: User's first name
 *   - planName: Name of the plan (e.g., "Pro Annual")
 *   - amount: Purchase amount (e.g., "$99.00")
 *   - transactionId: Transaction/Order ID
 *   - nextBillingDate: When next charge occurs (if subscription)
 *   - isSubscription: Boolean - true if recurring subscription
 */
export const PaymentConfirmationEmail = ({ 
    name = 'User',
    planName = 'Pro Annual',
    amount = '$99.00',
    transactionId = 'TXN-000001',
    nextBillingDate = null,
    isSubscription = true
}) => {
    const formattedDate = nextBillingDate ? 
        new Date(nextBillingDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }) : null;

    return (
        <BaseLayout 
            heading={`Payment Confirmed`}
            footerText={`Thank you for your purchase! Your account is now active.`}
        >
            <p style={emailStyles.text}>
                Hi {name},
            </p>

            <p style={emailStyles.text}>
                Thank you for upgrading to <strong>{planName}</strong>! Your payment has been successfully processed and your account is now active.
            </p>

            {/* Invoice Summary */}
            <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                padding: '16px',
                marginTop: '24px',
                marginBottom: '24px',
                border: '1px solid #334155'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                        <tr style={{ borderBottom: '1px solid #334155' }}>
                            <td style={{ padding: '8px 0', color: '#cbd5e1' }}>Plan</td>
                            <td style={{ padding: '8px 0', color: '#cbd5e1', textAlign: 'right', fontWeight: 'bold' }}>
                                {planName}
                            </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #334155' }}>
                            <td style={{ padding: '8px 0', color: '#cbd5e1' }}>Amount</td>
                            <td style={{ padding: '8px 0', color: '#14b8a6', textAlign: 'right', fontWeight: 'bold', fontSize: '18px' }}>
                                {amount}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: '8px 0', color: '#cbd5e1' }}>Transaction ID</td>
                            <td style={{ padding: '8px 0', color: '#94a3b8', textAlign: 'right', fontFamily: 'monospace' }}>
                                {transactionId}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <p style={emailStyles.text}>
                <strong>Your Premium Features:</strong>
            </p>

            <ul style={{
                margin: '12px 0 24px 0',
                paddingLeft: '20px',
                color: '#cbd5e1'
            }}>
                <li style={{ marginBottom: '8px' }}>Unlimited message scheduling</li>
                <li style={{ marginBottom: '8px' }}>Custom board designs & layouts</li>
                <li style={{ marginBottom: '8px' }}>Team collaboration & sharing</li>
                <li style={{ marginBottom: '8px' }}>Priority support</li>
                <li style={{ marginBottom: '8px' }}>Advanced analytics & insights</li>
                <li>No display watermark</li>
            </ul>

            {isSubscription && formattedDate && (
                <div style={{
                    backgroundColor: '#1a1f2e',
                    borderLeft: '4px solid #14b8a6',
                    padding: '12px 16px',
                    marginBottom: '24px',
                    borderRadius: '4px'
                }}>
                    <p style={{ color: '#cbd5e1', margin: '0 0 4px 0', fontSize: '12px' }}>
                        <strong>Next Billing Date</strong>
                    </p>
                    <p style={{ color: '#14b8a6', margin: '0', fontWeight: 'bold' }}>
                        {formattedDate}
                    </p>
                </div>
            )}

            <div style={emailStyles.buttonContainer}>
                <a href="https://flipdisplay.online/dashboard" style={emailStyles.button}>
                    Go to Dashboard
                </a>
            </div>

            <p style={emailStyles.text}>
                Need to manage your subscription or download an invoice? Visit your <a href="https://flipdisplay.online/dashboard/billing" style={{ color: '#14b8a6', textDecoration: 'none' }}>Billing Settings</a>.
            </p>

            <hr style={emailStyles.hr} />

            <p style={emailStyles.text}>
                <strong>Questions?</strong> Our support team is here to help. Reply to this email or contact us at support@flipdisplay.online.
            </p>

            <p style={emailStyles.text}>
                Best regards,<br />
                <strong>The FlipDisplay Team</strong>
            </p>
        </BaseLayout>
    );
};

export default PaymentConfirmationEmail;
