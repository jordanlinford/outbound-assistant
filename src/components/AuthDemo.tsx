'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { MicrosoftLoginButton } from './MicrosoftLoginButton';
import SimpleMicrosoftLogin from './SimpleMicrosoftLogin';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface EmailStatus {
  google: {
    connected: boolean;
    email?: string;
    expiresAt?: string;
  };
  microsoft: {
    connected: boolean;
    email?: string;
    expiresAt?: string;
  };
}

export function AuthDemo() {
  const { data: session, status } = useSession();
  const [message, setMessage] = useState<string>('');
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  // Fetch email provider status
  const fetchEmailStatus = async () => {
    if (!session?.user) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/email/status');
      if (response.ok) {
        const status = await response.json();
        setEmailStatus(status);
      }
    } catch (error) {
      console.error('Failed to fetch email status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for URL parameters from OAuth callback
    const error = searchParams.get('error');
    const success = searchParams.get('success');
    const description = searchParams.get('description');
    const errorMessage = searchParams.get('message');

    if (success === 'microsoft_connected') {
      setMessage('Microsoft account connected successfully!');
      setTimeout(() => setMessage(''), 5000);
      // Refresh email status after successful connection
      setTimeout(() => fetchEmailStatus(), 1000);
    } else if (error) {
      let errorText = 'Microsoft connection failed';
      if (error === 'no_code') {
        errorText = 'No authorization code received from Microsoft';
      } else if (error === 'no_state') {
        errorText = 'Missing state parameter';
      } else if (error === 'state_mismatch') {
        errorText = 'Security validation failed (state mismatch)';
      } else if (error === 'oauth_failed') {
        errorText = `OAuth failed: ${errorMessage || 'Unknown error'}`;
      } else {
        errorText = `Microsoft OAuth error: ${error}${description ? ` - ${description}` : ''}`;
      }
      setMessage(errorText);
      setTimeout(() => setMessage(''), 10000); // Show errors longer
    }
  }, [searchParams]);

  // Fetch email status when session is available
  useEffect(() => {
    if (session?.user) {
      fetchEmailStatus();
    }
  }, [session]);

  const handleMicrosoftSuccess = () => {
    setMessage('Microsoft account connected successfully!');
    setTimeout(() => setMessage(''), 5000);
    // Refresh email status after successful connection
    fetchEmailStatus();
  };

  const handleMicrosoftError = (error: string) => {
    setMessage(`Microsoft connection failed: ${error}`);
    setTimeout(() => setMessage(''), 5000);
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connect your email provider to get started
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-4">
              <button
                onClick={() => signIn('google')}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#4285F4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <p className="text-sm text-gray-600 text-center">
                First sign in with Google, then connect Microsoft for Outlook access
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Account Connected
            </h3>
            
            <div className="flex items-center space-x-4 mb-6">
              <img
                className="h-12 w-12 rounded-full"
                src={session.user?.image || ''}
                alt={session.user?.name || ''}
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                <p className="text-sm text-gray-500">{session.user?.email}</p>
              </div>
            </div>

            {message && (
              <div className={`mb-4 p-4 rounded-md ${
                message.includes('successfully') 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {message}
              </div>
            )}

            <div className="space-y-4">
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Connect Email Providers
                </h4>
                
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Checking connection status...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                        <div className="flex items-center">
                          <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                            <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#4285F4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Gmail</p>
                            {emailStatus?.google?.connected ? (
                              <p className="text-sm text-green-600">✓ Connected</p>
                            ) : (
                              <p className="text-sm text-gray-500">Not connected</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                        <div className="flex items-center">
                          <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                            <path fill="#0078D4" d="M0 0h11.377v11.372H0zm12.623 0H24v11.372H12.623zM0 12.623h11.377V24H0zm12.623 0H24V24H12.623z"/>
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Microsoft Outlook</p>
                            {emailStatus?.microsoft?.connected ? (
                              <p className="text-sm text-green-600">✓ Connected</p>
                            ) : (
                              <p className="text-sm text-gray-500">Connect for Outlook email access</p>
                            )}
                          </div>
                        </div>
                        {!emailStatus?.microsoft?.connected && (
                          <MicrosoftLoginButton
                            onSuccess={handleMicrosoftSuccess}
                            onError={handleMicrosoftError}
                            className="px-3 py-1 text-sm"
                          />
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Simplified Microsoft Login Alternative */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Alternative Microsoft Connection
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  If you're experiencing connection issues, try this simplified approach:
                </p>
                <SimpleMicrosoftLogin />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={() => signOut()}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 