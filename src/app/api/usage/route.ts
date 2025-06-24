import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { UsageTracker } from '@/lib/usage-tracker';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tracker = new UsageTracker(session.user.id);
    
    const [usage, serviceLevel, percentages, remaining] = await Promise.all([
      tracker.getCurrentUsage(),
      tracker.getUserServiceLevel(),
      tracker.getUsagePercentages(),
      tracker.getRemainingLimits(),
    ]);

    return NextResponse.json({
      usage,
      serviceLevel,
      percentages,
      remaining,
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, count = 1 } = await request.json();
    
    if (!action || !['email', 'campaign', 'linkedin', 'ai_response'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const tracker = new UsageTracker(session.user.id);
    
    // Check if the action is allowed
    const canPerform = await tracker.canPerformAction(action);
    
    if (!canPerform) {
      return NextResponse.json(
        { error: 'Usage limit exceeded', action },
        { status: 429 }
      );
    }

    // Track the usage
    await tracker.trackUsage(action, count);

    // Return updated usage stats
    const [usage, remaining] = await Promise.all([
      tracker.getCurrentUsage(),
      tracker.getRemainingLimits(),
    ]);

    return NextResponse.json({
      success: true,
      usage,
      remaining,
    });
  } catch (error) {
    console.error('Usage tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 