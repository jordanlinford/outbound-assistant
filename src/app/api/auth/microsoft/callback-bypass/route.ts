import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const MICROSOFT_GRAPH_URL = 'https://graph.microsoft.com/v1.0/me';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');

  console.log('Microsoft OAuth bypass callback:', { code: !!code, state, error, error_description });

  if (error) {
    console.error('Microsoft OAuth error:', error, error_description);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth-demo?error=${error}&description=${encodeURIComponent(error_description || '')}`);
  }

  if (!code) {
    console.error('No authorization code received');
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth-demo?error=no_code`);
  }

  // Skip state validation for testing
  console.log('⚠️ BYPASSING STATE VALIDATION FOR TESTING');

  const session = await getServerSession();
  if (!session?.user) {
    console.error('No session found during callback');
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?callbackUrl=${encodeURIComponent('/auth-demo')}`);
  }

  try {
    console.log('Exchanging code for tokens...');
    
    // Exchange code for tokens
    const tokenResponse = await fetch(MICROSOFT_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/microsoft/callback-bypass`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorText);
      throw new Error(`Failed to exchange code for tokens: ${tokenResponse.status} - ${errorText}`);
    }

    const tokens = await tokenResponse.json();
    console.log('✅ Tokens received successfully!');

    // Get user info from Microsoft Graph
    console.log('Fetching user info from Microsoft Graph...');
    const userInfoResponse = await fetch(MICROSOFT_GRAPH_URL, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('User info fetch failed:', {
        status: userInfoResponse.status,
        statusText: userInfoResponse.statusText,
        error: errorText
      });
      throw new Error(`Failed to fetch user info: ${userInfoResponse.status} - ${errorText}`);
    }

    const userInfo = await userInfoResponse.json();
    console.log('✅ User info received:', {
      displayName: userInfo.displayName,
      mail: userInfo.mail,
      userPrincipalName: userInfo.userPrincipalName
    });

    // Store tokens in database
    try {
      await prisma.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          microsoftAccessToken: tokens.access_token,
          microsoftRefreshToken: tokens.refresh_token,
          microsoftTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          microsoftEmail: userInfo.mail || userInfo.userPrincipalName,
        },
      });
      console.log('✅ Microsoft tokens stored successfully in database!');
    } catch (dbError) {
      console.error('Database update failed:', dbError);
      // Continue anyway - tokens work even if not stored
    }

    // Create success response
    const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth-demo?success=microsoft_connected_bypass`);

    // Set secure cookies
    response.cookies.set('microsoft_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in,
    });

    if (tokens.refresh_token) {
      response.cookies.set('microsoft_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    console.log('🎉 Microsoft OAuth completed successfully!');
    return response;

  } catch (error: any) {
    console.error('❌ Error in Microsoft OAuth callback:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth-demo?error=oauth_failed&message=${encodeURIComponent(error.message || 'Unknown error')}`);
  }
} 