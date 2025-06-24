'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function MicrosoftOAuthTest() {
  const { data: session, status } = useSession();
  const [testResult, setTestResult] = useState<string>('');

  const startMicrosoftAuth = async () => {
    if (!session?.user) {
      setTestResult('❌ No active session found. Please login first.');
      return;
    }

    try {
      setTestResult('🔄 Starting Microsoft OAuth...');
      window.location.href = '/api/auth/microsoft';
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    }
  };

  const clearCache = () => {
    // Clear browser cache/cookies related to Microsoft OAuth
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    sessionStorage.clear();
    localStorage.clear();
    setTestResult('🧹 Cache cleared. Please try OAuth again.');
  };

  if (status === 'loading') {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Microsoft OAuth Test</h1>
        
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
                Go to login page
              </a>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Microsoft OAuth Test</h2>
          
          <div className="space-y-4">
            <button
              onClick={startMicrosoftAuth}
              disabled={!session}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {session ? 'Connect Microsoft Account' : 'Login Required'}
            </button>

            <button
              onClick={clearCache}
              className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 ml-4"
            >
              Clear Cache & Cookies
            </button>
          </div>

          {testResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-mono text-sm">{testResult}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Troubleshooting Tips</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Ensure you're logged in with NextAuth first</li>
            <li>• Clear browser cache/cookies if you get state mismatch errors</li>
            <li>• Check that Microsoft Client ID and Secret are configured</li>
            <li>• Verify the redirect URI matches in Microsoft Azure</li>
            <li>• Make sure the session is active and not expired</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 