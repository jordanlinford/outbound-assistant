import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const AddProspectsSchema = z.object({
  prospects: z.array(z.object({
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    company: z.string().optional(),
    title: z.string().optional(),
    status: z.string().optional(),
  })),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = AddProspectsSchema.parse(body);

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

    // Add prospects to campaign
    const addedProspects = await prisma.prospect.createMany({
      data: validatedData.prospects.map((prospect) => ({
        campaignId: params.id,
        email: prospect.email,
        firstName: prospect.firstName || '',
        lastName: prospect.lastName || '',
        company: prospect.company || '',
        title: prospect.title || '',
        status: prospect.status || 'PENDING',
      })),
      skipDuplicates: true, // Skip if email already exists in campaign
    });

    return NextResponse.json({
      added: addedProspects.count,
      message: `Successfully added ${addedProspects.count} prospects to campaign`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error adding prospects:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 