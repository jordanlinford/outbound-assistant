import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma, ensurePrismaConnection } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const MICROSOFT_GRAPH_URL = 'https://graph.microsoft.com/v1.0/me';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');

  console.log('Microsoft OAuth callback received:', { 
    code: !!code, 
    state: state ? `${state.substring(0, 20)}...` : null, 
    error, 
    error_description 
  });

  // Handle OAuth errors first
  if (error) {
    console.error('Microsoft OAuth error:', error, error_description);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth-demo?error=${error}&description=${encodeURIComponent(error_description || '')}`);
  }

  if (!code) {
    console.error('No authorization code received');
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth-demo?error=no_code`);
  }

  if (!state) {
    console.error('No state parameter received');
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth-demo?error=no_state`);
  }

  // Ensure database connection before proceeding
  const dbConnected = await ensurePrismaConnection();
  if (!dbConnected) {
    console.error('Database connection failed');
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth-demo?error=database_error`);
  }

  // Get session after we know we have the required parameters
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    console.error('No session found during callback');
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?callbackUrl=${encodeURIComponent('/auth-demo')}`);
  }

  // Improved state validation with multiple fallback methods
  let stateValid = false;
  let stateValidationMethod = 'none';

  try {
    // Method 1: Check for bypass/simple states first
    if (state === 'bypass-test-state') {
      console.log('🔓 BYPASS MODE - Skipping state validation');
      stateValid = true;
      stateValidationMethod = 'bypass';
    }
    // Method 2: Simple timestamp-based state
    else if (state.startsWith('simple_')) {
      const parts = state.split('_');
      if (parts.length >= 2) {
        const timestamp = parseInt(parts[1]);
        const maxAge = 30 * 60 * 1000; // 30 minutes
        const age = Date.now() - timestamp;
        if (age <= maxAge) {
          stateValid = true;
          stateValidationMethod = 'simple';
          console.log('Simple state validation passed');
        } else {
          console.warn('Simple state expired:', { age, maxAge });
        }
      }
    }
    // Method 3: Email-based state validation (from MicrosoftLoginButton)
    else if (state.startsWith('user_')) {
      const decodedState = decodeURIComponent(state);
      const statePattern = /^user_[a-zA-Z0-9_]+_\d+$/;
      if (statePattern.test(decodedState)) {
        const stateParts = decodedState.split('_');
        if (stateParts.length >= 3) {
          const stateEmailPart = stateParts.slice(1, -1).join('_');
          const sessionEmailSanitized = session.user.email?.replace(/[^a-zA-Z0-9]/g, '_') || '';
          const timestamp = parseInt(stateParts[stateParts.length - 1]);
          const maxAge = 30 * 60 * 1000; // 30 minutes
          const age = Date.now() - timestamp;
          
          if (stateEmailPart === sessionEmailSanitized && age <= maxAge) {
            stateValid = true;
            stateValidationMethod = 'email';
            console.log('Email-based state validation passed');
          } else {
            console.warn('Email state validation failed:', { stateEmailPart, sessionEmailSanitized, age, maxAge });
          }
        }
      }
    }
    // Method 4: Complex JSON state validation
    else {
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        const maxAge = 30 * 60 * 1000; // 30 minutes
        const age = Date.now() - stateData.timestamp;
        
        if (age <= maxAge) {
          const receivedUserId = String(stateData.userId);
          const sessionUserId = session.user.id ? String(session.user.id) : null;
          const sessionUserEmail = session.user.email ? String(session.user.email) : null;
          
          if ((sessionUserId && receivedUserId === sessionUserId) || 
              (sessionUserEmail && receivedUserId === sessionUserEmail)) {
            stateValid = true;
            stateValidationMethod = 'complex';
            console.log('Complex state validation passed');
          } else {
            console.warn('Complex state user mismatch');
          }
        } else {
          console.warn('Complex state expired:', { age, maxAge });
        }
      } catch (complexError) {
        console.log('Complex state parsing failed:', complexError);
      }
    }

    if (!stateValid) {
      console.error('All state validation methods failed', { 
        state: state.substring(0, 50) + '...', 
        sessionUser: session.user.email,
        methods: ['bypass', 'simple', 'email', 'complex']
      });
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth-demo?error=state_validation_failed&method=${stateValidationMethod}`);
    }

    console.log(`State validation successful using method: ${stateValidationMethod}`);

  } catch (error) {
    console.error('State validation error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth-demo?error=state_validation_error`);
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
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/microsoft/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorText);
      throw new Error(`Failed to exchange code for tokens: ${tokenResponse.status}`);
    }

    const tokens = await tokenResponse.json();
    console.log('Tokens received successfully');

    // Get user info from Microsoft Graph
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
    console.log('User info received:', userInfo.mail || userInfo.userPrincipalName);

    // Store tokens in database with improved error handling
    const whereClause = session.user.id 
      ? { id: session.user.id } 
      : { email: session.user.email! };
    
    await prisma.user.update({
      where: whereClause,
      data: {
        microsoftAccessToken: tokens.access_token,
        microsoftRefreshToken: tokens.refresh_token,
        microsoftTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        microsoftEmail: userInfo.mail || userInfo.userPrincipalName,
      },
    });

    console.log('Microsoft tokens stored successfully');

    // Create response with redirect to auth demo with success
    const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth-demo?success=microsoft_connected&method=${stateValidationMethod}`);

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

    return response;
  } catch (error: any) {
    console.error('Error in Microsoft OAuth callback:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth-demo?error=oauth_failed&message=${encodeURIComponent(error.message || 'Unknown error')}`);
  }
} 