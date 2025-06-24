import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Verify campaign belongs to user
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!campaign) {
      return new NextResponse('Campaign not found', { status: 404 });
    }

    const campaignLists = await prisma.campaignList.findMany({
      where: {
        campaignId: params.id,
      },
      include: {
        list: {
          include: {
            _count: {
              select: {
                prospects: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(campaignLists);
  } catch (error) {
    console.error('Error fetching campaign lists:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { listIds, autoEnroll = true } = await request.json();

    if (!listIds || !Array.isArray(listIds) || listIds.length === 0) {
      return NextResponse.json({ error: 'List IDs are required' }, { status: 400 });
    }

    // Verify campaign belongs to user
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!campaign) {
      return new NextResponse('Campaign not found', { status: 404 });
    }

    // Verify all lists belong to user
    const lists = await prisma.list.findMany({
      where: {
        id: { in: listIds },
        userId: session.user.id,
      },
    });

    if (lists.length !== listIds.length) {
      return NextResponse.json({ error: 'Some lists not found or not accessible' }, { status: 400 });
    }

    // Connect lists to campaign (ignore duplicates)
    const campaignListEntries = listIds.map(listId => ({
      campaignId: params.id,
      listId,
      autoEnroll,
    }));

    const results = await Promise.allSettled(
      campaignListEntries.map(entry =>
        prisma.campaignList.create({
          data: entry,
          include: {
            list: {
              include: {
                _count: {
                  select: {
                    prospects: true,
                  },
                },
              },
            },
          },
        })
      )
    );

    const successful = results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value);

    const failed = results
      .filter(result => result.status === 'rejected')
      .length;

    // If auto-enroll is enabled, enroll existing prospects from these lists
    if (autoEnroll && successful.length > 0) {
      await enrollExistingProspectsFromLists(params.id, successful.map(s => s.listId));
    }

    return NextResponse.json({
      success: true,
      connected: successful.length,
      failed: failed,
      campaignLists: successful,
    });
  } catch (error) {
    console.error('Error connecting lists to campaign:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { listIds } = await request.json();

    if (!listIds || !Array.isArray(listIds) || listIds.length === 0) {
      return NextResponse.json({ error: 'List IDs are required' }, { status: 400 });
    }

    // Verify campaign belongs to user
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!campaign) {
      return new NextResponse('Campaign not found', { status: 404 });
    }

    // Disconnect lists from campaign
    const deleted = await prisma.campaignList.deleteMany({
      where: {
        campaignId: params.id,
        listId: { in: listIds },
      },
    });

    return NextResponse.json({
      success: true,
      disconnected: deleted.count,
    });
  } catch (error) {
    console.error('Error disconnecting lists from campaign:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Helper function to enroll existing prospects from lists into a campaign
async function enrollExistingProspectsFromLists(campaignId: string, listIds: string[]) {
  try {
    // Get all prospects from these lists
    const prospectLists = await prisma.prospectList.findMany({
      where: {
        listId: { in: listIds },
      },
      include: {
        prospect: true,
      },
    });

    // For each prospect, check if they need to be enrolled in the campaign
    for (const prospectList of prospectLists) {
      const prospect = prospectList.prospect;
      
      // Check if prospect is already in this campaign
      const existingProspect = await prisma.prospect.findFirst({
        where: {
          email: prospect.email,
          campaignId: campaignId,
        },
      });

      // If not already in campaign, create a new prospect record for this campaign
      if (!existingProspect) {
        try {
          await prisma.prospect.create({
            data: {
              email: prospect.email,
              name: prospect.name,
              company: prospect.company,
              title: prospect.title,
              campaignId: campaignId,
              status: 'new',
            },
          });
          console.log(`Auto-enrolled prospect ${prospect.email} in campaign ${campaignId}`);
        } catch (error) {
          // Handle duplicate email per campaign constraint
          console.log(`Prospect ${prospect.email} already exists in campaign ${campaignId}`);
        }
      }
    }
  } catch (error) {
    console.error('Error enrolling existing prospects:', error);
  }
} 