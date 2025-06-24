import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const sequences = await prisma.sequence.findMany({
      where: {
        campaignId: params.id,
        campaign: {
          userId: session.user.id,
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json(sequences);
  } catch (error) {
    console.error('Error fetching sequences:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

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
    const { name, type, content, delay, order } = body;

    // Verify campaign ownership
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!campaign) {
      return new NextResponse('Campaign not found', { status: 404 });
    }

    const sequence = await prisma.sequence.create({
      data: {
        name,
        type,
        content,
        delay,
        order,
        campaignId: params.id,
      },
    });

    return NextResponse.json(sequence);
  } catch (error) {
    console.error('Error creating sequence:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 