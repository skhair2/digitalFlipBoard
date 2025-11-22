# Email Templates Documentation

## Overview

FlipDisplay uses a standardized email template system built with React components. All templates inherit styling and structure from `BaseLayout` and `emailStyles` to ensure consistent branding across all user communications.

**Key Features:**
- ✅ Dark theme (slate-900 background, teal-500 primary color)
- ✅ Responsive design (mobile-friendly)
- ✅ Branded with "✦ FlipDisplay.online ✦" logo
- ✅ Reusable BaseLayout component
- ✅ Flexible, prop-based customization
- ✅ Professional footer with policies and contact

---

## Available Templates

### 1. **WelcomeEmail**
Sent when a new user creates an account.

**Props:**
```javascript
{
    name: 'John',                    // User's first name
    verificationLink: 'https://...',  // Email verification URL
}
```

**Use Case:**
- New user registration
- Account creation confirmation

---

### 2. **VerificationEmail**
Sent to verify user's email address.

**Props:**
```javascript
{
    name: 'John',                 // User's first name
    verificationCode: '123456',   // 6-digit verification code
    verificationLink: 'https://', // Verification URL
}
```

**Use Case:**
- Email verification during signup
- Resend verification code

---

### 3. **InviteEmail**
Sent when inviting someone to join FlipDisplay via magic link.

**Props:**
```javascript
{
    recipientName: 'Jane',           // Recipient's first name
    invitedByName: 'John',           // Person sending invite
    inviteLink: 'https://...',       // Magic link URL
    expiryHours: 24                  // Link expiration time
}
```

**Use Case:**
- Invite non-users to try FlipDisplay
- Marketing invitations

---

### 4. **PasswordResetEmail**
Sent when user requests password reset.

**Props:**
```javascript
{
    name: 'John',                    // User's first name
    resetLink: 'https://...',        // Password reset URL
    expirationHours: 24              // Link validity period
}
```

**Use Case:**
- Forgot password requests
- Password recovery

---

### 5. **PaymentConfirmationEmail**
Sent after successful payment/subscription upgrade.

**Props:**
```javascript
{
    name: 'John',                      // User's first name
    planName: 'Pro Annual',            // Plan purchased
    amount: '$99.00',                  // Purchase amount
    transactionId: 'TXN-000001',       // Transaction ID
    nextBillingDate: '2024-12-25',     // Next charge date (for subscriptions)
    isSubscription: true               // Whether it's a recurring subscription
}
```

**Use Case:**
- Purchase confirmation
- Subscription upgrade confirmation
- Invoice delivery

---

### 6. **DesignShareEmail**
Sent when a user shares a board design with others.

**Props:**
```javascript
{
    recipientName: 'Jane',                    // Recipient's name
    senderName: 'John',                       // Person sharing design
    designName: 'Sales Dashboard',            // Design title
    shareMessage: 'Check this out!',          // Custom message (optional)
    accessLink: 'https://...',                // Share link
    expiryDays: 30                            // Link expiration
}
```

**Use Case:**
- Design sharing notifications
- Collaboration invitations

---

### 7. **CollaborationInviteEmail**
Sent when inviting someone to join a team.

**Props:**
```javascript
{
    recipientName: 'Jane',              // Recipient's name
    invitedByName: 'John',              // Person sending invite
    teamName: 'Marketing Team',         // Team name
    inviteLink: 'https://...',          // Acceptance link
    role: 'Editor',                     // User's role ("Viewer", "Editor", "Admin")
    expiryDays: 7                       // Invite expiration
}
```

**Use Case:**
- Team collaboration invites
- Member onboarding
- Role-based access grants

---

### 8. **RateLimitWarningEmail**
Sent when user approaches or exceeds rate limits.

**Props:**
```javascript
{
    name: 'John',                       // User's first name
    limitType: 'messages',              // Type of limit
    currentUsage: '8 of 10',            // Current usage
    resetTime: '2024-12-25T15:30:00Z', // When limit resets
    planName: 'Free',                   // Current plan
    hasUpgrade: true                    // Can user upgrade?
}
```

**Limit Types:**
- `'messages'` - Message sending rate limit
- `'sessions'` - Active session limit
- `'api-calls'` - API usage limit

**Use Case:**
- Rate limit warnings
- Upgrade prompts
- Usage monitoring

---

## BaseLayout Component

All templates wrap their content with `BaseLayout` to ensure consistent structure and styling.

**Props:**
```javascript
{
    heading: 'Email Title',      // Main heading (required)
    children: <Content />,       // Email body content (required)
    footerText: 'Custom footer'  // Footer text (optional, has default)
}
```

