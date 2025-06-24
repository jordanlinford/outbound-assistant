# Microsoft OAuth Setup Guide

## Prerequisites
- Azure account with access to Azure Portal
- Domain name for production deployment
- SSL certificate for HTTPS

## 1. Azure App Registration

### Step 1: Create App Registration
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: `Outbound Assistant - Production`
   - **Supported account types**: `Accounts in any organizational directory and personal Microsoft accounts`
   - **Redirect URI**: 
     - Type: `Web`
     - URL: `https://yourdomain.com/api/auth/microsoft/callback`

### Step 2: Configure API Permissions
1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Add these permissions:
   - `openid`
   - `profile`
   - `email`
   - `offline_access`
   - `Mail.Read`
   - `Mail.Send`
   - `Mail.ReadWrite`
   - `Calendars.Read`
   - `Calendars.ReadWrite`
6. Click **Grant admin consent** (if you have admin privileges)

### Step 3: Create Client Secret
1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add description: `Production Secret`
4. Set expiration: `24 months` (recommended)
5. Click **Add**
6. **IMPORTANT**: Copy the secret value immediately (you won't see it again)

### Step 4: Configure Authentication
1. Go to **Authentication**
2. Under **Platform configurations**, click **Add a platform**
3. Select **Single-page application**
4. Add these redirect URIs:
   - `https://yourdomain.com` (for MSAL)
   - `https://yourdomain.com/auth-demo` (for testing)
5. Under **Implicit grant and hybrid flows**, enable:
   - `Access tokens`
   - `ID tokens`

## 2. Environment Variables

### Development (.env.local)
```bash
# Microsoft OAuth Configuration
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your_application_id_here
MICROSOFT_CLIENT_ID=your_application_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_here
```

### Production (Vercel/Netlify/AWS)
Set these environment variables in your hosting platform:
```bash
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your_application_id_here
MICROSOFT_CLIENT_ID=your_application_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_URL=https://yourdomain.com
```

## 3. Testing

### Test Endpoints
1. **Health Check**: `GET /api/health`
2. **Outlook Status**: `GET /api/email/outlook-test`
3. **Auth Demo**: Visit `/auth-demo`

### Test Flow
1. Sign in with Google first
2. Go to `/auth-demo` or dashboard
3. Click "Connect Outlook" button
4. Complete Microsoft OAuth flow
5. Verify connection in EmailProviderStatus component

## 4. Deployment Checklist

### Pre-Deployment
- [ ] Azure app registered with correct redirect URIs
- [ ] API permissions granted and admin consent given
- [ ] Client secret created and stored securely
- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] Domain DNS configured

### Post-Deployment
- [ ] Test Microsoft OAuth flow in production
- [ ] Verify token storage in database
- [ ] Test email sending via Outlook
- [ ] Monitor error logs for authentication issues
- [ ] Set up token refresh monitoring

## 5. Security Considerations

### Production Security
- Use HTTPS only
- Set secure cookie flags
- Implement CSRF protection
- Rotate client secrets regularly
- Monitor for suspicious activity

### Token Management
- Implement automatic token refresh
- Handle token expiration gracefully
- Store tokens encrypted in database
- Set appropriate token scopes

## 6. Troubleshooting

### Common Issues

#### "AADSTS50011: The reply URL specified in the request does not match"
- Check redirect URI in Azure app registration
- Ensure NEXTAUTH_URL matches production domain
- Verify HTTPS is used in production

#### "Invalid client secret"
- Regenerate client secret in Azure Portal
- Update environment variables
- Redeploy application

#### "Token expired" errors
- Implement token refresh logic
- Check token expiration handling
- Verify refresh token storage

#### "Insufficient privileges" for API calls
- Check API permissions in Azure
- Ensure admin consent is granted
- Verify user has necessary permissions

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=true
NEXTAUTH_DEBUG=true
```

## 7. Monitoring

### Key Metrics to Monitor
- OAuth success/failure rates
- Token refresh success rates
- Email sending success rates
- API error rates
- User connection status

### Logging
- Authentication events
- Token refresh events
- Email sending events
- Error events with stack traces

## 8. Maintenance

### Regular Tasks
- Monitor client secret expiration
- Review API permission usage
- Update redirect URIs for new domains
- Monitor Microsoft Graph API limits
- Review security logs

### Updates
- Keep MSAL libraries updated
- Monitor Microsoft Graph API changes
- Update scopes as needed
- Review security best practices

## Support

For issues with this integration:
1. Check Azure Portal app registration
2. Verify environment variables
3. Test with `/auth-demo` page
4. Check browser console for MSAL errors
5. Review application logs for backend errors 