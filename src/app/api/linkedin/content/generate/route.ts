import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import LinkedInContentGenerator from '@/lib/linkedin-content-generator';
import { z } from 'zod';

const generatePostSchema = z.object({
  promptId: z.string(),
  variables: z.record(z.string()),
  userContext: z.object({
    industry: z.string(),
    experience: z.string(),
    targetAudience: z.string(),
    personalStyle: z.string()
  })
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { promptId, variables, userContext } = generatePostSchema.parse(body);

    const contentGenerator = new LinkedInContentGenerator(process.env.OPENAI_API_KEY!);
    
    // Get the prompt by ID
    const prompts = contentGenerator.getContentPrompts(userContext.industry, ['all']);
    const prompt = prompts.find(p => p.id === promptId);
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const generatedPost = await contentGenerator.generatePost(prompt, variables, userContext);

    return NextResponse.json({
      success: true,
      post: generatedPost
    });

  } catch (error) {
    console.error('Error generating LinkedIn post:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate LinkedIn post' },
      { status: 500 }
    );
  }
} 