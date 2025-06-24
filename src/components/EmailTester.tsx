'use client';

import React, { useState } from 'react';

interface EmailTestResult {
  success: boolean;
  message?: string;
  error?: string;
  method?: string;
}

export default function EmailTester() {
  const [formData, setFormData] = useState({
    to: '',
    subject: 'Test Email from Outbound Assistant',
    body: 'Hello!\n\nThis is a test email from your Outbound Assistant system.\n\nBest regards,\nYour Outbound Assistant',
    method: 'auto'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EmailTestResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      // Choose endpoint based on method
      let endpoint = '/api/email/test'; // SendGrid fallback
      
      if (formData.method === 'gmail' || formData.method === 'auto') {
        endpoint = '/api/email/gmail-test'; // Use Gmail API
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: formData.to,
          subject: formData.subject,
          body: formData.body,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to send test email'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">📧 Email System Test</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="to" className="block text-sm font-medium text-gray-700">
            To Email Address
          </label>
          <input
            type="email"
            id="to"
            value={formData.to}
            onChange={(e) => handleInputChange('to', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="test@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            value={formData.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-gray-700">
            Message Body
          </label>
          <textarea
            id="body"
            value={formData.body}
            onChange={(e) => handleInputChange('body', e.target.value)}
            rows={4}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="method" className="block text-sm font-medium text-gray-700">
            Email Method
          </label>
          <select
            id="method"
            value={formData.method}
            onChange={(e) => handleInputChange('method', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="auto">Auto (Gmail → SendGrid fallback)</option>
            <option value="gmail">Gmail Only</option>
            <option value="sendgrid">SendGrid Only</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Auto will use your connected Gmail account if available, otherwise SendGrid
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : 'Send Test Email'}
        </button>
      </form>

      {result && (
        <div className={`mt-4 p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex">
            <div className={`flex-shrink-0 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
              {result.success ? (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? 'Email Sent Successfully!' : 'Email Failed to Send'}
              </h3>
              <div className={`mt-2 text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                {result.message && <p>{result.message}</p>}
                {result.error && <p>Error: {result.error}</p>}
                {result.method && <p className="text-xs mt-1">Method used: {result.method}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 border-t pt-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">📋 Setup Instructions</h3>
        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>For Gmail:</strong> Your Google account is automatically connected via OAuth</p>
          <p><strong>For SendGrid:</strong> Add SENDGRID_API_KEY to your .env.local file</p>
          <p><strong>Backup Email:</strong> Set FROM_EMAIL in .env.local for SendGrid</p>
        </div>
      </div>
    </div>
  );
} 