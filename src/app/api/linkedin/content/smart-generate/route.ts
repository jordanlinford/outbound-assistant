import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { z } from 'zod';

const smartGenerateSchema = z.object({
  contentIdea: z.string().min(1, 'Content idea is required'),
  userContext: z.object({
    industry: z.string(),
    experience: z.string(),
    targetAudience: z.string(),
    personalStyle: z.string(),
    name: z.string()
  })
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contentIdea, userContext } = smartGenerateSchema.parse(body);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API not configured' }, { status: 500 });
    }

    // Analyze the content idea to determine type and context
    const contentAnalysis = analyzeContentIdea(contentIdea);
    
    // Generate the post using OpenAI
    const generatedPost = await generateSmartPost(contentIdea, userContext, contentAnalysis);

    return NextResponse.json(generatedPost);

  } catch (error) {
    console.error('Error generating smart post:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate post' },
      { status: 500 }
    );
  }
}

function analyzeContentIdea(contentIdea: string) {
  const isUrl = /^https?:\/\//.test(contentIdea.trim());
  const hasPersonalExperience = /\b(I|my|our|we|experience|learned|discovered|realized)\b/i.test(contentIdea);
  const isQuestion = contentIdea.trim().endsWith('?');
  const isOpinion = /\b(think|believe|opinion|view|perspective)\b/i.test(contentIdea);
  const isTrend = /\b(trend|future|emerging|new|latest|2024|2025)\b/i.test(contentIdea);
  const isAdvice = /\b(tip|advice|lesson|strategy|how to|guide)\b/i.test(contentIdea);

  return {
    isUrl,
    hasPersonalExperience,
    isQuestion,
    isOpinion,
    isTrend,
    isAdvice,
    length: contentIdea.length,
    wordCount: contentIdea.split(/\s+/).length
  };
}

