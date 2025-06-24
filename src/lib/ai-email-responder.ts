import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface EmailContext {
  incomingEmail: {
    from: string;
    subject: string;
    body: string;
    timestamp: Date;
  };
  userProfile: {
    name: string;
    company: string;
    role: string;
    industry: string;
  };
  conversationHistory?: Array<{
    from: string;
    to: string;
    subject: string;
    body: string;
    timestamp: Date;
  }>;
  responseType: 'sales' | 'support' | 'general' | 'follow-up' | 'scheduling';
}

interface AIResponseOptions {
  tone: 'professional' | 'friendly' | 'casual' | 'formal';
  length: 'brief' | 'medium' | 'detailed';
  includeCallToAction: boolean;
  customInstructions?: string;
}

export class AIEmailResponder {
  /**
   * Generate AI-powered email response
   */
  async generateResponse(
    context: EmailContext, 
    options: AIResponseOptions = {
      tone: 'professional',
      length: 'medium',
      includeCallToAction: true
    }
  ): Promise<{
    subject: string;
    body: string;
    confidence: number;
    suggestedActions?: string[];
  }> {
    try {
      const prompt = this.buildPrompt(context, options);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt(context.responseType, options.tone)
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response generated');
      }

      return this.parseAIResponse(response);
    } catch (error) {
      console.error('Error generating AI email response:', error);
      throw error;
    }
  }

  /**
   * Analyze incoming email intent and sentiment
   */
  async analyzeEmail(emailContent: string): Promise<{
    intent: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    urgency: 'low' | 'medium' | 'high';
    topics: string[];
    suggestedResponseType: EmailContext['responseType'];
  }> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an email analysis expert. Analyze the email and return a JSON response with:
            - intent: main purpose of the email
            - sentiment: positive/neutral/negative
            - urgency: low/medium/high
            - topics: array of main topics discussed
            - suggestedResponseType: sales/support/general/follow-up/scheduling`
          },
          {
            role: "user",
            content: `Analyze this email:\n\n${emailContent}`
          }
        ],
        temperature: 0.3,
      });

      const analysis = completion.choices[0]?.message?.content;
      
      // Extract JSON from response if it's wrapped in markdown code blocks
      let jsonStr = analysis || '{}';
      const jsonMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error analyzing email:', error);
      return {
        intent: 'general inquiry',
        sentiment: 'neutral',
        urgency: 'medium',
        topics: ['general'],
        suggestedResponseType: 'general'
      };
    }
  }

  /**
   * Generate personalized follow-up sequence
   */
  async generateFollowUpSequence(
    initialEmail: string,
    prospectInfo: any,
    sequenceLength: number = 3
  ): Promise<Array<{
    delay: number; // days
    subject: string;
    body: string;
    type: 'value-add' | 'check-in' | 'social-proof' | 'final-ask';
  }>> {
    const sequence = [];
    
    for (let i = 0; i < sequenceLength; i++) {
      const followUpType = this.getFollowUpType(i);
      const delay = this.getFollowUpDelay(i);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Generate a ${followUpType} follow-up email for a sales sequence. 
            Make it valuable, not pushy. Focus on helping the prospect.`
          },
          {
            role: "user",
            content: `Original email: ${initialEmail}
            Prospect info: ${JSON.stringify(prospectInfo)}
            Follow-up #${i + 1} (${followUpType})
            
            Generate subject and body.`
          }
        ],
        temperature: 0.8,
      });

      const response = completion.choices[0]?.message?.content;
      const parsed = this.parseFollowUpResponse(response || '');
      
      sequence.push({
        delay,
        subject: parsed.subject,
        body: parsed.body,
        type: followUpType
      });
    }
    
    return sequence;
  }

  /**
   * Smart email routing - decide if human intervention needed
   */
  async shouldRouteToHuman(emailContent: string): Promise<{
    routeToHuman: boolean;
    reason: string;
    priority: 'low' | 'medium' | 'high';
    suggestedDepartment?: 'sales' | 'support' | 'technical' | 'billing';
  }> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Analyze if this email needs human attention. Consider:
            - Complaints or negative sentiment
            - Complex technical issues
            - High-value opportunities
            - Urgent requests
            - Legal/compliance matters
            
            Return JSON with routeToHuman (boolean), reason, priority, and suggestedDepartment.`
          },
          {
            role: "user",
            content: emailContent
          }
        ],
        temperature: 0.2,
      });

      const analysis = completion.choices[0]?.message?.content;
      
      // Extract JSON from response if it's wrapped in markdown code blocks
      let jsonStr = analysis || '{"routeToHuman": false, "reason": "Standard inquiry", "priority": "low"}';
      const jsonMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error in email routing analysis:', error);
      return {
        routeToHuman: true,
        reason: 'Analysis failed - route to human for safety',
        priority: 'medium'
      };
    }
  }

  private buildPrompt(context: EmailContext, options: AIResponseOptions): string {
    return `
