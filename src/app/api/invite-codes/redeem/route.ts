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

    // Use a transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Find the invite code
      const inviteCode = await tx.inviteCode.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!inviteCode) {
        throw new Error('Invalid invite code');
      }

      // Check if code is active and valid (same checks as validate)
      if (!inviteCode.isActive) {
        throw new Error('This invite code is no longer active');
      }

      if (inviteCode.expiresAt && new Date() > inviteCode.expiresAt) {
        throw new Error('This invite code has expired');
      }

      if (inviteCode.usedCount >= inviteCode.maxUses) {
        throw new Error('This invite code has reached its usage limit');
      }

      if (inviteCode.allowedEmails.length > 0 && 
          !inviteCode.allowedEmails.includes(session.user.email)) {
        throw new Error('This invite code is not available for your email address');
      }

      // Check if user has already used an invite code
      const user = await tx.user.findUnique({
        where: { email: session.user.email },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.inviteCodeUsed) {
        throw new Error('You have already used an invite code');
      }

      if (user.serviceLevelId && user.serviceLevelId !== 'free') {
        throw new Error('Invite codes can only be used with free accounts');
      }

      // Update the user with the new service level
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          serviceLevelId: inviteCode.serviceLevelId,
          inviteCodeUsed: inviteCode.code,
          inviteCodeRedeemedAt: new Date(),
        },
      });

      // Increment the usage count on the invite code
      await tx.inviteCode.update({
        where: { id: inviteCode.id },
        data: {
          usedCount: inviteCode.usedCount + 1,
        },
      });

      return {
        success: true,
        serviceLevelId: inviteCode.serviceLevelId,
        description: inviteCode.description,
      };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Invite code redemption error:', error);
    
    // Return specific error messages for known errors
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 