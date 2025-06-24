import Stripe from 'stripe';

// Only initialize Stripe on server-side and when environment variables are available
let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil',
    });
  }
  
  if (!stripe) {
    throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.');
  }
  
  return stripe;
}

// Export the getter function instead of the instance
export { getStripe as stripe };

export interface ServiceLevel {
  id: string;
  name: string;
  description: string;
  price: number;
  priceId: string;
  features: string[];
  limits: {
    emailsPerMonth: number;
    campaignsPerMonth: number;
    prospectsPerCampaign: number;
    linkedinPostsPerMonth: number;
    aiResponsesPerMonth: number;
    automationEnabled: boolean;
    prioritySupport: boolean;
    customIntegrations: boolean;
  };
}

export const SERVICE_LEVELS: ServiceLevel[] = [
  {
    id: 'pro-monthly',
    name: 'AI BDR Team (Monthly)',
    description: 'Replace your entire BDR team and save $97,400/year',
    price: 49.99,
    priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
    features: [
      '🤖 Complete BDR team replacement',
      '📧 Unlimited personalized emails',
      '🎯 Unlimited campaigns & prospects',
      '🔄 24/7 automated follow-ups',
      '📱 LinkedIn automation & content',
      '🧠 AI email responses & routing',
      '📅 Automatic meeting booking',
      '📊 Advanced analytics & reporting',
      '⚡ 2-minute setup (vs 3-6 months hiring)',
      '💰 Save $8,117/month vs hiring BDRs',
      '🚀 Works while you sleep'
    ],
    limits: {
      emailsPerMonth: -1, // -1 means unlimited
      campaignsPerMonth: -1,
      prospectsPerCampaign: -1,
      linkedinPostsPerMonth: -1,
      aiResponsesPerMonth: -1,
      automationEnabled: true,
      prioritySupport: true,
      customIntegrations: true
    }
  },
  {
    id: 'pro-yearly',
    name: 'AI BDR Team (Yearly)',
    description: 'Best value: Save $97,400/year vs BDRs + extra $100 discount',
    price: 500,
    priceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
    features: [
      '🤖 Complete BDR team replacement',
      '📧 Unlimited personalized emails',
      '🎯 Unlimited campaigns & prospects',
      '🔄 24/7 automated follow-ups',
      '📱 LinkedIn automation & content',
      '🧠 AI email responses & routing',
      '📅 Automatic meeting booking',
      '📊 Advanced analytics & reporting',
      '⚡ 2-minute setup (vs 3-6 months hiring)',
      '💰 Save $97,500/year vs hiring BDRs',
      '🎁 BONUS: Extra $100 annual savings',
      '🚀 Works while you sleep'
    ],
    limits: {
      emailsPerMonth: -1, // -1 means unlimited
      campaignsPerMonth: -1,
      prospectsPerCampaign: -1,
      linkedinPostsPerMonth: -1,
      aiResponsesPerMonth: -1,
      automationEnabled: true,
      prioritySupport: true,
      customIntegrations: true
    }
  }
];

export const FREE_TIER: ServiceLevel = {
  id: 'free',
  name: 'Free Trial',
  description: 'Test drive your AI BDR team risk-free',
  price: 0,
  priceId: '',
  features: [
    '50 emails per month (enough to test results)',
    '1 campaign to validate your process',
    '25 prospects per campaign',
    '5 LinkedIn posts per month',
    '10 AI responses per month',
    'Full feature access for 14 days',
    'See the ROI before you commit'
  ],
  limits: {
    emailsPerMonth: 50,
    campaignsPerMonth: 1,
    prospectsPerCampaign: 25,
    linkedinPostsPerMonth: 5,
    aiResponsesPerMonth: 10,
    automationEnabled: false,
    prioritySupport: false,
    customIntegrations: false
  }
};

export function getServiceLevelById(id: string): ServiceLevel | null {
  if (id === 'free') return FREE_TIER;
  return SERVICE_LEVELS.find(level => level.id === id) || null;
}

export function getServiceLevelByPriceId(priceId: string): ServiceLevel | null {
  return SERVICE_LEVELS.find(level => level.priceId === priceId) || null;
}

export async function createCheckoutSession(
  priceId: string,
  userId: string,
  userEmail: string
): Promise<Stripe.Checkout.Session> {
  const stripeInstance = getStripe();
  return await stripeInstance.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer_email: userEmail,
    metadata: {
      userId: userId,
    },
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=success`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing?payment=cancelled`,
  });
}

export async function createPortalSession(customerId: string): Promise<Stripe.BillingPortal.Session> {
  const stripeInstance = getStripe();
  return await stripeInstance.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXTAUTH_URL}/dashboard`,
  });
} 