INCOMING EMAIL:
From: ${context.incomingEmail.from}
Subject: ${context.incomingEmail.subject}
Body: ${context.incomingEmail.body}

USER PROFILE:
Name: ${context.userProfile.name}
Company: ${context.userProfile.company}
Role: ${context.userProfile.role}
Industry: ${context.userProfile.industry}

RESPONSE REQUIREMENTS:
- Tone: ${options.tone}
- Length: ${options.length}
- Include CTA: ${options.includeCallToAction}
- Type: ${context.responseType}
${options.customInstructions ? `- Custom instructions: ${options.customInstructions}` : ''}

${context.conversationHistory ? `
CONVERSATION HISTORY:
${context.conversationHistory.map(email => 
  `${email.from} → ${email.to}: ${email.subject}\n${email.body}`
).join('\n\n')}
` : ''}

Generate a response email with subject and body.
    `;
  }

  private getSystemPrompt(responseType: EmailContext['responseType'], tone: string): string {
    const basePrompt = `You are an expert email assistant. Generate helpful, ${tone} email responses.`;
    
    const typeSpecificPrompts = {
      sales: `Focus on building relationships, providing value, and moving prospects through the sales funnel. Be helpful, not pushy.`,
      support: `Provide clear, helpful solutions to customer problems. Be empathetic and solution-oriented.`,
      general: `Respond professionally and helpfully to general inquiries.`,
      'follow-up': `Create engaging follow-up emails that add value and maintain momentum.`,
      scheduling: `Help coordinate meetings and appointments efficiently.`
    };

    return `${basePrompt} ${typeSpecificPrompts[responseType]}`;
  }

  private parseAIResponse(response: string): {
    subject: string;
    body: string;
    confidence: number;
    suggestedActions?: string[];
  } {
    // Simple parsing - in production, you'd want more robust parsing
    const lines = response.split('\n');
    let subject = '';
    let body = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.toLowerCase().startsWith('subject:')) {
        subject = line.substring(8).trim();
      } else if (line.toLowerCase().startsWith('body:')) {
        body = lines.slice(i + 1).join('\n').trim();
        break;
      }
    }

    return {
      subject: subject || 'Re: ' + response.substring(0, 50),
      body: body || response,
      confidence: 0.85,
      suggestedActions: ['Send', 'Edit', 'Schedule']
    };
  }

  private parseFollowUpResponse(response: string): { subject: string; body: string } {
    const lines = response.split('\n');
    let subject = '';
    let body = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.toLowerCase().startsWith('subject:')) {
        subject = line.substring(8).trim();
      } else if (line.toLowerCase().startsWith('body:')) {
        body = lines.slice(i + 1).join('\n').trim();
        break;
      }
    }

    return {
      subject: subject || 'Following up on our conversation',
      body: body || response
    };
  }

  private getFollowUpType(index: number): 'value-add' | 'check-in' | 'social-proof' | 'final-ask' {
    const types: Array<'value-add' | 'check-in' | 'social-proof' | 'final-ask'> = [
      'value-add', 'check-in', 'social-proof', 'final-ask'
    ];
    return types[index] || 'check-in';
  }

  private getFollowUpDelay(index: number): number {
    const delays = [3, 7, 14, 21]; // days
    return delays[index] || 7;
  }
} 