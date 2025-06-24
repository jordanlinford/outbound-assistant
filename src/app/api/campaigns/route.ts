import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { generateEmailSteps } from '@/lib/email-generator';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Request validation schemas
const EmailStepSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  delay: z.number().min(0),
});

const CreateCampaignSchema = z.object({
  name: z.string().min(1),
  template: z.string(),
  emailList: z.array(z.object({
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    company: z.string().optional(),
    title: z.string().optional(),
    industry: z.string().optional(),
  })),
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            sequences: true,
            prospects: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = CreateCampaignSchema.parse(body);

    // Generate email steps for the first contact to use as template
    const templateContact = validatedData.emailList[0];
    const emailSteps = await generateEmailSteps(validatedData.template, templateContact);

    // Create campaign with sequences
    const campaign = await prisma.campaign.create({
      data: {
        name: validatedData.name,
        userId: session.user.id,
        status: 'DRAFT',
        sequences: {
          create: emailSteps.map((step, index) => ({
            name: `Step ${index + 1}`,
            type: 'EMAIL',
            content: step.body,
            subject: step.subject,
            delay: step.delay,
            order: index,
          })),
        },
        prospects: {
          create: validatedData.emailList.map((prospect) => ({
            email: prospect.email,
            firstName: prospect.firstName || '',
            lastName: prospect.lastName || '',
            company: prospect.company || '',
            title: prospect.title || '',
            status: 'PENDING',
          })),
        },
      },
      include: {
        sequences: true,
        prospects: true,
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating campaign:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 