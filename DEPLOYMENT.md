# 🚀 Vercel Deployment Guide

## Prerequisites
- Vercel account (free tier works)
- PostgreSQL database (Supabase, Neon, or Railway recommended)
- Google OAuth credentials
- OpenAI API key (optional but recommended)

## 1. Database Setup

### Option A: Supabase (Recommended)
1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string (starts with `postgresql://`)
5. Replace `[YOUR-PASSWORD]` with your actual password

### Option B: Neon
1. Go to [Neon](https://neon.tech/)
2. Create a new database
3. Copy the connection string

### Option C: Railway
1. Go to [Railway](https://railway.app/)
2. Create a PostgreSQL database
3. Copy the connection string

## 2. Environment Variables Setup

In your Vercel dashboard, add these environment variables:

### Required Variables
```bash
# Database
DATABASE_URL="your-postgresql-connection-string"

# NextAuth
NEXTAUTH_URL="https://your-app-name.vercel.app"
NEXTAUTH_SECRET="your-random-secret-key-32-characters-long"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Optional Variables
```bash
# OpenAI (for AI features)
OPENAI_API_KEY="sk-your-openai-api-key"

# Stripe (for payments)
STRIPE_SECRET_KEY="sk_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Microsoft OAuth (optional)
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"

# SendGrid (for email backup)
SENDGRID_API_KEY="your-sendgrid-api-key"
FROM_EMAIL="your-email@yourdomain.com"
```

## 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API and Gmail API
4. Go to "Credentials" > "Create Credentials" > "OAuth 2.0 Client IDs"
5. Set authorized redirect URIs:
   - `https://your-app-name.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for development)

## 4. Deploy to Vercel

### Method 1: GitHub Integration (Recommended)
1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables
6. Deploy!

### Method 2: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

## 5. Post-Deployment Setup

### Database Migration
After deployment, run the database migration:
1. Go to your Vercel dashboard
2. Open your project
3. Go to "Functions" tab
4. The database will be automatically set up on first API call

### OAuth Redirect URIs
Update your OAuth providers with the production URLs:
- Google: `https://your-app-name.vercel.app/api/auth/callback/google`
- Microsoft: `https://your-app-name.vercel.app/api/auth/microsoft/callback`

## 6. Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Go to "Settings" > "Domains"
3. Add your custom domain
4. Update DNS settings as instructed
5. Update `NEXTAUTH_URL` environment variable to your custom domain

## 7. Environment Variables Reference

### Required for Basic Functionality
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Your app's URL
- `NEXTAUTH_SECRET` - Random secret key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

### Optional for Enhanced Features
- `OPENAI_API_KEY` - For AI-powered email responses
- `STRIPE_SECRET_KEY` - For subscription payments
- `MICROSOFT_CLIENT_ID` - For Outlook integration
- `SENDGRID_API_KEY` - For email sending backup

## 8. Troubleshooting

### Common Issues

**Build Errors:**
- Ensure all environment variables are set
- Check that your database is accessible
- Verify OAuth credentials are correct

**Database Connection Issues:**
- Ensure your database allows connections from Vercel IPs
- Check the connection string format
- Verify database credentials

**OAuth Issues:**
- Ensure redirect URIs match exactly
- Check that OAuth consent screen is configured
- Verify client IDs and secrets are correct

### Support
If you encounter issues:
1. Check Vercel function logs
2. Verify environment variables
3. Test OAuth flows in development first
4. Check database connectivity

## 9. Security Checklist

- [ ] Use strong, unique `NEXTAUTH_SECRET`
- [ ] Restrict OAuth redirect URIs to your domains only
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS only (automatic with Vercel)
- [ ] Regularly rotate API keys
- [ ] Monitor for unauthorized access

## 10. Performance Optimization

The app is already optimized for Vercel with:
- ✅ Static page generation where possible
- ✅ API route optimization
- ✅ Image optimization
- ✅ Automatic code splitting
- ✅ CDN distribution

Your app should load quickly and scale automatically with Vercel's infrastructure.

---

🎉 **Your Outbound Assistant is now ready for production!**

Visit your deployed app and start automating your sales outreach! 