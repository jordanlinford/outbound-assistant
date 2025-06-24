'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function AIEmailTestPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    incomingEmail: {
      from: 'prospect@company.com',
      subject: 'Interested in your services',
      body: `Hi there,

I came across your company and I'm interested in learning more about your business development services. 

We're a growing SaaS company looking to scale our sales efforts. Could you tell me more about how you help companies like ours?

Best regards,
John Smith
CEO, TechCorp Inc.`
    },
    responseType: 'sales',
    tone: 'professional',
    length: 'medium',
    includeCallToAction: true,
    customInstructions: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/email/ai-respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to generate AI response'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateFollowUpSequence = async () => {
    setLoading(true);
    try {
      // This would be a separate endpoint for follow-up sequences
      const mockSequence = [
        {
          delay: 3,
          subject: "Quick follow-up on our BDR services",
          body: "Hi John,\n\nI wanted to follow up on your inquiry about our business development services...",
          type: "value-add"
        },
        {
          delay: 7,
          subject: "How other SaaS companies scaled with us",
          body: "Hi John,\n\nI thought you'd be interested in how we helped TechFlow increase their qualified leads by 300%...",
          type: "social-proof"
        }
      ];
      
      setResult({
        ...result,
        followUpSequence: mockSequence
      });
    } catch (error) {
      console.error('Error generating follow-up sequence:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) return <div>Please sign in to test AI email responses.</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🤖 AI Email Response System</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Incoming Email</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">From:</label>
              <input
                type="email"
                value={formData.incomingEmail.from}
                onChange={(e) => setFormData({
                  ...formData,
                  incomingEmail: { ...formData.incomingEmail, from: e.target.value }
                })}
                className="w-full p-2 border rounded"
                aria-label="From email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Subject:</label>
              <input
                type="text"
                value={formData.incomingEmail.subject}
                onChange={(e) => setFormData({
                  ...formData,
                  incomingEmail: { ...formData.incomingEmail, subject: e.target.value }
                })}
                className="w-full p-2 border rounded"
                aria-label="Email subject"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email Body:</label>
              <textarea
                value={formData.incomingEmail.body}
                onChange={(e) => setFormData({
                  ...formData,
                  incomingEmail: { ...formData.incomingEmail, body: e.target.value }
                })}
                className="w-full p-2 border rounded h-32"
                aria-label="Email body content"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Response Type:</label>
                <select
                  value={formData.responseType}
                  onChange={(e) => setFormData({ ...formData, responseType: e.target.value })}
                  className="w-full p-2 border rounded"
                  aria-label="Response type"
                >
                  <option value="sales">Sales</option>
                  <option value="support">Support</option>
                  <option value="general">General</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="scheduling">Scheduling</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tone:</label>
                <select
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  className="w-full p-2 border rounded"
                  aria-label="Response tone"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Custom Instructions (Optional):</label>
              <textarea
                value={formData.customInstructions}
                onChange={(e) => setFormData({ ...formData, customInstructions: e.target.value })}
                className="w-full p-2 border rounded h-20"
                placeholder="e.g., Mention our upcoming webinar, Include pricing information..."
                aria-label="Custom instructions"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Generating AI Response...' : 'Generate AI Response'}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">AI Response & Analysis</h2>
          
          {result ? (
            <div className="space-y-4">
              {result.success ? (
                <>
                  {/* Email Analysis */}
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-semibold mb-2">📊 Email Analysis</h3>
                    <div className="text-sm space-y-1">
                      <p><strong>Intent:</strong> {result.analysis?.intent}</p>
                      <p><strong>Sentiment:</strong> <span className={`px-2 py-1 rounded text-xs ${
                        result.analysis?.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                        result.analysis?.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{result.analysis?.sentiment}</span></p>
                      <p><strong>Urgency:</strong> <span className={`px-2 py-1 rounded text-xs ${
                        result.analysis?.urgency === 'high' ? 'bg-red-100 text-red-800' :
                        result.analysis?.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>{result.analysis?.urgency}</span></p>
                      <p><strong>Topics:</strong> {result.analysis?.topics?.join(', ')}</p>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="bg-blue-50 p-4 rounded">
                    <h3 className="font-semibold mb-2">🤖 Generated Response</h3>
                    <div className="space-y-2">
                      <p><strong>Subject:</strong> {result.aiResponse?.subject}</p>
                      <div>
                        <strong>Body:</strong>
                        <div className="mt-2 p-3 bg-white rounded border text-sm whitespace-pre-wrap">
                          {result.aiResponse?.body}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        <strong>Confidence:</strong> {Math.round((result.aiResponse?.confidence || 0) * 100)}%
                      </p>
                    </div>
                  </div>

                  {/* Routing Decision */}
                  <div className={`p-4 rounded ${
                    result.routingDecision?.routeToHuman ? 'bg-yellow-50' : 'bg-green-50'
                  }`}>
                    <h3 className="font-semibold mb-2">
                      {result.routingDecision?.routeToHuman ? '👤 Human Review Needed' : '🤖 AI Can Handle'}
                    </h3>
                    <p className="text-sm">{result.routingDecision?.reason}</p>
                    {result.routingDecision?.suggestedDepartment && (
                      <p className="text-sm mt-1">
                        <strong>Route to:</strong> {result.routingDecision.suggestedDepartment}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={generateFollowUpSequence}
                      disabled={loading}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                      Generate Follow-up Sequence
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(result.aiResponse?.body || '')}
                      className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
                    >
                      Copy Response
                    </button>
                  </div>

                  {/* Follow-up Sequence */}
                  {result.followUpSequence && (
                    <div className="bg-purple-50 p-4 rounded">
                      <h3 className="font-semibold mb-2">📅 Follow-up Sequence</h3>
                      <div className="space-y-3">
                        {result.followUpSequence.map((email: any, index: number) => (
                          <div key={index} className="bg-white p-3 rounded border">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-medium">Day {email.delay}</span>
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                {email.type}
                              </span>
                            </div>
                            <p className="text-sm font-medium">{email.subject}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {email.body.substring(0, 100)}...
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-red-50 p-4 rounded">
                  <p className="text-red-800">
                    <strong>Error:</strong> {result.error}
                  </p>
                  {result.details && (
                    <p className="text-red-600 text-sm mt-1">{result.details}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Generate an AI response to see results here.</p>
          )}
        </div>
      </div>

      {/* Features Overview */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">🚀 AI Email Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded">
            <div className="text-2xl mb-2">🧠</div>
            <h3 className="font-medium">Smart Analysis</h3>
            <p className="text-sm text-gray-600">Intent, sentiment & urgency detection</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded">
            <div className="text-2xl mb-2">✍️</div>
            <h3 className="font-medium">AI Responses</h3>
            <p className="text-sm text-gray-600">Context-aware, personalized replies</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded">
            <div className="text-2xl mb-2">📅</div>
            <h3 className="font-medium">Follow-up Sequences</h3>
            <p className="text-sm text-gray-600">Automated nurture campaigns</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-medium">Smart Routing</h3>
            <p className="text-sm text-gray-600">Human handoff when needed</p>
          </div>
        </div>
      </div>
    </div>
  );
} 