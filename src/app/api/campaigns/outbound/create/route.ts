import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { OutboundCampaignManager } from '@/lib/outbound-campaign-manager';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { config, prospects } = body;

    // Validate required fields
    if (!config?.name || !prospects?.length) {
      return NextResponse.json(
        { error: 'Campaign name and prospects are required' },
        { status: 400 }
      );
    }

    // Create campaign manager instance
    const campaignManager = new OutboundCampaignManager();

    // Create campaign with AI-generated sequences
    const campaign = await campaignManager.createCampaign(
      session.user.id,
      {
        name: config.name,
        description: config.description || '',
        industry: config.industry || 'General Business',
        valueProposition: config.valueProposition || 'Helping businesses grow and scale efficiently',
        callToAction: config.callToAction || 'Schedule a 15-minute discovery call',
        tone: config.tone || 'professional',
        sequenceSteps: config.sequenceSteps || 3,
        delayBetweenEmails: config.delayBetweenEmails || 24,
        maxEmailsPerDay: config.maxEmailsPerDay || 50,
        trackOpens: config.trackOpens || true,
        trackClicks: config.trackClicks || true,
        autoRespond: config.autoRespond || true
      },
      prospects
    );

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        status: campaign.status,
        prospectCount: campaign.prospects.length,
        sequenceCount: campaign.sequences.length,
        createdAt: campaign.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating outbound campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
} 