async function generateSmartPost(
  contentIdea: string,
  userContext: any,
  analysis: any
) {
  const systemPrompt = `You are an expert LinkedIn content strategist and copywriter. You create engaging, professional posts that drive meaningful conversations and build thought leadership.

Your writing style should be:
- Authentic and conversational, not salesy
- Thought-provoking with clear insights
- Well-structured with engaging hooks
- Professional but personable
- Include strategic hashtags and strong calls-to-action

User Context:
- Name: ${userContext.name}
- Industry: ${userContext.industry}
- Experience Level: ${userContext.experience}
- Target Audience: ${userContext.targetAudience}
- Personal Style: ${userContext.personalStyle}`;

  let userPrompt = '';

  if (analysis.isUrl) {
    userPrompt = `Create a thoughtful LinkedIn post about this article/resource: "${contentIdea}"

Since I can't access the URL directly, please create a post that:
1. Acknowledges this is about an external resource
2. Provides valuable commentary or insights related to the topic
3. Connects it to my industry (${userContext.industry}) and experience
4. Encourages discussion about the broader implications
5. Includes a call-to-action for people to check out the resource and share their thoughts

Make it feel like I've actually read/engaged with the content and am sharing genuine insights.`;
  } else if (analysis.hasPersonalExperience) {
    userPrompt = `Transform this personal experience/insight into a compelling LinkedIn post: "${contentIdea}"

Create a post that:
1. Starts with a compelling hook related to the experience
2. Tells the story in an engaging way with specific details
3. Extracts 2-3 key lessons or insights
4. Connects it to broader industry trends in ${userContext.industry}
5. Ends with a question to encourage engagement
6. Maintains authenticity while being professionally valuable`;
  } else if (analysis.isQuestion) {
    userPrompt = `Turn this question into an engaging LinkedIn post: "${contentIdea}"

Create a post that:
1. Starts with the question as a hook
2. Provides my perspective/insights on the topic
3. Shares relevant experience from ${userContext.industry}
4. Offers 2-3 key points or frameworks
5. Invites others to share their experiences
6. Positions me as thoughtful and knowledgeable`;
  } else if (analysis.isTrend || analysis.isOpinion) {
    userPrompt = `Create a thought leadership post about: "${contentIdea}"

Structure the post to:
1. Open with a contrarian or thought-provoking statement
2. Provide evidence or reasoning for my perspective
3. Connect it to real examples from ${userContext.industry}
4. Offer actionable insights for ${userContext.targetAudience}
5. End with a question that sparks debate or discussion
6. Position me as a forward-thinking leader`;
  } else if (analysis.isAdvice) {
    userPrompt = `Create an advice-focused LinkedIn post based on: "${contentIdea}"

Structure it as:
1. Hook: A common problem or challenge in ${userContext.industry}
2. The advice/solution with 3-4 specific, actionable points
3. A brief example or story to illustrate
4. Why this matters for ${userContext.targetAudience}
5. Call-to-action asking what others have found helpful
6. Make it practical and immediately useful`;
  } else {
    userPrompt = `Create an engaging LinkedIn post about: "${contentIdea}"

Make it:
1. Start with an attention-grabbing hook
2. Provide valuable insights related to ${userContext.industry}
3. Include personal perspective or experience
4. Offer 2-3 key takeaways for ${userContext.targetAudience}
5. End with an engaging question
6. Feel authentic and conversation-starting`;
  }

  userPrompt += `

Important formatting requirements:
- Use emojis strategically (1-2 max) for visual appeal
- Include line breaks for readability
- Add 3-5 relevant hashtags at the end
- Keep it between 1000-1500 characters for optimal engagement
- Include a clear call-to-action
  - Make it sound like my authentic voice, not corporate speak
  
  Return ONLY the LinkedIn post content as plain text. Do not include JSON, markdown, or any formatting. Just write the post content with natural line breaks and include 3-5 relevant hashtags at the end.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Process plain text response
    let postData;
    
    // Clean up the content
    let cleanContent = content.trim();
    
    // Remove any markdown code blocks or extra formatting
    cleanContent = cleanContent.replace(/```[a-zA-Z]*\s*/g, '').replace(/```\s*/g, '');
    
    // Extract hashtags from the content
    const hashtags = extractHashtags(cleanContent);
    
    // Find engagement hooks (questions, interesting statements)
    const engagementHooks: string[] = [];
    const lines = cleanContent.split('\n');
    lines.forEach((line: string) => {
      const trimmedLine = line.trim();
      if (trimmedLine.endsWith('?') || trimmedLine.includes('🤔') || trimmedLine.includes('💡')) {
        if (trimmedLine.length > 10 && trimmedLine.length < 150) {
          engagementHooks.push(trimmedLine);
        }
      }
    });
    
    // Find call to action (usually the last question or engaging statement)
    let callToAction = 'Share your thoughts in the comments';
    const lastLines = lines.slice(-3);
    for (const line of lastLines.reverse()) {
      const trimmedLine = line.trim();
      if (trimmedLine.endsWith('?') && trimmedLine.length > 20) {
        callToAction = trimmedLine;
        break;
      }
    }
    
    postData = {
      content: cleanContent,
      hashtags: hashtags,
      engagementHooks: engagementHooks.slice(0, 2), // Take first 2 hooks
      callToAction: callToAction,
      postType: 'text',
      estimatedReach: 2500,
      bestTimeToPost: getBestPostingTime(userContext.industry)
    };

    return {
      id: `smart_post_${Date.now()}`,
      ...postData
    };

  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw new Error('Failed to generate post content');
  }
}

function extractHashtags(content: string): string[] {
  const hashtags = content.match(/#\w+/g) || [];
  return hashtags.slice(0, 5); // Limit to 5 hashtags
}

function getBestPostingTime(industry: string): string {
  const industryTimes: Record<string, string> = {
    'technology': '9:00 AM PST',
    'finance': '8:00 AM EST',
    'healthcare': '7:00 AM EST',
    'marketing': '10:00 AM EST',
    'sales': '9:00 AM EST',
    'real estate': '8:00 AM local',
    'consulting': '9:00 AM EST',
    'default': '9:00 AM local time'
  };

  return industryTimes[industry.toLowerCase()] || industryTimes.default;
} 