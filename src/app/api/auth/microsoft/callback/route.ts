import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('Microsoft OAuth callback hit');
    
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('OAuth callback params:', {
      code: code ? 'present' : 'missing',
      state,
      error,
      errorDescription
    });

    // Handle OAuth errors
    if (error) {
      console.error('Microsoft OAuth error:', error, errorDescription);
      const errorUrl = `/auth-demo?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`;
      return NextResponse.redirect(new URL(errorUrl, request.url));
    }

    if (!code) {
      console.error('No authorization code received');
      const errorUrl = `/auth-demo?error=no_code&error_description=${encodeURIComponent('No authorization code received')}`;
      return NextResponse.redirect(new URL(errorUrl, request.url));
    }

    if (!state) {
      console.error('No state parameter received');
      const errorUrl = `/auth-demo?error=no_state&error_description=${encodeURIComponent('No state parameter received')}`;
      return NextResponse.redirect(new URL(errorUrl, request.url));
    }

    // Get current session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.error('No active session found');
      const errorUrl = `/auth-demo?error=no_session&error_description=${encodeURIComponent('No active session found')}`;
      return NextResponse.redirect(new URL(errorUrl, request.url));
    }

    console.log('Session user:', session.user.email);

    // Validate state parameter - check if it follows our expected format
    const decodedState = decodeURIComponent(state);
    console.log('Received state:', decodedState);
    
    // State format: user_{email_sanitized}_{timestamp}
    const statePattern = /^user_[a-zA-Z0-9_]+_\d+$/;
    if (!statePattern.test(decodedState)) {
      console.error('Invalid state format:', decodedState);
      const errorUrl = `/auth-demo?error=invalid_state&error_description=${encodeURIComponent('Invalid state parameter format')}`;
      return NextResponse.redirect(new URL(errorUrl, request.url));
    }

    // Extract email from state for additional validation
    const stateParts = decodedState.split('_');
    if (stateParts.length < 3) {
      console.error('State parameter malformed:', decodedState);
      const errorUrl = `/auth-demo?error=malformed_state&error_description=${encodeURIComponent('State parameter is malformed')}`;
      return NextResponse.redirect(new URL(errorUrl, request.url));
    }

    // Basic validation - check if state contains expected user identifier
    const stateEmailPart = stateParts.slice(1, -1).join('_'); // Everything between 'user_' and timestamp
    const sessionEmailSanitized = session.user.email?.replace(/[^a-zA-Z0-9]/g, '_') || '';
    
    if (stateEmailPart !== sessionEmailSanitized) {
      console.error('State email mismatch:', { stateEmailPart, sessionEmailSanitized });
      const errorUrl = `/auth-demo?error=state_mismatch&error_description=${encodeURIComponent('State parameter does not match current user')}`;
      return NextResponse.redirect(new URL(errorUrl, request.url));
    }

    console.log('State validation passed');

    // Exchange code for tokens
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/microsoft/callback`,
        scope: [
          'openid',
          'profile',
          'email',
          'offline_access',
          'https://graph.microsoft.com/Mail.Read',
          'https://graph.microsoft.com/Mail.Send',
          'https://graph.microsoft.com/Mail.ReadWrite',
          'https://graph.microsoft.com/Calendars.Read',
          'https://graph.microsoft.com/Calendars.ReadWrite',
        ].join(' '),
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log('Token exchange response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      const errorUrl = `/auth-demo?error=token_exchange_failed&error_description=${encodeURIComponent(tokenData.error_description || 'Failed to exchange code for tokens')}`;
      return NextResponse.redirect(new URL(errorUrl, request.url));
    }

    console.log('Token exchange successful');

    // Get user info from Microsoft Graph
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();
    console.log('Microsoft user data:', userData.mail || userData.userPrincipalName);

    if (!userResponse.ok) {
      console.error('Failed to get user info:', userData);
      const errorUrl = `/auth-demo?error=user_info_failed&error_description=${encodeURIComponent('Failed to get user information from Microsoft')}`;
      return NextResponse.redirect(new URL(errorUrl, request.url));
    }

    // Save tokens to database
    await prisma.user.update({
      where: { email: session.user.email! },
      data: {
        microsoftAccessToken: tokenData.access_token,
        microsoftRefreshToken: tokenData.refresh_token,
        microsoftTokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
        microsoftEmail: userData.mail || userData.userPrincipalName,
      },
    });

    console.log('Microsoft tokens saved successfully');

    // Redirect to success page
    return NextResponse.redirect(new URL('/auth-demo?success=microsoft_connected', request.url));

  } catch (error) {
    console.error('Microsoft OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorUrl = `/auth-demo?error=callback_error&error_description=${encodeURIComponent(errorMessage)}`;
    return NextResponse.redirect(new URL(errorUrl, request.url));
  }
} 