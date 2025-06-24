'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function DebugMicrosoft() {
  const { data: session, status } = useSession();
  const [diagnostics, setDiagnostics] = useState<any>(null);

  const runDiagnostics = async () => {
    setDiagnostics('Running diagnostics...');
    
    try {
      // Check environment variables
      const envCheck = {
        clientId: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID ? '✅ Set' : '❌ Missing',
        nextAuthUrl: typeof window !== 'undefined' ? window.location.origin : 'Unknown',
        session: session ? '✅ Active' : '❌ None'
      };

      // Test the OAuth URL construction
      const testUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
      testUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || '');
      testUrl.searchParams.set('response_type', 'code');
      testUrl.searchParams.set('redirect_uri', `${window.location.origin}/api/auth/microsoft/callback`);
      testUrl.searchParams.set('scope', 'offline_access User.Read Mail.Read Mail.Send Mail.ReadWrite Calendars.Read Calendars.ReadWrite');
      testUrl.searchParams.set('state', 'test-state');
      
      setDiagnostics({
        environment: envCheck,
        oauthUrl: testUrl.toString(),
        redirectUri: `${window.location.origin}/api/auth/microsoft/callback`,
        scopes: ['offline_access', 'User.Read', 'Mail.Read', 'Mail.Send', 'Mail.ReadWrite', 'Calendars.Read', 'Calendars.ReadWrite'],
        clientId: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID,
        recommendations: [
          'Verify Redirect URI in Azure matches exactly',
          'Check API permissions are granted in Azure',
          'Ensure app supports "Accounts in any organizational directory and personal Microsoft accounts"',
          'Grant admin consent for all permissions'
        ]
      });
    } catch (error) {
      setDiagnostics({ error: error instanceof Error ? error.message : String(error) });
    }
  };

  const testDirectOAuth = () => {
    if (!session) {
      alert('Please login with Google first');
      return;
    }
    
    // Construct the OAuth URL manually for testing
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || '',
      response_type: 'code',
      redirect_uri: `${window.location.origin}/api/auth/microsoft/callback`,
      scope: 'offline_access User.Read',  // Start with minimal scope
      state: Buffer.from(JSON.stringify({
        userId: session.user?.id,
        timestamp: Date.now(),
        nonce: Math.random().toString(36).substring(2, 15)
      })).toString('base64')
    });
    
    const oauthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
    window.location.href = oauthUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Microsoft OAuth Diagnostics</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Issue: server_error</h2>
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
            <p className="text-red-800">
              <strong>server_error</strong> typically indicates:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-red-700">
              <li>Redirect URI mismatch in Azure app</li>
              <li>Missing API permissions</li>
              <li>App not configured for personal accounts</li>
              <li>Permissions not granted admin consent</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Status</h2>
          {session ? (
            <div className="space-y-2">
              <p className="text-green-600">✅ Authenticated as: {session.user?.email}</p>
              <p className="text-sm text-gray-600">User ID: {session.user?.id}</p>
            </div>
          ) : (
            <div>
              <p className="text-red-600">❌ Not authenticated</p>
              <a href="/login" className="text-blue-600 hover:underline">
                Login with Google first
              </a>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Diagnostic Tools</h2>
          
          <div className="space-y-4">
            <button
              onClick={runDiagnostics}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Run Configuration Diagnostics
            </button>

            <button
              onClick={testDirectOAuth}
              disabled={!session}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed ml-4"
            >
              Test Direct OAuth (Minimal Scope)
            </button>

            <button
              onClick={() => window.location.href = '/api/auth/microsoft-bypass'}
              disabled={!session}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed ml-4"
            >
              🔓 Test Bypass (No State Validation)
            </button>
          </div>

          {diagnostics && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Diagnostic Results:</h3>
              <pre className="text-sm overflow-auto">
                {typeof diagnostics === 'string' 
                  ? diagnostics 
                  : JSON.stringify(diagnostics, null, 2)
                }
              </pre>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Azure App Configuration Checklist</h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <input type="checkbox" className="mt-1" aria-label="Redirect URI configured" />
              <div>
                <strong>Redirect URI:</strong> Must be exactly 
                <code className="bg-gray-100 px-2 py-1 rounded ml-2">
                  http://localhost:3000/api/auth/microsoft/callback
                </code>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <input type="checkbox" className="mt-1" aria-label="Account types configured" />
              <div>
                <strong>Supported account types:</strong> 
                "Accounts in any organizational directory and personal Microsoft accounts"
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <input type="checkbox" className="mt-1" aria-label="API permissions configured" />
              <div>
                <strong>API Permissions:</strong> User.Read, Mail.Read, Mail.Send, Mail.ReadWrite, Calendars.Read, Calendars.ReadWrite
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <input type="checkbox" className="mt-1" aria-label="Admin consent granted" />
              <div>
                <strong>Admin Consent:</strong> Granted for all permissions
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 