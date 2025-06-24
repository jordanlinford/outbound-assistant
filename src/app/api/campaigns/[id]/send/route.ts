import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { createEmailSender } from '@/lib/email-sender';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { prospectIds, emailSubject, emailBody, sendNow = false } = body;

    // Get campaign with prospects
    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        prospects: {
          where: prospectIds ? { id: { in: prospectIds } } : undefined,
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.prospects.length === 0) {
      return NextResponse.json({ error: 'No prospects found' }, { status: 400 });
    }

    // Create email sender
    const emailSender = await createEmailSender();
    if (!emailSender) {
      return NextResponse.json({ error: 'Email service not available. Please reconnect your Gmail account.' }, { status: 400 });
    }

    const results = [];
    let sentCount = 0;
    let failedCount = 0;

    for (const prospect of campaign.prospects) {
      try {
        // Personalize email content
        const personalizedSubject = personalizeEmail(emailSubject, prospect);
        const personalizedBody = personalizeEmail(emailBody, prospect);

        if (sendNow) {
          // Send email immediately
          const result = await emailSender.sendEmail({
            to: prospect.email,
            subject: personalizedSubject,
            body: personalizedBody,
            fromName: session.user.name || 'Outbound Assistant',
            replyTo: session.user.email || undefined,
          });

                     if (result.success) {
             sentCount++;
             // Log email sent as interaction
             await prisma.interaction.create({
               data: {
                 prospectId: prospect.id,
                 type: 'email_sent',
                 content: `Subject: ${personalizedSubject}\n\n${personalizedBody}`,
               },
             });
             
             // Update prospect status
             await prisma.prospect.update({
               where: { id: prospect.id },
               data: { status: 'contacted' },
             });
           } else {
             failedCount++;
             // Log email failed as interaction
             await prisma.interaction.create({
               data: {
                 prospectId: prospect.id,
                 type: 'email_failed',
                 content: `Failed to send: ${result.error}`,
               },
             });
           }

          results.push({
            prospectId: prospect.id,
            email: prospect.email,
            success: result.success,
            error: result.error,
          });
                 } else {
           // Schedule email for later using EmailSequence model
           await prisma.emailSequence.create({
             data: {
               toEmail: prospect.email,
               subject: personalizedSubject,
               body: personalizedBody,
               scheduledFor: new Date(),
               sequenceType: 'queued_response',
               status: 'scheduled',
             },
           });
         }

        // Rate limiting - wait between emails
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error processing prospect ${prospect.id}:`, error);
        failedCount++;
        results.push({
          prospectId: prospect.id,
          email: prospect.email,
          success: false,
          error: 'Processing failed',
        });
      }
    }

         // Update campaign stats
     await prisma.campaign.update({
       where: { id },
       data: {
         status: sendNow ? 'active' : campaign.status,
       },
     });

    return NextResponse.json({
      success: true,
      message: sendNow 
        ? `Sent ${sentCount} emails, ${failedCount} failed`
        : `Scheduled ${campaign.prospects.length} emails`,
      results: sendNow ? results : undefined,
      stats: {
        sent: sentCount,
        failed: failedCount,
        total: campaign.prospects.length,
      },
    });

  } catch (error) {
    console.error('Error sending campaign emails:', error);
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    );
  }
}

// Helper function to personalize email content
function personalizeEmail(template: string, prospect: any): string {
  return template
    .replace(/\{firstName\}/g, prospect.firstName || 'there')
    .replace(/\{lastName\}/g, prospect.lastName || '')
    .replace(/\{fullName\}/g, `${prospect.firstName || ''} ${prospect.lastName || ''}`.trim() || 'there')
    .replace(/\{company\}/g, prospect.company || 'your company')
    .replace(/\{title\}/g, prospect.title || 'your role')
    .replace(/\{email\}/g, prospect.email || '');
} 