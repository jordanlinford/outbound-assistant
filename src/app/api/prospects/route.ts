import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Get all prospects from campaigns owned by the user
    const prospects = await prisma.prospect.findMany({
      where: {
        campaign: {
          userId: session.user.id,
        },
      },
      include: {
        campaign: {
          select: {
            name: true,
          },
        },
        interactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        lists: {
          include: {
            list: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to include list information
    const transformedProspects = prospects.map(prospect => ({
      id: prospect.id,
      name: prospect.name,
      email: prospect.email,
      company: prospect.company,
      title: prospect.title,
      status: prospect.status,
      addedDate: prospect.createdAt.toISOString(),
      campaignName: prospect.campaign.name,
      lastInteraction: prospect.interactions[0]?.createdAt?.toISOString() || null,
      lists: prospect.lists.map(pl => pl.list),
    }));

    return NextResponse.json(transformedProspects);
  } catch (error) {
    console.error('Error fetching prospects:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { prospects, campaignId, listId } = await request.json();

    if (!prospects || !Array.isArray(prospects) || prospects.length === 0) {
      return NextResponse.json({ error: 'Prospects array is required' }, { status: 400 });
    }

    // Ensure user has a default list
    let targetList;
    if (listId) {
      // Verify the specified list belongs to the user
      targetList = await prisma.list.findFirst({
        where: {
          id: listId,
          userId: session.user.id,
        },
      });
      if (!targetList) {
        return NextResponse.json({ error: 'List not found or not accessible' }, { status: 400 });
      }
    } else {
      // Get or create default list
      targetList = await getOrCreateDefaultList(session.user.id);
    }

    // If campaignId is provided, verify it belongs to the user
    let targetCampaign;
    if (campaignId) {
      targetCampaign = await prisma.campaign.findFirst({
        where: {
          id: campaignId,
          userId: session.user.id,
        },
      });
      if (!targetCampaign) {
        return NextResponse.json({ error: 'Campaign not found or not accessible' }, { status: 400 });
      }
    } else {
      // Get or create default campaign
      targetCampaign = await getOrCreateDefaultCampaign(session.user.id);
    }

    const results = [];
    const errors = [];

    for (const prospectData of prospects) {
      try {
        // Create or update prospect in the campaign
        const prospect = await prisma.prospect.upsert({
          where: {
            email_campaignId: {
              email: prospectData.email,
              campaignId: targetCampaign.id,
            },
          },
          update: {
            name: prospectData.name || null,
            company: prospectData.company || null,
            title: prospectData.title || null,
          },
          create: {
            email: prospectData.email,
            name: prospectData.name || null,
            company: prospectData.company || null,
            title: prospectData.title || null,
            campaignId: targetCampaign.id,
            status: 'new',
          },
        });

                 // Add prospect to the list
         try {
           await prisma.prospectList.create({
             data: {
               prospectId: prospect.id,
               listId: targetList.id,
               addedBy: session.user.id,
             },
           });
         } catch (error) {
           // Prospect already in this list, skip
         }

        results.push(prospect);
      } catch (error) {
        console.error('Error processing prospect:', prospectData.email, error);
        errors.push({
          email: prospectData.email,
          error: 'Failed to process prospect',
        });
      }
    }

    // Auto-enroll in campaigns if the list is connected to campaigns with auto-enroll
    if (results.length > 0) {
      await autoEnrollFromList(targetList.id, results.map(p => p.id));
    }

    return NextResponse.json({
      success: true,
      imported: results.length,
      errorCount: errors.length,
      listId: targetList.id,
      listName: targetList.name,
      campaignId: targetCampaign.id,
      campaignName: targetCampaign.name,
      results,
      errors,
    });
  } catch (error) {
    console.error('Error importing prospects:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Helper function to get or create default list
async function getOrCreateDefaultList(userId: string) {
  let defaultList = await prisma.list.findFirst({
    where: {
      userId,
      isDefault: true,
    },
  });

  if (!defaultList) {
    defaultList = await prisma.list.create({
      data: {
        name: 'All Prospects',
        description: 'Default list for all imported prospects',
        color: '#3B82F6',
        isDefault: true,
        userId,
      },
    });
  }

  return defaultList;
}

// Helper function to get or create default campaign
async function getOrCreateDefaultCampaign(userId: string) {
  let defaultCampaign = await prisma.campaign.findFirst({
    where: {
      userId,
      name: 'Default Campaign',
    },
  });

  if (!defaultCampaign) {
    defaultCampaign = await prisma.campaign.create({
      data: {
        name: 'Default Campaign',
        description: 'Default campaign for imported prospects',
        userId,
        status: 'draft',
      },
    });
  }

  return defaultCampaign;
}

// Helper function to auto-enroll prospects from a list into connected campaigns
async function autoEnrollFromList(listId: string, prospectIds: string[]) {
  try {
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
      for (const prospectId of prospectIds) {
        const prospect = await prisma.prospect.findUnique({
          where: { id: prospectId },
        });

        if (prospect) {
          // Check if prospect already exists in the target campaign
          const existingProspect = await prisma.prospect.findFirst({
            where: {
              email: prospect.email,
              campaignId: campaignList.campaignId,
            },
          });

          if (!existingProspect) {
            try {
              await prisma.prospect.create({
                data: {
                  email: prospect.email,
                  name: prospect.name,
                  company: prospect.company,
                  title: prospect.title,
                  campaignId: campaignList.campaignId,
                  status: 'new',
                },
              });
              console.log(`Auto-enrolled ${prospect.email} in campaign ${campaignList.campaign.name}`);
            } catch (error) {
              console.log(`Prospect ${prospect.email} already exists in campaign ${campaignList.campaign.name}`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in auto-enrollment:', error);
  }
} 