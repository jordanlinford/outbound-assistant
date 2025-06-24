import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { EmailSender, isValidEmail } from '@/lib/email-sender';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { to, subject, body, method } = await request.json();

    // Validate input
    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      );
    }

    if (!isValidEmail(to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get user's Google account information
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
        { status: 404 }
      );
    }

    // Initialize email sender
    const emailSender = new EmailSender();

    // Send test email
    const result = await emailSender.sendEmail({
      to,
      subject,
      body,
      fromEmail: user.email!,
      fromName: user.name || 'Outbound Assistant'
    });

    return NextResponse.json({
      success: result,
      message: result ? 'Test email sent successfully!' : 'Failed to send test email',
      method: method || 'auto'
    });

  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send test email'
      },
      { status: 500 }
    );
  }
} 