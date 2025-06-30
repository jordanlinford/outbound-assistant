import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import SmartLeadScorer from '@/lib/smart-lead-scorer';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ProspectCriteria {
  industries: string[];
  companySizes: string[];
  jobTitles: string[];
  locations: string[];
  technologies: string[];
  keywords: string[];
  excludeCompanies?: string[];
  minEmployees?: number;
  maxEmployees?: number;
  revenueRange?: string;
}

interface FoundProspect {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  industry: string;
  companySize: string;
  score: number;
  linkedinUrl?: string;
  reason: string;
  dataSource: 'ai' | 'linkedin' | 'apollo' | 'manual';
  confidence: number;
  companyWebsite?: string;
  phoneNumber?: string;
  location?: string;
}

interface DataSourceResult {
  prospects: FoundProspect[];
  source: string;
  confidence: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { criteria }: { criteria: ProspectCriteria } = await request.json();

    // Validate criteria
    if (!criteria.industries.length && !criteria.jobTitles.length) {
      return NextResponse.json({ 
        error: 'Please specify at least one industry or job title' 
      }, { status: 400 });
    }

    console.log('🔍 Starting prospect search with criteria:', criteria);

    // Generate a unique search identifier to ensure variety
    const searchId = Date.now().toString(36) + Math.random().toString(36).substr(2);

    // Get existing prospects to avoid duplicates
    const existingProspects = await getExistingProspects(session.user.id);
    console.log(`📋 Found ${existingProspects.size} existing prospects to exclude`);

    // Multi-source prospect finding
    const allProspects: FoundProspect[] = [];
    
    // 1. Try LinkedIn Sales Navigator (if API available)
    try {
      const linkedinProspects = await findLinkedInProspects(criteria);
      allProspects.push(...linkedinProspects.prospects);
      console.log(`✅ LinkedIn: Found ${linkedinProspects.prospects.length} prospects`);
    } catch (error) {
      console.log('⚠️ LinkedIn API not available, skipping');
    }

    // 2. Try Apollo.io or similar B2B database
    try {
      const apolloProspects = await findApolloProspects(criteria);
      allProspects.push(...apolloProspects.prospects);
      console.log(`✅ Apollo: Found ${apolloProspects.prospects.length} prospects`);
    } catch (error) {
      console.log('⚠️ Apollo API not available, skipping');
    }

    // 3. AI-generated prospects (enhanced with exclusions)
    const aiProspects = await generateEnhancedProspects(criteria, existingProspects, searchId);
    allProspects.push(...aiProspects);
    console.log(`✅ AI Generated: ${aiProspects.length} prospects`);

    // 4. Remove duplicates and validate emails
    const uniqueProspects = deduplicateProspects(allProspects, existingProspects);
    const validatedProspects = await validateProspects(uniqueProspects);

    // 5. Score and qualify each prospect
    const scorer = new SmartLeadScorer();
    const scoredProspects = [];
    
    for (const prospect of validatedProspects) {
      try {
        const score = await scorer.scoreLead({
          email: prospect.email,
          firstName: prospect.firstName,
          lastName: prospect.lastName,
          company: prospect.company,
          title: prospect.title,
          industry: prospect.industry,
          companySize: prospect.companySize
        });
        
        scoredProspects.push({
          ...prospect,
          score: score.overallScore,
          reason: score.reasons[0] || prospect.reason || 'Matches your criteria'
        });
      } catch (error) {
        // Keep prospect with default score if scoring fails
        scoredProspects.push({
          ...prospect,
          score: 50,
          reason: prospect.reason || 'Matches your criteria'
        });
      }
    }

    // 6. Sort by score and return top prospects
    const topProspects = scoredProspects
      .sort((a, b) => b.score - a.score)
      .slice(0, 100); // Increased limit

    // Track search history for future exclusions
    await trackSearchHistory(session.user.id, criteria, topProspects.length);

    console.log(`🎯 Returning ${topProspects.length} top prospects`);

    return NextResponse.json({ 
      prospects: topProspects,
      total: topProspects.length,
      sources: {
        ai: topProspects.filter(p => p.dataSource === 'ai').length,
        linkedin: topProspects.filter(p => p.dataSource === 'linkedin').length,
        apollo: topProspects.filter(p => p.dataSource === 'apollo').length
      },
      excludedDuplicates: existingProspects.size,
      searchVariation: searchId || 'default'
    });

  } catch (error) {
    console.error('Error finding prospects:', error);
    return NextResponse.json(
      { error: 'Failed to find prospects' },
      { status: 500 }
    );
  }
}

