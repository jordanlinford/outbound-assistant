import { prisma } from './prisma';
import { getServiceLevelById, FREE_TIER } from './stripe';

/**
 * Simple mapping of daily caps per service level. Unlimited = -1.
 * These can be tuned later or moved to DB.
 */
const DAILY_CAPS: Record<string, number> = {
  free: 50,
  'pro-monthly': 200,
  'pro-yearly': 200,
};

/**
 * Return the max emails a user can send per calendar day, factoring in service level.
 */
export async function getDailySendCap(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { serviceLevelId: true } });
  const levelId = user?.serviceLevelId || 'free';
  const cap = DAILY_CAPS[levelId] ?? DAILY_CAPS['free'];

  // Warm-up safeguard --------------------------------------------------
  // If the user has an active EmailWarmup record that started < 14 days ago
  // OR the warm-up phase is not yet "warmed_up", restrict to 20 per day
  const warmup = await prisma.emailWarmup.findFirst({
    where: {
      userId,
      status: 'active',
    },
    select: {
      startDate: true,
      phase: true,
    },
  });

  if (warmup) {
    const daysRunning = Math.floor((Date.now() - warmup.startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRunning < 14 || warmup.phase !== 'warmed_up') {
      return Math.min(cap, 20);
    }
  }

  return cap;
}

/**
 * How many email_sent interactions have been logged today for this user.
 */
export async function getEmailsSentToday(userId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const count = await prisma.interaction.count({
    where: {
      type: 'email_sent',
      prospect: {
        campaign: {
          userId,
        },
      },
      createdAt: {
        gte: startOfDay,
      },
    },
  });

  return count;
}

/**
 * Return number allowed to send now (0+). If cap is unlimited (-1) returns Infinity.
 */
export async function getRemainingDailyAllowance(userId: string): Promise<number> {
  const [cap, sent] = await Promise.all([
    getDailySendCap(userId),
    getEmailsSentToday(userId),
  ]);
  if (cap === -1) return Infinity;
  return Math.max(0, cap - sent);
} 