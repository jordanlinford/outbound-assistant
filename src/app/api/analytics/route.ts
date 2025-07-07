import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Fetch all interactions for campaigns owned by the user
    const interactions = await prisma.interaction.findMany({
      where: {
        prospect: {
          campaign: {
            userId: session.user.id,
          },
        },
      },
      select: {
        type: true,
      },
    });

    const totals = {
      emailsSent: 0,
      emailsOpened: 0,
      emailsReplied: 0,
      meetingsBooked: 0,
    };

    interactions.forEach((i) => {
      switch (i.type) {
        case 'email_sent':
          totals.emailsSent += 1;
          break;
        case 'email_opened':
          totals.emailsOpened += 1;
          break;
        case 'email_replied':
          totals.emailsReplied += 1;
          break;
        case 'meeting_booked':
          totals.meetingsBooked += 1;
          break;
        default:
          break;
      }
    });

    const openRate = totals.emailsSent > 0 ? (totals.emailsOpened / totals.emailsSent) * 100 : 0;
    const replyRate = totals.emailsSent > 0 ? (totals.emailsReplied / totals.emailsSent) * 100 : 0;

    return NextResponse.json({
      metrics: {
        totalEmailsSent: totals.emailsSent,
        openRate,
        replyRate,
        meetingsBooked: totals.meetingsBooked,
      },
    });
  } catch (error) {
    console.error('Error computing analytics summary:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 