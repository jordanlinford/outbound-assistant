import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { EmailWarmupManager } from '@/lib/email-warmup';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const warmupManager = new EmailWarmupManager();
    
    // Initialize warmup
    const settings = await warmupManager.initializeWarmup(session.user.id, email);

    return NextResponse.json({
      success: true,
      settings,
      message: 'Email warmup initialized successfully'
    });

  } catch (error) {
    console.error('Error initializing warmup:', error);
    return NextResponse.json(
      { error: 'Failed to initialize warmup' },
      { status: 500 }
    );
  }
} 