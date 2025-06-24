# 🎯 Outbound Assistant - AI-Powered Sales Automation

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/outbound-assistant)

> **Replace expensive BDR hires with AI that handles prospecting, email sequences, follow-ups, and meeting booking. 99% cost savings vs traditional sales teams.**

![Outbound Assistant Logo](public/outbound-assistant-logo.svg)

## 🚀 Features

### 🤖 **AI-Powered Automation**
- **Smart Prospect Finding**: AI discovers high-quality leads with advanced deduplication
- **Email Sequence Generation**: AI creates personalized email campaigns
- **Intelligent Follow-ups**: Automated responses based on prospect engagement
- **Meeting Scheduling**: AI handles calendar coordination and booking

### 📧 **Email Management**
- **Multi-Provider Support**: Gmail, Outlook, and custom SMTP
- **Email Warmup**: Gradual sending volume increase for deliverability
- **Campaign Analytics**: Track opens, clicks, replies, and conversions
- **Template Library**: Pre-built sequences for different industries

### 📊 **CRM & Analytics**
- **Prospect Management**: Organize leads with custom lists and tags
- **Campaign Tracking**: Real-time performance monitoring
- **ROI Calculation**: Track cost savings vs traditional BDR teams
- **Usage Analytics**: Monitor API usage and subscription limits

### 🔗 **Integrations**
- **OAuth Authentication**: Google & Microsoft login
- **Stripe Payments**: Subscription management and billing
- **LinkedIn Content**: AI-generated posts and engagement
- **Calendar Sync**: Meeting scheduling integration

## 🛠 Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js (Google, Microsoft OAuth)
- **Payments**: Stripe
- **Deployment**: Vercel
- **AI**: OpenAI GPT-4 integration

## 📦 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Google OAuth credentials
- Microsoft OAuth credentials (optional)
- Stripe account
- OpenAI API key

### 1. Clone & Install
```bash
git clone https://github.com/your-username/outbound-assistant.git
cd outbound-assistant
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
```

Fill in your environment variables:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/outbound_assistant"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Microsoft OAuth (Optional)
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"

# Stripe
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# OpenAI
OPENAI_API_KEY="sk-..."
```

### 3. Database Setup
```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see your app! 🎉

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/your-username/outbound-assistant.git
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Connect your GitHub repository
   - Add environment variables
   - Deploy automatically

3. **Database Setup**:
   - Use Vercel Postgres or external PostgreSQL
   - Run migrations: `npx prisma migrate deploy`

### Manual Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm start
   ```

## 📋 Configuration

### OAuth Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-domain.com/api/auth/callback/google`

#### Microsoft OAuth
1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new application
3. Add redirect URI: `https://your-domain.com/api/auth/callback/microsoft`
4. Get client ID and secret

### Stripe Setup
1. Create Stripe account
2. Get publishable and secret keys
3. Set up webhook endpoint: `https://your-domain.com/api/stripe/webhook`
4. Configure subscription products

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only

# Production
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run database migrations
npm run prisma:studio   # Open Prisma Studio

# Utilities
npm run lint            # Run ESLint
npm run type-check      # TypeScript type checking
```

## 🏗 Project Structure

```
outbound-assistant/
├── src/
│   ├── app/                 # Next.js 13+ app directory
│   │   ├── api/            # API routes
│   │   ├── dashboard/      # Dashboard pages
│   │   └── (auth)/         # Authentication pages
│   ├── components/         # React components
│   ├── lib/               # Utility libraries
│   └── types/             # TypeScript types
├── prisma/                # Database schema & migrations
├── public/                # Static assets
└── scripts/               # Development scripts
```

## 🔐 Security Features

- **CSRF Protection**: Built-in Next.js security
- **SQL Injection Prevention**: Prisma ORM with prepared statements
- **Environment Variables**: Secure credential management
- **OAuth Security**: Industry-standard authentication
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Server-side validation for all inputs

## 📊 Monitoring & Analytics

- **Performance Monitoring**: Built-in performance tracking
- **Error Boundaries**: Comprehensive error handling
- **Usage Analytics**: Track API usage and limits
- **Health Checks**: System status monitoring
- **Logging**: Structured logging throughout the application

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

- 📧 Email: support@outboundassistant.com
- 💬 Discord: [Join our community](https://discord.gg/outbound-assistant)
- 📖 Documentation: [docs.outboundassistant.com](https://docs.outboundassistant.com)

## 🎯 Roadmap

- [ ] **Advanced AI Features**
  - [ ] Voice call automation
  - [ ] Video message generation
  - [ ] Sentiment analysis
  
- [ ] **Integrations**
  - [ ] HubSpot CRM
  - [ ] Salesforce integration
  - [ ] Slack notifications
  
- [ ] **Analytics**
  - [ ] Advanced reporting dashboard
  - [ ] A/B testing for email sequences
  - [ ] Predictive lead scoring

---

**Built with ❤️ by the Outbound Assistant team**

*Empowering solo entrepreneurs and small businesses to scale their outreach without scaling their costs.*
