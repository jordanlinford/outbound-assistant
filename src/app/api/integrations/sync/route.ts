import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { createCRMIntegration, ProspectData } from '@/lib/crm-integrations';

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { crmType, config, campaignId, filters } = await request.json();

    // Validate required fields
    if (!crmType || !config || !campaignId) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Create CRM integration instance
    const crmIntegration = createCRMIntegration(crmType, config);

    // Fetch prospects from CRM
    const crmProspects = await crmIntegration.fetchProspects(filters);

    if (crmProspects.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No prospects found in CRM',
        imported: 0 
      });
    }

    // Verify campaign exists and belongs to user
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        userId: session.user.id,
      }
    });

    if (!campaign) {
      return new NextResponse('Campaign not found', { status: 404 });
    }

    // Import prospects into database
    const importedProspects = [];
    const skippedProspects = [];

    for (const crmProspect of crmProspects) {
      try {
        // Check if prospect already exists in this campaign
        const existingProspect = await prisma.prospect.findFirst({
          where: {
            email: crmProspect.email,
            campaignId: campaignId,
          }
        });

        if (existingProspect) {
          skippedProspects.push({
            email: crmProspect.email,
            reason: 'Already exists in campaign'
          });
          continue;
        }

        // Create new prospect
        const newProspect = await prisma.prospect.create({
          data: {
            email: crmProspect.email,
            name: `${crmProspect.firstName || ''} ${crmProspect.lastName || ''}`.trim() || null,
            company: crmProspect.company || null,
            title: crmProspect.title || null,
            status: 'new',
            campaignId: campaignId,
          }
        });

        importedProspects.push(newProspect);
      } catch (error) {
        console.error('Error importing prospect:', crmProspect.email, error);
        skippedProspects.push({
          email: crmProspect.email,
          reason: 'Database error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedProspects.length} prospects from ${crmType}`,
      imported: importedProspects.length,
      skipped: skippedProspects.length,
      skippedDetails: skippedProspects,
      prospects: importedProspects
    });

  } catch (error) {
    console.error('CRM sync error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// GET endpoint to test CRM connection
export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const crmType = searchParams.get('crmType');
    const configParam = searchParams.get('config');

    if (!crmType || !configParam) {
      return new NextResponse('Missing CRM type or config', { status: 400 });
    }

    const config = JSON.parse(configParam);
    const crmIntegration = createCRMIntegration(crmType as any, config);

    // Test connection by fetching a small number of prospects
    const testProspects = await crmIntegration.fetchProspects({ limit: 5 });

    return NextResponse.json({
      success: true,
      message: `Successfully connected to ${crmType}`,
      sampleCount: testProspects.length,
      sampleProspects: testProspects.slice(0, 3) // Return first 3 as sample
    });

  } catch (error) {
    console.error('CRM connection test error:', error);
    return NextResponse.json({
      success: false,
      message: `Failed to connect to CRM: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 400 });
  }
} 