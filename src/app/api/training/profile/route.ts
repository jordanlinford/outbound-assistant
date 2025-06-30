import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const ProfileSchema = z.object({
  about: z.string().optional(),
  uniqueValue: z.string().optional(),
  targetCustomers: z.string().optional(),
  mainPainPoints: z.string().optional(),
  tonePreference: z.string().optional(),
  callToActions: z.string().optional(), // JSON array or comma separated list
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  try {
    // @ts-ignore – generated after next prisma generate
    const profile = await prisma.businessProfile.findUnique({
      where: { userId: session.user.id },
    });
    return NextResponse.json(profile || {});
  } catch (err) {
    console.error('Error fetching business profile', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const body = await request.json();
    const data = ProfileSchema.parse(body);

    // @ts-ignore – generated after next prisma generate
    const profile = await prisma.businessProfile.upsert({
      where: { userId: session.user.id },
      update: {
        ...data,
      },
      create: {
        userId: session.user.id,
        ...data,
      },
    });

    return NextResponse.json(profile);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error('Error saving business profile', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 