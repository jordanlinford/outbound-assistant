# Gmail Connection Fix Guide

## Issue Identified
The dashboard was showing Gmail as "connected" but email sending was failing because:
1. NextAuth stores tokens in the `Account` table
2. Some parts of the code were looking for tokens in the `User` table
3. The token storage was inconsistent between different parts of the system

## Fix Applied
Updated the authentication system to store tokens in both locations for compatibility.

## Steps to Fix Your Connection

### 1. Sign Out and Sign Back In
1. Go to your dashboard: http://localhost:3000/dashboard
2. Click "Sign Out"
3. Sign back in with Google
4. **Important**: When Google asks for permissions, make sure to grant Gmail permissions

### 2. Test the Connection
After signing back in, the system should automatically:
- Store tokens in both the Account table (NextAuth standard)
- Store tokens in the User table (for backward compatibility)
- Show "Connected & Ready" status for Gmail

### 3. Verify Email Sending
1. Go to the dashboard
2. Try sending a test email or creating a campaign
3. It should now work without the "connect Gmail" error

## What Was Changed
1. **Enhanced NextAuth callback**: Now populates both token storage locations
2. **Updated Gmail test endpoint**: Checks both token sources and provides better status
3. **Added Gmail.modify scope**: For better email management capabilities
4. **Improved error handling**: Better debugging information

## If Issues Persist
1. Check the browser console for any errors
2. Try clearing browser cookies and signing in again
3. Ensure your Google account has Gmail enabled
4. Check that the GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correctly set

## Technical Details
- Tokens are now stored in both `accounts.access_token` and `user.googleAccessToken`
- The system prefers NextAuth tokens but falls back to user tokens
- Token expiration is properly handled
- Better status reporting in the dashboard 