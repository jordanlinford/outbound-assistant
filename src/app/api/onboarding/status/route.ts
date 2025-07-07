import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Check if any provider account is connected
  const providerConnected = await prisma.account.count({ where: { userId } }) > 0;

  // Check if user has at least one campaign
  const hasCampaign = await prisma.campaign.count({ where: { userId } }) > 0;

  // Check if user has prospects (across campaigns)
  const hasProspects = await prisma.prospect.count({ where: { campaign: { userId } } }) > 0;

  return NextResponse.json({ providerConnected, hasCampaign, hasProspects });
} 