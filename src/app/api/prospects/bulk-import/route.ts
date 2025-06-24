import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

interface ProspectToImport {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  industry: string;
  companySize: string;
  score: number;
  linkedinUrl?: string;
  reason: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prospects, campaignId }: { 
      prospects: ProspectToImport[]; 
      campaignId?: string;
    } = await request.json();

    if (!prospects || prospects.length === 0) {
      return NextResponse.json({ error: 'No prospects provided' }, { status: 400 });
    }

    let targetCampaignId = campaignId;

    // If no campaign specified, create a new one
    if (!targetCampaignId) {
      const campaign = await prisma.campaign.create({
        data: {
          name: `Auto-Generated Campaign - ${new Date().toLocaleDateString()}`,
          description: `Campaign created from ${prospects.length} auto-found prospects`,
          status: 'draft',
          userId: session.user.id,
        }
      });
      targetCampaignId = campaign.id;
    }

    // Import prospects into the campaign
    const importedProspects = [];
    const errors = [];

    for (const prospect of prospects) {
      try {
        // Check if prospect already exists in this campaign
        const existingProspect = await prisma.prospect.findFirst({
          where: {
            email: prospect.email,
            campaignId: targetCampaignId
          }
        });

        if (existingProspect) {
          errors.push(`${prospect.email} already exists in campaign`);
          continue;
        }

        // Create new prospect
        const newProspect = await prisma.prospect.create({
          data: {
            email: prospect.email,
            name: `${prospect.firstName} ${prospect.lastName}`,
            company: prospect.company,
            title: prospect.title,
            status: 'new',
            campaignId: targetCampaignId,
          }
        });

        // Store lead score if available
        if (prospect.score) {
          try {
            await prisma.leadScore.upsert({
              where: { email: prospect.email },
              update: {
                firstName: prospect.firstName,
                lastName: prospect.lastName,
                company: prospect.company,
                title: prospect.title,
                overallScore: prospect.score,
                qualification: prospect.score >= 70 ? 'hot' : prospect.score >= 50 ? 'warm' : 'cold',
                reasons: [prospect.reason],
                buyingSignals: [],
                redFlags: [],
                suggestedApproach: 'Standard outreach approach',
                estimatedBudget: 'Unknown',
                decisionMakerLevel: 'medium',
                urgency: 'medium',
                personalizedMessage: `Hi ${prospect.firstName}, I noticed ${prospect.company} and thought you might be interested in...`
              },
              create: {
                email: prospect.email,
                firstName: prospect.firstName,
                lastName: prospect.lastName,
                company: prospect.company,
                title: prospect.title,
                overallScore: prospect.score,
                qualification: prospect.score >= 70 ? 'hot' : prospect.score >= 50 ? 'warm' : 'cold',
                reasons: [prospect.reason],
                buyingSignals: [],
                redFlags: [],
                suggestedApproach: 'Standard outreach approach',
                estimatedBudget: 'Unknown',
                decisionMakerLevel: 'medium',
                urgency: 'medium',
                personalizedMessage: `Hi ${prospect.firstName}, I noticed ${prospect.company} and thought you might be interested in...`
              }
            });
          } catch (scoreError) {
            console.error('Error storing lead score:', scoreError);
            // Continue even if lead score fails
          }
        }

        importedProspects.push(newProspect);
      } catch (error) {
        console.error(`Error importing prospect ${prospect.email}:`, error);
        errors.push(`Failed to import ${prospect.email}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      campaignId: targetCampaignId,
      imported: importedProspects.length,
      total: prospects.length,
      errors: errors.length > 0 ? errors : undefined,
      prospects: importedProspects
    });

  } catch (error) {
    console.error('Error bulk importing prospects:', error);
    return NextResponse.json(
      { error: 'Failed to import prospects' },
      { status: 500 }
    );
  }
} 