export interface LinkedInProfile {
  id: string;
  name: string;
  headline: string;
  industry: string;
  followerCount: number;
  engagementRate: number;
  recentPostTopics: string[];
  profileUrl: string;
  avatarUrl?: string;
  location?: string;
  connectionDegree: '1st' | '2nd' | '3rd+';
}

export interface ContentPrompt {
  id: string;
  title: string;
  description: string;
  category: 'thought-leadership' | 'industry-insights' | 'personal-story' | 'tips-advice' | 'trending-topics';
  prompt: string;
  variables: string[];
}

export interface GeneratedPost {
  id: string;
  content: string;
  hashtags: string[];
  postType: 'text' | 'carousel' | 'poll' | 'video-script';
  engagementHooks: string[];
  callToAction?: string;
  bestTimeToPost?: string;
  estimatedReach?: number;
}

export interface ContentStrategy {
  industry: string;
  targetAudience: string;
  contentGoals: string[];
  postingFrequency: number;
  contentMix: {
    thoughtLeadership: number;
    industryInsights: number;
    personalStories: number;
    tipsAdvice: number;
    trendingTopics: number;
  };
}

class LinkedInContentGenerator {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Suggest people to follow based on industry and interests
  async suggestPeopleToFollow(
    industry: string,
    interests: string[],
    currentFollowing: string[] = []
  ): Promise<LinkedInProfile[]> {
    try {
      // Get comprehensive industry leaders
      const industryLeaders = this.getIndustryLeaders(industry, interests);
      
      // Filter out people already following
      const filtered = industryLeaders.filter(leader => 
        !currentFollowing.includes(leader.id)
      );

      // Use AI to analyze and rank suggestions if API key is available
      if (this.apiKey && this.apiKey !== 'demo-key') {
        return await this.aiEnhancedSuggestions(filtered, industry, interests);
      }

      // Return top suggestions with engagement scoring
      return this.rankSuggestionsByRelevance(filtered, industry, interests)
        .slice(0, 15);
    } catch (error) {
      console.error('Error getting people suggestions:', error);
      return this.getFallbackSuggestions(industry);
    }
  }

