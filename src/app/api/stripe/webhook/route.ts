import { NextRequest, NextResponse } from 'next/server';
import { stripe, getServiceLevelByPriceId } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        
        if (!userId) {
          console.error('No userId in session metadata');
          break;
        }

        // Get the subscription details
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        const priceId = subscription.items.data[0].price.id;
        const serviceLevel = getServiceLevelByPriceId(priceId);

        if (!serviceLevel) {
          console.error('Unknown price ID:', priceId);
          break;
        }

        // Update user subscription
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscription.id,
            serviceLevelId: serviceLevel.id,
            subscriptionStatus: subscription.status,
            currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          },
        });

        // Record the payment
        await prisma.paymentRecord.create({
          data: {
            userId,
            stripePaymentId: session.payment_intent as string,
            amount: session.amount_total || 0,
            currency: session.currency || 'usd',
            status: 'succeeded',
            serviceLevelId: serviceLevel.id,
          },
        });

        console.log(`Subscription created for user ${userId}: ${serviceLevel.name}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;

        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Find user by subscription ID
        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
        });

        if (!user) {
          console.error('User not found for subscription:', subscriptionId);
          break;
        }

        // Update subscription period
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: subscription.status,
            currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          },
        });

        console.log(`Payment succeeded for user ${user.id}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (!user) {
          console.error('User not found for subscription:', subscription.id);
          break;
        }

        const priceId = subscription.items.data[0].price.id;
        const serviceLevel = getServiceLevelByPriceId(priceId);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            serviceLevelId: serviceLevel?.id || 'free',
            subscriptionStatus: subscription.status,
            currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          },
        });

        console.log(`Subscription updated for user ${user.id}: ${subscription.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (!user) {
          console.error('User not found for subscription:', subscription.id);
          break;
        }

        // Downgrade to free tier
        await prisma.user.update({
          where: { id: user.id },
          data: {
            serviceLevelId: 'free',
            subscriptionStatus: 'canceled',
            stripeSubscriptionId: null,
          },
        });

        console.log(`Subscription canceled for user ${user.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
} 