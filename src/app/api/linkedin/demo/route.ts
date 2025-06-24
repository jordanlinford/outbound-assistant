import { NextRequest, NextResponse } from 'next/server';
import LinkedInContentGenerator from '@/lib/linkedin-content-generator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'suggestions';

    const contentGenerator = new LinkedInContentGenerator(process.env.OPENAI_API_KEY || 'demo-key');

    if (action === 'suggestions') {
      // Demo people suggestions
      const suggestions = await contentGenerator.suggestPeopleToFollow('Technology', ['AI', 'startups']);
      
      return NextResponse.json({
        success: true,
        action: 'suggestions',
        data: suggestions,
        message: 'Demo suggestions generated successfully'
      });
    }

    if (action === 'prompts') {
      // Demo content prompts
      const prompts = contentGenerator.getContentPrompts('technology', ['thought-leadership', 'tips']);
      
      return NextResponse.json({
        success: true,
        action: 'prompts',
        data: prompts,
        message: 'Demo prompts generated successfully'
      });
    }

    if (action === 'post') {
      // Demo post generation (without calling OpenAI)
      const prompts = contentGenerator.getContentPrompts('technology', ['thought-leadership']);
      const selectedPrompt = prompts[0];
      
      if (!selectedPrompt) {
        return NextResponse.json({ error: 'No prompts available' }, { status: 404 });
      }

      // Mock generated post instead of calling OpenAI
      const mockPost = {
        id: `demo_post_${Date.now()}`,
        content: `🚀 The future of AI in business is not just about automation—it's about augmentation.

While everyone talks about AI replacing jobs, I see something different happening in my work with startups. The most successful companies are using AI to amplify human creativity, not replace it.

Here's what I'm seeing:
• AI handles the repetitive tasks, freeing humans for strategic thinking
• Data analysis becomes accessible to non-technical team members
• Customer insights emerge faster, enabling quicker pivots
• Content creation scales, but human judgment guides the strategy

The key? It's not about choosing between human or AI—it's about orchestrating them together.

What's your experience been with AI in your business? Are you seeing augmentation or replacement?`,
        hashtags: ['#AI', '#BusinessStrategy', '#FutureOfWork', '#StartupLife', '#TechTrends'],
        postType: 'text' as const,
        engagementHooks: [
          'Opens with a contrarian perspective',
          'Uses personal experience as credibility',
          'Provides actionable insights',
          'Ends with engaging questions'
        ],
        callToAction: 'Share your AI experience in the comments',
        bestTimeToPost: '9:00 AM PST',
        estimatedReach: 3500
      };

      return NextResponse.json({
        success: true,
        action: 'post',
        data: mockPost,
        message: 'Demo post generated successfully (mock data)',
        note: 'This is a demo response. Real implementation would use OpenAI API.'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'LinkedIn Content Generator Demo API',
      availableActions: ['suggestions', 'prompts', 'post'],
      usage: {
        suggestions: '/api/linkedin/demo?action=suggestions',
        prompts: '/api/linkedin/demo?action=prompts',
        post: '/api/linkedin/demo?action=post'
      }
    });

  } catch (error) {
    console.error('Demo API error:', error);
    return NextResponse.json(
      { error: 'Demo API error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 