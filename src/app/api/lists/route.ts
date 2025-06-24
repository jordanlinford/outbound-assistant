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
    const lists = await prisma.list.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            prospects: true,
            campaigns: true,
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(lists);
  } catch (error) {
    console.error('Error fetching lists:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { name, description, color } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if list name already exists for this user
    const existingList = await prisma.list.findFirst({
      where: {
        userId: session.user.id,
        name: name,
      },
    });

    if (existingList) {
      return NextResponse.json({ error: 'A list with this name already exists' }, { status: 400 });
    }

    const list = await prisma.list.create({
      data: {
        name,
        description: description || null,
        color: color || '#3B82F6', // Default blue color
        userId: session.user.id,
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

    return NextResponse.json(list);
  } catch (error) {
    console.error('Error creating list:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 