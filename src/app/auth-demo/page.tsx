'use client';

import { useSession, signIn } from 'next-auth/react';
import IncrementalAuthButton from '@/components/IncrementalAuthButton';
import { EmailProviderStatus } from '@/components/EmailProviderStatus';

export default function AuthDemo() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h2 className="text-lg font-medium text-gray-900">Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Authentication Demo</h1>
          <p className="mt-2 text-gray-600">Test Google OAuth and incremental authorization</p>
        </div>

        {/* Authentication Status */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Authentication Status</h2>
          {session ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <img 
                  src={session.user?.image || ''} 
                  alt={session.user?.name || ''} 
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium text-gray-900">{session.user?.name}</p>
                  <p className="text-sm text-gray-500">{session.user?.email}</p>
                </div>
              </div>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Authenticated
              </div>
            </div>
          ) : (
            <div>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mb-3">
                ✗ Not authenticated
              </div>
              <p className="text-sm text-gray-600 mb-4">Please sign in to test incremental authorization.</p>
              <button
                onClick={() => signIn('google')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Sign in with Google
              </button>
            </div>
          )}
        </div>

        {/* Email Provider Status */}
        <EmailProviderStatus />

        {/* Incremental Authorization */}
        {session && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Incremental Authorization</h2>
            <p className="text-sm text-gray-600 mb-4">
              Request additional permissions only when needed for specific features.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <IncrementalAuthButton
                scopes={['https://www.googleapis.com/auth/gmail.readonly']}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Authorize Gmail
              </IncrementalAuthButton>
              
              <IncrementalAuthButton
                scopes={['https://www.googleapis.com/auth/calendar.readonly']}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Authorize Calendar
              </IncrementalAuthButton>
              
              <IncrementalAuthButton
                scopes={['https://www.googleapis.com/auth/drive.readonly']}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
              >
                Authorize Drive
              </IncrementalAuthButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 