import { Client } from '@microsoft/microsoft-graph-client';
import { prisma } from './prisma';

export interface MicrosoftGraphConfig {
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  fromName?: string;
  attachments?: Array<{
    name: string;
    contentType: string;
    contentBytes: string;
  }>;
}

export class MicrosoftGraphService {
  private client: Client;
  private config: MicrosoftGraphConfig;

  constructor(config: MicrosoftGraphConfig) {
    this.config = config;
    this.client = Client.init({
      authProvider: (done) => {
        done(null, config.accessToken);
      }
    });
  }

  /**
   * Send an email using Microsoft Graph API
   */
  async sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const graphMessage = {
        message: {
          subject: message.subject,
          body: {
            contentType: 'HTML',
            content: message.body
          },
          toRecipients: [
            {
              emailAddress: {
                address: message.to
              }
            }
          ],
          from: message.fromName ? {
            emailAddress: {
              name: message.fromName
            }
          } : undefined,
          attachments: message.attachments?.map(att => ({
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: att.name,
            contentType: att.contentType,
            contentBytes: att.contentBytes
          }))
        },
        saveToSentItems: true
      };

      const response = await this.client
        .api('/me/sendMail')
        .post(graphMessage);

      return {
        success: true,
        messageId: `outlook-${Date.now()}`, // Graph API doesn't return message ID for sendMail
      };
    } catch (error: any) {
      console.error('Microsoft Graph send email error:', error);
      
      // Handle token expiration
      if (error.code === 'InvalidAuthenticationToken' || error.code === 'TokenExpired') {
        return {
          success: false,
          error: 'Access token expired. Please reconnect your Microsoft account.',
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to send email via Microsoft Graph',
      };
    }
  }

  /**
   * Get user's email messages
   */
  async getMessages(options: {
    top?: number;
    filter?: string;
    orderBy?: string;
  } = {}): Promise<{ success: boolean; messages?: any[]; error?: string }> {
    try {
      let request = this.client.api('/me/messages');

      if (options.top) {
        request = request.top(options.top);
      }

      if (options.filter) {
        request = request.filter(options.filter);
      }

      if (options.orderBy) {
        request = request.orderby(options.orderBy);
      }

      const response = await request.get();

      return {
        success: true,
        messages: response.value,
      };
    } catch (error: any) {
      console.error('Microsoft Graph get messages error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get messages from Microsoft Graph',
      };
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(): Promise<{ success: boolean; profile?: any; error?: string }> {
    try {
      const profile = await this.client.api('/me').get();

      return {
        success: true,
        profile,
      };
    } catch (error: any) {
      console.error('Microsoft Graph get profile error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get user profile from Microsoft Graph',
      };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<{ success: boolean; accessToken?: string; expiresIn?: number; error?: string }> {
    try {
      const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        accessToken: data.access_token,
        expiresIn: data.expires_in,
      };
    } catch (error: any) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: error.message || 'Failed to refresh access token',
      };
    }
  }

  /**
   * Create service instance for a user from database
   */
  static async createForUser(userEmail: string): Promise<MicrosoftGraphService | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (!user?.microsoftAccessToken) {
        throw new Error('User does not have Microsoft account connected');
      }

      // Check if token is expired
      if (user.microsoftTokenExpiresAt && user.microsoftTokenExpiresAt < new Date()) {
        // Try to refresh token
        if (user.microsoftRefreshToken && process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
          const refreshResult = await this.refreshAccessToken(
            user.microsoftRefreshToken,
            process.env.MICROSOFT_CLIENT_ID,
            process.env.MICROSOFT_CLIENT_SECRET
          );

          if (refreshResult.success && refreshResult.accessToken) {
            // Update user with new token
            await prisma.user.update({
              where: { email: userEmail },
              data: {
                microsoftAccessToken: refreshResult.accessToken,
                microsoftTokenExpiresAt: new Date(Date.now() + (refreshResult.expiresIn || 3600) * 1000),
              },
            });

            return new MicrosoftGraphService({
              accessToken: refreshResult.accessToken,
              refreshToken: user.microsoftRefreshToken,
            });
          }
        }

        throw new Error('Microsoft access token expired and could not be refreshed');
      }

      return new MicrosoftGraphService({
        accessToken: user.microsoftAccessToken,
        refreshToken: user.microsoftRefreshToken || undefined,
      });
    } catch (error) {
      console.error('Error creating Microsoft Graph service for user:', error);
      return null;
    }
  }
} 