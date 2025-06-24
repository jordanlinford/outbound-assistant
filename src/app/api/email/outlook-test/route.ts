import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { EmailSender } from '@/lib/email-sender';

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

    // Get user's Microsoft account with tokens
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      );
    }

    if (!user.microsoftAccessToken) {
      return NextResponse.json(
        { error: 'Microsoft Outlook account not connected' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (user.microsoftTokenExpiresAt && user.microsoftTokenExpiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Microsoft access token expired. Please reconnect your Outlook account.' },
        { status: 400 }
      );
    }

    // Send email via Outlook
    const result = await EmailSender.sendViaOutlook({
      to,
      subject,
      body,
      fromName: user.name || 'Outbound Assistant',
      fromEmail: user.microsoftEmail || user.email!
    }, {
      accessToken: user.microsoftAccessToken
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully via Outlook!',
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
        from: user.microsoftEmail || user.email,
        to: to
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Outlook send error:', error);
    
    let errorMessage = 'Failed to send email via Outlook';
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
    // Check user's Microsoft account status
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    const hasMicrosoftAccount = user?.microsoftAccessToken;
    const isTokenValid = user?.microsoftTokenExpiresAt && user.microsoftTokenExpiresAt > new Date();

    return NextResponse.json({
      message: 'Outlook test endpoint ready',
      user: {
        email: user?.email,
        name: user?.name,
        microsoftEmail: user?.microsoftEmail
      },
      outlook: {
        connected: !!hasMicrosoftAccount,
        hasAccessToken: !!hasMicrosoftAccount,
        tokenValid: !!isTokenValid,
        tokenExpires: user?.microsoftTokenExpiresAt?.toISOString(),
        status: (hasMicrosoftAccount && isTokenValid) ? 'ready' : 'needs_connection'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Outlook status error:', error);
    return NextResponse.json(
      { error: 'Failed to check Outlook status' },
      { status: 500 }
    );
  }
} 