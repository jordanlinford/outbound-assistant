import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import { prisma } from './prisma';
import { AIEmailResponder } from './ai-email-responder';
import { EmailSender } from './email-sender';

interface AutomationConfig {
  enabled: boolean;
  autoReplyEnabled: boolean;
  humanReviewThreshold: number; // 0.0 to 1.0
  maxEmailsPerHour: number;
  businessHours: {
    start: number; // 9 (9 AM)
    end: number;   // 17 (5 PM)
    timezone: string; // 'America/New_York'
  };
  autoFollowUp: boolean;
  blacklistedDomains: string[];
  whitelistedSenders: string[];
  responseDelay: number; // minutes to wait before responding
  maxDailyEmails: number;
}

export class EmailAutomationSystem {
  private config: AutomationConfig;
  private aiResponder: AIEmailResponder;
  private emailSender!: EmailSender;
  private oauth2Client: any;
  private microsoftClient?: Client;
  private provider: 'gmail' | 'outlook';

  constructor(config: AutomationConfig, provider: 'gmail' | 'outlook' = 'gmail') {
    this.config = config;
    this.aiResponder = new AIEmailResponder();
    this.provider = provider;
    
    if (provider === 'gmail') {
      // Initialize Gmail API client
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'http://localhost:3000/api/auth/callback/google'
      );
    }
    // Microsoft client will be initialized when needed with user token
  }

  /**
   * Main automation loop - monitors email for new messages
   */
  async startAutomation(userEmail: string) {
    console.log(`🤖 Starting email automation system for ${this.provider}...`);
    
    // Get user's email tokens
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { accounts: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (this.provider === 'gmail') {
      const googleAccount = user.accounts.find(acc => acc.provider === 'google');
      if (!googleAccount?.access_token) {
        throw new Error('Google account not connected');
      }

      this.oauth2Client.setCredentials({
        access_token: googleAccount.access_token,
        refresh_token: googleAccount.refresh_token,
      });

      this.emailSender = new EmailSender(googleAccount.access_token, 'gmail');
      await this.monitorGmailInbox();
    } else if (this.provider === 'outlook') {
      if (!user.microsoftAccessToken) {
        throw new Error('Microsoft Outlook account not connected');
      }

      // Check if token is expired
      if (user.microsoftTokenExpiresAt && user.microsoftTokenExpiresAt < new Date()) {
        throw new Error('Microsoft access token expired. Please reconnect your Outlook account.');
      }

      this.microsoftClient = Client.init({
        authProvider: (done) => {
          done(null, user.microsoftAccessToken!);
        }
      });

      this.emailSender = new EmailSender(user.microsoftAccessToken, 'outlook');
      await this.monitorOutlookInbox();
    }
  }

  /**
   * Monitor Gmail inbox for new emails
   */
  private async monitorGmailInbox() {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    
    try {
      // Get unread emails
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread -from:me', // Exclude emails from yourself
        maxResults: 10
      });

      const messages = response.data.messages || [];
      console.log(`📧 Found ${messages.length} unread Gmail emails`);

      for (const message of messages) {
        await this.processGmailEmail(message.id!, gmail);
      }

      // Schedule next check (every 2 minutes)
      setTimeout(() => this.monitorGmailInbox(), 120000);
      
    } catch (error) {
      console.error('Error monitoring Gmail inbox:', error);
      // Retry in 5 minutes on error
      setTimeout(() => this.monitorGmailInbox(), 300000);
    }
  }

  /**
   * Monitor Outlook inbox for new emails
   */
  private async monitorOutlookInbox() {
    if (!this.microsoftClient) {
      throw new Error('Microsoft Graph client not initialized');
    }

    try {
      // Get unread emails from Outlook
      const messages = await this.microsoftClient
        .api('/me/messages')
        .filter('isRead eq false')
        .top(10)
        .get();

      console.log(`📧 Found ${messages.value.length} unread Outlook emails`);

      for (const message of messages.value) {
        await this.processOutlookEmail(message);
      }

      // Schedule next check (every 2 minutes)
      setTimeout(() => this.monitorOutlookInbox(), 120000);
      
    } catch (error) {
      console.error('Error monitoring Outlook inbox:', error);
      // Retry in 5 minutes on error
      setTimeout(() => this.monitorOutlookInbox(), 300000);
    }
  }

  /**
   * Process individual Gmail email
   */
  private async processGmailEmail(messageId: string, gmail: any) {
    try {
      // Get email details
      const message = await gmail.users.messages.get({
        userId: 'me',
        id: messageId
      });

      const email = this.parseGmailMessage(message.data);
      console.log(`📨 Processing Gmail email from: ${email.from}`);

      await this.processEmailCommon(email, messageId, 'gmail');

    } catch (error) {
      console.error(`Error processing Gmail email ${messageId}:`, error);
    }
  }

  /**
   * Process individual Outlook email
   */
  private async processOutlookEmail(message: any) {
    try {
      const email = this.parseOutlookMessage(message);
      console.log(`📨 Processing Outlook email from: ${email.from}`);

      await this.processEmailCommon(email, message.id, 'outlook');

    } catch (error) {
      console.error(`Error processing Outlook email ${message.id}:`, error);
    }
  }

  /**
   * Common email processing logic for both providers
   */
  private async processEmailCommon(email: any, messageId: string, provider: 'gmail' | 'outlook') {
    // Check if we should process this email
    if (!this.shouldProcessEmail(email)) {
      console.log(`⏭️  Skipping email from ${email.from} (filtered)`);
      return;
    }

    // Check if we've already responded to this thread
    const existingResponse = await this.checkExistingResponse(email.threadId);
    if (existingResponse) {
      console.log(`✅ Already responded to thread ${email.threadId}`);
      return;
    }

    // Analyze email with AI
    const analysis = await this.aiResponder.analyzeEmail(email.body);
    console.log(`🧠 Email analysis: ${analysis.intent} (${analysis.sentiment})`);

    // Check if human review is needed
    const routingDecision = await this.aiResponder.shouldRouteToHuman(email.body);
    
    if (routingDecision.routeToHuman && routingDecision.priority === 'high') {
      await this.flagForHumanReview(email, analysis, routingDecision);
      return;
    }

    // Generate AI response
    const userContext = {
      name: 'Jordan Linford', // This should come from user data
      email: 'jordanlinford@gmail.com',
      company: 'Outbound Assistant',
      role: 'AI Assistant',
      industry: 'Software/SaaS'
    };

    const context = {
      incomingEmail: {
        from: email.from,
        subject: email.subject,
        body: email.body,
        timestamp: new Date()
      },
      userProfile: userContext,
      responseType: analysis.suggestedResponseType
    };

    const aiResponse = await this.aiResponder.generateResponse(context, {
      tone: 'professional',
      length: 'medium',
      includeCallToAction: true
    });

    // Send automated response
    if (this.config.autoReplyEnabled && this.isBusinessHours()) {
      await this.sendAutomatedResponse(email, aiResponse, provider);
      
      // Schedule follow-up if needed
      if (this.config.autoFollowUp && analysis.suggestedResponseType === 'sales') {
        await this.scheduleFollowUpSequence(email, analysis);
      }
    }

    // Log interaction
    await this.logEmailInteraction(email, analysis, aiResponse, 'automated');

    // Mark as read
    await this.markAsRead(messageId, provider);
  }

  private parseOutlookMessage(message: any) {
    return {
      from: message.from?.emailAddress?.address || '',
      subject: message.subject || '',
      body: message.body?.content || '',
      threadId: message.conversationId || message.id,
      timestamp: new Date(message.receivedDateTime)
    };
  }

  private async markAsRead(messageId: string, provider: 'gmail' | 'outlook') {
    try {
      if (provider === 'gmail') {
        const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
        await gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            removeLabelIds: ['UNREAD']
          }
        });
      } else if (provider === 'outlook' && this.microsoftClient) {
        await this.microsoftClient
          .api(`/me/messages/${messageId}`)
          .patch({
            isRead: true
          });
      }
    } catch (error) {
      console.error(`Error marking email as read (${provider}):`, error);
    }
  }

  /**
   * Helper methods
   */
  private parseGmailMessage(message: any) {
    const headers = message.payload.headers;
    const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value || '';
    
    let body = '';
    if (message.payload.body?.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString();
    } else if (message.payload.parts) {
      const textPart = message.payload.parts.find((part: any) => part.mimeType === 'text/plain');
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString();
      }
    }

    return {
      from: getHeader('From'),
      subject: getHeader('Subject'),
      body,
      threadId: message.threadId,
      timestamp: new Date(parseInt(message.internalDate))
    };
  }

  private shouldProcessEmail(email: any): boolean {
    // Skip if from known automated systems
    const automatedSenders = [
      'noreply@',
      'no-reply@',
      'donotreply@',
      'notifications@',
      'support@'
    ];
    
    return !automatedSenders.some(sender => email.from.toLowerCase().includes(sender));
  }

  private async checkExistingResponse(threadId: string): Promise<boolean> {
    // Check database for existing responses to this thread
    const existing = await prisma.emailInteraction.findFirst({
      where: { threadId }
    });
    return !!existing;
  }

  private async flagForHumanReview(email: any, analysis: any, routingDecision: any) {
    console.log(`🚨 Flagging email for human review: ${routingDecision.reason}`);
    
    await prisma.emailInteraction.create({
      data: {
        fromEmail: email.from,
        subject: email.subject,
        body: email.body,
        threadId: email.threadId,
        intent: analysis.intent,
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
        responseType: 'human_review_needed',
        routingReason: routingDecision.reason,
        priority: routingDecision.priority
      }
    });
  }

  private async sendAutomatedResponse(email: any, aiResponse: any, provider: 'gmail' | 'outlook') {
    try {
      // Check rate limits
      if (!await this.checkRateLimit()) {
        console.log('⏳ Rate limit reached, queuing response');
        await this.queueResponse(email, aiResponse);
        return;
      }

      const emailData = {
        to: email.from,
        subject: aiResponse.subject.startsWith('Re:') ? aiResponse.subject : `Re: ${email.subject}`,
        body: aiResponse.body,
        fromName: 'Jordan Linford',
        fromEmail: provider === 'gmail' ? 'jordanlinford@gmail.com' : undefined
      };

      const result = await this.emailSender.sendEmail(emailData);

      if (result.success) {
        console.log(`✅ Automated response sent via ${provider} to ${email.from}`);
        // Update rate limit counter
        await this.updateRateLimit();
      } else {
        console.error(`❌ Failed to send response via ${provider}:`, result.error);
      }

    } catch (error) {
      console.error(`Error sending automated response via ${provider}:`, error);
    }
  }

  private async checkRateLimit(): Promise<boolean> {
    // Simple rate limiting - max emails per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sentToday = await prisma.emailInteraction.count({
      where: {
        createdAt: { gte: today },
        responseType: 'automated'
      }
    });
    
    return sentToday < this.config.maxDailyEmails;
  }

  private async updateRateLimit() {
    // Rate limit tracking is handled by the interaction logging
  }

  private async queueResponse(email: any, aiResponse: any) {
    // Queue response for later sending
    await prisma.emailSequence.create({
      data: {
        toEmail: email.from,
        subject: aiResponse.subject,
        body: aiResponse.body,
        scheduledFor: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes later
        sequenceType: 'queued_response',
        status: 'scheduled'
      }
    });
  }

  private async scheduleFollowUpSequence(email: any, analysis: any) {
    // Schedule follow-up emails based on analysis
    const followUpDelays = [24, 72, 168]; // 1 day, 3 days, 1 week (in hours)
    
    for (let i = 0; i < followUpDelays.length; i++) {
      const scheduledTime = new Date(Date.now() + followUpDelays[i] * 60 * 60 * 1000);
      
      await prisma.emailSequence.create({
        data: {
          toEmail: email.from,
          subject: `Following up: ${email.subject}`,
          body: `Hi there,\n\nI wanted to follow up on my previous email regarding ${email.subject}.\n\nBest regards,\nJordan`,
          scheduledFor: scheduledTime,
          sequenceType: 'follow-up',
          status: 'scheduled'
        }
      });
    }
  }

  private async logEmailInteraction(email: any, analysis: any, aiResponse: any, responseType: string) {
    await prisma.emailInteraction.create({
      data: {
        fromEmail: email.from,
        subject: email.subject,
        body: email.body,
        threadId: email.threadId,
        intent: analysis.intent,
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
        responseSubject: aiResponse.subject,
        responseBody: aiResponse.body,
        responseType,
        confidence: analysis.confidence
      }
    });
  }

  private isBusinessHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    return hour >= this.config.businessHours.start && hour < this.config.businessHours.end;
  }
} 