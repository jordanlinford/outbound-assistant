import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import LinkedInContentGenerator from '@/lib/linkedin-content-generator';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { industry, interests, currentFollowing } = await request.json();

    if (!industry) {
      return NextResponse.json({ error: 'Industry is required' }, { status: 400 });
    }

    const contentGenerator = new LinkedInContentGenerator(process.env.OPENAI_API_KEY!);
    
    const suggestions = await contentGenerator.suggestPeopleToFollow(
      industry,
      interests || [],
      currentFollowing || []
    );

    return NextResponse.json({
      success: true,
      suggestions,
      count: suggestions.length
    });

  } catch (error) {
    console.error('Error getting LinkedIn suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to get LinkedIn suggestions' },
      { status: 500 }
    );
  }
} 