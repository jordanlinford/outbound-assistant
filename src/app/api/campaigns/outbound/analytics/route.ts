import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { OutboundCampaignManager } from '@/lib/outbound-campaign-manager';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Create campaign manager instance
    const campaignManager = new OutboundCampaignManager();

    // Get campaign analytics
    const analytics = await campaignManager.getCampaignAnalytics(campaignId, session.user.id);

    return NextResponse.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Error getting campaign analytics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get analytics' },
      { status: 500 }
    );
  }
} 