import { NextResponse } from 'next/server';
import { EmailSender, isValidEmail } from '@/lib/email-sender';

export async function POST(request: Request) {
  try {
    const { to, subject, body } = await request.json();

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

    // Initialize email sender
    const emailSender = new EmailSender();

    // Send test email
    const result = await emailSender.sendEmail({
      to,
      subject,
      body,
      fromEmail: 'test@outbound-assistant.com',
      fromName: 'Outbound Assistant Test'
    });

    return NextResponse.json({
      success: result,
      message: result ? 'Test email sent successfully!' : 'Failed to send test email',
      timestamp: new Date().toISOString(),
      emailService: process.env.SENDGRID_API_KEY ? 'sendgrid' : 'none'
    });

  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send test email',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email test endpoint is ready',
    timestamp: new Date().toISOString(),
    emailService: process.env.SENDGRID_API_KEY ? 'sendgrid configured' : 'no email service configured',
    gmailService: process.env.GOOGLE_CLIENT_ID ? 'gmail oauth configured' : 'gmail not configured'
  });
} 