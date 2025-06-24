import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await request.json();
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
    }

    // Find the invite code
    const inviteCode = await prisma.inviteCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!inviteCode) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid invite code' 
      }, { status: 400 });
    }

    // Check if code is active
    if (!inviteCode.isActive) {
      return NextResponse.json({ 
        valid: false, 
        error: 'This invite code is no longer active' 
      }, { status: 400 });
    }

    // Check if code has expired
    if (inviteCode.expiresAt && new Date() > inviteCode.expiresAt) {
      return NextResponse.json({ 
        valid: false, 
        error: 'This invite code has expired' 
      }, { status: 400 });
    }

    // Check if code has reached max uses
    if (inviteCode.usedCount >= inviteCode.maxUses) {
      return NextResponse.json({ 
        valid: false, 
        error: 'This invite code has reached its usage limit' 
      }, { status: 400 });
    }

    // Check if user's email is allowed (if email restrictions exist)
    if (inviteCode.allowedEmails.length > 0 && 
        !inviteCode.allowedEmails.includes(session.user.email)) {
      return NextResponse.json({ 
        valid: false, 
        error: 'This invite code is not available for your email address' 
      }, { status: 400 });
    }

    // Check if user has already used an invite code
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { inviteCodeUsed: true, serviceLevelId: true }
    });

    if (user?.inviteCodeUsed) {
      return NextResponse.json({ 
        valid: false, 
        error: 'You have already used an invite code' 
      }, { status: 400 });
    }

    // If user is already on a paid plan, don't allow invite code
    if (user?.serviceLevelId && user.serviceLevelId !== 'free') {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invite codes can only be used with free accounts' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      valid: true, 
      serviceLevelId: inviteCode.serviceLevelId,
      description: inviteCode.description 
    });

  } catch (error) {
    console.error('Invite code validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 