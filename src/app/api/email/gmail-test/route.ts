import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { to, subject, body } = await request.json();

    // Validate input
    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      );
    }

    // Get user's Google account with tokens
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: {
        accounts: {
          where: { provider: 'google' }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      );
    }

    const hasGoogleAccount = user.accounts && user.accounts.length > 0;
    const accountAccessToken = hasGoogleAccount ? user.accounts[0].access_token : null;
    const accountRefreshToken = hasGoogleAccount ? user.accounts[0].refresh_token : null;
    const userAccessToken = user.googleAccessToken;
    const userRefreshToken = user.googleRefreshToken;

    // Prefer account tokens (NextAuth standard) but fall back to user tokens
    const accessToken = accountAccessToken || userAccessToken;
    const refreshToken = accountRefreshToken || userRefreshToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google access token not available. Please reconnect your Gmail account.' },
        { status: 400 }
      );
    }

    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3000/api/auth/callback/google'
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Create email content
    const emailContent = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `From: ${user.name || 'Outbound Assistant'} <${user.email}>`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body
    ].join('\n');

    // Encode email
    const encodedEmail = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully via Gmail!',
      messageId: response.data.id,
      timestamp: new Date().toISOString(),
      from: user.email,
      to: to
    });

  } catch (error) {
    console.error('Gmail send error:', error);
    
    let errorMessage = 'Failed to send email via Gmail';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check user's Google account status
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: {
        accounts: {
          where: { provider: 'google' }
        }
      }
    });

    const hasGoogleAccount = user?.accounts && user.accounts.length > 0;
    const accountAccessToken = hasGoogleAccount ? user.accounts[0].access_token : null;
    const userAccessToken = user?.googleAccessToken;
    
    // Prefer account token (NextAuth standard) but fall back to user token
    const hasAccessToken = !!(accountAccessToken || userAccessToken);
    
    // Check if token is expired (only for user tokens, account tokens are managed by NextAuth)
    const tokenExpired = user?.googleTokenExpiresAt && user.googleTokenExpiresAt < new Date();
    
    let status = 'not_connected';
    if (hasAccessToken && !tokenExpired) {
      status = 'ready';
    } else if (hasAccessToken && tokenExpired) {
      status = 'token_expired';
    } else if (hasGoogleAccount) {
      status = 'needs_reconnection';
    }

    return NextResponse.json({
      message: 'Gmail test endpoint ready',
      user: {
        email: user?.email,
        name: user?.name
      },
      gmail: {
        connected: hasGoogleAccount,
        hasAccessToken: hasAccessToken,
        tokenExpired: tokenExpired,
        status: status,
        tokenSource: accountAccessToken ? 'account' : (userAccessToken ? 'user' : 'none')
      },
      debug: {
        hasGoogleAccount,
        accountTokenExists: !!accountAccessToken,
        userTokenExists: !!userAccessToken,
        tokenExpiresAt: user?.googleTokenExpiresAt
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gmail status error:', error);
    return NextResponse.json(
      { error: 'Failed to check Gmail status' },
      { status: 500 }
    );
  }
} 