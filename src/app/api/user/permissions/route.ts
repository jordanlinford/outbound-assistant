import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Map of Google OAuth scopes to friendly names
const SCOPE_MAPPING = {
  'https://www.googleapis.com/auth/gmail.readonly': 'gmail',
  'https://www.googleapis.com/auth/gmail.send': 'gmail',
  'https://www.googleapis.com/auth/gmail.modify': 'gmail',
  'https://www.googleapis.com/auth/calendar.readonly': 'calendar',
  'https://www.googleapis.com/auth/calendar.events': 'calendar',
  'https://www.googleapis.com/auth/drive.file': 'drive',
  'openid': 'profile',
  'email': 'profile', 
  'profile': 'profile',
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiresAt: true,
        googleEmail: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has Google tokens
    if (!user.googleAccessToken) {
      return NextResponse.json({ 
        permissions: ['profile'], // Basic permissions from initial sign-in
        hasGoogleAccess: false,
        tokenExpired: false,
      });
    }

    // Check if token is expired
    const tokenExpired = user.googleTokenExpiresAt ? 
      new Date() > user.googleTokenExpiresAt : false;

    if (tokenExpired && !user.googleRefreshToken) {
      return NextResponse.json({ 
        permissions: ['profile'],
        hasGoogleAccess: false,
        tokenExpired: true,
      });
    }

    // Get token info from Google to check current scopes
    let currentScopes: string[] = [];
    try {
      const tokenInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${user.googleAccessToken}`
      );

      if (tokenInfoResponse.ok) {
        const tokenInfo = await tokenInfoResponse.json();
        currentScopes = tokenInfo.scope ? tokenInfo.scope.split(' ') : [];
      } else if (user.googleRefreshToken && tokenExpired) {
        // Try to refresh the token
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            refresh_token: user.googleRefreshToken,
            grant_type: 'refresh_token',
          }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          
          // Update user with new token
          await prisma.user.update({
            where: { email: session.user.email },
            data: {
              googleAccessToken: refreshData.access_token,
              googleTokenExpiresAt: new Date(Date.now() + refreshData.expires_in * 1000),
            },
          });

          // Get scopes from refresh response
          currentScopes = refreshData.scope ? refreshData.scope.split(' ') : [];
        }
      }
    } catch (error) {
      console.error('Error checking token info:', error);
      // Fallback to basic permissions
      currentScopes = ['openid', 'email', 'profile'];
    }

    // Convert scopes to friendly names
    const permissions = Array.from(new Set(
      currentScopes.map(scope => SCOPE_MAPPING[scope as keyof typeof SCOPE_MAPPING] || scope)
        .filter(permission => permission !== undefined)
    ));

    return NextResponse.json({
      permissions,
      hasGoogleAccess: true,
      tokenExpired: false,
      scopes: currentScopes, // Include raw scopes for debugging
    });

  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 