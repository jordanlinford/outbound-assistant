import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import LinkedInContentGenerator from '@/lib/linkedin-content-generator';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry') || 'business';
    const goals = searchParams.get('goals')?.split(',') || ['all'];

    const contentGenerator = new LinkedInContentGenerator(process.env.OPENAI_API_KEY!);
    const prompts = contentGenerator.getContentPrompts(industry, goals);

    return NextResponse.json({
      success: true,
      prompts,
      count: prompts.length
    });

  } catch (error) {
    console.error('Error getting content prompts:', error);
    return NextResponse.json(
      { error: 'Failed to get content prompts' },
      { status: 500 }
    );
  }
} 