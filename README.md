# Digital FlipBoard

Transform any screen into a stunning split-flap message board. Control from your phone, display on your TV. No hardware required. Free forever.

## ✨ Features

- **Split-Flap Display**: Realistic split-flap animation and sound effects
- **Remote Control**: Control the display from your mobile phone
- **Real-time Updates**: Messages update instantly using WebSockets
- **Customizable**: Choose from various color themes and animations
- **Free**: No hardware costs, just use your existing devices
- **No Account Required**: Just share a session code
- **Premium Features**: Designer, Collections, Version History, Sharing (optional upgrade)

## 🚀 Getting Started

### 1. Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server && npm install && cd ..
```

### 2. Set Up Environment Variables

**Frontend** (`.env.local`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_WEBSOCKET_URL=http://localhost:3001
VITE_MIXPANEL_TOKEN=your-token
```

**Backend** (`server/.env`):
```bash
cp server/.env.example server/.env
# Then edit with your values:
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - RESEND_API_KEY (for email invitations)
# - ALLOWED_ORIGINS (your domain)
```

### 3. Start the Application

```bash
# Terminal 1: Start Frontend
npm run dev

# Terminal 2: Start Backend
npm run server:dev
```

### 4. Open in Browser

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 📱 Usage

### Display Mode
1. Open http://localhost:5173/display
2. Share this page URL or display on a TV/monitor
3. Wait for someone to connect

### Control Mode
1. Open http://localhost:5173/control
2. Generate a session code
3. Share code with display operator
4. Type messages and watch them animate

## 🏗️ Architecture

### Frontend
- **React + Vite** - Fast development and production builds
- **Zustand** - Lightweight state management
- **TailwindCSS** - Utility-first styling
- **Socket.io Client** - Real-time communication
- **Supabase JS** - Authentication and data

### Backend
- **Express.js** - Web server
- **Socket.io** - WebSocket communication
- **Supabase** - Auth and database
- **Resend** - Email service
- **Zod** - Input validation

### Database
- **Supabase PostgreSQL** - User data, designs, permissions
- **Row Level Security (RLS)** - Fine-grained access control
- **Real-time subscriptions** - Live data updates

## 🔐 Security

All critical and high-priority security vulnerabilities have been fixed:
- ✅ API keys server-only (no client exposure)
- ✅ JWT authentication verified
- ✅ Input validation with Zod schemas
- ✅ CORS whitelist-based configuration
- ✅ Server-side rate limiting enforced
- ✅ Security headers implemented
- ✅ XSS protection via DOMPurify
- ✅ Sanitized logging in production

See `docs/README_SECURITY_IMPLEMENTATION.md` for details.

## 📊 SEO & Marketing

**Comprehensive Content Strategy:**
- 13 blog articles (1,200-2,000 words each)
- 6 master taglines + 50+ industry variations
- 100+ marketing assets (email, social, ads)
- Complete keyword research (40+ keywords)
- 12-month content roadmap

See `docs/SEO_CONTENT_STRATEGY.md` for the full strategy.

## 📚 Documentation

### Getting Started
- [Architecture Overview](.github/copilot-instructions.md)
- [Security Implementation](docs/README_SECURITY_IMPLEMENTATION.md)
- [SEO Strategy](docs/SEO_CONTENT_STRATEGY.md)

### Deployment
- [Production Deployment Checklist](docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- [Environment Configuration](server/.env.example)

### Development
- [Component Patterns](.github/copilot-instructions.md)
- [WebSocket Events](.github/copilot-instructions.md)
- [State Management](.github/copilot-instructions.md)

## 🛠️ Development Commands

```bash
# Frontend
npm run dev              # Start dev server (Vite)
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # ESLint

# Backend
npm run server:dev       # Start with auto-reload (nodemon)
npm run server           # Start production server
npm run server:install   # Install server dependencies
```

## 📈 Performance

- **Code Splitting**: Lazy-loaded components
- **Tree Shaking**: Unused code removed
- **Compression**: Gzip enabled
- **CDN Ready**: Static assets optimized
- **Real-time**: WebSocket fallback to polling
- **Offline**: Graceful degradation

## 🔄 State Management Flow

```
Control Page
  ↓
  MessageInput (component)
  ↓
  sessionStore (Zustand)
  ↓
  websocketService (Socket.io)
  ↓
  Server/Socket.io
  ↓
  Display Page
  ↓
  DigitalFlipBoardGrid (component)
```

## 🌍 Supported Themes

- **Monochrome** (black/white)
- **Teal** (modern)
- **Vintage** (retro)

## 🎨 Customization

### Add New Theme
1. Update `ColorThemePicker.jsx` with new option
2. Add CSS classes to `Character.jsx`
3. Update theme config in `tailwind.config.js`

### Add New Animation
1. Define keyframe in `tailwind.config.js`
2. Add option to `AnimationPicker.jsx`
3. Apply in `Character.jsx`

## 📞 Support

- **Issues**: Create GitHub issue
- **Discussions**: Use GitHub discussions
- **Email**: support@flipdisplay.online
- **Documentation**: See `/docs` folder

## 📄 License

MIT License - See LICENSE file

## 🙏 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Create pull request

## 🎯 Roadmap

- [x] Core flip board display
- [x] Remote control interface
- [x] Session pairing
- [x] Multiple themes
- [x] Animations
- [x] Security hardening
- [x] SEO optimization
- [ ] Video recording
- [ ] GIF export
- [ ] Mobile app
- [ ] Cloud hosting

## 🌟 Show Your Support

⭐ Star this repo if you find it useful!

---

**Status**: ✅ Production Ready | **Grade**: A- (Security) | **Last Updated**: November 22, 2025