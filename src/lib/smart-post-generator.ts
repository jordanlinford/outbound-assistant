interface PostGenerationContext {
  industry: string;
  experience: string;
  targetAudience: string;
  personalStyle: string;
  contentIdea?: string;
  promptType?: string;
  variables?: Record<string, string>;
}

interface GeneratedPost {
  content: string;
  hashtags: string[];
  engagementHooks: string[];
  callToAction: string;
  bestTimeToPost: string;
  estimatedReach: number;
  postType: 'text' | 'carousel' | 'poll' | 'video-script';
}

export class SmartPostGenerator {
  private industryInsights = {
    technology: {
      trends: ['AI automation', 'remote work tech', 'cybersecurity', 'cloud migration', 'data analytics'],
      challenges: ['technical debt', 'scaling issues', 'talent shortage', 'security threats'],
      opportunities: ['digital transformation', 'process automation', 'new market entry'],
      hashtags: ['#TechTrends', '#Innovation', '#DigitalTransformation', '#AI', '#StartupLife']
    },
    sales: {
      trends: ['social selling', 'AI-powered CRM', 'video prospecting', 'account-based selling'],
      challenges: ['lead qualification', 'pipeline management', 'quota pressure', 'buyer education'],
      opportunities: ['relationship building', 'consultative selling', 'customer success'],
      hashtags: ['#SalesStrategy', '#B2BSales', '#SalesLeadership', '#CRM', '#SalesSuccess']
    },
    marketing: {
      trends: ['content marketing', 'influencer partnerships', 'marketing automation', 'personalization'],
      challenges: ['attribution tracking', 'content creation', 'audience engagement', 'ROI measurement'],
      opportunities: ['brand building', 'community growth', 'thought leadership'],
      hashtags: ['#DigitalMarketing', '#ContentMarketing', '#MarketingStrategy', '#GrowthHacking', '#BrandBuilding']
    },
    finance: {
      trends: ['fintech disruption', 'digital payments', 'blockchain adoption', 'robo-advisors'],
      challenges: ['regulatory compliance', 'risk management', 'digital transformation', 'customer trust'],
      opportunities: ['financial inclusion', 'process automation', 'data-driven decisions'],
      hashtags: ['#FinTech', '#Investment', '#Finance', '#Economics', '#BusinessStrategy']
    },
    healthcare: {
      trends: ['telemedicine', 'AI diagnostics', 'patient experience', 'digital health records'],
      challenges: ['regulatory compliance', 'data privacy', 'cost management', 'staff shortages'],
      opportunities: ['preventive care', 'personalized medicine', 'efficiency gains'],
      hashtags: ['#HealthTech', '#Healthcare', '#DigitalHealth', '#PatientCare', '#MedicalInnovation']
    },
    'real estate': {
      trends: ['virtual tours', 'PropTech', 'sustainable buildings', 'remote work impact'],
      challenges: ['market volatility', 'financing options', 'regulatory changes', 'competition'],
      opportunities: ['investment opportunities', 'technology adoption', 'market expansion'],
      hashtags: ['#RealEstate', '#PropTech', '#Investment', '#PropertyManagement', '#RealEstateInvesting']
    },
    consulting: {
      trends: ['digital consulting', 'remote delivery', 'specialized expertise', 'outcome-based pricing'],
      challenges: ['client acquisition', 'project scope creep', 'talent retention', 'market saturation'],
      opportunities: ['niche specialization', 'thought leadership', 'strategic partnerships'],
      hashtags: ['#Consulting', '#BusinessStrategy', '#Management', '#Leadership', '#ProblemSolving']
    }
  };

