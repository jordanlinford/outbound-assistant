import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=${error}`);
  }

  if (!code || !state) {
    console.error('Missing code or state in OAuth callback');
    return new NextResponse('Invalid request - missing code or state', { status: 400 });
  }

  try {
    // Parse state (now JSON format)
    let stateData;
    try {
      stateData = JSON.parse(state);
    } catch (e) {
      // Fallback for old string format
      stateData = { userId: state, requestedScopes: ['gmail'], timestamp: Date.now() };
    }

    // Verify state matches current user
    if (stateData.userId !== session.user.id) {
      console.error('State userId mismatch:', { expected: session.user.id, received: stateData.userId });
      return new NextResponse('Invalid state - user mismatch', { status: 400 });
    }

    // Check state timestamp (prevent replay attacks)
    const stateAge = Date.now() - (stateData.timestamp || 0);
    if (stateAge > 10 * 60 * 1000) { // 10 minutes
      console.error('State too old:', stateAge);
      return new NextResponse('Invalid state - expired', { status: 400 });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error(`Failed to exchange code for tokens: ${errorText}`);
    }

    const tokens = await tokenResponse.json();
    console.log('Received tokens:', { 
      hasAccessToken: !!tokens.access_token, 
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in,
      scope: tokens.scope 
    });

    // Get user info
    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('User info fetch failed:', errorText);
      throw new Error(`Failed to fetch user info: ${errorText}`);
    }

    const userInfo = await userInfoResponse.json();
    console.log('User info retrieved:', { email: userInfo.email });

    // Store tokens in database
    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token || undefined, // Don't overwrite existing refresh token with null
        googleTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        googleEmail: userInfo.email,
      },
    });

    console.log('✅ Successfully updated user tokens in database');

    // Create response with redirect
    const redirectUrl = `${process.env.NEXTAUTH_URL}/dashboard?auth=success&scopes=${stateData.requestedScopes?.join(',') || 'gmail'}`;
    const response = NextResponse.redirect(redirectUrl);

    // Set secure cookies
    response.cookies.set('google_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in,
    });

    if (tokens.refresh_token) {
      response.cookies.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    return response;
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=oauth_failed&details=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`);
  }
} 