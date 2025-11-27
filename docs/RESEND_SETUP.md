# Resend Email Integration Setup

## Overview
The email service uses Resend via the backend Express server for secure email delivery.

## Setup Steps

### 1. Configure Resend in Backend Server

Add your Resend API key to the server's `.env` file:

```bash
# In server/.env
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=noreply@yourdomain.com
```

### 2. Update Backend FROM_EMAIL

Edit `server/index.js` line 398 to use your verified sender email:

```javascript
from: 'noreply@yourdomain.com', // Change this to your verified email
```

Or use the environment variable by updating the code to:

```javascript
from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
```

### 3. Start the Backend Server

```bash
cd server
npm install  # If not already done
npm run dev  # Development mode
# or
npm start    # Production mode
```

The server will run on `http://localhost:3001` by default.

### 4. Test the Integration

You can test the email service from your application:

```javascript
import { emailService } from './services/emailService';

// Send a welcome email
await emailService.sendWelcome('user@example.com', 'John Doe');

// Send a verification email
await emailService.sendVerification('user@example.com', 'ABC123');

// Send an invite
await emailService.sendInvite(
  'user@example.com',
  'Jane Doe',
  'My Board',
  'https://flipdisplay.online/invite/xyz'
);
```

## Email Templates

All email templates are located in `src/emails/templates/`:
- `WelcomeEmail.js` - Welcome message for new users
- `VerificationEmail.js` - Email verification codes
- `InviteEmail.js` - Collaboration invitations
- `PasswordResetEmail.js` - Password reset links
- `PaymentConfirmationEmail.js` - Payment receipts
- `DesignShareEmail.js` - Design sharing notifications
- `CollaborationInviteEmail.js` - Collaboration requests
- `RateLimitWarningEmail.js` - Rate limit warnings

Templates use React components with inline styles for maximum email client compatibility.

## Resend Domain Setup

Make sure you have verified your domain in Resend:
1. Go to https://resend.com/domains
2. Add your domain
3. Add the required DNS records (SPF, DKIM, DMARC)
4. Wait for verification (usually takes a few minutes)

## How It Works

1. **Frontend** (`src/services/emailService.js`):
   - Renders React email templates to HTML using `renderToStaticMarkup`
   - Sends authenticated request to backend API at `/api/send-email`
   - Includes user's auth token for security

2. **Backend** (`server/index.js`):
   - Validates authentication token
   - Validates email payload
   - Sends email via Resend API
   - Logs email activity

## Troubleshooting

### Email Not Sending
- Verify `RESEND_API_KEY` is set in `server/.env`
- Check backend server is running on port 3001
- Verify domain is verified in Resend
- Check `FROM_EMAIL` matches a verified sender
- Review backend server logs for errors

### Authentication Errors
- Ensure user is logged in (has valid session)
- Check `VITE_API_URL` in frontend `.env` points to backend
- Verify CORS is configured correctly in backend

### Template Rendering Issues
- Ensure all template props are provided
- Check browser console for React errors
- Verify `react-dom/server` is installed in frontend