  private postStructures = {
    'thought-leadership': {
      hooks: [
        'Unpopular opinion:',
        'Here\'s what everyone gets wrong about',
        'After X years in [industry], I\'ve learned that',
        'The biggest myth in [industry] is',
        'Most people think [topic] is about X, but it\'s actually about Y'
      ],
      structure: (context: PostGenerationContext, hook: string, content: string) => {
        return `${hook} ${content}

Here's why this matters:

• [Key insight 1 based on experience]
• [Key insight 2 with specific example]
• [Key insight 3 with actionable advice]

The bottom line? [Clear conclusion that challenges conventional thinking]

What's your take on this? Have you seen similar patterns in your experience?`;
      }
    },
    'personal-story': {
      hooks: [
        'I made a $X mistake so you don\'t have to.',
        'This failure taught me more than any success.',
        'I almost quit [industry] until this happened:',
        'The worst advice I ever followed:',
        'Here\'s the mistake that changed my career:'
      ],
      structure: (context: PostGenerationContext, hook: string, content: string) => {
        return `${hook}

${content}

What I learned:
• [Specific lesson 1]
• [Specific lesson 2] 
• [Specific lesson 3]

If you're facing something similar, here's my advice:
[Actionable recommendation]

What's the biggest lesson you've learned from a professional setback?`;
      }
    },
    'tips-advice': {
      hooks: [
        'X things I wish I knew when starting in [industry]:',
        'Stop doing these X things in [industry]:',
        'X simple changes that transformed my [business/career]:',
        'The X-step framework that changed everything:',
        'X mistakes every [target audience] makes:'
      ],
      structure: (context: PostGenerationContext, hook: string, content: string) => {
        return `${hook}

${content}

Save this post if you found it helpful!

Which of these resonates most with your experience? Drop a comment below 👇`;
      }
    },
    'industry-insights': {
      hooks: [
        'X% of [industry] professionals don\'t know this:',
        'New data reveals something surprising about [industry]:',
        'This trend is quietly reshaping [industry]:',
        'The numbers don\'t lie - [industry] is changing:',
        'Research shows [industry] leaders are missing this:'
      ],
      structure: (context: PostGenerationContext, hook: string, content: string) => {
        return `${hook}

${content}

What this means for you:
• [Implication 1]
• [Implication 2]
• [Implication 3]

Are you seeing this trend in your organization? How are you adapting?`;
      }
    },
    'trending-topics': {
      hooks: [
        'Everyone\'s talking about [topic], but here\'s what they\'re missing:',
        'Hot take on [trending topic]:',
        'While everyone focuses on [obvious angle], the real opportunity is:',
        'The [trending topic] conversation is missing this crucial point:',
                 '[Trending topic] isn\'t just a trend - it\'s a fundamental shift.'
      ],
      structure: (context: PostGenerationContext, hook: string, content: string) => {
        return `${hook}

${content}

My prediction: [Bold prediction about where this trend is heading]

What's your take? Are you bullish or bearish on this trend?`;
      }
    }
  };

  generatePost(context: PostGenerationContext): GeneratedPost {
    if (context.contentIdea) {
      return this.generateFromContentIdea(context);
    } else {
      return this.generateFromTemplate(context);
    }
  }

  private generateFromContentIdea(context: PostGenerationContext): GeneratedPost {
    const idea = context.contentIdea!;
    const industry = context.industry.toLowerCase();
    const insights = this.industryInsights[industry] || this.industryInsights.technology;
    
    // Analyze the content idea
    const isLink = idea.includes('http') || idea.includes('www.');
    const isPersonalExperience = idea.toLowerCase().includes('my ') || idea.toLowerCase().includes('i ') || idea.toLowerCase().includes('lesson');
    const isTrend = idea.toLowerCase().includes('trend') || idea.toLowerCase().includes('changing') || idea.toLowerCase().includes('future');
    const isAdvice = idea.toLowerCase().includes('tip') || idea.toLowerCase().includes('advice') || idea.toLowerCase().includes('how to');

    let postContent = '';
    let postType: 'thought-leadership' | 'personal-story' | 'tips-advice' | 'industry-insights' | 'trending-topics' = 'thought-leadership';

    if (isPersonalExperience) {
      postType = 'personal-story';
      postContent = this.generatePersonalStoryPost(idea, context, insights);
    } else if (isAdvice) {
      postType = 'tips-advice';
      postContent = this.generateAdvicePost(idea, context, insights);
    } else if (isTrend) {
      postType = 'trending-topics';
      postContent = this.generateTrendPost(idea, context, insights);
    } else if (isLink) {
      postType = 'industry-insights';
      postContent = this.generateLinkPost(idea, context, insights);
    } else {
      postType = 'thought-leadership';
      postContent = this.generateThoughtLeadershipPost(idea, context, insights);
    }

    return {
      content: postContent,
      hashtags: this.generateHashtags(industry, postType, insights),
      engagementHooks: this.getEngagementHooks(postType),
      callToAction: this.generateCallToAction(postType),
      bestTimeToPost: this.getBestPostingTime(industry),
      estimatedReach: this.estimateReach(context.targetAudience, context.experience),
      postType: 'text'
    };
  }