**Structure:**
```
┌─────────────────────────────────┐
│  ✦ FlipDisplay.online ✦ (Logo) │
├─────────────────────────────────┤
│  Email Heading                  │
├─────────────────────────────────┤
│  Custom Content (children)      │
├─────────────────────────────────┤
│  Footer with:                   │
│  - Custom footer text           │
│  - Copyright & year             │
│  - Policy links                 │
│  - Contact email                │
└─────────────────────────────────┘
```

---

## Email Styling

All templates use styles from `src/emails/styles.js`:

### Color Palette
```javascript
colors: {
    bg: '#0f172a',           // Main background (slate-900)
    cardBg: '#1e293b',       // Card background (slate-800)
    border: '#334155',       // Border color (slate-700)
    primary: '#14b8a6',      // Primary (teal-500)
    text: '#cbd5e1',         // Main text (slate-200)
    muted: '#94a3b8',        // Muted text (slate-400)
    accent: '#f97316'        // Accent/warning (orange-500)
}
```

### Key Style Objects
- `emailStyles.text` - Standard paragraph styling
- `emailStyles.heading` - Section headings
- `emailStyles.button` - CTA buttons (teal background)
- `emailStyles.buttonContainer` - Button wrapper with padding
- `emailStyles.codeContainer` - Code/monospace text containers
- `emailStyles.hr` - Horizontal divider
- `emailStyles.footerText` - Footer text styling

---

## Usage Examples

### Example 1: Send Welcome Email
```javascript
import { WelcomeEmail } from '@/emails/templates';
import { resend } from '@/services/emailService';

// In your backend/API
const html = ReactDOMServer.renderToString(
    <WelcomeEmail 
        name="John"
        verificationLink="https://flipdisplay.online/verify/abc123"
    />
);

await resend.emails.send({
    from: 'welcome@flipdisplay.online',
    to: user.email,
    subject: 'Welcome to FlipDisplay!',
    html
});
```

### Example 2: Send Payment Confirmation
```javascript
import { PaymentConfirmationEmail } from '@/emails/templates';

const html = ReactDOMServer.renderToString(
    <PaymentConfirmationEmail 
        name="John"
        planName="Pro Annual"
        amount="$99.00"
        transactionId="TXN-000001"
        nextBillingDate="2025-12-25"
        isSubscription={true}
    />
);

await resend.emails.send({
    from: 'billing@flipdisplay.online',
    to: user.email,
    subject: 'Payment Confirmed - Welcome to FlipDisplay Pro!',
    html
});
```

### Example 3: Send Team Invite
```javascript
import { CollaborationInviteEmail } from '@/emails/templates';

const html = ReactDOMServer.renderToString(
    <CollaborationInviteEmail 
        recipientName="Jane"
        invitedByName="John"
        teamName="Marketing Team"
        inviteLink="https://flipdisplay.online/team/invite/xyz789"
        role="Editor"
        expiryDays={7}
    />
);

await resend.emails.send({
    from: 'team@flipdisplay.online',
    to: recipient.email,
    subject: `Join ${teamName} on FlipDisplay`,
    html
});
```

---

## Rendering Email Templates

Email templates are React components and must be converted to HTML before sending.

### Option 1: Using react-dom/server (Node.js)
```javascript
import ReactDOMServer from 'react-dom/server';
import { WelcomeEmail } from '@/emails/templates';

const html = ReactDOMServer.renderToString(
    <WelcomeEmail name="John" verificationLink="..." />
);
```

### Option 2: Using @react-email/render (Recommended)
```javascript
import { render } from '@react-email/render';
import { WelcomeEmail } from '@/emails/templates';

const html = render(
    <WelcomeEmail name="John" verificationLink="..." />
);
```

---

## Best Practices

### 1. Always Provide Default Props
Templates should work with just user data provided:
```javascript
// Good - has sensible defaults
export const WelcomeEmail = ({ name = 'User', ... }) => { ... }

// User only needs to provide required data
<WelcomeEmail name="John" />
```

### 2. Use Consistent Naming
- `name` for current user's first name
- `recipientName` when email goes to someone else
- `invitedByName` / `senderName` for action originator

### 3. Use BaseLayout for Consistency
Never skip BaseLayout - it ensures consistent branding:
```javascript
// ✅ Good
<BaseLayout heading="Title">
    <Content />
</BaseLayout>

// ❌ Don't do this
<div>
    <p>Content without BaseLayout</p>
</div>
```

### 4. Include Helpful CTAs
Every email should have at least one clear call-to-action button:
```javascript
<div style={emailStyles.buttonContainer}>
    <a href={actionLink} style={emailStyles.button}>
        Action Text
    </a>
</div>
```

