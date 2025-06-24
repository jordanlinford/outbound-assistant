import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { EmailSender } from '@/lib/email-sender';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// GET - Check for due follow-ups and process them
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Processing scheduled follow-ups...');
    
    // For now, we'll simulate the follow-up logic
    // In a real implementation, you'd query your database for:
    // 1. Active campaigns
    // 2. Prospects who haven't responded in 3+ days
    // 3. Prospects who haven't reached the end of their sequence
    
    const mockFollowUps = [
      {
        prospectEmail: 'example@test.com',
        prospectName: 'John Doe',
        campaignName: 'Product Launch',
        currentStep: 1,
        daysSinceLastEmail: 3
      }
    ];

    const results = [];
    
    for (const followUp of mockFollowUps) {
      try {
        const emailContent = await generateFollowUpEmail(followUp);
        
        // Send the follow-up email
        const emailSender = new EmailSender();
        await emailSender.sendEmail({
          to: followUp.prospectEmail,
          subject: emailContent.subject,
          body: emailContent.content,
        });

        results.push({
          prospect: followUp.prospectEmail,
          status: 'sent',
          step: followUp.currentStep + 1
        });

        console.log(`✅ Follow-up sent to ${followUp.prospectEmail}`);
      } catch (error) {
        console.error(`Error sending follow-up to ${followUp.prospectEmail}:`, error);
        results.push({
          prospect: followUp.prospectEmail,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('Error processing follow-ups:', error);
    return NextResponse.json(
      { error: 'Failed to process follow-ups' },
      { status: 500 }
    );
  }
}

async function generateFollowUpEmail(followUp: any): Promise<{subject: string, content: string}> {
  const followUpPrompts = {
    1: "Write a gentle follow-up email that adds value and asks if they had a chance to review the previous message.",
    2: "Write a more direct follow-up that addresses potential concerns and offers a specific benefit or solution.",
    3: "Write a final follow-up that creates urgency with a time-sensitive offer or deadline.",
    4: "Write a 'breakup' email that politely acknowledges they may not be interested but leaves the door open.",
    5: "Write a final value-add email with a helpful resource, no ask - just building goodwill."
  };

  const stepNumber = followUp.currentStep + 1;
  const promptKey = Math.min(stepNumber - 1, 4) as keyof typeof followUpPrompts;

  const prompt = `
You are writing a follow-up email for step ${stepNumber} of an outbound campaign.

Campaign: ${followUp.campaignName}
Prospect: ${followUp.prospectName || followUp.prospectEmail}
Days since last email: ${followUp.daysSinceLastEmail}

${followUpPrompts[promptKey]}

The email should:
- Reference the previous email subtly without being pushy
- Provide additional value or perspective
- Have a clear but soft call-to-action
- Be concise (under 150 words)
- Feel personal and human

Return JSON with 'subject' and 'content' fields.
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  const response = completion.choices[0]?.message?.content || '{}';
  
  // Extract JSON from response if it's wrapped in markdown code blocks
  let jsonStr = response;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }
  
  try {
    const emailData = JSON.parse(jsonStr);
    return {
      subject: emailData.subject || `Follow-up: ${followUp.campaignName}`,
      content: emailData.content || 'Thanks for your time. Let me know if you have any questions.'
    };
  } catch (error) {
    return {
      subject: `Follow-up: ${followUp.campaignName}`,
      content: 'Thanks for your time. Let me know if you have any questions.'
    };
  }
}

// POST - Manually trigger follow-ups for a specific campaign
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaignId } = await request.json();

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
    }

    // Trigger follow-ups for specific campaign
    console.log(`🎯 Triggering follow-ups for campaign: ${campaignId}`);

    return NextResponse.json({
      success: true,
      message: `Follow-ups triggered for campaign ${campaignId}`
    });

  } catch (error) {
    console.error('Error triggering follow-ups:', error);
    return NextResponse.json(
      { error: 'Failed to trigger follow-ups' },
      { status: 500 }
    );
  }
} 