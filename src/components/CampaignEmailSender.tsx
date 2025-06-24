'use client';

import { useState } from 'react';
import { Button } from './ui/button';

interface Prospect {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
}

interface CampaignEmailSenderProps {
  campaignId: string;
  prospects: Prospect[];
  onClose: () => void;
  onEmailsSent: () => void;
}

export default function CampaignEmailSender({ 
  campaignId, 
  prospects, 
  onClose, 
  onEmailsSent 
}: CampaignEmailSenderProps) {
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [selectedProspects, setSelectedProspects] = useState<string[]>(prospects.map(p => p.id));
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSendEmails = async (sendNow: boolean = true) => {
    setSending(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prospectIds: selectedProspects,
          emailSubject,
          emailBody,
          sendNow,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResults(data);
        if (sendNow) {
          onEmailsSent();
        }
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      alert('Failed to send emails. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('emailBody') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newText = before + `{${variable}}` + after;
      setEmailBody(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 2, start + variable.length + 2);
      }, 0);
    }
  };

  const previewEmail = (prospect: Prospect) => {
    const personalizedSubject = emailSubject
      .replace(/\{firstName\}/g, prospect.firstName || 'there')
      .replace(/\{lastName\}/g, prospect.lastName || '')
      .replace(/\{fullName\}/g, `${prospect.firstName || ''} ${prospect.lastName || ''}`.trim() || 'there')
      .replace(/\{company\}/g, prospect.company || 'your company')
      .replace(/\{title\}/g, prospect.title || 'your role');

    const personalizedBody = emailBody
      .replace(/\{firstName\}/g, prospect.firstName || 'there')
      .replace(/\{lastName\}/g, prospect.lastName || '')
      .replace(/\{fullName\}/g, `${prospect.firstName || ''} ${prospect.lastName || ''}`.trim() || 'there')
      .replace(/\{company\}/g, prospect.company || 'your company')
      .replace(/\{title\}/g, prospect.title || 'your role');

    return { subject: personalizedSubject, body: personalizedBody };
  };

  if (results) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-green-600">Emails Sent Successfully!</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" title="Close">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 p-3 rounded">
                <div className="text-2xl font-bold text-green-600">{results.stats.sent}</div>
                <div className="text-sm text-gray-600">Sent</div>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <div className="text-2xl font-bold text-red-600">{results.stats.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-2xl font-bold text-blue-600">{results.stats.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </div>

          {results.results && (
            <div className="space-y-2">
              <h3 className="font-medium">Detailed Results:</h3>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {results.results.map((result: any, index: number) => (
                  <div key={index} className={`text-sm p-2 rounded ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <span className="font-medium">{result.email}</span>
                    {result.success ? ' ✓ Sent' : ` ✗ Failed: ${result.error}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Send Campaign Emails</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" title="Close">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Composer */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Subject
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Quick question about {company}"
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Body
              </label>
              <div className="mb-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => insertVariable('firstName')}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  {'{firstName}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('fullName')}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  {'{fullName}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('company')}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  {'{company}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('title')}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  {'{title}'}
                </button>
              </div>
              <textarea
                id="emailBody"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Hi {firstName},&#10;&#10;I noticed {company} is doing great work in [industry]. I'd love to chat about how we could help you [specific value proposition].&#10;&#10;Would you be open to a quick 15-minute call this week?&#10;&#10;Best regards,&#10;[Your Name]"
                rows={12}
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipients ({selectedProspects.length} selected)
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                {prospects.map((prospect) => (
                  <label key={prospect.id} className="flex items-center space-x-2 p-1">
                    <input
                      type="checkbox"
                      checked={selectedProspects.includes(prospect.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProspects([...selectedProspects, prospect.id]);
                        } else {
                          setSelectedProspects(selectedProspects.filter(id => id !== prospect.id));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">
                      {prospect.name || `${prospect.firstName || ''} ${prospect.lastName || ''}`.trim() || prospect.email}
                      {prospect.company && ` (${prospect.company})`}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProspects(prospects.map(p => p.id))}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProspects([])}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Select None
                </button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Email Preview</h3>
            {prospects.length > 0 && (
              <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                <div className="mb-2">
                  <strong>To:</strong> {prospects[0].email}
                </div>
                <div className="mb-2">
                  <strong>Subject:</strong> {previewEmail(prospects[0]).subject}
                </div>
                <div className="border-t pt-2">
                  <div className="whitespace-pre-wrap text-sm">
                    {previewEmail(prospects[0]).body}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="text-sm text-gray-600">
            Ready to send {selectedProspects.length} email{selectedProspects.length !== 1 ? 's' : ''}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleSendEmails(false)}
              disabled={sending || selectedProspects.length === 0 || !emailSubject || !emailBody}
            >
              Schedule for Later
            </Button>
            <Button
              onClick={() => handleSendEmails(true)}
              disabled={sending || selectedProspects.length === 0 || !emailSubject || !emailBody}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sending ? 'Sending...' : 'Send Now'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 