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
    // Verify list belongs to user
    const list = await prisma.list.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!list) {
      return new NextResponse('List not found', { status: 404 });
    }

    const prospects = await prisma.prospectList.findMany({
      where: {
        listId: params.id,
      },
      include: {
        prospect: {
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
              },
            },
            interactions: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
              select: {
                type: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(prospects);
  } catch (error) {
    console.error('Error fetching list prospects:', error);
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
    const { prospectIds, tags } = await request.json();

    if (!prospectIds || !Array.isArray(prospectIds) || prospectIds.length === 0) {
      return NextResponse.json({ error: 'Prospect IDs are required' }, { status: 400 });
    }

    // Verify list belongs to user
    const list = await prisma.list.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!list) {
      return new NextResponse('List not found', { status: 404 });
    }

    // Verify all prospects belong to user's campaigns
    const prospects = await prisma.prospect.findMany({
      where: {
        id: { in: prospectIds },
        campaign: {
          userId: session.user.id,
        },
      },
    });

    if (prospects.length !== prospectIds.length) {
      return NextResponse.json({ error: 'Some prospects not found or not accessible' }, { status: 400 });
    }

    // Add prospects to list (ignore duplicates)
    const prospectListEntries = prospectIds.map(prospectId => ({
      prospectId,
      listId: params.id,
      addedBy: session.user.id,
      tags: tags || [],
    }));

    const results = await Promise.allSettled(
      prospectListEntries.map(entry =>
        prisma.prospectList.create({
          data: entry,
          include: {
            prospect: {
              include: {
                campaign: {
                  select: {
                    id: true,
                    name: true,
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

    // Auto-enroll prospects in campaigns if the list is connected to campaigns with auto-enroll enabled
    if (successful.length > 0) {
      await autoEnrollProspectsInCampaigns(params.id, successful.map(s => s.prospectId));
    }

    return NextResponse.json({
      success: true,
      added: successful.length,
      failed: failed,
      prospects: successful,
    });
  } catch (error) {
    console.error('Error adding prospects to list:', error);
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
    const { prospectIds } = await request.json();

    if (!prospectIds || !Array.isArray(prospectIds) || prospectIds.length === 0) {
      return NextResponse.json({ error: 'Prospect IDs are required' }, { status: 400 });
    }

    // Verify list belongs to user
    const list = await prisma.list.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!list) {
      return new NextResponse('List not found', { status: 404 });
    }

    // Remove prospects from list
    const deleted = await prisma.prospectList.deleteMany({
      where: {
        listId: params.id,
        prospectId: { in: prospectIds },
      },
    });

    return NextResponse.json({
      success: true,
      removed: deleted.count,
    });
  } catch (error) {
    console.error('Error removing prospects from list:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Helper function to auto-enroll prospects in campaigns
async function autoEnrollProspectsInCampaigns(listId: string, prospectIds: string[]) {
  try {
    // Find campaigns connected to this list with auto-enroll enabled
    const campaignLists = await prisma.campaignList.findMany({
      where: {
        listId,
        autoEnroll: true,
      },
      include: {
        campaign: true,
      },
    });

    for (const campaignList of campaignLists) {
      // For each prospect, check if they're already in the campaign
      for (const prospectId of prospectIds) {
        const existingProspect = await prisma.prospect.findFirst({
          where: {
            id: prospectId,
            campaignId: campaignList.campaignId,
          },
        });

        // If prospect is not in the campaign, we would need to create a new prospect record
        // Since prospects are tied to campaigns, we'll log this for now
        // In a real implementation, you might want to duplicate the prospect or handle this differently
        if (!existingProspect) {
          console.log(`Prospect ${prospectId} would be auto-enrolled in campaign ${campaignList.campaignId}`);
          // TODO: Implement prospect duplication or campaign enrollment logic
        }
      }
    }
  } catch (error) {
    console.error('Error in auto-enrollment:', error);
  }
} 