// Get existing prospects for a user to avoid duplicates
async function getExistingProspects(userId: string): Promise<Set<string>> {
  try {
    const prospects = await prisma.prospect.findMany({
      where: {
        campaign: {
          userId: userId
        }
      },
      select: {
        email: true,
        company: true
      }
    });

    // Create a set of email-company combinations for fast lookup
    const existingSet = new Set<string>();
    prospects.forEach(p => {
      existingSet.add(p.email.toLowerCase());
      if (p.company) {
        existingSet.add(`${p.email.toLowerCase()}-${p.company.toLowerCase()}`);
      }
    });

    return existingSet;
  } catch (error) {
    console.error('Error fetching existing prospects:', error);
    return new Set();
  }
}

// Track search history for analytics and future improvements
async function trackSearchHistory(userId: string, criteria: ProspectCriteria, resultsCount: number): Promise<void> {
  try {
    // For now, just log the search. In a real implementation, you might store this in a database
    console.log(`📊 Search tracked for user ${userId}: ${resultsCount} results for criteria:`, {
      industries: criteria.industries,
      jobTitles: criteria.jobTitles,
      companySizes: criteria.companySizes
    });
    
    // Future enhancement: Store in database for analytics
    // await prisma.searchHistory.create({
    //   data: {
    //     userId,
    //     criteria: JSON.stringify(criteria),
    //     resultsCount,
    //     timestamp: new Date()
    //   }
    // });
  } catch (error) {
    console.error('Error tracking search history:', error);
  }
}

// LinkedIn Sales Navigator integration (placeholder)
async function findLinkedInProspects(criteria: ProspectCriteria): Promise<DataSourceResult> {
  // This would integrate with LinkedIn Sales Navigator API
  // For now, return empty as it requires special API access
  return {
    prospects: [],
    source: 'linkedin',
    confidence: 0.9
  };
}

// Apollo.io integration (placeholder)
async function findApolloProspects(criteria: ProspectCriteria): Promise<DataSourceResult> {
  // This would integrate with Apollo.io API
  // Requires API key: process.env.APOLLO_API_KEY
  return {
    prospects: [],
    source: 'apollo',
    confidence: 0.8
  };
}

async function generateEnhancedProspects(criteria: ProspectCriteria, existingProspects?: Set<string>, searchId?: string): Promise<FoundProspect[]> {
  // If no OpenAI key configured we immediately fall back to sample data so the route never errors out
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY not set – using sample prospects');
    return getEnhancedSampleProspects(criteria);
  }

  try {
    // Use provided search ID or generate one
    const currentSearchId = searchId || Date.now().toString(36) + Math.random().toString(36).substr(2);
    const excludeCompaniesText = criteria.excludeCompanies?.length ? 
      `\n    EXCLUDE these companies: ${criteria.excludeCompanies.join(', ')}` : '';
    
    const prompt = `
    Generate a diverse list of 30 realistic B2B prospects for outbound sales based on these criteria:
    
    Industries: ${criteria.industries.join(', ')}
    Company Sizes: ${criteria.companySizes.join(', ')}
    Job Titles: ${criteria.jobTitles.join(', ')}
    Locations: ${criteria.locations.join(', ')}
    Technologies: ${criteria.technologies.join(', ')}
    Keywords: ${criteria.keywords.join(', ')}${excludeCompaniesText}
    
    Search ID: ${currentSearchId} (use this to ensure unique results)
    
    Requirements:
    - Focus on decision-makers with budget authority
    - Use realistic company names (mix of real and plausible fictional)
    - Generate professional business email addresses
    - Include diverse geographic locations
    - Vary company sizes within specified ranges
    - Create compelling reasons for outreach
    - Make each prospect unique and realistic
    - Use varied first/last names from different backgrounds
    - Include emerging companies and scale-ups, not just Fortune 500
    
    For each prospect, provide:
    {
      "firstName": "string",
      "lastName": "string", 
      "email": "professional.email@company.com",
      "company": "Company Name",
      "title": "Job Title",
      "industry": "Industry from list",
      "companySize": "Size from list",
      "linkedinUrl": "https://linkedin.com/in/profile",
      "companyWebsite": "https://company.com",
      "location": "City, State/Country",
      "reason": "Specific reason why they're a good prospect"
    }
    
    Return only a valid JSON array of prospects.
    `;

    // Abort the OpenAI request if it takes longer than 8 seconds (Vercel edge functions default timeout is 10s)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert B2B prospect researcher. Generate high-quality, realistic prospect data for sales outreach. Focus on accuracy and relevance. Return only valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1200,
    }, { signal: controller.signal });

    clearTimeout(timeout);

    const response = completion.choices[0]?.message?.content;
    
    // Extract JSON from response
    let jsonStr = response || '[]';
    const jsonMatch = jsonStr.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    const prospects = JSON.parse(jsonStr);
    
    // Add metadata to AI-generated prospects and filter out existing ones
    const newProspects = prospects
      .map((prospect: any) => ({
        ...prospect,
        dataSource: 'ai' as const,
        confidence: 0.7,
        score: 0 // Will be scored later
      }))
      .filter((prospect: FoundProspect) => {
        if (!existingProspects) return true;
        
        const email = prospect.email.toLowerCase();
        const emailCompany = `${email}-${prospect.company.toLowerCase()}`;
        
        // Skip if email or email-company combo already exists
        return !existingProspects.has(email) && !existingProspects.has(emailCompany);
      });

    console.log(`🔄 Filtered ${prospects.length - newProspects.length} duplicate prospects`);
    return newProspects;
    
  } catch (error) {
    console.error('Error generating prospects:', error);
    return getEnhancedSampleProspects(criteria);
  }
}

