'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { LogoutButton } from '@/components/LogoutButton';

export default function EmailTestPage() {
  const { data: session, status } = useSession();
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    to: '',
    subject: 'Test Email from Outbound Assistant',
    body: 'Hello!\n\nThis is a test email from your Outbound Assistant system.\n\nBest regards,\nYour Outbound Assistant',
    method: 'auto'
  });

  const checkGmailStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/email/gmail-test');
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ error: 'Failed to check Gmail status' });
    }
    setLoading(false);
  };

  const sendTestEmail = async () => {
    if (!formData.to) {
      alert('Please enter a recipient email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/email/gmail-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ error: 'Failed to send email' });
    }
    setLoading(false);
  };

  if (status === 'loading') {
    return <div className="p-8">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Email Test - Please Sign In</h1>
        <button
          onClick={() => signIn('google')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gmail Email Test</h1>
        <LogoutButton className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          Sign Out
        </LogoutButton>
      </div>

      <div className="mb-6 p-4 bg-gray-100 rounded">
        <p><strong>Signed in as:</strong> {session.user?.email}</p>
        <p><strong>Name:</strong> {session.user?.name}</p>
      </div>

      <div className="space-y-4 mb-6">
        <button
          onClick={checkGmailStatus}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check Gmail Status'}
        </button>
      </div>

      <div className="space-y-4 mb-6">
        <h2 className="text-xl font-semibold">Send Test Email</h2>
        <div>
          <label className="block text-sm font-medium mb-1">To:</label>
          <input
            type="email"
            value={formData.to}
            onChange={(e) => setFormData({...formData, to: e.target.value})}
            className="w-full p-2 border rounded"
            placeholder="recipient@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Subject:</label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({...formData, subject: e.target.value})}
            className="w-full p-2 border rounded"
            placeholder="Email subject"
            aria-label="Email subject"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Body:</label>
          <textarea
            value={formData.body}
            onChange={(e) => setFormData({...formData, body: e.target.value})}
            className="w-full p-2 border rounded h-32"
            placeholder="Email body content"
            aria-label="Email body content"
          />
        </div>
        <button
          onClick={sendTestEmail}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Test Email'}
        </button>
      </div>

      {testResult && (
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Result:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold mb-2">⚠️ Important:</h3>
        <p className="text-sm">
          If Gmail permissions are missing, you'll need to sign out and sign back in to grant Gmail access permissions.
          The system now requests Gmail send permissions during Google OAuth.
        </p>
      </div>
    </div>
  );
} 