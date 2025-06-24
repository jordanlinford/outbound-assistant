import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { EmailAutomationSystem } from '@/lib/email-automation';

// Store automation instances
const automationInstances = new Map<string, EmailAutomationSystem>();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { config } = await request.json();

    // Default automation config
    const defaultConfig = {
      enabled: true,
      autoReplyEnabled: true,
      humanReviewThreshold: 0.7,
      maxEmailsPerHour: 20,
      businessHours: {
        start: 9, // 9 AM
        end: 17,  // 5 PM
        timezone: 'America/Los_Angeles'
      },
      autoFollowUp: true,
      blacklistedDomains: [
        'noreply.com',
        'no-reply.com',
        'mailer-daemon.com'
      ],
      whitelistedSenders: []
    };

    const automationConfig = { ...defaultConfig, ...config };

    // Create automation instance
    const automation = new EmailAutomationSystem(automationConfig);
    
    // Store instance for this user
    automationInstances.set(session.user.email, automation);

    // Start automation
    automation.startAutomation(session.user.email);

    // Also start scheduled email processor
    setInterval(() => {
      automation.processScheduledEmails();
    }, 5 * 60 * 1000); // Every 5 minutes

    console.log(`🤖 Email automation started for ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Email automation started successfully',
      config: automationConfig,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error starting email automation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to start email automation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const automation = automationInstances.get(session.user.email);
  const isRunning = !!automation;

  return NextResponse.json({
    isRunning,
    userEmail: session.user.email,
    timestamp: new Date().toISOString()
  });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Stop automation
  automationInstances.delete(session.user.email);

  console.log(`🛑 Email automation stopped for ${session.user.email}`);

  return NextResponse.json({
    success: true,
    message: 'Email automation stopped',
    timestamp: new Date().toISOString()
  });
} 