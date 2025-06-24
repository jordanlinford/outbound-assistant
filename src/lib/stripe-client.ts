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
    priceId: 'price_1RdCioGCix0pRkbmNCWDgDwK',
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
    priceId: 'price_1RdCjFGCix0pRkbm0cYFJnjH',
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