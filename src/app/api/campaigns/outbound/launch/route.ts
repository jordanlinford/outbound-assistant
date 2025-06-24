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
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Create campaign manager instance
    const campaignManager = new OutboundCampaignManager();

    // Launch the campaign
    const result = await campaignManager.launchCampaign(campaignId, session.user.id);

    return NextResponse.json({
      message: `Campaign launched successfully! Sent ${result.sent} emails out of ${result.total} total.`,
      ...result
    });

  } catch (error) {
    console.error('Error launching campaign:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to launch campaign' },
      { status: 500 }
    );
  }
} 