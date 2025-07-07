import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { MicrosoftGraphService } from '@/lib/microsoft-graph';

/**
 * Runs hourly via Vercel Cron.
 * For each user with a Gmail access token, fetches inbox messages from the last hour.
 * If the sender matches one of the user's prospects, logs an `email_replied` interaction and updates prospect.status.
 */
export async function GET() {
  const startTime = Date.now();
  const oneHourAgoSeconds = Math.floor(Date.now() / 1000) - 60 * 60; // epoch seconds
  let processedUsers = 0;
  let repliesLogged = 0;
  let bouncesLogged = 0;

  // Get all users who have a stored Gmail token
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { googleAccessToken: { not: null } },
        { microsoftAccessToken: { not: null } },
      ],
    },
    select: {
      id: true,
      googleAccessToken: true,
      microsoftAccessToken: true,
    },
  });

  for (const user of users) {
    // --- Gmail Processing --------------------------------------------------
    if (user.googleAccessToken) {
      try {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: user.googleAccessToken });
        const gmail = google.gmail({ version: 'v1', auth });

        // Search inbox for messages received in the last hour
        const listRes = await gmail.users.messages.list({
          userId: 'me',
          q: `is:inbox after:${oneHourAgoSeconds}`,
          maxResults: 50,
        });

        const messages = listRes.data.messages || [];
        if (messages.length > 0) {
          repliesLogged += await handleMessages(messages.length, async (idx) => {
            const msgMeta = messages[idx];
            if (!msgMeta?.id) return false;
            const msg = await gmail.users.messages.get({
              userId: 'me',
              id: msgMeta.id,
              format: 'metadata',
              metadataHeaders: ['From', 'Subject'],
            });
            const headers = msg.data.payload?.headers || [];
            const fromHeader = headers.find((h) => h.name === 'From')?.value || '';
            const subject = headers.find(h=>h.name==='Subject')?.value?.toLowerCase() || '';

            const prospectRecord = prospectsMap[fromHeader.toLowerCase().replace(/.*<|>.*/g,'')];
            if (!prospectRecord) {
              // Detect potential bounce/NDN messages by common keywords
              const lower = fromHeader.toLowerCase();
              if (lower.includes('mailer-daemon') || lower.includes('postmaster') || subject.includes('delivery') || subject.includes('undeliverable')) {
                bouncesLogged += await maybeHandleBounce(subject, prospectsMap);
              }
              return false;
            }

            return await maybeLogReply(user.id, fromHeader);
          });
        }

      } catch (error) {
        console.error(`Gmail reply check failed for user ${user.id}:`, error);
      }
    }

    // --- Outlook Processing ----------------------------------------------
    if (user.microsoftAccessToken) {
      try {
        const graphSvc = new MicrosoftGraphService({ accessToken: user.microsoftAccessToken });
        const res = await graphSvc.getMessages({
          top: 50,
          filter: `receivedDateTime ge ${new Date(Date.now() - 60 * 60 * 1000).toISOString()}`,
        });

        if (res.success && res.messages?.length) {
          repliesLogged += await handleMessages(res.messages.length, async (idx) => {
            const m = res.messages![idx];
            const fromEmail = (m.from?.emailAddress?.address || '').toLowerCase();
            return await maybeLogReply(user.id, fromEmail);
          });
        }
      } catch (error) {
        console.error(`Outlook reply check failed for user ${user.id}:`, error);
      }
    }

    processedUsers += 1;
  }

  const durationMs = Date.now() - startTime;
  return NextResponse.json({ processedUsers, repliesLogged, bouncesLogged, durationMs });
}

// helper functions ----------------------------------------------
async function maybeLogReply(userId: string, fromEmailHeader: string): Promise<boolean> {
  const emailMatch = fromEmailHeader.match(/<([^>]+)>/);
  const fromEmail = (emailMatch ? emailMatch[1] : fromEmailHeader).toLowerCase().trim();

  const prospect = await prisma.prospect.findFirst({
    where: {
      email: fromEmail,
      campaign: {
        userId,
      },
      status: {
        in: ['contacted', 'active'],
      },
    },
    select: { id: true },
  });

  if (!prospect) return false;

  const existing = await prisma.interaction.findFirst({
    where: {
      prospectId: prospect.id,
      type: 'email_replied',
    },
  });
  if (existing) return false;

  await prisma.interaction.create({
    data: { prospectId: prospect.id, type: 'email_replied' },
  });
  await prisma.prospect.update({ where: { id: prospect.id }, data: { status: 'replied' } });
  return true;
}

async function handleMessages(count: number, cb: (idx: number) => Promise<boolean>): Promise<number> {
  let logged = 0;
  for (let i = 0; i < count; i++) {
    if (await cb(i)) logged += 1;
  }
  return logged;
}

let prospectsMap: Record<string, { id: string; campaignId: string }> = {};

async function maybeHandleBounce(subject: string, prospectIndex: Record<string, { id: string; campaignId: string }>): Promise<number> {
  let logged = 0;
  for (const [email, info] of Object.entries(prospectIndex)) {
    if (!subject.toLowerCase().includes(email.toLowerCase())) continue;

    // Avoid duplicate bounce entries
    const existing = await prisma.interaction.findFirst({
      where: { prospectId: info.id, type: 'email_bounced' },
    });
    if (existing) continue;

    await prisma.interaction.create({
      data: {
        prospectId: info.id,
        type: 'email_bounced',
      },
    });

    await prisma.prospect.update({ where: { id: info.id }, data: { status: 'bounced' } });

    // Auto-pause campaign if bounce rate exceeds 5 % over last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [sentLast7, bouncedLast7] = await Promise.all([
      prisma.interaction.count({
        where: {
          type: 'email_sent',
          prospect: { campaignId: info.campaignId },
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.interaction.count({
        where: {
          type: 'email_bounced',
          prospect: { campaignId: info.campaignId },
          createdAt: { gte: sevenDaysAgo },
        },
      }),
    ]);

    if (sentLast7 > 0 && bouncedLast7 / sentLast7 > 0.05) {
      await prisma.campaign.update({
        where: { id: info.campaignId },
        data: { status: 'paused_auto' },
      });
      console.warn(`🚫 Campaign ${info.campaignId} auto-paused due to high bounce rate.`);
    }

    logged += 1;
  }
  return logged;
} 