'use client';

import React, { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface IncrementalAuthButtonProps {
  /** Array of scope groups to request (e.g., ['gmail', 'calendar']) */
  scopes: string[];
  /** Button text */
  children: React.ReactNode;
  /** CSS classes for the button */
  className?: string;
  /** Called when authorization is successful */
  onSuccess?: (grantedScopes: string[]) => void;
  /** Called when authorization fails */
  onError?: (error: string) => void;
  /** Whether to show loading state */
  disabled?: boolean;
}

export default function IncrementalAuthButton({
  scopes,
  children,
  className = '',
  onSuccess,
  onError,
  disabled = false,
}: IncrementalAuthButtonProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthorize = useCallback(async () => {
    if (!session?.user || isLoading) return;

    setIsLoading(true);

    try {
      // Construct the authorization URL
      const params = new URLSearchParams({
        scopes: scopes.join(','),
        redirect_uri: `${window.location.origin}/api/auth/google/callback`,
      });

      // Redirect to our Google OAuth endpoint
      const authUrl = `/api/auth/google?${params.toString()}`;
      
      // Store callback info in sessionStorage for after redirect
      if (onSuccess || onError) {
        sessionStorage.setItem('incrementalAuth', JSON.stringify({
          scopes,
          successCallback: !!onSuccess,
          errorCallback: !!onError,
        }));
      }

      // Redirect to authorization
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initiate incremental authorization:', error);
      setIsLoading(false);
      onError?.(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [session, scopes, onSuccess, onError, isLoading]);

  // Check if user is signed in
  if (!session?.user) {
    return (
      <button
        disabled
        className={`opacity-50 cursor-not-allowed ${className}`}
      >
        Sign in required
      </button>
    );
  }

  return (
    <button
      onClick={handleAuthorize}
      disabled={disabled || isLoading}
      className={`${className} ${(disabled || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isLoading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Authorizing...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

// Hook to handle post-authorization callbacks
export function useIncrementalAuthCallback() {
  React.useEffect(() => {
    // Check if we just returned from an incremental auth flow
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth');
    const authError = urlParams.get('error');
    const grantedScopes = urlParams.get('scopes');

    if (authSuccess === 'success' || authError) {
      // Retrieve callback info from sessionStorage
      const storedInfo = sessionStorage.getItem('incrementalAuth');
      if (storedInfo) {
        try {
          const { scopes, successCallback, errorCallback } = JSON.parse(storedInfo);
          
          if (authSuccess === 'success' && successCallback) {
            // Fire success event
            window.dispatchEvent(new CustomEvent('incrementalAuthSuccess', {
              detail: { scopes: grantedScopes?.split(',') || scopes }
            }));
          } else if (authError && errorCallback) {
            // Fire error event
            window.dispatchEvent(new CustomEvent('incrementalAuthError', {
              detail: { error: authError }
            }));
          }

          // Clean up
          sessionStorage.removeItem('incrementalAuth');
          
          // Clean up URL parameters
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        } catch (e) {
          console.error('Failed to parse incremental auth callback info:', e);
        }
      }
    }
  }, []);
}

// Example usage components for common scenarios

export function GmailAuthButton({ 
  className = "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded",
  onSuccess,
  onError 
}: { 
  className?: string;
  onSuccess?: (scopes: string[]) => void;
  onError?: (error: string) => void;
}) {
  return (
    <IncrementalAuthButton
      scopes={['gmail']}
      className={className}
      onSuccess={onSuccess}
      onError={onError}
    >
      Connect Gmail
    </IncrementalAuthButton>
  );
}

export function CalendarAuthButton({ 
  className = "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded",
  onSuccess,
  onError 
}: { 
  className?: string;
  onSuccess?: (scopes: string[]) => void;
  onError?: (error: string) => void;
}) {
  return (
    <IncrementalAuthButton
      scopes={['calendar']}
      className={className}
      onSuccess={onSuccess}
      onError={onError}
    >
      Connect Calendar
    </IncrementalAuthButton>
  );
}

export function DriveAuthButton({ 
  className = "bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded",
  onSuccess,
  onError 
}: { 
  className?: string;
  onSuccess?: (scopes: string[]) => void;
  onError?: (error: string) => void;
}) {
  return (
    <IncrementalAuthButton
      scopes={['drive']}
      className={className}
      onSuccess={onSuccess}
      onError={onError}
    >
      Connect Drive
    </IncrementalAuthButton>
  );
} 