import { prisma } from './prisma';
import { getServiceLevelById, ServiceLevel, FREE_TIER } from './stripe';

export interface UsageStats {
  emailsSent: number;
  campaignsCreated: number;
  linkedinPostsGenerated: number;
  aiResponsesGenerated: number;
}

export class UsageTracker {
  private userId: string;
  private currentMonth: number;
  private currentYear: number;

  constructor(userId: string) {
    this.userId = userId;
    const now = new Date();
    this.currentMonth = now.getMonth() + 1; // 1-12
    this.currentYear = now.getFullYear();
  }

  async getCurrentUsage(): Promise<UsageStats> {
    const record = await prisma.usageRecord.findUnique({
      where: {
        userId_month_year: {
          userId: this.userId,
          month: this.currentMonth,
          year: this.currentYear,
        },
      },
    });

    return {
      emailsSent: record?.emailsSent || 0,
      campaignsCreated: record?.campaignsCreated || 0,
      linkedinPostsGenerated: record?.linkedinPostsGenerated || 0,
      aiResponsesGenerated: record?.aiResponsesGenerated || 0,
    };
  }

  async getUserServiceLevel(): Promise<ServiceLevel> {
    const user = await prisma.user.findUnique({
      where: { id: this.userId },
      select: { serviceLevelId: true },
    });

    if (!user) {
      return FREE_TIER;
    }

    return getServiceLevelById(user.serviceLevelId) || FREE_TIER;
  }

  async canPerformAction(action: 'email' | 'campaign' | 'linkedin' | 'ai_response'): Promise<boolean> {
    const [usage, serviceLevel] = await Promise.all([
      this.getCurrentUsage(),
      this.getUserServiceLevel(),
    ]);

    switch (action) {
      case 'email':
        return serviceLevel.limits.emailsPerMonth === -1 || 
               usage.emailsSent < serviceLevel.limits.emailsPerMonth;
      
      case 'campaign':
        return serviceLevel.limits.campaignsPerMonth === -1 || 
               usage.campaignsCreated < serviceLevel.limits.campaignsPerMonth;
      
      case 'linkedin':
        return serviceLevel.limits.linkedinPostsPerMonth === -1 || 
               usage.linkedinPostsGenerated < serviceLevel.limits.linkedinPostsPerMonth;
      
      case 'ai_response':
        return serviceLevel.limits.aiResponsesPerMonth === -1 || 
               usage.aiResponsesGenerated < serviceLevel.limits.aiResponsesPerMonth;
      
      default:
        return false;
    }
  }

  async trackUsage(action: 'email' | 'campaign' | 'linkedin' | 'ai_response', count: number = 1): Promise<void> {
    const updateData: any = {};
    
    switch (action) {
      case 'email':
        updateData.emailsSent = { increment: count };
        break;
      case 'campaign':
        updateData.campaignsCreated = { increment: count };
        break;
      case 'linkedin':
        updateData.linkedinPostsGenerated = { increment: count };
        break;
      case 'ai_response':
        updateData.aiResponsesGenerated = { increment: count };
        break;
    }

    await prisma.usageRecord.upsert({
      where: {
        userId_month_year: {
          userId: this.userId,
          month: this.currentMonth,
          year: this.currentYear,
        },
      },
      update: updateData,
      create: {
        userId: this.userId,
        month: this.currentMonth,
        year: this.currentYear,
        ...Object.fromEntries(
          Object.entries(updateData).map(([key, value]) => [
            key,
            (value as any).increment || 0
          ])
        ),
      },
    });
  }

  async getUsagePercentages(): Promise<{
    emails: number;
    campaigns: number;
    linkedin: number;
    aiResponses: number;
  }> {
    const [usage, serviceLevel] = await Promise.all([
      this.getCurrentUsage(),
      this.getUserServiceLevel(),
    ]);

    const calculatePercentage = (used: number, limit: number): number => {
      if (limit === -1) return 0; // Unlimited
      return Math.min((used / limit) * 100, 100);
    };

    return {
      emails: calculatePercentage(usage.emailsSent, serviceLevel.limits.emailsPerMonth),
      campaigns: calculatePercentage(usage.campaignsCreated, serviceLevel.limits.campaignsPerMonth),
      linkedin: calculatePercentage(usage.linkedinPostsGenerated, serviceLevel.limits.linkedinPostsPerMonth),
      aiResponses: calculatePercentage(usage.aiResponsesGenerated, serviceLevel.limits.aiResponsesPerMonth),
    };
  }

  async getRemainingLimits(): Promise<{
    emails: number | 'unlimited';
    campaigns: number | 'unlimited';
    linkedin: number | 'unlimited';
    aiResponses: number | 'unlimited';
  }> {
    const [usage, serviceLevel] = await Promise.all([
      this.getCurrentUsage(),
      this.getUserServiceLevel(),
    ]);

    const calculateRemaining = (used: number, limit: number): number | 'unlimited' => {
      if (limit === -1) return 'unlimited';
      return Math.max(0, limit - used);
    };

    return {
      emails: calculateRemaining(usage.emailsSent, serviceLevel.limits.emailsPerMonth),
      campaigns: calculateRemaining(usage.campaignsCreated, serviceLevel.limits.campaignsPerMonth),
      linkedin: calculateRemaining(usage.linkedinPostsGenerated, serviceLevel.limits.linkedinPostsPerMonth),
      aiResponses: calculateRemaining(usage.aiResponsesGenerated, serviceLevel.limits.aiResponsesPerMonth),
    };
  }
}

export async function checkUsageLimit(
  userId: string, 
  action: 'email' | 'campaign' | 'linkedin' | 'ai_response'
): Promise<{ allowed: boolean; remaining: number | 'unlimited' }> {
  const tracker = new UsageTracker(userId);
  const [canPerform, remaining] = await Promise.all([
    tracker.canPerformAction(action),
    tracker.getRemainingLimits(),
  ]);

  let remainingCount: number | 'unlimited';
  switch (action) {
    case 'email':
      remainingCount = remaining.emails;
      break;
    case 'campaign':
      remainingCount = remaining.campaigns;
      break;
    case 'linkedin':
      remainingCount = remaining.linkedin;
      break;
    case 'ai_response':
      remainingCount = remaining.aiResponses;
      break;
    default:
      remainingCount = 0;
  }

  return {
    allowed: canPerform,
    remaining: remainingCount,
  };
} 