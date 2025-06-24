import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { accessToken, refreshToken, expiresOn, account } = await request.json();

    if (!accessToken || !account) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Calculate expiration date
    const expiresAt = expiresOn ? new Date(expiresOn) : new Date(Date.now() + 3600 * 1000); // Default to 1 hour

    // Update user with Microsoft tokens
    await prisma.user.update({
      where: {
        email: session.user.email!,
      },
      data: {
        microsoftAccessToken: accessToken,
        microsoftRefreshToken: refreshToken,
        microsoftTokenExpiresAt: expiresAt,
        microsoftEmail: account.username || account.name,
      },
    });

    // Also create or update Account record for NextAuth compatibility
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'microsoft',
      },
    });

    if (existingAccount) {
      await prisma.account.update({
        where: {
          id: existingAccount.id,
        },
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: Math.floor(expiresAt.getTime() / 1000),
        },
      });
    } else {
      await prisma.account.create({
        data: {
          userId: session.user.id,
          type: 'oauth',
          provider: 'microsoft',
          providerAccountId: account.homeAccountId || account.localAccountId,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: Math.floor(expiresAt.getTime() / 1000),
          scope: 'openid profile email offline_access Mail.Read Mail.Send Mail.ReadWrite Calendars.Read Calendars.ReadWrite',
          token_type: 'Bearer',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Microsoft account connected successfully',
      user: {
        email: session.user.email,
        microsoftEmail: account.username || account.name,
        tokenExpires: expiresAt.toISOString(),
      },
    });

  } catch (error) {
    console.error('Error saving Microsoft tokens:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 