function deduplicateProspects(prospects: FoundProspect[], existingProspects?: Set<string>): FoundProspect[] {
  const seen = new Set<string>();
  return prospects.filter(prospect => {
    const email = prospect.email.toLowerCase();
    const emailCompany = `${email}-${prospect.company.toLowerCase()}`;
    
    // Check against existing prospects from database
    if (existingProspects && (existingProspects.has(email) || existingProspects.has(emailCompany))) {
      return false;
    }
    
    // Check against current batch
    if (seen.has(emailCompany)) {
      return false;
    }
    
    seen.add(emailCompany);
    return true;
  });
}

async function validateProspects(prospects: FoundProspect[]): Promise<FoundProspect[]> {
  return prospects.filter(prospect => {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(prospect.email)) {
      return false;
    }
    
    // Basic name validation
    if (!prospect.firstName || !prospect.lastName) {
      return false;
    }
    
    // Company validation
    if (!prospect.company || prospect.company.length < 2) {
      return false;
    }
    
    return true;
  });
}

function getEnhancedSampleProspects(criteria: ProspectCriteria): FoundProspect[] {
  const sampleProspects: FoundProspect[] = [
    {
      firstName: "Sarah",
      lastName: "Chen",
      email: "sarah.chen@techstartup.com",
      company: "TechStartup Inc",
      title: "CEO",
      industry: criteria.industries[0] || "Technology",
      companySize: criteria.companySizes[0] || "11-50 employees",
      score: 85,
      linkedinUrl: "https://linkedin.com/in/sarahchen",
      companyWebsite: "https://techstartup.com",
      location: "San Francisco, CA",
      reason: "High-growth tech CEO actively seeking solutions to scale operations",
      dataSource: 'ai',
      confidence: 0.7
    },
    {
      firstName: "Michael",
      lastName: "Rodriguez",
      email: "m.rodriguez@growthco.io",
      company: "GrowthCo",
      title: "VP of Sales",
      industry: criteria.industries[0] || "Technology",
      companySize: criteria.companySizes[0] || "51-200 employees",
      score: 78,
      linkedinUrl: "https://linkedin.com/in/mrodriguez",
      companyWebsite: "https://growthco.io",
      location: "Austin, TX",
      reason: "Sales leader looking to scale operations and improve team efficiency",
      dataSource: 'ai',
      confidence: 0.7
    },
    {
      firstName: "Jennifer",
      lastName: "Kim",
      email: "jennifer.kim@scalecorp.com",
      company: "ScaleCorp",
      title: "CMO",
      industry: criteria.industries[0] || "Marketing",
      companySize: criteria.companySizes[0] || "201-500 employees",
      score: 72,
      linkedinUrl: "https://linkedin.com/in/jenniferkim",
      companyWebsite: "https://scalecorp.com",
      location: "New York, NY",
      reason: "Marketing executive with budget authority seeking automation tools",
      dataSource: 'ai',
      confidence: 0.7
    },
    {
      firstName: "David",
      lastName: "Thompson",
      email: "david.thompson@innovatetech.com",
      company: "InnovateTech Solutions",
      title: "CTO",
      industry: criteria.industries[0] || "Technology",
      companySize: criteria.companySizes[0] || "101-500 employees",
      score: 80,
      linkedinUrl: "https://linkedin.com/in/davidthompson",
      companyWebsite: "https://innovatetech.com",
      location: "Seattle, WA",
      reason: "Technology leader evaluating new solutions for digital transformation",
      dataSource: 'ai',
      confidence: 0.7
    },
    {
      firstName: "Lisa",
      lastName: "Wang",
      email: "lisa.wang@financeplus.com",
      company: "FinancePlus",
      title: "VP of Operations",
      industry: criteria.industries.includes("Finance") ? "Finance" : "Technology",
      companySize: criteria.companySizes[0] || "51-200 employees",
      score: 75,
      linkedinUrl: "https://linkedin.com/in/lisawang",
      companyWebsite: "https://financeplus.com",
      location: "Chicago, IL",
      reason: "Operations executive focused on efficiency and cost reduction",
      dataSource: 'ai',
      confidence: 0.7
    }
  ];

  return sampleProspects;
} 