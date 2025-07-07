import { google } from 'googleapis';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import sgMail from '@sendgrid/mail';
import { Client } from '@microsoft/microsoft-graph-client';
import { MicrosoftGraphService } from './microsoft-graph';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailData {
  to: string;
  subject: string;
  body: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
}

interface GmailCredentials {
  accessToken: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}

interface MicrosoftCredentials {
  accessToken: string;
  refreshToken?: string;
}

export class EmailSender {
  private gmail: any;
  private microsoftClient?: Client;
  private microsoftGraphService?: MicrosoftGraphService;
  private provider: 'gmail' | 'outlook';
  private accessToken: string;

  constructor(accessToken: string, provider: 'gmail' | 'outlook' = 'gmail') {
    this.provider = provider;
    this.accessToken = accessToken;
    
    if (provider === 'gmail') {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });
      this.gmail = google.gmail({ version: 'v1', auth });
    } else if (provider === 'outlook') {
      this.microsoftClient = Client.init({
        authProvider: (done) => {
          done(null, accessToken);
        }
      });
      this.microsoftGraphService = new MicrosoftGraphService({
        accessToken: accessToken,
      });
    }
  }

  async sendEmail(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (this.provider === 'gmail') {
      return this.sendViaGmailInternal(emailData);
    } else if (this.provider === 'outlook') {
      return this.sendViaOutlookInternal(emailData);
    }
    
    return {
      success: false,
      error: 'Unsupported email provider'
    };
  }

  private async sendViaGmailInternal(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { to, subject, body, fromName = '', replyTo } = emailData;
      
      // Create email message
      const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        fromName ? `From: ${fromName}` : '',
        replyTo ? `Reply-To: ${replyTo}` : '',
        'Content-Type: text/html; charset=utf-8',
        '',
        body
      ].filter(Boolean).join('\n');

      // Encode email in base64url
      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
        },
      });

      return {
        success: true,
        messageId: response.data.id,
      };
    } catch (error: any) {
      console.error('Gmail sending failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email via Gmail',
      };
    }
  }

  private async sendViaOutlookInternal(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.microsoftGraphService) {
        throw new Error('Microsoft Graph service not initialized');
      }

      const { to, subject, body, fromName } = emailData;

      const result = await this.microsoftGraphService.sendEmail({
        to,
        subject,
        body,
        fromName,
      });

      return result;
    } catch (error: any) {
      console.error('Outlook sending failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email via Outlook',
      };
    }
  }

  // Static methods for backward compatibility
  static async sendViaGmail(emailData: EmailData, credentials: GmailCredentials): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const sender = new EmailSender(credentials.accessToken, 'gmail');
    return sender.sendEmail(emailData);
  }

  static async sendViaOutlook(emailData: EmailData, credentials: MicrosoftCredentials): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const sender = new EmailSender(credentials.accessToken, 'outlook');
    return sender.sendEmail(emailData);
  }

  /**
   * Send a batch of emails with an optional delay between each send. Returns a summary
   * object so that callers can easily inspect how many were sent vs. failed in
   * addition to the per-email results array.
   */
  async sendBulkEmails(
    emails: EmailData[],
    delayMs: number = 1000
  ): Promise<{
    sent: number;
    failed: number;
    results: Array<{ success: boolean; messageId?: string; error?: string; email: string }>;
  }> {
    const results: Array<{ success: boolean; messageId?: string; error?: string; email: string }> = [];
    let sent = 0;
    let failed = 0;

    for (const emailData of emails) {
      const result = await this.sendEmail(emailData);

      if (result.success) {
        sent += 1;
      } else {
        failed += 1;
      }

      results.push({ ...result, email: emailData.to });

      // Respect rate limits between sends if a delay is specified
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return { sent, failed, results };
  }
}

export async function createEmailSender(): Promise<EmailSender | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.accessToken) {
    return null;
  }
  
  return new EmailSender(session.accessToken);
}

/**
 * Replace template variables in email content
 */
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\[${key}\\]`, 'g');
    result = result.replace(regex, value || '');
  });
  
  return result;
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
} 