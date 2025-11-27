# Email Flow Verification Checklist

## ✅ Configuration Verified

### Backend Configuration
- ✅ **Resend API Key**: Configured in `server/.env`
- ✅ **Backend Server**: Has `/api/send-email` endpoint
- ✅ **Email Templates**: 8 React templates available in `src/emails/templates/`

### Frontend Configuration
- ✅ **Email Service**: Updated to call backend API
- ✅ **Template Rendering**: Uses `renderToStaticMarkup` to convert React to HTML
- ✅ **Authentication**: Sends auth token with requests

## 🧪 Testing Steps

### 1. Test Backend Email Sending (Direct)

Test the Resend integration directly:

```bash
cd server
node testEmail.js your-email@example.com
```

This will:
- ✅ Verify Resend API key is working
- ✅ Send a test email with the FlipDisplay template
- ✅ Confirm email delivery

### 2. Test Backend API Endpoint

Test the `/api/send-email` endpoint:

```bash
# First, make sure backend server is running
cd server
npm run dev
```

Then in another terminal, test the endpoint:

```bash
# You'll need a valid auth token from Supabase
curl -X POST http://localhost:3001/api/send-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<h1>Test</h1><p>This is a test email.</p>",
    "text": "Test email"
  }'
```

### 3. Test Full Frontend Flow

Test from the application:

1. **Start both servers**:
   ```bash
   # Terminal 1: Backend
   cd server
   npm run dev
   
   # Terminal 2: Frontend
   npm run dev
   ```

2. **Log in to the application** (to get auth token)

3. **Trigger an email** (e.g., from user registration, password reset, etc.)

## 🔍 Verification Points

### Backend Server Checklist
- [ ] Server running on port 3001
- [ ] `/api/send-email` endpoint accessible
- [ ] Resend API key loaded from `.env`
- [ ] FROM_EMAIL configured (or using default)
- [ ] CORS allows frontend origin

### Email Service Checklist
- [ ] Frontend can reach backend API
- [ ] Auth token is included in requests
- [ ] React templates render to HTML correctly
- [ ] Email payload is valid

### Resend Configuration
- [ ] API key is valid
- [ ] Domain is verified (if using custom domain)
- [ ] FROM_EMAIL matches verified sender

## 🐛 Troubleshooting

### Email Not Sending

**Check Backend Logs**:
```bash
cd server
npm run dev
# Watch for errors when email is triggered
```

**Common Issues**:

1. **"Unauthorized" error**
   - User not logged in
   - Auth token expired
   - Check `useAuthStore` has valid session

2. **"Invalid API key"**
   - Verify `RESEND_API_KEY` in `server/.env`
   - Check key starts with `re_`

3. **"Domain not verified"**
   - If using custom FROM_EMAIL, verify domain in Resend
   - Or use `onboarding@resend.dev` for testing

4. **"CORS error"**
   - Check `ALLOWED_ORIGINS` in `server/.env` includes frontend URL
   - Default: `http://localhost:5173`

5. **Backend not running**
   - Start server: `cd server && npm run dev`
   - Check port 3001 is not in use

## 📊 Expected Flow

```
User Action (Frontend)
    ↓
emailService.sendWelcome(email, name)
    ↓
Render React template to HTML (renderToStaticMarkup)
    ↓
POST /api/send-email with auth token
    ↓
Backend validates auth token
    ↓
Backend validates email payload
    ↓
Backend calls Resend API
    ↓
Email sent! ✅
```

## ✨ Success Indicators

When everything is working:
- ✅ Test script sends email successfully
- ✅ Backend logs show "email_sent" with email ID
- ✅ Email appears in recipient inbox
- ✅ Email has correct styling and content
- ✅ No errors in browser console
- ✅ No errors in backend logs
