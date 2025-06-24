import { prisma } from './prisma';

interface WarmupSettings {
  dailyLimit: number;
  rampUpDays: number;
  replyRate: number; // percentage of emails that should get replies
  currentDailyVolume: number;
}

interface DeliverabilityMetrics {
  deliveryRate: number;
  openRate: number;
  replyRate: number;
  spamScore: number;
  domainReputation: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
}

export class EmailWarmupManager {
  /**
   * Initialize email warmup for a new user
   */
  async initializeWarmup(userId: string, email: string): Promise<WarmupSettings> {
    const settings: WarmupSettings = {
      dailyLimit: 5, // Start very low
      rampUpDays: 30,
      replyRate: 15, // Target 15% reply rate during warmup
      currentDailyVolume: 0
    };

    // Store warmup settings
    await prisma.emailWarmup.create({
      data: {
        userId,
        email,
        phase: 'initializing',
        dailyLimit: settings.dailyLimit,
        currentVolume: 0,
        targetReplyRate: settings.replyRate,
        startDate: new Date(),
        status: 'active'
      }
    });

    return settings;
  }

  /**
   * Get recommended daily sending limit based on warmup progress
   */
  async getRecommendedDailyLimit(userId: string): Promise<number> {
    const warmup = await prisma.emailWarmup.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (!warmup) {
      return 5; // Conservative start
    }

    const daysActive = Math.floor(
      (Date.now() - warmup.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Gradual ramp-up schedule
    if (daysActive < 7) return 10;
    if (daysActive < 14) return 20;
    if (daysActive < 21) return 35;
    if (daysActive < 30) return 50;
    
    return 100; // Full capacity after 30 days
  }

  /**
   * Check if user can send more emails today
   */
  async canSendEmail(userId: string): Promise<{
    canSend: boolean;
    remainingToday: number;
    dailyLimit: number;
  }> {
    const dailyLimit = await this.getRecommendedDailyLimit(userId);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sentToday = await prisma.emailInteraction.count({
      where: {
        userId,
        createdAt: {
          gte: today
        }
      }
    });

    return {
      canSend: sentToday < dailyLimit,
      remainingToday: Math.max(0, dailyLimit - sentToday),
      dailyLimit
    };
  }

  /**
   * Analyze email deliverability and provide recommendations
   */
  async analyzeDeliverability(userId: string): Promise<DeliverabilityMetrics> {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Get email stats from last 30 days
    const emailStats = await prisma.emailInteraction.groupBy({
      by: ['userId'],
      where: {
        userId,
        createdAt: { gte: last30Days }
      },
      _count: {
        id: true
      }
    });

    // This would integrate with email service providers to get real metrics
    // For now, we'll provide intelligent estimates based on sending patterns
    
    const recommendations: string[] = [];
    let domainReputation: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
    
    // Analyze sending patterns and provide recommendations
    const dailyLimit = await this.getRecommendedDailyLimit(userId);
    
    if (dailyLimit < 20) {
      recommendations.push('🔥 Still in warmup phase - keep daily volume low');
      recommendations.push('📧 Focus on high-quality, personalized emails');
    }
    
    if (dailyLimit >= 50) {
      recommendations.push('✅ Warmup complete - you can send at full capacity');
      recommendations.push('📊 Monitor reply rates to maintain reputation');
    }

    // Add general best practices
    recommendations.push('🎯 Maintain 15%+ reply rate for best deliverability');
    recommendations.push('📝 Use personalized subject lines and content');
    recommendations.push('⏰ Send emails during business hours (9-5 local time)');
    recommendations.push('🔄 Clean your list regularly - remove bounces');

    return {
      deliveryRate: 95, // Would be calculated from real data
      openRate: 22,     // Would be calculated from real data
      replyRate: 8,     // Would be calculated from real data
      spamScore: 2.1,   // Would be calculated from real data
      domainReputation,
      recommendations
    };
  }

  /**
   * Schedule emails with optimal timing for deliverability
   */
  async scheduleOptimalSending(emails: Array<{
    to: string;
    subject: string;
    body: string;
    campaignId: string;
  }>, userId: string): Promise<Array<{
    email: any;
    scheduledFor: Date;
    reason: string;
  }>> {
    const { remainingToday, dailyLimit } = await this.canSendEmail(userId);
    const scheduled = [];
    
    // Spread emails across optimal sending times
    const optimalHours = [9, 10, 11, 14, 15, 16, 17]; // Business hours
    let currentDate = new Date();
    let emailsScheduledToday = 0;
    
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      
      // If we've hit today's limit, move to tomorrow
      if (emailsScheduledToday >= remainingToday) {
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
        emailsScheduledToday = 0;
      }
      
      // Pick random optimal hour
      const hour = optimalHours[Math.floor(Math.random() * optimalHours.length)];
      const minute = Math.floor(Math.random() * 60);
      
      const scheduledFor = new Date(currentDate);
      scheduledFor.setHours(hour, minute, 0, 0);
      
      scheduled.push({
        email,
        scheduledFor,
        reason: emailsScheduledToday === 0 ? 
          'Scheduled for optimal business hours' : 
          'Spread across day for better deliverability'
      });
      
      emailsScheduledToday++;
    }
    
    return scheduled;
  }

  /**
   * Get warmup progress and status
   */
  async getWarmupStatus(userId: string): Promise<{
    phase: string;
    daysActive: number;
    currentLimit: number;
    nextMilestone: string;
    progress: number; // 0-100
  }> {
    const warmup = await prisma.emailWarmup.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (!warmup) {
      return {
        phase: 'not_started',
        daysActive: 0,
        currentLimit: 5,
        nextMilestone: 'Start email warmup',
        progress: 0
      };
    }

    const daysActive = Math.floor(
      (Date.now() - warmup.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let phase = 'warming_up';
    let nextMilestone = 'Continue daily sending';
    let progress = Math.min(100, (daysActive / 30) * 100);

    if (daysActive >= 30) {
      phase = 'warmed_up';
      nextMilestone = 'Maintain good sending practices';
      progress = 100;
    }

    return {
      phase,
      daysActive,
      currentLimit: await this.getRecommendedDailyLimit(userId),
      nextMilestone,
      progress
    };
  }
} 