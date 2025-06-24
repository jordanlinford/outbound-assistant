'use client';

import { useState } from 'react';

export default function SimpleMicrosoftLogin() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<string>('');

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setStatus('Redirecting to Microsoft...');
      
      // Use the bypass Microsoft OAuth route that doesn't require authentication
      window.location.href = '/api/auth/microsoft-bypass';
    } catch (error) {
      console.error('Error connecting to Microsoft:', error);
      setStatus('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setIsConnecting(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Connect Microsoft Outlook</h3>
      
      {status && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-800">{status}</p>
        </div>
      )}
      
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? 'Connecting...' : 'Connect Microsoft Outlook'}
      </button>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>This will connect your Microsoft Outlook account for:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Reading emails</li>
          <li>Sending emails</li>
          <li>Managing calendar events</li>
        </ul>
      </div>
    </div>
  );
} 