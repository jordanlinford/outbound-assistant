import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { EmailWarmupManager } from '@/lib/email-warmup';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const warmupManager = new EmailWarmupManager();
    
    // Get warmup status
    const status = await warmupManager.getWarmupStatus(session.user.id);
    
    // Get deliverability metrics
    const deliverability = await warmupManager.analyzeDeliverability(session.user.id);

    return NextResponse.json({
      status,
      deliverability
    });

  } catch (error) {
    console.error('Error getting warmup status:', error);
    return NextResponse.json(
      { error: 'Failed to get warmup status' },
      { status: 500 }
    );
  }
} 