import OpenAI from 'openai';
import { prisma } from './prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface LeadData {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  industry?: string;
  companySize?: string;
  revenue?: string;
  location?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  phoneNumber?: string;
}

interface LeadScore {
  overallScore: number; // 0-100
  qualification: 'hot' | 'warm' | 'cold' | 'unqualified';
  reasons: string[];
  buyingSignals: string[];
  redFlags: string[];
  suggestedApproach: string;
  estimatedBudget: string;
  decisionMakerLevel: 'high' | 'medium' | 'low';
  urgency: 'high' | 'medium' | 'low';
  personalizedMessage: string;
}

export class SmartLeadScorer {
  /**
   * Score and qualify a lead using AI
   */
  async scoreLead(leadData: LeadData, targetPersona?: string): Promise<LeadScore> {
    try {
      const prompt = this.buildScoringPrompt(leadData, targetPersona);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert lead qualification specialist. Analyze leads and return a detailed scoring assessment in JSON format.

            Return JSON with:
            - overallScore: number 0-100
            - qualification: "hot"|"warm"|"cold"|"unqualified"  
            - reasons: array of scoring reasons
            - buyingSignals: array of positive indicators
            - redFlags: array of concerns
            - suggestedApproach: string with recommended outreach strategy
            - estimatedBudget: string estimate
            - decisionMakerLevel: "high"|"medium"|"low"
            - urgency: "high"|"medium"|"low"
            - personalizedMessage: string with personalized opener`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content;
      
      // Extract JSON from response
      let jsonStr = response || '{}';
      const jsonMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      const score = JSON.parse(jsonStr);
      
      // Store the scoring result
      await this.storeLeadScore(leadData, score);
      
      return score;
    } catch (error) {
      console.error('Error scoring lead:', error);
      return this.getDefaultScore();
    }
  }

  /**
   * Batch score multiple leads
   */
  async batchScoreLeads(leads: LeadData[], targetPersona?: string): Promise<LeadScore[]> {
    const scores = [];
    
    // Process in batches of 5 to avoid rate limits
    for (let i = 0; i < leads.length; i += 5) {
      const batch = leads.slice(i, i + 5);
      const batchPromises = batch.map(lead => this.scoreLead(lead, targetPersona));
      const batchScores = await Promise.all(batchPromises);
      scores.push(...batchScores);
      
      // Small delay between batches
      if (i + 5 < leads.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return scores;
  }

  /**
   * Get enriched lead data from various sources
   */
  async enrichLead(email: string): Promise<LeadData> {
    // This would integrate with services like Clearbit, ZoomInfo, etc.
    // For now, we'll extract what we can from the email domain
    
    const domain = email.split('@')[1];
    const enrichedData: LeadData = { email };
    
    try {
      // Basic domain analysis
      if (domain) {
        enrichedData.company = this.extractCompanyFromDomain(domain);
        enrichedData.industry = await this.guessIndustryFromDomain(domain);
        enrichedData.websiteUrl = `https://${domain}`;
      }
      
      // You could add integrations here:
      // - Clearbit Enrichment API
      // - ZoomInfo API  
      // - LinkedIn Sales Navigator API
      // - Hunter.io API
      
    } catch (error) {
      console.error('Error enriching lead:', error);
    }
    
