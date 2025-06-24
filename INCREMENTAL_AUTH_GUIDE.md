# Incremental Authorization Implementation Guide

## Overview

This guide explains how Google OAuth incremental authorization is implemented in the StartupAssistant application. Incremental authorization allows you to request additional Google API permissions only when needed, providing a better user experience.

## Key Benefits

- **Better UX**: Users only see permission requests when they need specific features
- **Higher Conversion**: Reduced permission fatigue leads to higher approval rates  
- **Flexibility**: Add new features without requiring users to re-authorize everything
- **Security**: Users have better visibility into what permissions each feature needs

## Implementation Architecture

### 1. NextAuth Configuration (`src/app/api/auth/[...nextauth]/route.ts`)

The NextAuth provider is configured with minimal initial scopes:

```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      // Basic scopes for initial sign-in
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      // Enable incremental authorization
      include_granted_scopes: 'true',
    },
  },
})
```

### 2. Separate OAuth Flow (`src/app/api/auth/google/route.ts`)

A separate endpoint handles additional scope requests:

```typescript
// Define scope groups for different features
const SCOPE_GROUPS = {
  gmail: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
  ],
  calendar: [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
  ],
  drive: [
    'https://www.googleapis.com/auth/drive.file',
  ],
};
```

### 3. React Components (`src/components/IncrementalAuthButton.tsx`)

Reusable components for requesting additional permissions:

- `IncrementalAuthButton` - Generic component for any scope combination
- `GmailAuthButton` - Pre-configured for Gmail permissions
- `CalendarAuthButton` - Pre-configured for Calendar permissions  
- `DriveAuthButton` - Pre-configured for Drive permissions

## Usage Examples

### Basic Gmail Authorization

```tsx
import { GmailAuthButton } from '@/components/IncrementalAuthButton';

function EmailCampaignFeature() {
  const handleGmailSuccess = (scopes: string[]) => {
    console.log('Gmail authorized:', scopes);
    // Enable email campaign features
  };

  return (
    <GmailAuthButton 
      onSuccess={handleGmailSuccess}
      onError={(error) => console.error('Failed:', error)}
    />
  );
}
```

### Custom Scope Combination

```tsx
import IncrementalAuthButton from '@/components/IncrementalAuthButton';

function AdvancedIntegration() {
  return (
    <IncrementalAuthButton
      scopes={['gmail', 'calendar', 'drive']}
      onSuccess={(scopes) => enableAllFeatures(scopes)}
      className="bg-purple-600 text-white px-4 py-2 rounded"
    >
      Enable Full Integration
    </IncrementalAuthButton>
  );
}
```

### Handling Callbacks

```tsx
import { useIncrementalAuthCallback } from '@/components/IncrementalAuthButton';

function MyComponent() {
  // Handle URL parameters after OAuth redirect
  useIncrementalAuthCallback();
  
  useEffect(() => {
    const handleSuccess = (event: CustomEvent) => {
      console.log('New permissions:', event.detail.scopes);
      // Update UI, enable features, etc.
    };
    
    window.addEventListener('incrementalAuthSuccess', handleSuccess);
    return () => window.removeEventListener('incrementalAuthSuccess', handleSuccess);
  }, []);
}
```

## Real-World Integration Examples

### 1. Email Campaign Manager

Request Gmail permissions only when user tries to create their first campaign:

```tsx
function CampaignCreator() {
  const [hasGmailAccess, setHasGmailAccess] = useState(false);

  const handleCreateCampaign = () => {
    if (!hasGmailAccess) {
      // Show Gmail authorization button
      return <GmailAuthButton onSuccess={() => setHasGmailAccess(true)} />;
    }
    
    // Proceed with campaign creation
    return <CampaignForm />;
  };
}
```

### 2. Meeting Scheduler

Request Calendar permissions when user accesses scheduling features:

```tsx
function MeetingScheduler() {
  return (
    <div>
      <h2>Schedule a Meeting</h2>
      <CalendarAuthButton 
        onSuccess={() => showCalendarPicker()}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Connect Calendar to Schedule
      </CalendarAuthButton>
    </div>
  );
}
```

### 3. File Export Feature

Request Drive permissions when user wants to save files:

```tsx
function ExportDialog() {
  const exportToDrive = () => {
    return (
      <DriveAuthButton 
        onSuccess={(scopes) => performDriveExport()}
        className="bg-yellow-600 text-white px-3 py-2 rounded"
      >
        Save to Google Drive
      </DriveAuthButton>
    );
  };
}
```

## API Endpoints

### Check User Permissions

`GET /api/user/permissions` - Returns current user permissions:

```json
{
  "permissions": ["profile", "gmail", "calendar"],
  "hasGoogleAccess": true,
  "tokenExpired": false,
  "scopes": ["openid", "email", "profile", "https://www.googleapis.com/auth/gmail.send"]
}
```

### Request Additional Scopes

`GET /api/auth/google?scopes=gmail,calendar` - Initiates incremental auth flow

## Google Cloud Console Setup

### Required OAuth Settings

**Authorized JavaScript Origins:**
- `https://your-domain.com`
- `http://localhost:3000` (for development)

**Authorized Redirect URIs:**
- `https://your-domain.com/api/auth/callback/google`
- `http://localhost:3000/api/auth/callback/google`

### Important Notes

1. **include_granted_scopes=true** must be set in authorization requests
2. Scopes are cumulative - new requests include previously granted scopes
3. Refresh tokens work with combined authorization scopes
4. Users can revoke all permissions at once from their Google Account settings

## Testing

Visit `/incremental-auth-demo` to see a working demonstration of all features.

## Security Considerations

1. **State Parameter**: Always include anti-CSRF state parameter
2. **Token Expiration**: Handle expired tokens gracefully with refresh tokens
3. **Scope Validation**: Verify received scopes match requested scopes
4. **Error Handling**: Provide clear error messages for failed authorizations

## Troubleshooting

### Common Issues

1. **redirect_uri_mismatch**: Ensure OAuth redirect URIs exactly match Google Cloud Console settings
2. **invalid_scope**: Check that requested scopes are enabled in Google Cloud Console
3. **state_validation_failed**: Verify state parameter handling in callbacks

### Debug Mode

Enable debug logging in NextAuth configuration:

```typescript
export const authOptions: NextAuthOptions = {
  debug: true, // Enable in development
  // ... other config
};
```

## Migration from Traditional OAuth

If migrating from requesting all scopes upfront:

1. Update NextAuth provider to minimal scopes
2. Add `include_granted_scopes: 'true'` parameter
3. Replace permission buttons with incremental auth components
4. Test that existing users retain their permissions

This implementation provides a smooth user experience while maintaining security and flexibility for future feature additions. 