  private generatePersonalStoryPost(idea: string, context: PostGenerationContext, insights: any): string {
    const hooks = this.postStructures['personal-story'].hooks;
    const hook = hooks[Math.floor(Math.random() * hooks.length)];
    
    return `${hook.replace('[industry]', context.industry)}

${idea}

Here's what this experience taught me:

• Every setback contains valuable lessons if you're willing to look for them
• The most growth happens outside your comfort zone
• Building resilience is more valuable than avoiding failure
• Sharing struggles helps others feel less alone in their journey

The key is to extract the lesson and apply it moving forward.

If you're going through a similar challenge, remember: this too shall pass, and you'll be stronger for it.

What's the most valuable lesson you've learned from a professional challenge?`;
  }

  private generateAdvicePost(idea: string, context: PostGenerationContext, insights: any): string {
    const relevantTrends = insights.trends.slice(0, 3);
    const relevantChallenges = insights.challenges.slice(0, 3);
    
    return `5 game-changing insights about: "${idea}"

Based on my experience in ${context.industry}:

1. Start small, but think big
   → Focus on one key area first, then expand

2. Measure what matters
   → Track metrics that actually drive business outcomes

3. Invest in relationships
   → Your network is your net worth, especially in ${context.industry}

4. Stay ahead of trends
   → Keep an eye on: ${relevantTrends.join(', ')}

5. Learn from failures fast
   → Every mistake is data for better decisions

Bonus tip: ${this.getIndustrySpecificAdvice(context.industry)}

Save this post for later! 📌

Which tip resonates most with your experience?`;
  }

  private generateTrendPost(idea: string, context: PostGenerationContext, insights: any): string {
    return `🔮 My take on: "${idea}"

While everyone's focused on the obvious implications, here's what I think most people are missing:

The real transformation isn't in the technology itself—it's in how it's changing human behavior and expectations.

In ${context.industry}, I'm seeing:
• Faster decision-making cycles
• Higher demand for personalization
• Shift toward outcome-based solutions

This creates 3 key opportunities:
1. Businesses that adapt quickly will gain competitive advantage
2. New market segments will emerge for early movers
3. Traditional approaches will need complete rethinking

My prediction: Companies that embrace this shift now will dominate their markets within 2-3 years.

What trends are you seeing in your industry? Are you positioned to take advantage?`;
  }

  private generateLinkPost(idea: string, context: PostGenerationContext, insights: any): string {
    return `💡 Interesting read: ${idea}

This article highlights something I've been seeing in ${context.industry} lately.

Key takeaways that stood out to me:

• The data confirms what many of us suspected
• There's a clear shift in how ${context.targetAudience} approach this challenge
• The implications go beyond what most people realize

What this means for professionals in ${context.industry}:

→ We need to rethink our approach to [relevant challenge]
→ Early adopters will have a significant advantage
→ The old playbook isn't working anymore

I'm curious - are you seeing similar patterns in your organization?

What's your biggest takeaway from developments like this?`;
  }

  private generateThoughtLeadershipPost(idea: string, context: PostGenerationContext, insights: any): string {
    const hooks = this.postStructures['thought-leadership'].hooks;
    const hook = hooks[Math.floor(Math.random() * hooks.length)];
    
    return `${hook.replace('[industry]', context.industry).replace('[topic]', idea)}

After ${this.getExperienceYears(context.experience)} in ${context.industry}, here's what I've learned:

"${idea}" isn't just a buzzword—it's a fundamental shift that's reshaping how we work.

The companies that get this right are:
• Focusing on outcomes, not activities
• Investing in their people's growth
• Building systems that scale with demand

The ones that don't? They're falling behind fast.

Here's my advice: Start experimenting now. Don't wait for perfect conditions.

The cost of inaction is higher than the risk of trying something new.

What's your experience been? Are you seeing similar changes in your industry?`;
  }