    return enrichedData;
  }

  /**
   * Generate personalized outreach sequence based on lead score
   */
  async generatePersonalizedSequence(leadData: LeadData, score: LeadScore): Promise<{
    emails: Array<{
      subject: string;
      body: string;
      delay: number;
      type: string;
    }>;
    linkedinMessage?: string;
  }> {
    const prompt = `
    Generate a personalized outreach sequence for this lead:
    
    Lead: ${JSON.stringify(leadData)}
    Score: ${JSON.stringify(score)}
    
    Create 3 emails and 1 LinkedIn message based on their qualification level and buying signals.
    Tailor the messaging to their industry, role, and company size.
    
    Return JSON with emails array and linkedinMessage.
    `;
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Generate personalized outreach sequences based on lead qualification data."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content;
      let jsonStr = response || '{}';
      const jsonMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error generating sequence:', error);
      return this.getDefaultSequence();
    }
  }

  private buildScoringPrompt(leadData: LeadData, targetPersona?: string): string {
    return `
    Analyze this lead for B2B sales qualification:
    
    LEAD DATA:
    ${JSON.stringify(leadData, null, 2)}
    
    ${targetPersona ? `TARGET PERSONA: ${targetPersona}` : ''}
    
    SCORING CRITERIA:
    - Company size and revenue potential
    - Decision maker level and authority
    - Industry fit and buying signals
    - Technology stack and needs
    - Budget indicators
    - Urgency signals
    - Contact quality and reachability
    
    Consider:
    - Is this person likely to have budget?
    - Do they have authority to make decisions?
    - Is there a clear need for our solution?
    - What's their urgency level?
    - Any red flags or disqualifiers?
    
    Provide a comprehensive scoring analysis.
    `;
  }

  private async storeLeadScore(leadData: LeadData, score: LeadScore): Promise<void> {
    try {
      await prisma.leadScore.create({
        data: {
          email: leadData.email,
          firstName: leadData.firstName,
          lastName: leadData.lastName,
          company: leadData.company,
          title: leadData.title,
          overallScore: score.overallScore,
          qualification: score.qualification,
          reasons: score.reasons,
          buyingSignals: score.buyingSignals,
          redFlags: score.redFlags,
          suggestedApproach: score.suggestedApproach,
          estimatedBudget: score.estimatedBudget,
          decisionMakerLevel: score.decisionMakerLevel,
          urgency: score.urgency,
          personalizedMessage: score.personalizedMessage,
        }
      });
    } catch (error) {
      console.error('Error storing lead score:', error);
    }
  }

  private extractCompanyFromDomain(domain: string): string {
    // Remove common TLDs and clean up domain for company name
    return domain
      .replace(/\.(com|org|net|io|co|ai|app)$/, '')
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private async guessIndustryFromDomain(domain: string): Promise<string> {
    // Simple industry detection based on domain keywords
    const industryKeywords = {
      'fintech|bank|finance|payment|crypto': 'Financial Services',
      'health|medical|pharma|bio|clinic': 'Healthcare',
      'tech|software|saas|app|dev': 'Technology',
      'edu|university|school|learning': 'Education',
      'retail|shop|store|ecommerce': 'Retail',
      'real|estate|property|realty': 'Real Estate',
      'marketing|agency|advertising': 'Marketing',
      'law|legal|attorney|firm': 'Legal',
      'consulting|advisory|services': 'Consulting'
    };
    
    for (const [keywords, industry] of Object.entries(industryKeywords)) {
      const regex = new RegExp(keywords, 'i');
      if (regex.test(domain)) {
        return industry;
      }
    }
    
    return 'Other';
  }

  private getDefaultScore(): LeadScore {
    return {
      overallScore: 50,
      qualification: 'warm',
      reasons: ['Insufficient data for scoring'],
      buyingSignals: [],
      redFlags: [],
      suggestedApproach: 'Standard outreach approach',
      estimatedBudget: 'Unknown',
      decisionMakerLevel: 'medium',
      urgency: 'medium',
      personalizedMessage: 'Hi there, I wanted to reach out about...'
    };
  }

  private getDefaultSequence() {
    return {
      emails: [
        {
          subject: 'Quick question about [Company]',
          body: 'Hi [FirstName],\n\nI noticed [Company] and thought you might be interested in...',
          delay: 0,
          type: 'introduction'
        }
      ],
      linkedinMessage: 'Hi [FirstName], I\'d love to connect and share some insights about [Industry].'
    };
  }
}

export default SmartLeadScorer; 