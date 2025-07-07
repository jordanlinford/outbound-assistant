'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface MicrosoftLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export function MicrosoftLoginButton({ 
  onSuccess, 
  onError, 
  className = '',
  disabled = false 
}: MicrosoftLoginButtonProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const handleMicrosoftLogin = async () => {
    if (!session?.user) {
      onError?.('Please sign in first before connecting Microsoft account');
      return;
    }

    setLoading(true);
    
    try {
      // Use server-side OAuth flow instead of MSAL
      const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID;
      const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/microsoft/callback`);
      const scopes = encodeURIComponent([
        'openid',
        'profile',
        'email',
        'offline_access',
        'https://graph.microsoft.com/Mail.Read',
        'https://graph.microsoft.com/Mail.Send',
        'https://graph.microsoft.com/Mail.ReadWrite',
        'https://graph.microsoft.com/Calendars.Read',
        'https://graph.microsoft.com/Calendars.ReadWrite',
      ].join(' '));
      
      // Generate state in format expected by callback: user_<sanitizedEmail>_<timestamp>
      const sanitizedEmail = (session.user.email || '').replace(/[^a-zA-Z0-9]/g, '_');
      const state = `user_${sanitizedEmail}_${Date.now()}`;
      
      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${redirectUri}&` +
        `scope=${scopes}&` +
        `state=${state}&` +
        `response_mode=query`;
      
      // Redirect to Microsoft OAuth
      window.location.href = authUrl;
      
    } catch (error: any) {
      console.error('Microsoft login error:', error);
      const errorMessage = error.message || 'Failed to connect Microsoft account';
      onError?.(errorMessage);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleMicrosoftLogin}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center px-4 py-2 border border-gray-300 
        shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white 
        hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
        focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Connecting...
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path fill="#0078D4" d="M0 0h11.377v11.372H0zm12.623 0H24v11.372H12.623zM0 12.623h11.377V24H0zm12.623 0H24V24H12.623z"/>
          </svg>
          Connect Outlook
        </>
      )}
    </button>
  );
} 