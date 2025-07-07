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
  description: z.string().optional().default(''),
  template: z.string().optional(),
  callToAction: z.string().optional(),
  emailList: z.array(z.object({
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    company: z.string().optional(),
    title: z.string().optional(),
    industry: z.string().optional(),
  })).optional(),
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

    let sequencesData = undefined;
    let prospectsData = undefined;

    if (validatedData.template && validatedData.emailList && validatedData.emailList.length > 0) {
      const templateContact = validatedData.emailList[0];
      const emailSteps = await generateEmailSteps(validatedData.template, templateContact);

      sequencesData = {
        create: emailSteps.map((step, index) => ({
          name: `Step ${index + 1}`,
          type: 'EMAIL',
          content: step.body,
          subject: step.subject,
          delay: step.delay,
          order: index,
        })),
      } as const;

      prospectsData = {
        create: validatedData.emailList.map((prospect) => ({
          email: prospect.email,
          firstName: prospect.firstName || '',
          lastName: prospect.lastName || '',
          company: prospect.company || '',
          title: prospect.title || '',
          status: 'PENDING',
        })),
      } as const;
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        callToAction: validatedData.callToAction || '',
        userId: session.user.id,
        status: 'DRAFT',
        ...(sequencesData ? { sequences: sequencesData } : {}),
        ...(prospectsData ? { prospects: prospectsData } : {}),
      } as any,
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