import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { stripe, SERVICE_LEVELS } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        serviceLevelId: true,
        subscriptionStatus: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user is on free plan or Stripe is not configured
    if (!user.stripeSubscriptionId || user.serviceLevelId === 'free' || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        id: 'free',
        status: 'free',
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        serviceLevelId: 'free',
        serviceLevelName: 'Free Trial',
        price: 0,
        billingCycle: null,
      });
    }

    try {
      // Fetch subscription details from Stripe
      const stripeInstance = stripe();
      const subscription = await stripeInstance.subscriptions.retrieve(user.stripeSubscriptionId);
      
      // Get service level details
      const serviceLevel = SERVICE_LEVELS.find(level => level.id === user.serviceLevelId);
      
      return NextResponse.json({
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
        serviceLevelId: user.serviceLevelId,
        serviceLevelName: serviceLevel?.name || 'Unknown Plan',
        price: serviceLevel?.price || 0,
        billingCycle: user.serviceLevelId?.includes('yearly') ? 'yearly' : 'monthly',
      });
    } catch (stripeError) {
      console.error('Stripe API error:', stripeError);
      // Fallback to database info if Stripe fails
      const serviceLevel = SERVICE_LEVELS.find(level => level.id === user.serviceLevelId);
      return NextResponse.json({
        id: user.stripeSubscriptionId,
        status: user.subscriptionStatus || 'unknown',
        currentPeriodStart: user.currentPeriodStart?.toISOString() || null,
        currentPeriodEnd: user.currentPeriodEnd?.toISOString() || null,
        cancelAtPeriodEnd: false,
        serviceLevelId: user.serviceLevelId,
        serviceLevelName: serviceLevel?.name || 'Unknown Plan',
        price: serviceLevel?.price || 0,
        billingCycle: user.serviceLevelId?.includes('yearly') ? 'yearly' : 'monthly',
      });
    }
  } catch (error) {
    console.error('Subscription details API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 