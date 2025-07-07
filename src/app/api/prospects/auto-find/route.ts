import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { searchProspectsPDL } from '@/lib/lead-sourcing';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    let query: string | undefined = body.query;
    const limit: number = body.limit ?? 25;

    // Allow legacy payload: { criteria: { industries: [], jobTitles: [], ... } }
    if (!query && body.criteria) {
      const c = body.criteria as any;
      const parts: string[] = [];
      if (c.jobTitles?.length) parts.push(`(job_title:(${c.jobTitles.join(' OR ')}))`);
      if (c.industries?.length) parts.push(`(industry:(${c.industries.join(' OR ')}))`);
      if (c.companySizes?.length) parts.push(`(company_size:(${c.companySizes.join(' OR ')}))`);
      if (c.locations?.length) parts.push(`(location:(${c.locations.join(' OR ')}))`);
      if (c.keywords?.length) parts.push(`(${c.keywords.join(' ')})`);
      query = parts.join(' AND ');
    }

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
    }

    const prospects = await searchProspectsPDL(query, limit);

    return NextResponse.json({
      prospects,
      total: prospects.length,
      sources: { ai: 0, linkedin: 0, apollo: 0, pdl: prospects.length },
    });
  } catch (e: any) {
    console.error('Auto-find error', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
} 