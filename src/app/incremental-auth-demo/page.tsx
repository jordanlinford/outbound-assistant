'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import IncrementalAuthButton, { 
  GmailAuthButton, 
  CalendarAuthButton, 
  DriveAuthButton,
  useIncrementalAuthCallback 
} from '@/components/IncrementalAuthButton';

export default function IncrementalAuthDemo() {
  const { data: session, status } = useSession();
  const [authMessages, setAuthMessages] = useState<string[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  // Handle incremental auth callbacks
  useIncrementalAuthCallback();

  // Listen for auth events
  useEffect(() => {
    const handleSuccess = (event: CustomEvent) => {
      const scopes = event.detail.scopes;
      setAuthMessages(prev => [...prev, `✅ Successfully granted access to: ${scopes.join(', ')}`]);
      setUserPermissions(prev => [...new Set([...prev, ...scopes])]);
    };

    const handleError = (event: CustomEvent) => {
      const error = event.detail.error;
      setAuthMessages(prev => [...prev, `❌ Authorization failed: ${error}`]);
    };

    window.addEventListener('incrementalAuthSuccess', handleSuccess as EventListener);
    window.addEventListener('incrementalAuthError', handleError as EventListener);

    return () => {
      window.removeEventListener('incrementalAuthSuccess', handleSuccess as EventListener);
      window.removeEventListener('incrementalAuthError', handleError as EventListener);
    };
  }, []);

  // Load user's current permissions on mount
  useEffect(() => {
    if (session?.user) {
      // In a real app, you'd fetch this from your API
      // For demo purposes, we'll check what's in the database
      fetch('/api/user/permissions')
        .then(res => res.json())
        .then(data => {
          if (data.permissions) {
            setUserPermissions(data.permissions);
          }
        })
        .catch(err => console.error('Failed to load permissions:', err));
    }
  }, [session]);

  if (status === 'loading') {
    return <div className="p-8">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in required
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in to see the incremental authorization demo
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Incremental Authorization Demo
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Request Google permissions only when you need them
          </p>
        </div>

        {/* User Info */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Current User</h2>
          <div className="flex items-center space-x-4">
            {session.user.image && (
              <img 
                src={session.user.image} 
                alt={session.user.name || ''} 
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <p className="font-medium text-gray-900">{session.user.name}</p>
              <p className="text-sm text-gray-500">{session.user.email}</p>
            </div>
          </div>
        </div>

        {/* Current Permissions */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Current Permissions</h2>
          {userPermissions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {userPermissions.map(permission => (
                <span 
                  key={permission}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  {permission}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No additional permissions granted yet</p>
          )}
        </div>

        {/* Incremental Authorization Concept */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-blue-900 mb-4">
            What is Incremental Authorization?
          </h2>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>Traditional approach:</strong> Request all permissions upfront during sign-in
            </p>
            <p>
              <strong>Incremental approach:</strong> Request permissions only when needed for specific features
            </p>
            <p>
              <strong>Benefits:</strong> Better user experience, higher conversion rates, reduced permission fatigue
            </p>
          </div>
        </div>

        {/* Demo Scenarios */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Demo Scenarios</h2>
          
          <div className="space-y-6">
            {/* Gmail Scenario */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">📧 Email Campaign Feature</h3>
              <p className="text-sm text-gray-600 mb-4">
                When a user wants to send email campaigns, request Gmail permissions at that moment.
              </p>
              <GmailAuthButton 
                onSuccess={(scopes) => console.log('Gmail authorized:', scopes)}
                onError={(error) => console.error('Gmail auth failed:', error)}
              />
            </div>

            {/* Calendar Scenario */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">📅 Meeting Scheduler Feature</h3>
              <p className="text-sm text-gray-600 mb-4">
                When a user wants to schedule meetings, request Calendar permissions then.
              </p>
              <CalendarAuthButton 
                onSuccess={(scopes) => console.log('Calendar authorized:', scopes)}
                onError={(error) => console.error('Calendar auth failed:', error)}
              />
            </div>

            {/* Drive Scenario */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">💾 File Export Feature</h3>
              <p className="text-sm text-gray-600 mb-4">
                When a user wants to save files to Drive, request Drive permissions.
              </p>
              <DriveAuthButton 
                onSuccess={(scopes) => console.log('Drive authorized:', scopes)}
                onError={(error) => console.error('Drive auth failed:', error)}
              />
            </div>

            {/* Custom Scenario */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">🔧 Custom Permissions</h3>
              <p className="text-sm text-gray-600 mb-4">
                Request multiple permissions at once for a feature that needs them.
              </p>
              <IncrementalAuthButton
                scopes={['gmail', 'calendar']}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                onSuccess={(scopes) => console.log('Multiple scopes authorized:', scopes)}
                onError={(error) => console.error('Multi-scope auth failed:', error)}
              >
                Connect Gmail + Calendar
              </IncrementalAuthButton>
            </div>
          </div>
        </div>

        {/* Auth Messages */}
        {authMessages.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Authorization Log</h2>
            <div className="space-y-2">
              {authMessages.map((message, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded text-sm ${
                    message.startsWith('✅') 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {message}
                </div>
              ))}
            </div>
            <button
              onClick={() => setAuthMessages([])}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700"
            >
              Clear log
            </button>
          </div>
        )}

        {/* Implementation Guide */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Implementation Guide</h2>
          <div className="prose prose-sm text-gray-600">
            <h3>1. Basic Usage</h3>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`import { GmailAuthButton } from '@/components/IncrementalAuthButton';

<GmailAuthButton 
  onSuccess={(scopes) => console.log('Authorized:', scopes)}
  onError={(error) => console.error('Failed:', error)}
/>`}
            </pre>

            <h3>2. Custom Scopes</h3>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`import IncrementalAuthButton from '@/components/IncrementalAuthButton';

<IncrementalAuthButton
  scopes={['gmail', 'calendar', 'drive']}
  onSuccess={(scopes) => enableFeatures(scopes)}
>
  Enable Full Integration
</IncrementalAuthButton>`}
            </pre>

            <h3>3. Handle Callbacks</h3>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`import { useIncrementalAuthCallback } from '@/components/IncrementalAuthButton';

function MyComponent() {
  useIncrementalAuthCallback(); // Handles URL params after auth
  
  useEffect(() => {
    const handleSuccess = (event) => {
      console.log('New permissions:', event.detail.scopes);
    };
    
    window.addEventListener('incrementalAuthSuccess', handleSuccess);
    return () => window.removeEventListener('incrementalAuthSuccess', handleSuccess);
  }, []);
}`}
            </pre>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link 
            href="/dashboard" 
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
} 