'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { MicrosoftLoginButton } from './MicrosoftLoginButton';

interface EmailProviderStatus {
  gmail: {
    connected: boolean;
    hasAccessToken: boolean;
    status: string;
  };
  outlook: {
    connected: boolean;
    hasAccessToken: boolean;
    tokenValid: boolean;
    status: string;
  };
}

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-10 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg -top-2 left-full ml-2 whitespace-nowrap">
          {content}
          <div className="absolute top-3 -left-1 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      )}
    </div>
  );
}

export function EmailProviderStatus() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<EmailProviderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      checkProviderStatus();
    }
  }, [session]);

  const checkProviderStatus = async () => {
    setLoading(true);
    try {
      const [gmailResponse, outlookResponse] = await Promise.all([
        fetch('/api/email/gmail-test'),
        fetch('/api/email/outlook-test')
      ]);

      const gmailData = await gmailResponse.json();
      const outlookData = await outlookResponse.json();

      setStatus({
        gmail: gmailData.gmail || { connected: false, hasAccessToken: false, status: 'not_connected' },
        outlook: outlookData.outlook || { connected: false, hasAccessToken: false, tokenValid: false, status: 'not_connected' }
      });
    } catch (error) {
      console.error('Error checking provider status:', error);
    }
    setLoading(false);
  };

  const handleConnect = async (provider: 'gmail' | 'outlook') => {
    setConnecting(provider);
    
    if (provider === 'gmail') {
      window.location.href = '/api/auth/signin/google';
    } else {
      // Outlook connection is handled by MicrosoftLoginButton
      setConnecting(null);
    }
  };

  const handleMicrosoftSuccess = () => {
    setConnecting(null);
    checkProviderStatus(); // Refresh status after successful connection
  };

  const handleMicrosoftError = (error: string) => {
    setConnecting(null);
    console.error('Microsoft connection error:', error);
    // You could show a toast notification here
  };

  const getStatusIcon = (providerStatus: any) => {
    if (providerStatus.status === 'ready') {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    } else if (providerStatus.connected && !providerStatus.tokenValid) {
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    } else {
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = (providerStatus: any) => {
    if (providerStatus.status === 'ready') {
      return 'Connected & Ready';
    } else if (providerStatus.connected && !providerStatus.tokenValid) {
      return 'Token Expired - Reconnect Required';
    } else if (providerStatus.connected) {
      return 'Connected';
    } else {
      return 'Not Connected';
    }
  };

  const getStatusColor = (providerStatus: any) => {
    if (providerStatus.status === 'ready') {
      return 'border-green-200 bg-green-50';
    } else if (providerStatus.connected && !providerStatus.tokenValid) {
      return 'border-yellow-200 bg-yellow-50';
    } else {
      return 'border-red-200 bg-red-50';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6" id="email-provider">
        <div className="flex items-center mb-4">
          <h3 className="text-lg font-semibold">Email Provider Status</h3>
          <Tooltip content="Connect your email provider to send campaigns and automate responses">
            <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400 ml-2" />
          </Tooltip>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-white rounded-lg shadow p-6" id="email-provider">
        <h3 className="text-lg font-semibold mb-4">Email Provider Status</h3>
        <div className="text-center py-4">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-2" />
          <p className="text-gray-500">Unable to check provider status</p>
          <button
            onClick={checkProviderStatus}
            className="mt-2 text-sm text-blue-600 hover:text-blue-500"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const hasAnyConnection = status.gmail.status === 'ready' || status.outlook.status === 'ready';

  return (
    <div className="bg-white rounded-lg shadow p-6" id="email-provider">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold">Email Provider Status</h3>
          <Tooltip content="Connect Gmail or Outlook to send automated campaigns and responses">
            <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400 ml-2" />
          </Tooltip>
        </div>
        <button
          onClick={checkProviderStatus}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Refresh
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Gmail Status */}
        <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${getStatusColor(status.gmail)}`}>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#4285F4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Gmail</h4>
              <p className="text-sm text-gray-500">{getStatusText(status.gmail)}</p>
              {status.gmail.status === 'ready' && (
                <p className="text-xs text-green-600">✓ Ready to send campaigns</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusIcon(status.gmail)}
            {status.gmail.status !== 'ready' && (
              <button
                onClick={() => handleConnect('gmail')}
                disabled={connecting === 'gmail'}
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {connecting === 'gmail' ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>
        </div>

        {/* Outlook Status */}
        <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${getStatusColor(status.outlook)}`}>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8" viewBox="0 0 24 24">
                <path fill="#0078D4" d="M7 14c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v4z"/>
                <path fill="#0078D4" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM9 17H4V7h5v10zm11 0h-9V7h9v10z"/>
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Outlook</h4>
              <p className="text-sm text-gray-500">{getStatusText(status.outlook)}</p>
              {status.outlook.status === 'ready' && (
                <p className="text-xs text-green-600">✓ Ready to send campaigns</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusIcon(status.outlook)}
            {status.outlook.status !== 'ready' && (
              <MicrosoftLoginButton
                onSuccess={handleMicrosoftSuccess}
                onError={handleMicrosoftError}
                disabled={connecting === 'outlook'}
                className="px-3 py-1 text-sm leading-4"
              />
            )}
          </div>
        </div>
      </div>

      {!hasAnyConnection && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Connect an email provider to get started
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Choose Gmail or Outlook to enable automated email campaigns, AI responses, and prospect outreach. 
                  You can connect both for maximum flexibility.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {hasAnyConnection && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Email provider connected successfully!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  You're ready to create campaigns and send automated emails. 
                  <a href="/dashboard/campaigns" className="font-medium underline hover:no-underline ml-1">
                    Create your first campaign →
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 