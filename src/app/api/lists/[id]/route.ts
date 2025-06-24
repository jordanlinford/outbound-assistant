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
    const list = await prisma.list.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        prospects: {
          include: {
            prospect: {
              include: {
                campaign: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        campaigns: {
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            prospects: true,
            campaigns: true,
          },
        },
      },
    });

    if (!list) {
      return new NextResponse('List not found', { status: 404 });
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error('Error fetching list:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { name, description, color } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if list exists and belongs to user
    const existingList = await prisma.list.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingList) {
      return new NextResponse('List not found', { status: 404 });
    }

    // Check if new name conflicts with another list
    if (name !== existingList.name) {
      const nameConflict = await prisma.list.findFirst({
        where: {
          userId: session.user.id,
          name: name,
          id: { not: params.id },
        },
      });

      if (nameConflict) {
        return NextResponse.json({ error: 'A list with this name already exists' }, { status: 400 });
      }
    }

    const updatedList = await prisma.list.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        description: description || null,
        color: color || existingList.color,
      },
      include: {
        _count: {
          select: {
            prospects: true,
            campaigns: true,
          },
        },
      },
    });

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error('Error updating list:', error);
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
    // Check if list exists and belongs to user
    const list = await prisma.list.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!list) {
      return new NextResponse('List not found', { status: 404 });
    }

    // Don't allow deleting default list
    if (list.isDefault) {
      return NextResponse.json({ error: 'Cannot delete default list' }, { status: 400 });
    }

    // Delete the list (cascade will handle related records)
    await prisma.list.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting list:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 