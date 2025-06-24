import { google } from 'googleapis';
import { prisma } from './prisma';
import { EmailSender } from './email-sender';
import { AIEmailResponder } from './ai-email-responder';

interface CampaignConfig {
  name: string;
  description?: string;
  industry?: string;
  valueProposition?: string;
  callToAction?: string;
  tone: 'professional' | 'casual' | 'friendly' | 'direct';
  sequenceSteps: number;
  delayBetweenEmails: number; // hours
  maxEmailsPerDay: number;
  trackOpens: boolean;
  trackClicks: boolean;
  autoRespond: boolean;
}

interface ProspectData {
  id: string;
  name?: string;
  email: string;
  company?: string;
  title?: string;
  industry?: string;
  linkedinUrl?: string;
  notes?: string;
}

export class OutboundCampaignManager {
  private emailSender: EmailSender;
  private aiResponder: AIEmailResponder;
  private oauth2Client: any;

  constructor() {
    this.emailSender = new EmailSender();
    this.aiResponder = new AIEmailResponder();
    
    // Initialize Gmail API client
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3001/api/auth/callback/google'
    );
  }

  /**
   * Create a new outbound campaign with AI-generated sequences
   */
  async createCampaign(userId: string, config: CampaignConfig, prospects: ProspectData[]) {
    console.log(`🚀 Creating campaign: ${config.name} with ${prospects.length} prospects`);

    try {
      // Generate AI-powered email sequences
      const emailSequences = await this.generateEmailSequences(config);

      // Create campaign in database
      const campaign = await prisma.campaign.create({
        data: {
          name: config.name,
          description: config.description || '',
          status: 'draft',
          userId: userId,
          sequences: {
            create: emailSequences.map((sequence, index) => ({
              name: `Step ${index + 1}: ${sequence.type}`,
              type: 'email',
              content: sequence.body,
              delay: config.delayBetweenEmails * index,
              order: index
            }))
          },
          prospects: {
            create: prospects.map(prospect => ({
              email: prospect.email,
              name: prospect.name || '',
              company: prospect.company || '',
              title: prospect.title || '',
              status: 'new'
            }))
          }
        },
        include: {
          sequences: true,
          prospects: true
        }
      });

      console.log(`✅ Campaign created with ID: ${campaign.id}`);
      return campaign;

    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  /**
   * Generate AI-powered email sequences based on campaign config
   */
  private async generateEmailSequences(config: CampaignConfig) {
    const sequences = [];
    
    // Define sequence types based on best practices
    const sequenceTypes = [
      { type: 'introduction', purpose: 'Introduce yourself and establish credibility' },
      { type: 'value-add', purpose: 'Provide value without asking for anything' },
      { type: 'social-proof', purpose: 'Share case studies or testimonials' },
      { type: 'problem-agitation', purpose: 'Highlight pain points and consequences' },
      { type: 'solution-presentation', purpose: 'Present your solution and benefits' },
      { type: 'final-ask', purpose: 'Direct call-to-action with urgency' }
    ];

    // Generate sequences up to the specified number of steps
    for (let i = 0; i < Math.min(config.sequenceSteps, sequenceTypes.length); i++) {
      const sequenceType = sequenceTypes[i];
      
      const prompt = `Generate a ${config.tone} outbound sales email for step ${i + 1} of a ${config.sequenceSteps}-step sequence.

Campaign Details:
- Industry: ${config.industry || 'General Business'}
- Value Proposition: ${config.valueProposition || 'Helping businesses grow and scale efficiently'}
- Call to Action: ${config.callToAction || 'Schedule a 15-minute discovery call'}
- Tone: ${config.tone}

Email Type: ${sequenceType.type}
Purpose: ${sequenceType.purpose}

Requirements:
- Keep it under 150 words
- Include personalization placeholders: {{firstName}}, {{company}}, {{title}}
- Make it compelling and relevant
- ${i === 0 ? 'This is the first email - focus on introduction and curiosity' : ''}
- ${i === config.sequenceSteps - 1 ? 'This is the final email - include urgency and clear CTA' : ''}
- Don't be pushy or salesy
- Focus on value and building relationships

Return ONLY the email body text, no subject line or additional formatting.`;

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are an expert sales copywriter specializing in outbound email campaigns. Generate compelling, personalized emails that build relationships and drive responses.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 500,
            temperature: 0.7,
          }),
        });

        const data = await response.json();
        const emailBody = data.choices[0]?.message?.content || '';

        // Generate subject line
        const subjectPrompt = `Generate a compelling subject line for this ${sequenceType.type} email in a ${config.tone} tone. Keep it under 50 characters and make it curiosity-driven. Don't use "Re:" or "Fwd:". Return only the subject line.

Email body: ${emailBody.substring(0, 200)}...`;

        const subjectResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: subjectPrompt
              }
            ],
            max_tokens: 50,
            temperature: 0.8,
          }),
        });

        const subjectData = await subjectResponse.json();
        const subject = subjectData.choices[0]?.message?.content?.trim() || `Step ${i + 1}: ${sequenceType.type}`;

        sequences.push({
          type: sequenceType.type,
          subject: subject,
          body: emailBody,
          order: i
        });

      } catch (error) {
        console.error(`Error generating sequence ${i + 1}:`, error);
        // Fallback template
        sequences.push({
          type: sequenceType.type,
          subject: `Quick question about {{company}}`,
          body: `Hi {{firstName}},\n\nI hope this email finds you well. I noticed that {{company}} is doing great work in the {{industry}} space.\n\n${sequenceType.purpose}\n\nWould you be interested in a brief 15-minute conversation to explore how we might be able to help {{company}} achieve even better results?\n\nBest regards,\n{{senderName}}`,
          order: i
        });
      }
    }

    return sequences;
  }

  /**
   * Launch a campaign - start sending emails to prospects
   */
  async launchCampaign(campaignId: string, userId: string) {
    console.log(`🚀 Launching campaign: ${campaignId}`);

    try {
      // Get campaign with prospects and sequences
      const campaign = await prisma.campaign.findUnique({
        where: {
          id: campaignId,
          userId: userId
        },
        include: {
          prospects: {
            where: { status: 'new' }
          },
          sequences: {
            orderBy: { order: 'asc' }
          }
        }
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (campaign.prospects.length === 0) {
        throw new Error('No prospects to contact');
      }

      // Get user's Google tokens for email sending
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { accounts: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const googleAccount = user.accounts.find(acc => acc.provider === 'google');
      if (!googleAccount?.access_token) {
        throw new Error('Google account not connected. Please reconnect your Gmail account.');
      }

      // Set up email sender with user's credentials
      this.emailSender = new EmailSender({
        accessToken: googleAccount.access_token,
        refreshToken: googleAccount.refresh_token || '',
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      });

      // Send first email in sequence to all prospects
      const firstSequence = campaign.sequences[0];
      if (!firstSequence) {
        throw new Error('No email sequences found');
      }

      const emailsToSend = [];
      
      for (const prospect of campaign.prospects) {
        // Personalize email content
        const personalizedContent = this.personalizeEmail(
          firstSequence.content,
          prospect,
          user
        );

        const personalizedSubject = this.personalizeSubject(
          firstSequence.content, // We'll extract subject from content or use a default
          prospect
        );

        emailsToSend.push({
          to: prospect.email,
          subject: personalizedSubject,
          body: personalizedContent,
          fromName: user.name || 'Jordan Linford',
          fromEmail: user.email || 'jordanlinford@gmail.com',
          prospectId: prospect.id,
          campaignId: campaign.id,
          sequenceId: firstSequence.id
        });
      }

      // Send emails with rate limiting
      console.log(`📧 Sending ${emailsToSend.length} emails...`);
      const results = await this.emailSender.sendBulkEmails(emailsToSend, 2000); // 2 second delay between emails

      // Update campaign status
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'active' }
      });

      // Update prospect statuses
      const successfulEmails = emailsToSend.slice(0, results.sent);
      if (successfulEmails.length > 0) {
        await prisma.prospect.updateMany({
          where: {
            id: { in: successfulEmails.map(email => email.prospectId) }
          },
          data: { status: 'contacted' }
        });

        // Log interactions
        const interactions = successfulEmails.map(email => ({
          prospectId: email.prospectId,
          type: 'email_sent',
          content: email.body
        }));

        await prisma.interaction.createMany({
          data: interactions
        });

        // Schedule follow-up emails
        await this.scheduleFollowUpEmails(campaign, successfulEmails);
      }

      console.log(`✅ Campaign launched! Sent ${results.sent} emails out of ${emailsToSend.length} total`);
      
      return {
        success: true,
        sent: results.sent,
        failed: results.failed,
        total: emailsToSend.length
      };

    } catch (error) {
      console.error('Error launching campaign:', error);
      throw error;
    }
  }

  /**
   * Schedule follow-up emails in the sequence
   */
  private async scheduleFollowUpEmails(campaign: any, sentEmails: any[]) {
    const followUpSequences = campaign.sequences.slice(1); // Skip first sequence (already sent)
    
    for (const sequence of followUpSequences) {
      for (const email of sentEmails) {
        const scheduledTime = new Date();
        scheduledTime.setHours(scheduledTime.getHours() + sequence.delay);

        await prisma.emailSequence.create({
          data: {
            toEmail: email.to,
            subject: this.personalizeSubject(sequence.content, { email: email.to }),
            body: sequence.content,
            scheduledFor: scheduledTime,
            sequenceType: 'follow-up',
            status: 'scheduled'
          }
        });
      }
    }
  }

  /**
   * Personalize email content with prospect data
   */
  private personalizeEmail(template: string, prospect: any, user: any): string {
    let personalized = template;
    
    // Replace placeholders
    personalized = personalized.replace(/\{\{firstName\}\}/g, prospect.name?.split(' ')[0] || 'there');
    personalized = personalized.replace(/\{\{lastName\}\}/g, prospect.name?.split(' ').slice(1).join(' ') || '');
    personalized = personalized.replace(/\{\{name\}\}/g, prospect.name || 'there');
    personalized = personalized.replace(/\{\{company\}\}/g, prospect.company || 'your company');
    personalized = personalized.replace(/\{\{title\}\}/g, prospect.title || 'your role');
    personalized = personalized.replace(/\{\{senderName\}\}/g, user.name || 'Jordan Linford');
    personalized = personalized.replace(/\{\{senderEmail\}\}/g, user.email || 'jordanlinford@gmail.com');

    return personalized;
  }

  /**
   * Personalize email subject line
   */
  private personalizeSubject(content: string, prospect: any): string {
    // Extract subject from content or generate one
    const companyName = prospect.company || 'your company';
    const firstName = prospect.name?.split(' ')[0] || 'there';
    
    // Simple subject line generation
    const subjects = [
      `Quick question about ${companyName}`,
      `${firstName}, thought you might find this interesting`,
      `Helping ${companyName} grow`,
      `${firstName} - 2 minutes of your time?`,
      `${companyName} - potential partnership opportunity`
    ];
    
    return subjects[Math.floor(Math.random() * subjects.length)];
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string, userId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaignId,
        userId: userId
      },
      include: {
        prospects: {
          include: {
            interactions: true
          }
        }
      }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const analytics = {
      totalProspects: campaign.prospects.length,
      contacted: campaign.prospects.filter(p => p.status === 'contacted').length,
      replied: campaign.prospects.filter(p => p.status === 'replied').length,
      qualified: campaign.prospects.filter(p => p.status === 'qualified').length,
      emailsSent: campaign.prospects.reduce((sum, p) => 
        sum + p.interactions.filter(i => i.type === 'email_sent').length, 0
      ),
      repliesReceived: campaign.prospects.reduce((sum, p) => 
        sum + p.interactions.filter(i => i.type === 'email_replied').length, 0
      ),
      responseRate: 0,
      conversionRate: 0
    };

    analytics.responseRate = analytics.contacted > 0 
      ? (analytics.replied / analytics.contacted) * 100 
      : 0;

    analytics.conversionRate = analytics.replied > 0 
      ? (analytics.qualified / analytics.replied) * 100 
      : 0;

    return analytics;
  }

  async processFollowUps(): Promise<void> {
    try {
      console.log('🔄 Processing scheduled follow-ups...');
      
      // Get all campaigns with active sequences
      const campaigns = await prisma.campaign.findMany({
        where: {
          status: 'active'
        },
        include: {
          sequences: {
            include: {
              prospects: true
            }
          }
        }
      });

      for (const campaign of campaigns) {
        for (const sequence of campaign.sequences) {
          // Check for prospects who haven't responded and are due for follow-up
          const dueProspects = await this.getProspectsForFollowUp(sequence.id);
          
          for (const prospect of dueProspects) {
            await this.sendFollowUpEmail(campaign, sequence, prospect);
          }
        }
      }
      
      console.log('✅ Follow-up processing completed');
    } catch (error) {
      console.error('Error processing follow-ups:', error);
      throw error;
    }
  }

  private async getProspectsForFollowUp(sequenceId: string) {
    // Get prospects who:
    // 1. Were sent the previous email 3+ days ago
    // 2. Haven't responded (no interactions)
    // 3. Haven't been sent the next follow-up yet
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    return await prisma.prospect.findMany({
      where: {
        sequenceId: sequenceId,
        lastEmailSent: {
          lte: threeDaysAgo
        },
        // No responses recorded
        interactions: {
          none: {
            type: 'email_reply'
          }
        },
        // Still has more steps in sequence
        currentStep: {
          lt: 6 // Assuming max 6 steps
        }
      },
      include: {
        interactions: true
      }
    });
  }

  private async sendFollowUpEmail(campaign: any, sequence: any, prospect: any): Promise<void> {
    try {
      console.log(`📧 Sending follow-up ${prospect.currentStep + 1} to ${prospect.email}`);
      
      // Generate personalized follow-up email
      const followUpEmail = await this.generateFollowUpEmail(
        campaign,
        prospect,
        prospect.currentStep + 1
      );

      // Send the email
      const emailSender = new EmailSender();
      await emailSender.sendEmail({
        to: prospect.email,
        subject: followUpEmail.subject,
        htmlContent: followUpEmail.content,
        campaignId: campaign.id
      });

      // Update prospect status
      await prisma.prospect.update({
        where: { id: prospect.id },
        data: {
          currentStep: prospect.currentStep + 1,
          lastEmailSent: new Date(),
          status: prospect.currentStep + 1 >= 6 ? 'completed' : 'active'
        }
      });

      // Log the interaction
      await prisma.interaction.create({
        data: {
          prospectId: prospect.id,
          campaignId: campaign.id,
          type: 'email_sent',
          subject: followUpEmail.subject,
          content: followUpEmail.content,
          timestamp: new Date()
        }
      });

      console.log(`✅ Follow-up sent successfully to ${prospect.email}`);
    } catch (error) {
      console.error(`Error sending follow-up to ${prospect.email}:`, error);
    }
  }

  private async generateFollowUpEmail(campaign: any, prospect: any, stepNumber: number): Promise<{subject: string, content: string}> {
    const followUpPrompts = {
      2: "Write a gentle follow-up email that adds value and asks if they had a chance to review the previous message.",
      3: "Write a more direct follow-up that addresses potential concerns and offers a specific benefit or solution.",
      4: "Write a final follow-up that creates urgency with a time-sensitive offer or deadline.",
      5: "Write a 'breakup' email that politely acknowledges they may not be interested but leaves the door open.",
      6: "Write a final value-add email with a helpful resource, no ask - just building goodwill."
    };

    const prompt = `
You are writing a follow-up email for step ${stepNumber} of an outbound campaign.

Campaign: ${campaign.name}
Industry: ${campaign.industry}
Tone: ${campaign.tone}
Prospect: ${prospect.name || prospect.email}
Company: ${prospect.company || 'N/A'}

${followUpPrompts[stepNumber as keyof typeof followUpPrompts]}

The email should:
- Reference the previous email subtly without being pushy
- Provide additional value or perspective
- Have a clear but soft call-to-action
- Be concise (under 150 words)
- Feel personal and human

Return JSON with 'subject' and 'content' fields.
`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || '{}';
    
    // Extract JSON from response if it's wrapped in markdown code blocks
    let jsonStr = response;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    const emailData = JSON.parse(jsonStr);
    
    return {
      subject: emailData.subject || `Follow-up: ${campaign.name}`,
      content: emailData.content || 'Thanks for your time. Let me know if you have any questions.'
    };
  }
} 