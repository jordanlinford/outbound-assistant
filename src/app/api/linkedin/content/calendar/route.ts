import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CalendarRequest {
  period: 'week' | 'month' | 'custom';
  postsPerWeek: number;
  focusArea: 'mixed' | 'thought-leadership' | 'personal-brand' | 'industry-insights';
  userContext: {
    industry: string;
    experience: string;
    targetAudience: string;
    personalStyle: string;
    name: string;
  };
}

interface ContentPost {
  day: string;
  date: string;
  type: string;
  title: string;
  contentIdea: string;
  time: string;
  engagement: string;
  hashtags: string[];
  callToAction?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CalendarRequest = await request.json();
    const { period, postsPerWeek, focusArea, userContext } = body;

    if (!userContext.industry) {
      return NextResponse.json({ error: 'Industry is required' }, { status: 400 });
    }

    // Generate content calendar using OpenAI
    const prompt = `You are a LinkedIn content strategist. Generate a ${period === 'week' ? 'weekly' : 'monthly'} content calendar for a ${userContext.experience} professional in ${userContext.industry}.

User Profile:
- Industry: ${userContext.industry}
- Experience: ${userContext.experience}
- Target Audience: ${userContext.targetAudience}
- Writing Style: ${userContext.personalStyle}
- Name: ${userContext.name}

Requirements:
- ${postsPerWeek} posts per week
- Focus area: ${focusArea}
- Mix of content types: industry insights, personal stories, questions/polls, tips, contrarian opinions
- Include optimal posting times based on LinkedIn best practices
- Vary engagement potential (High, Very High, Medium)

For each post, provide:
1. Day of week and date (use current week starting Monday)
2. Content type (Industry Insight, Personal Story, Question/Poll, Tips, Opinion, etc.)
3. Compelling title/hook (under 100 characters)
4. Brief content idea description
5. Optimal posting time
6. Expected engagement level
7. 3-5 relevant hashtags
8. Call to action (optional)

Generate ${period === 'week' ? postsPerWeek : postsPerWeek * 4} posts total.

Return as a JSON array of posts with this structure:
{
  "posts": [
    {
      "day": "Monday",
      "date": "Dec 16",
      "type": "Industry Insight",
      "title": "AI is changing how we work - here's what I've learned",
      "contentIdea": "Share 3 specific ways AI has changed your daily workflow, with concrete examples",
      "time": "9:00 AM",
      "engagement": "High",
      "hashtags": ["#AI", "#FutureOfWork", "#Technology"],
      "callToAction": "What AI tools have changed your workflow? Share in the comments!"
    }
  ],
  "strategy": {
    "contentMix": "40% industry insights, 30% personal stories, 30% engagement posts",
    "bestTimes": "Mon-Wed: 9-11 AM, Thu-Fri: 1-3 PM",
    "goals": ["Build thought leadership", "Increase engagement", "Grow follower base"]
  }
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a LinkedIn content strategist who creates strategic content calendars. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let calendarData;
    try {
      calendarData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Response text:', responseText);
      throw new Error('Invalid JSON response from AI');
    }

    // Add color coding based on content type
    const colorMap: Record<string, string> = {
      'Industry Insight': 'bg-blue-100 border-blue-300 text-blue-800',
      'Personal Story': 'bg-green-100 border-green-300 text-green-800',
      'Question/Poll': 'bg-purple-100 border-purple-300 text-purple-800',
      'Tips': 'bg-orange-100 border-orange-300 text-orange-800',
      'Opinion': 'bg-red-100 border-red-300 text-red-800',
      'Achievement': 'bg-yellow-100 border-yellow-300 text-yellow-800'
    };

    // Add colors to posts
    if (calendarData.posts) {
      calendarData.posts = calendarData.posts.map((post: ContentPost) => ({
        ...post,
        color: colorMap[post.type] || 'bg-gray-100 border-gray-300 text-gray-800'
      }));
    }

    return NextResponse.json(calendarData);

  } catch (error) {
    console.error('Calendar generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content calendar' },
      { status: 500 }
    );
  }
} 