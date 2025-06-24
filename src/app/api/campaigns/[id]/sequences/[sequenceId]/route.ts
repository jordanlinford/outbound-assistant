import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string; sequenceId: string } }
) {
  const session = await getServerSession();

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const sequence = await prisma.sequence.findUnique({
      where: {
        id: params.sequenceId,
        campaignId: params.id,
        campaign: {
          userId: session.user.id,
        },
      },
    });

    if (!sequence) {
      return new NextResponse('Sequence not found', { status: 404 });
    }

    return NextResponse.json(sequence);
  } catch (error) {
    console.error('Error fetching sequence:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; sequenceId: string } }
) {
  const session = await getServerSession();

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, type, content, delay, order } = body;

    const sequence = await prisma.sequence.update({
      where: {
        id: params.sequenceId,
        campaignId: params.id,
        campaign: {
          userId: session.user.id,
        },
      },
      data: {
        name,
        type,
        content,
        delay,
        order,
      },
    });

    return NextResponse.json(sequence);
  } catch (error) {
    console.error('Error updating sequence:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; sequenceId: string } }
) {
  const session = await getServerSession();

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await prisma.sequence.delete({
      where: {
        id: params.sequenceId,
        campaignId: params.id,
        campaign: {
          userId: session.user.id,
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting sequence:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 