  private generateFromTemplate(context: PostGenerationContext): GeneratedPost {
    // This would use the existing template logic
    const industry = context.industry.toLowerCase();
    const insights = this.industryInsights[industry] || this.industryInsights.technology;
    
    return {
      content: "Template-based post generation - implement based on selected prompt",
      hashtags: insights.hashtags,
      engagementHooks: ['Engaging hook', 'Personal experience', 'Clear value proposition'],
      callToAction: 'What\'s your experience with this?',
      bestTimeToPost: this.getBestPostingTime(industry),
      estimatedReach: this.estimateReach(context.targetAudience, context.experience),
      postType: 'text'
    };
  }

  private generateHashtags(industry: string, postType: string, insights: any): string[] {
    const baseHashtags = insights.hashtags || ['#Business', '#Leadership', '#Professional'];
    const typeHashtags = {
      'thought-leadership': ['#ThoughtLeadership', '#Innovation', '#Future'],
      'personal-story': ['#LessonsLearned', '#Growth', '#Resilience'],
      'tips-advice': ['#Tips', '#Advice', '#BestPractices'],
      'industry-insights': ['#Insights', '#Data', '#Trends'],
      'trending-topics': ['#Trending', '#FutureOfWork', '#Disruption']
    };
    
    return [...baseHashtags.slice(0, 3), ...typeHashtags[postType].slice(0, 2)];
  }

  private getEngagementHooks(postType: string): string[] {
    const hooks = {
      'thought-leadership': ['Contrarian perspective', 'Industry experience', 'Bold prediction'],
      'personal-story': ['Vulnerable sharing', 'Relatable struggle', 'Clear lesson'],
      'tips-advice': ['Actionable insights', 'Numbered list', 'Save-worthy content'],
      'industry-insights': ['Data-driven', 'Trend analysis', 'Future implications'],
      'trending-topics': ['Hot take', 'Unique angle', 'Prediction']
    };
    
    return hooks[postType] || hooks['thought-leadership'];
  }

  private generateCallToAction(postType: string): string {
    const ctas = {
      'thought-leadership': 'What\'s your take on this trend?',
      'personal-story': 'What\'s the biggest lesson you\'ve learned from failure?',
      'tips-advice': 'Which tip will you implement first?',
      'industry-insights': 'Are you seeing similar patterns in your industry?',
      'trending-topics': 'What\'s your prediction for where this is heading?'
    };
    
    return ctas[postType] || 'What are your thoughts?';
  }

  private getBestPostingTime(industry: string): string {
    const times = {
      'technology': '9:00 AM PST',
      'finance': '8:00 AM EST',
      'healthcare': '7:00 AM EST',
      'marketing': '10:00 AM EST',
      'sales': '8:30 AM local time',
      'real estate': '9:30 AM local time',
      'consulting': '9:00 AM EST'
    };
    
    return times[industry] || '9:00 AM local time';
  }

  private estimateReach(audience: string, experience: string): number {
    const baseReach = {
      'executives': 5000,
      'entrepreneurs': 3500,
      'sales professionals': 4000,
      'marketers': 3800,
      'consultants': 3200,
      'small business owners': 2800
    };
    
    const experienceMultiplier = {
      'entry-level': 0.7,
      'mid-level': 1.0,
      'senior-level': 1.4,
      'executive': 1.8
    };
    
    const base = baseReach[audience] || 2500;
    const multiplier = experienceMultiplier[experience] || 1.0;
    
    return Math.round(base * multiplier);
  }

  private getExperienceYears(experience: string): string {
    const years = {
      'entry-level': '2+ years',
      'mid-level': '5+ years',
      'senior-level': '10+ years',
      'executive': '15+ years'
    };
    
    return years[experience] || '5+ years';
  }

  private getIndustrySpecificAdvice(industry: string): string {
    const advice = {
      'technology': 'Always be learning - tech changes fast, but fundamentals remain',
      'sales': 'Listen more than you talk - understanding beats persuasion',
      'marketing': 'Test everything, assume nothing - data trumps opinions',
      'finance': 'Risk management is wealth preservation - protect before you grow',
      'healthcare': 'Patient outcomes drive everything - never lose sight of the human element',
      'real estate': 'Location insights beat market timing - know your local market deeply',
      'consulting': 'Solve the real problem, not the stated problem - dig deeper'
    };
    
    return advice[industry] || 'Focus on providing value first - everything else follows';
  }
}

export default SmartPostGenerator; 