import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Verify campaign exists and belongs to user
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            prospects: true,
            sequences: true,
          },
        },
      },
    });

    if (!campaign) {
      return new NextResponse('Campaign not found', { status: 404 });
    }

    if (campaign.status === 'ACTIVE') {
      return NextResponse.json({ error: 'Campaign is already active' }, { status: 400 });
    }

    if (campaign._count.prospects === 0) {
      return NextResponse.json({ 
        error: 'Cannot launch campaign with no prospects. Please add prospects first.' 
      }, { status: 400 });
    }

    if (campaign._count.sequences === 0) {
      return NextResponse.json({ 
        error: 'Cannot launch campaign with no email sequences. Please create sequences first.' 
      }, { status: 400 });
    }

    // Update campaign status to ACTIVE
    const updatedCampaign = await prisma.campaign.update({
      where: {
        id: params.id,
      },
      data: {
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Campaign "${campaign.name}" launched successfully with ${campaign._count.prospects} prospects and ${campaign._count.sequences} email sequences`,
      campaign: updatedCampaign,
    });
  } catch (error) {
    console.error('Error launching campaign:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 