### 5. Responsive Design
Use inline styles and avoid media queries:
```javascript
// ✅ Good - works in all email clients
style={{ padding: '16px', fontSize: '14px' }}

// ❌ Avoid - not supported in many email clients
style={{ ...responsive.desktop }}
```

---

## Testing Emails

### Option 1: Visual Testing with Resend Preview
```bash
npm install -D @react-email/cli
npx react-email preview
```

### Option 2: Email Client Testing
Send test emails to:
- Gmail (desktop and mobile)
- Outlook
- Apple Mail
- Gmail mobile app

### Option 3: Automated Testing
```javascript
import { render } from '@react-email/render';
import { WelcomeEmail } from '@/emails/templates';

describe('WelcomeEmail', () => {
    it('renders with required props', () => {
        const html = render(<WelcomeEmail name="John" />);
        expect(html).toContain('John');
        expect(html).toContain('FlipDisplay');
    });
});
```

---

## Integration with Backend

### Supabase Edge Functions
```javascript
// supabase/functions/send-welcome-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { render } from '@react-email/render';
import WelcomeEmail from '../../emails/templates/WelcomeEmail.tsx';
import { resend } from '@/services/emailService';

serve(async (req) => {
    const { email, name, verificationLink } = await req.json();
    
    const html = render(
        <WelcomeEmail 
            name={name}
            verificationLink={verificationLink}
        />
    );
    
    await resend.emails.send({
        from: 'welcome@flipdisplay.online',
        to: email,
        subject: 'Welcome to FlipDisplay!',
        html
    });
    
    return new Response('Email sent');
});
```

### Express Backend
```javascript
// server/routes/auth.js
import ReactDOMServer from 'react-dom/server';
import { WelcomeEmail } from '../emails/templates';

router.post('/signup', async (req, res) => {
    const { email, name } = req.body;
    
    // Create user...
    
    const html = ReactDOMServer.renderToString(
        <WelcomeEmail 
            name={name}
            verificationLink={`${FRONTEND_URL}/verify/${token}`}
        />
    );
    
    await sendEmail({
        to: email,
        subject: 'Welcome to FlipDisplay!',
        html
    });
    
    res.json({ success: true });
});
```

---

## Maintenance & Updates

### Adding a New Template
1. Create new component in `src/emails/templates/`
2. Inherit from `BaseLayout`
3. Use `emailStyles` for all styling
4. Document props and use cases
5. Add to `index.js` exports
6. Update this documentation

### Updating Brand Elements
- **Logo**: Update in `BaseLayout.js`
- **Colors**: Update in `src/emails/styles.js`
- **Company name**: Search/replace "FlipDisplay" or "flipdisplay.online"
- **Footer links**: Update in `BaseLayout.js` footer section

---

## File Structure

```
src/emails/
├── styles.js                    # Shared email styling
├── templates/
│   ├── index.js                # Central exports
│   ├── BaseLayout.js           # Reusable layout
│   ├── WelcomeEmail.js         # New user welcome
│   ├── VerificationEmail.js    # Email verification
│   ├── InviteEmail.js          # Magic link invite
│   ├── PasswordResetEmail.js   # Password recovery
│   ├── PaymentConfirmationEmail.js  # Payment receipt
│   ├── DesignShareEmail.js     # Design sharing
│   ├── CollaborationInviteEmail.js  # Team invite
│   └── RateLimitWarningEmail.js     # Rate limit notice
└── TEMPLATES_DOCUMENTATION.md  # This file
```

---

## FAQ

**Q: Can I use these templates for SMS or push notifications?**
A: These are specifically designed for email. For SMS/push, you'll need separate templates without email-specific styling.

**Q: How do I add inline images?**
A: Use base64-encoded images or external URLs in `<img>` tags. Most email clients support both.

**Q: Can I use custom fonts?**
A: Stick to web-safe fonts (Arial, Helvetica, Georgia) as email clients have limited font support. Use `font-family` stack fallbacks.

**Q: What about dark mode support?**
A: All templates use dark colors by design. Consider adding `@media (prefers-color-scheme: light)` for clients that support it.

**Q: How do I track email opens?**
A: Add a tracking pixel in BaseLayout footer:
```javascript
<img src={`${TRACKING_URL}/email/${emailId}/open`} width="1" height="1" />
```

---

## Support & Resources

- **Resend Documentation**: https://resend.com/docs
- **Email Best Practices**: https://mjml.io
- **MJML Templates**: https://github.com/mjmlio/mjml
- **Email Testing**: https://www.litmus.com

---

**Last Updated:** December 2024
**Maintained By:** FlipDisplay Team
**Version:** 1.0