  private async aiEnhancedSuggestions(
    profiles: LinkedInProfile[],
    industry: string,
    interests: string[]
  ): Promise<LinkedInProfile[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a LinkedIn networking expert. Analyze and rank profiles based on relevance for someone in ${industry} interested in ${interests.join(', ')}. You must respond with valid JSON only.`
            },
            {
              role: 'user',
              content: `Rank these LinkedIn profiles by networking value and relevance. Return ONLY a JSON array of objects with "id" field, ordered by recommendation priority:

${JSON.stringify(profiles.map(p => ({ id: p.id, name: p.name, headline: p.headline, topics: p.recentPostTopics })))}

Response format: [{"id": "profile-id"}, {"id": "another-id"}]`
            }
          ],
          temperature: 0.3,
          max_tokens: 500,
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

      // Try to extract JSON from the response
      let rankedIds;
      try {
        // Look for JSON array in the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          rankedIds = JSON.parse(jsonMatch[0]);
        } else {
          rankedIds = JSON.parse(content);
        }
      } catch (parseError) {
        console.error('JSON parsing failed:', content);
        throw new Error('Invalid JSON response from OpenAI');
      }
      
      // Validate the response structure
      if (!Array.isArray(rankedIds) || rankedIds.length === 0) {
        throw new Error('Invalid ranking response structure');
      }

      // Reorder profiles based on AI ranking
      const rankedProfiles = rankedIds
        .map((item: any) => profiles.find(p => p.id === item.id))
        .filter(Boolean) as LinkedInProfile[];

      // If AI didn't rank all profiles, add the remaining ones
      const rankedIds_set = new Set(rankedIds.map((item: any) => item.id));
      const remainingProfiles = profiles.filter(p => !rankedIds_set.has(p.id));
      
      return [...rankedProfiles, ...remainingProfiles].slice(0, 15);
    } catch (error) {
      console.error('AI ranking failed, using fallback:', error);
      return this.rankSuggestionsByRelevance(profiles, industry, interests).slice(0, 15);
    }
  }

  private rankSuggestionsByRelevance(
    profiles: LinkedInProfile[],
    industry: string,
    interests: string[]
  ): LinkedInProfile[] {
    return profiles.map(profile => ({
      ...profile,
      relevanceScore: this.calculateRelevanceScore(profile, industry, interests)
    }))
    .sort((a, b) => (b as any).relevanceScore - (a as any).relevanceScore)
    .map(({ relevanceScore, ...profile }) => profile);
  }

  private calculateRelevanceScore(
    profile: LinkedInProfile,
    industry: string,
    interests: string[]
  ): number {
    let score = 0;

    // Industry match (40% weight)
    if (profile.industry.toLowerCase().includes(industry.toLowerCase())) {
      score += 40;
    }

    // Interest alignment (30% weight)
    const matchingTopics = profile.recentPostTopics.filter(topic =>
      interests.some(interest => 
        topic.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(topic.toLowerCase())
      )
    );
    score += (matchingTopics.length / Math.max(interests.length, 1)) * 30;

    // Engagement quality (20% weight)
    if (profile.engagementRate > 3.0) score += 20;
    else if (profile.engagementRate > 2.0) score += 15;
    else if (profile.engagementRate > 1.0) score += 10;

    // Follower count balance (10% weight) - not too small, not too big
    if (profile.followerCount >= 10000 && profile.followerCount <= 100000) {
      score += 10;
    } else if (profile.followerCount >= 5000 && profile.followerCount <= 200000) {
      score += 7;
    }

    // Connection degree bonus
    if (profile.connectionDegree === '2nd') score += 5;
    else if (profile.connectionDegree === '1st') score += 3;

    return score;
  }

  private getFallbackSuggestions(industry: string): LinkedInProfile[] {
    const fallbackProfiles = this.getIndustryLeaders(industry, []);
    return fallbackProfiles.slice(0, 10);
  }

  // Get content prompts based on user's industry and goals
  getContentPrompts(industry: string, contentGoals: string[]): ContentPrompt[] {
    const basePrompts: ContentPrompt[] = [
      {
        id: 'thought-leadership-1',
        title: 'Industry Prediction',
        description: 'Share your predictions about industry trends',
        category: 'thought-leadership',
        prompt: `Write a LinkedIn post about a prediction you have for the {industry} industry in the next {timeframe}. 
        
        Structure:
        1. Start with a bold prediction
        2. Explain your reasoning with 2-3 key points
        3. Ask your audience what they think
        
        Tone: Confident but open to discussion
        Length: 150-200 words`,
        variables: ['industry', 'timeframe']
      },
      {
        id: 'personal-story-1',
        title: 'Lesson Learned',
        description: 'Share a professional lesson or mistake',
        category: 'personal-story',
        prompt: `Write a LinkedIn post about a professional lesson you learned the hard way in {industry}.
        
        Structure:
        1. Start with the mistake or challenge
        2. Explain what you learned
        3. Give actionable advice to others
        4. End with a question to engage your audience
        
        Tone: Humble, helpful, authentic
        Length: 200-250 words`,
        variables: ['industry']
      },
      {
        id: 'tips-advice-1',
        title: 'Quick Tips List',
        description: 'Share actionable tips for your audience',
        category: 'tips-advice',
        prompt: `Create a LinkedIn post with {number} actionable tips for {target_audience} in {industry}.
        
        Structure:
        1. Compelling hook about the value of these tips
        2. List each tip with brief explanation
        3. Encourage saving/sharing
        4. Ask which tip resonates most
        
        Tone: Helpful, direct, valuable
        Length: 180-220 words`,
        variables: ['number', 'target_audience', 'industry']
      },
      {
        id: 'industry-insights-1',
        title: 'Data-Driven Insight',
        description: 'Share industry statistics or research findings',
        category: 'industry-insights',
        prompt: `Write a LinkedIn post analyzing a recent statistic or trend in {industry}.
        
        Structure:
        1. Share the statistic (make it surprising if possible)
        2. Explain what this means for professionals in the field
        3. Give practical implications or actions
        4. Ask for others' experiences
        
        Tone: Analytical, informative, engaging
        Length: 170-200 words`,
        variables: ['industry']
      },
      {
        id: 'trending-topics-1',
        title: 'Hot Take on Trends',
        description: 'Give your perspective on current industry trends',
        category: 'trending-topics',
        prompt: `Write a LinkedIn post giving your perspective on {trending_topic} in {industry}.
        
        Structure:
        1. Reference the trending topic
        2. Share your unique angle or contrarian view
        3. Support with examples or reasoning
        4. Invite discussion and different viewpoints
        
        Tone: Thoughtful, slightly provocative, discussion-starting
        Length: 180-220 words`,
        variables: ['trending_topic', 'industry']
      }
    ];

    return basePrompts.filter(prompt => 
      contentGoals.some(goal => 
        goal.toLowerCase().includes(prompt.category) || 
        prompt.description.toLowerCase().includes(goal.toLowerCase())
      )
    );
  }

  // Generate a post using AI based on a prompt
  async generatePost(
    prompt: ContentPrompt,
    variables: Record<string, string>,
    userContext: {
      industry: string;
      experience: string;
      targetAudience: string;
      personalStyle: string;
    }
  ): Promise<GeneratedPost> {
    // Replace variables in the prompt
    let finalPrompt = prompt.prompt;
    Object.entries(variables).forEach(([key, value]) => {
      finalPrompt = finalPrompt.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    // Add user context to the prompt
    const contextualPrompt = `
      ${finalPrompt}
      
      Additional context:
      - User's industry: ${userContext.industry}
      - User's experience level: ${userContext.experience}
      - Target audience: ${userContext.targetAudience}
      - Writing style preference: ${userContext.personalStyle}
      
      Please generate a LinkedIn post that follows the structure above and includes:
      - Relevant hashtags (3-5)
      - Strong engagement hooks
      - A clear call-to-action if appropriate
      
      Return the response in JSON format with: content, hashtags, engagementHooks, callToAction
    `;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a LinkedIn content expert who creates engaging, professional posts that drive meaningful engagement. Always return valid JSON.'
            },
            {
              role: 'user',
              content: contextualPrompt
            }
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const generatedContent = JSON.parse(data.choices[0].message.content);

      return {
        id: `post_${Date.now()}`,
        content: generatedContent.content,
        hashtags: generatedContent.hashtags || [],
        postType: 'text',
        engagementHooks: generatedContent.engagementHooks || [],
        callToAction: generatedContent.callToAction,
        bestTimeToPost: this.getBestPostingTime(userContext.industry),
        estimatedReach: this.estimateReach(userContext.targetAudience)
      };
    } catch (error) {
      console.error('Error generating post:', error);
      throw new Error('Failed to generate post content');
    }
  }

  // Generate a content calendar for the week/month
  async generateContentCalendar(
    strategy: ContentStrategy,
    timeframe: 'week' | 'month'
  ): Promise<{
    posts: (GeneratedPost & { scheduledDate: Date; prompt: ContentPrompt })[];
    analytics: {
      contentMixBalance: boolean;
      estimatedTotalReach: number;
      recommendedAdjustments: string[];
    };
  }> {
    const days = timeframe === 'week' ? 7 : 30;
    const totalPosts = Math.floor((strategy.postingFrequency * days) / 7);
    
    const contentMix = this.calculateContentMix(strategy.contentMix, totalPosts);
    const prompts = this.getContentPrompts(strategy.industry, strategy.contentGoals);
    
    const posts: (GeneratedPost & { scheduledDate: Date; prompt: ContentPrompt })[] = [];
    
    // Generate posts based on content mix
    for (const [category, count] of Object.entries(contentMix)) {
      const categoryPrompts = prompts.filter(p => p.category === category);
      
      for (let i = 0; i < count; i++) {
        const prompt = categoryPrompts[i % categoryPrompts.length];
        const scheduledDate = this.getOptimalPostingDate(strategy.industry, posts.length, timeframe);
        
        // For demo purposes, create a sample post
        const post: GeneratedPost & { scheduledDate: Date; prompt: ContentPrompt } = {
          id: `calendar_post_${posts.length}`,
          content: `Sample ${category} post - this would be AI generated`,
          hashtags: this.getIndustryHashtags(strategy.industry),
          postType: 'text',
          engagementHooks: ['Hook would be generated by AI'],
          scheduledDate,
          prompt,
          bestTimeToPost: this.getBestPostingTime(strategy.industry),
          estimatedReach: this.estimateReach(strategy.targetAudience)
        };
        
        posts.push(post);
      }
    }

    return {
      posts: posts.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime()),
      analytics: {
        contentMixBalance: this.checkContentBalance(contentMix, strategy.contentMix),
        estimatedTotalReach: posts.reduce((sum, post) => sum + (post.estimatedReach || 0), 0),
        recommendedAdjustments: this.getContentRecommendations(strategy, contentMix)
      }
    };
  }

  // Analyze competitor content for inspiration
  async analyzeCompetitorContent(
    competitorProfiles: string[],
    industry: string
  ): Promise<{
    topPerformingContent: Array<{
      profile: string;
      content: string;
      engagement: number;
      contentType: string;
      keyTopics: string[];
    }>;
    trendingTopics: string[];
    contentGaps: string[];
    recommendations: string[];
  }> {
    // This would integrate with LinkedIn's API to analyze public posts
    // For now, returning mock data structure
    return {
      topPerformingContent: [
        {
          profile: "Industry Leader",
          content: "Sample high-performing post about AI trends...",
          engagement: 1250,
          contentType: "thought-leadership",
          keyTopics: ["AI", "automation", "future of work"]
        }
      ],
      trendingTopics: ["AI integration", "remote work", "sustainability"],
      contentGaps: ["personal branding", "team management"],
      recommendations: [
        "Consider posting more about AI integration",
        "Share personal experiences with remote work",
        "Create content about sustainable business practices"
      ]
    };
  }

  // Helper methods
  private getIndustryLeaders(industry: string, interests: string[]): LinkedInProfile[] {
    // Comprehensive database of industry leaders across multiple sectors
    const allLeaders: LinkedInProfile[] = [
      // Technology Leaders
      {
        id: "satya-nadella",
        name: "Satya Nadella",
        headline: "Chairman and CEO at Microsoft",
        industry: "Technology",
        followerCount: 2800000,
        engagementRate: 4.8,
        recentPostTopics: ["AI transformation", "cloud computing", "digital innovation", "leadership", "empathy in tech"],
        profileUrl: "https://linkedin.com/in/satyanadella",
        location: "Seattle, WA",
        connectionDegree: "3rd+"
      },
      {
        id: "reid-hoffman",
        name: "Reid Hoffman",
        headline: "Co-Founder of LinkedIn | Partner at Greylock",
        industry: "Technology",
        followerCount: 3200000,
        engagementRate: 3.9,
        recentPostTopics: ["entrepreneurship", "AI ethics", "network thinking", "startup scaling", "venture capital"],
        profileUrl: "https://linkedin.com/in/reidhoffman",
        location: "Palo Alto, CA",
        connectionDegree: "3rd+"
      },
      {
        id: "melinda-gates",
        name: "Melinda French Gates",
        headline: "Co-founder of Pivotal Ventures",
        industry: "Technology",
        followerCount: 1900000,
        engagementRate: 5.2,
        recentPostTopics: ["women in tech", "social impact", "gender equality", "philanthropy", "innovation"],
        profileUrl: "https://linkedin.com/in/melindafrenchgates",
        location: "Seattle, WA",
        connectionDegree: "3rd+"
      },
      {
        id: "jensen-huang",
        name: "Jensen Huang",
        headline: "Founder and CEO of NVIDIA",
        industry: "Technology",
        followerCount: 850000,
        engagementRate: 4.1,
        recentPostTopics: ["AI acceleration", "GPU computing", "deep learning", "autonomous vehicles", "metaverse"],
        profileUrl: "https://linkedin.com/in/jenhsunhuang",
        location: "Santa Clara, CA",
        connectionDegree: "3rd+"
      },

      // Sales & Business Development
      {
        id: "jill-konrath",
        name: "Jill Konrath",
        headline: "Sales Strategist | Author of Selling to Big Companies",
        industry: "Sales",
        followerCount: 320000,
        engagementRate: 6.8,
        recentPostTopics: ["sales methodology", "buyer psychology", "sales enablement", "prospecting", "closing techniques"],
        profileUrl: "https://linkedin.com/in/jillkonrath",
        location: "Minneapolis, MN",
        connectionDegree: "2nd"
      },
      {
        id: "anthony-iannarino",
        name: "Anthony Iannarino",
        headline: "Sales Leader | Author | Speaker",
        industry: "Sales",
        followerCount: 280000,
        engagementRate: 7.2,
        recentPostTopics: ["consultative selling", "sales leadership", "value creation", "relationship building", "sales process"],
        profileUrl: "https://linkedin.com/in/anthonyiannarino",
        location: "Columbus, OH",
        connectionDegree: "2nd"
      },
      {
        id: "aaron-ross",
        name: "Aaron Ross",
        headline: "Author of Predictable Revenue | Sales Process Expert",
        industry: "Sales",
        followerCount: 195000,
        engagementRate: 5.9,
        recentPostTopics: ["predictable revenue", "sales development", "outbound sales", "sales ops", "scaling sales"],
        profileUrl: "https://linkedin.com/in/aaronross",
        location: "Austin, TX",
        connectionDegree: "2nd"
      },

      // Marketing Leaders
      {
        id: "seth-godin",
        name: "Seth Godin",
        headline: "Author & Marketing Expert",
        industry: "Marketing",
        followerCount: 1100000,
        engagementRate: 8.1,
        recentPostTopics: ["permission marketing", "brand storytelling", "purple cow", "marketing philosophy", "customer loyalty"],
        profileUrl: "https://linkedin.com/in/sethgodin",
        location: "New York, NY",
        connectionDegree: "3rd+"
      },
      {
        id: "ann-handley",
        name: "Ann Handley",
        headline: "Chief Content Officer at MarketingProfs",
        industry: "Marketing",
        followerCount: 485000,
        engagementRate: 6.4,
        recentPostTopics: ["content marketing", "writing", "email marketing", "customer experience", "brand voice"],
        profileUrl: "https://linkedin.com/in/annhandley",
        location: "Boston, MA",
        connectionDegree: "2nd"
      },
      {
        id: "rand-fishkin",
        name: "Rand Fishkin",
        headline: "Founder of SparkToro | SEO Expert",
        industry: "Marketing",
        followerCount: 390000,
        engagementRate: 5.7,
        recentPostTopics: ["SEO strategy", "audience research", "transparent entrepreneurship", "marketing attribution", "startup lessons"],
        profileUrl: "https://linkedin.com/in/randfishkin",
        location: "Seattle, WA",
        connectionDegree: "2nd"
      },

      // Finance & Investment
      {
        id: "warren-buffett",
        name: "Warren Buffett",
        headline: "Chairman and CEO of Berkshire Hathaway",
        industry: "Finance",
        followerCount: 1800000,
        engagementRate: 3.2,
        recentPostTopics: ["value investing", "long-term thinking", "business fundamentals", "economic insights", "shareholder letters"],
        profileUrl: "https://linkedin.com/in/warrenbuffett",
        location: "Omaha, NE",
        connectionDegree: "3rd+"
      },
      {
        id: "ray-dalio",
        name: "Ray Dalio",
        headline: "Founder of Bridgewater Associates",
        industry: "Finance",
        followerCount: 920000,
        engagementRate: 4.3,
        recentPostTopics: ["principles", "economic cycles", "debt cycles", "meditation", "radical transparency"],
        profileUrl: "https://linkedin.com/in/raydalio",
        location: "Greenwich, CT",
        connectionDegree: "3rd+"
      },
      {
        id: "cathie-wood",
        name: "Cathie Wood",
        headline: "Founder, CEO & CIO of ARK Invest",
        industry: "Finance",
        followerCount: 650000,
        engagementRate: 5.1,
        recentPostTopics: ["disruptive innovation", "genomics", "artificial intelligence", "electric vehicles", "blockchain"],
        profileUrl: "https://linkedin.com/in/cathie-wood",
        location: "New York, NY",
        connectionDegree: "3rd+"
      },

      // Healthcare & Biotech
      {
        id: "atul-gawande",
        name: "Atul Gawande",
        headline: "Surgeon, Writer, and Public Health Researcher",
        industry: "Healthcare",
        followerCount: 420000,
        engagementRate: 6.8,
        recentPostTopics: ["healthcare systems", "medical innovation", "patient safety", "public health", "healthcare policy"],
        profileUrl: "https://linkedin.com/in/atulgawande",
        location: "Boston, MA",
        connectionDegree: "3rd+"
      },
      {
        id: "eric-topol",
        name: "Eric Topol",
        headline: "Director of Scripps Translational Science Institute",
        industry: "Healthcare",
        followerCount: 285000,
        engagementRate: 7.2,
        recentPostTopics: ["digital medicine", "AI in healthcare", "genomics", "medical research", "precision medicine"],
        profileUrl: "https://linkedin.com/in/erictopol",
        location: "La Jolla, CA",
        connectionDegree: "3rd+"
      },

      // Real Estate
      {
        id: "barbara-corcoran",
        name: "Barbara Corcoran",
        headline: "Real Estate Mogul | Shark Tank Investor",
        industry: "Real Estate",
        followerCount: 890000,
        engagementRate: 5.9,
        recentPostTopics: ["real estate investing", "entrepreneurship", "business building", "negotiation", "leadership"],
        profileUrl: "https://linkedin.com/in/barbaracorcoran",
        location: "New York, NY",
        connectionDegree: "3rd+"
      },
      {
        id: "ryan-serhant",
        name: "Ryan Serhant",
        headline: "CEO of SERHANT. | Real Estate Broker",
        industry: "Real Estate",
        followerCount: 520000,
        engagementRate: 6.4,
        recentPostTopics: ["luxury real estate", "sales techniques", "personal branding", "team building", "market trends"],
        profileUrl: "https://linkedin.com/in/ryanserhant",
        location: "New York, NY",
        connectionDegree: "2nd"
      },

      // Consulting & Strategy
      {
        id: "tom-peters",
        name: "Tom Peters",
        headline: "Management Guru | Author of In Search of Excellence",
        industry: "Consulting",
        followerCount: 380000,
        engagementRate: 4.9,
        recentPostTopics: ["management excellence", "customer service", "innovation", "leadership development", "organizational change"],
        profileUrl: "https://linkedin.com/in/tompeters",
        location: "Boston, MA",
        connectionDegree: "3rd+"
      },
      {
        id: "whitney-johnson",
        name: "Whitney Johnson",
        headline: "CEO of Disruption Advisors | Thinkers50",
        industry: "Consulting",
        followerCount: 195000,
        engagementRate: 7.1,
        recentPostTopics: ["personal disruption", "career development", "innovation", "talent development", "S-curve learning"],
        profileUrl: "https://linkedin.com/in/whitneyjohnson",
        location: "Lexington, VA",
        connectionDegree: "2nd"
      },

      // Emerging Leaders & Entrepreneurs
      {
        id: "garyvee",
        name: "Gary Vaynerchuk",
        headline: "Chairman of VaynerX | CEO of VaynerMedia",
        industry: "Marketing",
        followerCount: 3800000,
        engagementRate: 4.2,
        recentPostTopics: ["digital marketing", "social media", "entrepreneurship", "NFTs", "personal branding"],
        profileUrl: "https://linkedin.com/in/garyvaynerchuk",
        location: "New York, NY",
        connectionDegree: "3rd+"
      },
      {
        id: "simon-sinek",
        name: "Simon Sinek",
        headline: "Author of Start With Why | Leadership Expert",
        industry: "Leadership",
        followerCount: 4200000,
        engagementRate: 5.8,
        recentPostTopics: ["leadership", "purpose", "why", "team building", "organizational culture"],
        profileUrl: "https://linkedin.com/in/simonsinek",
        location: "New York, NY",
        connectionDegree: "3rd+"
      },
      {
        id: "brene-brown",
        name: "Brené Brown",
        headline: "Research Professor | Author | Speaker",
        industry: "Leadership",
        followerCount: 2100000,
        engagementRate: 8.9,
        recentPostTopics: ["vulnerability", "courage", "shame resilience", "leadership", "empathy"],
        profileUrl: "https://linkedin.com/in/brenebrown",
        location: "Houston, TX",
        connectionDegree: "3rd+"
      },

      // Industry-Specific Rising Stars
      {
        id: "alex-hormozi",
        name: "Alex Hormozi",
        headline: "Founder of Acquisition.com | Business Builder",
        industry: "Business",
        followerCount: 680000,
        engagementRate: 9.2,
        recentPostTopics: ["business acquisition", "scaling", "offer creation", "value delivery", "entrepreneur mindset"],
        profileUrl: "https://linkedin.com/in/alexhormozi",
        location: "Las Vegas, NV",
        connectionDegree: "2nd"
      },
      {
        id: "sahil-bloom",
        name: "Sahil Bloom",
        headline: "Content Creator | Investor | Entrepreneur",
        industry: "Finance",
        followerCount: 420000,
        engagementRate: 8.7,
        recentPostTopics: ["investing", "personal finance", "mental models", "decision making", "wealth building"],
        profileUrl: "https://linkedin.com/in/sahilbloom",
        location: "New York, NY",
        connectionDegree: "2nd"
      }
    ];

    // Filter by industry and interests
    return allLeaders.filter(leader => {
      // Primary industry match
      const industryMatch = leader.industry.toLowerCase().includes(industry.toLowerCase()) ||
                           industry.toLowerCase().includes(leader.industry.toLowerCase());
      
      // Secondary: cross-industry relevance
      const crossIndustryRelevance = this.checkCrossIndustryRelevance(leader, industry);
      
      // Interest alignment
      const interestMatch = interests.length === 0 || interests.some(interest =>
        leader.recentPostTopics.some(topic =>
          topic.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(topic.toLowerCase())
        )
      );

      return (industryMatch || crossIndustryRelevance) && interestMatch;
    });
  }

  private checkCrossIndustryRelevance(leader: LinkedInProfile, targetIndustry: string): boolean {
    const crossIndustryMap: Record<string, string[]> = {
      'technology': ['Marketing', 'Sales', 'Finance', 'Leadership'],
      'sales': ['Technology', 'Marketing', 'Business', 'Leadership'],
      'marketing': ['Technology', 'Sales', 'Business', 'Leadership'],
      'finance': ['Technology', 'Business', 'Leadership'],
      'healthcare': ['Technology', 'Leadership'],
      'real estate': ['Sales', 'Marketing', 'Finance', 'Leadership'],
      'consulting': ['Leadership', 'Business', 'Technology'],
      'business': ['Technology', 'Sales', 'Marketing', 'Finance', 'Leadership']
    };

    const relevantIndustries = crossIndustryMap[targetIndustry.toLowerCase()] || [];
    return relevantIndustries.includes(leader.industry);
  }

  private getBestPostingTime(industry: string): string {
    const industryTimes: Record<string, string> = {
      'technology': '9:00 AM PST',
      'finance': '8:00 AM EST',
      'healthcare': '7:00 AM EST',
      'marketing': '10:00 AM EST',
      'default': '9:00 AM local time'
    };

    return industryTimes[industry.toLowerCase()] || industryTimes.default;
  }

  private estimateReach(targetAudience: string): number {
    // Simple estimation based on audience size
    const audienceSizes: Record<string, number> = {
      'executives': 5000,
      'entrepreneurs': 3000,
      'sales professionals': 4000,
      'marketers': 3500,
      'general': 2000
    };

    return audienceSizes[targetAudience.toLowerCase()] || audienceSizes.general;
  }

  private getIndustryHashtags(industry: string): string[] {
    const industryHashtags: Record<string, string[]> = {
      'technology': ['#TechTrends', '#Innovation', '#DigitalTransformation', '#AI', '#StartupLife'],
      'sales': ['#SalesStrategy', '#B2BSales', '#SalesLeadership', '#CRM', '#SalesSuccess'],
      'marketing': ['#DigitalMarketing', '#ContentMarketing', '#MarketingStrategy', '#GrowthHacking', '#BrandBuilding'],
      'finance': ['#FinTech', '#Investment', '#Finance', '#Economics', '#BusinessStrategy'],
      'default': ['#Business', '#Leadership', '#Professional', '#Growth', '#Success']
    };

    return industryHashtags[industry.toLowerCase()] || industryHashtags.default;
  }

  private calculateContentMix(contentMix: ContentStrategy['contentMix'], totalPosts: number): Record<string, number> {
    const total = Object.values(contentMix).reduce((sum, value) => sum + value, 0);
    
    return {
      'thought-leadership': Math.round((contentMix.thoughtLeadership / total) * totalPosts),
      'industry-insights': Math.round((contentMix.industryInsights / total) * totalPosts),
      'personal-story': Math.round((contentMix.personalStories / total) * totalPosts),
      'tips-advice': Math.round((contentMix.tipsAdvice / total) * totalPosts),
      'trending-topics': Math.round((contentMix.trendingTopics / total) * totalPosts)
    };
  }

  private getOptimalPostingDate(industry: string, postIndex: number, timeframe: 'week' | 'month'): Date {
    const startDate = new Date();
    const optimalDays = [1, 2, 3, 4]; // Monday to Thursday are typically best for LinkedIn
    
    if (timeframe === 'week') {
      const dayIndex = postIndex % optimalDays.length;
      const targetDay = optimalDays[dayIndex];
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + targetDay);
      return date;
    } else {
      // Spread posts throughout the month on optimal days
      const weeksInMonth = 4;
      const week = Math.floor(postIndex / optimalDays.length) % weeksInMonth;
      const dayInWeek = postIndex % optimalDays.length;
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + (week * 7) + optimalDays[dayInWeek]);
      return date;
    }
  }

  private checkContentBalance(actual: Record<string, number>, target: ContentStrategy['contentMix']): boolean {
    // Check if actual content mix is within 20% of target
    const tolerance = 0.2;
    const totalActual = Object.values(actual).reduce((sum, value) => sum + value, 0);
    const totalTarget = Object.values(target).reduce((sum, value) => sum + value, 0);
    
    return Object.entries(target).every(([key, targetValue]) => {
      const actualValue = actual[key] || 0;
      const targetRatio = targetValue / totalTarget;
      const actualRatio = actualValue / totalActual;
      return Math.abs(targetRatio - actualRatio) <= tolerance;
    });
  }

  private getContentRecommendations(strategy: ContentStrategy, actual: Record<string, number>): string[] {
    const recommendations: string[] = [];
    const totalActual = Object.values(actual).reduce((sum, value) => sum + value, 0);
    
    // Check for content gaps
    if (actual['thought-leadership'] / totalActual < 0.3) {
      recommendations.push("Consider adding more thought leadership content to establish authority");
    }
    
    if (actual['personal-story'] / totalActual < 0.15) {
      recommendations.push("Share more personal stories to build authentic connections");
    }
    
    if (strategy.postingFrequency < 3) {
      recommendations.push("Consider posting more frequently (3-5 times per week) for better engagement");
    }
    
    return recommendations;
  }
}

export default LinkedInContentGenerator; 