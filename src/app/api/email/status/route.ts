import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user from database with email provider tokens
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiresAt: true,
        googleEmail: true,
        microsoftAccessToken: true,
        microsoftRefreshToken: true,
        microsoftTokenExpiresAt: true,
        microsoftEmail: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if tokens exist and are not expired
    const now = new Date();
    
    const googleConnected = !!(
      user.googleAccessToken && 
      user.googleRefreshToken &&
      (!user.googleTokenExpiresAt || user.googleTokenExpiresAt > now)
    );

    const microsoftConnected = !!(
      user.microsoftAccessToken && 
      user.microsoftRefreshToken &&
      (!user.microsoftTokenExpiresAt || user.microsoftTokenExpiresAt > now)
    );

    return NextResponse.json({
      google: {
        connected: googleConnected,
        email: user.googleEmail,
        expiresAt: user.googleTokenExpiresAt,
      },
      microsoft: {
        connected: microsoftConnected,
        email: user.microsoftEmail,
        expiresAt: user.microsoftTokenExpiresAt,
      },
    });

  } catch (error) {
    console.error('Email status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check email status' },
      { status: 500 }
    );
  }
} 