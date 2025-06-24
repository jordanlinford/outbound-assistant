import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
// Types will be inferred from Prisma queries
import { z } from 'zod';

// Interface will be inferred from Prisma query result

const UpdateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED']),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Get campaign with engagement metrics
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        prospects: {
          include: {
            interactions: true,
          },
        },
      },
    });

    if (!campaign) {
      return new NextResponse('Campaign not found', { status: 404 });
    }

    // Calculate engagement metrics
    const metrics = {
      totalProspects: campaign.prospects.length,
      emailsSent: campaign.prospects.reduce((acc: number, prospect: any) => 
        acc + prospect.interactions.filter((i: any) => i.type === 'EMAIL_SENT').length, 0),
      emailsOpened: campaign.prospects.reduce((acc: number, prospect: any) => 
        acc + prospect.interactions.filter((i: any) => i.type === 'EMAIL_OPENED').length, 0),
      emailsReplied: campaign.prospects.reduce((acc: number, prospect: any) => 
        acc + prospect.interactions.filter((i: any) => i.type === 'EMAIL_REPLIED').length, 0),
      meetingsBooked: campaign.prospects.reduce((acc: number, prospect: any) => 
        acc + prospect.interactions.filter((i: any) => i.type === 'MEETING_BOOKED').length, 0),
      openRate: 0,
      replyRate: 0,
      meetingRate: 0,
    };

    // Calculate rates
    if (metrics.emailsSent > 0) {
      metrics.openRate = (metrics.emailsOpened / metrics.emailsSent) * 100;
      metrics.replyRate = (metrics.emailsReplied / metrics.emailsSent) * 100;
      metrics.meetingRate = (metrics.meetingsBooked / metrics.emailsSent) * 100;
    }

    return NextResponse.json({
      campaignId: campaign.id,
      campaignName: campaign.name,
      status: campaign.status,
      metrics,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching campaign status:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = UpdateStatusSchema.parse(body);

    // Verify campaign exists and belongs to user
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!campaign) {
      return new NextResponse('Campaign not found', { status: 404 });
    }

    // Update campaign status
    const updatedCampaign = await prisma.campaign.update({
      where: {
        id: params.id,
      },
      data: {
        status: validatedData.status,
      },
    });

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating campaign status:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 