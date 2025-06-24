'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  prospectCount: number;
  sequenceCount: number;
  createdAt: string;
}

interface CampaignConfig {
  name: string;
  description?: string;
  industry?: string;
  valueProposition?: string;
  callToAction?: string;
  tone: 'professional' | 'casual' | 'friendly' | 'direct';
  sequenceSteps: number;
  delayBetweenEmails: number;
  maxEmailsPerDay: number;
  trackOpens: boolean;
  trackClicks: boolean;
  autoRespond: boolean;
}

interface CampaignAnalytics {
  totalProspects: number;
  contacted: number;
  replied: number;
  qualified: number;
  emailsSent: number;
  repliesReceived: number;
  responseRate: number;
  conversionRate: number;
}

export default function OutboundCampaignsPage() {
  const { data: session } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [prospects, setProspects] = useState('');

  const [config, setConfig] = useState<CampaignConfig>({
    name: '',
    description: '',
    industry: 'Technology',
    valueProposition: 'Helping businesses grow and scale efficiently with AI-powered solutions',
    callToAction: 'Schedule a 15-minute discovery call',
    tone: 'professional',
    sequenceSteps: 3,
    delayBetweenEmails: 24,
    maxEmailsPerDay: 50,
    trackOpens: true,
    trackClicks: true,
    autoRespond: true
  });

  useEffect(() => {
    if (session?.user) {
      loadCampaigns();
    }
  }, [session]);

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const handleCreateCampaign = async () => {
    if (!config.name || !prospects.trim()) {
      alert('Campaign name and at least one prospect email are required');
      return;
    }

    const prospectList = prospects
      .split('\n')
      .filter(email => email.trim())
      .map(email => ({ email: email.trim() }));

    if (prospectList.length === 0) {
      alert('Please enter at least one valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/campaigns/outbound/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config,
          prospects: prospectList
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Campaign "${config.name}" created successfully with ${data.campaign.prospectCount} prospects and ${data.campaign.sequenceCount} AI-generated email sequences!`);
        setShowCreateModal(false);
        loadCampaigns();
        resetForm();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to launch this campaign? This will start sending emails to all prospects.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/campaigns/outbound/launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ campaignId }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        loadCampaigns();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error launching campaign:', error);
      alert('Failed to launch campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalytics = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setLoading(true);
    try {
      const response = await fetch(`/api/campaigns/outbound/analytics?campaignId=${campaign.id}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
        setShowAnalyticsModal(true);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      alert('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setConfig({
      name: '',
      description: '',
      industry: 'Technology',
      valueProposition: 'Helping businesses grow and scale efficiently with AI-powered solutions',
      callToAction: 'Schedule a 15-minute discovery call',
      tone: 'professional',
      sequenceSteps: 3,
      delayBetweenEmails: 24,
      maxEmailsPerDay: 50,
      trackOpens: true,
      trackClicks: true,
      autoRespond: true
    });
    setProspects('');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    
    return statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🚀 AI-Powered Outbound Campaigns</h2>
            <p className="text-gray-600 mt-1">Create campaigns with AI-generated sequences and automated responses</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium"
          >
            <span className="mr-2">🤖</span>
            Create AI Campaign
          </button>
        </div>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🤖</span>
            <div>
              <h3 className="font-semibold text-blue-900">AI Email Generation</h3>
              <p className="text-sm text-blue-700">Personalized sequences for each prospect</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚡</span>
            <div>
              <h3 className="font-semibold text-green-900">Auto-Response</h3>
              <p className="text-sm text-green-700">AI handles replies automatically</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📊</span>
            <div>
              <h3 className="font-semibold text-purple-900">Real-time Analytics</h3>
              <p className="text-sm text-purple-700">Track performance and ROI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      {campaigns.length > 0 ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Your AI Campaigns</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prospects
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sequences
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                        <div className="text-sm text-gray-500">{campaign.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.prospectCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.sequenceCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {campaign.status === 'draft' && (
                        <button
                          onClick={() => handleLaunchCampaign(campaign.id)}
                          className="text-green-600 hover:text-green-900"
                          disabled={loading}
                        >
                          Launch
                        </button>
                      )}
                      <button
                        onClick={() => handleViewAnalytics(campaign)}
                        className="text-blue-600 hover:text-blue-900"
                        disabled={loading}
                      >
                        Analytics
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No AI campaigns yet</h3>
          <p className="text-gray-600 mb-6">Create your first AI-powered outbound campaign to start generating leads automatically.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium"
          >
            <span className="mr-2">🤖</span>
            Create Your First AI Campaign
          </button>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">🤖 Create AI-Powered Campaign</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Q1 2024 AI Outreach"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={config.description}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Targeting SaaS companies for our AI solution"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <select
                    value={config.industry}
                    onChange={(e) => setConfig({ ...config, industry: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Education">Education</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Tone
                  </label>
                  <select
                    value={config.tone}
                    onChange={(e) => setConfig({ ...config, tone: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="casual">Casual</option>
                    <option value="direct">Direct</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value Proposition
                </label>
                <textarea
                  value={config.valueProposition}
                  onChange={(e) => setConfig({ ...config, valueProposition: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="What unique value do you provide?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sequence Steps
                  </label>
                  <select
                    value={config.sequenceSteps}
                    onChange={(e) => setConfig({ ...config, sequenceSteps: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={3}>3 Steps</option>
                    <option value={4}>4 Steps</option>
                    <option value={5}>5 Steps</option>
                    <option value={6}>6 Steps</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delay Between Emails (hours)
                  </label>
                  <input
                    type="number"
                    value={config.delayBetweenEmails}
                    onChange={(e) => setConfig({ ...config, delayBetweenEmails: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    max="168"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prospects (Email addresses, one per line) *
                </label>
                <textarea
                  value={prospects}
                  onChange={(e) => setProspects(e.target.value)}
                  placeholder="john@company.com&#10;jane@business.com&#10;mike@startup.io"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter email addresses, one per line. AI will generate personalized sequences for each prospect.
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.autoRespond}
                    onChange={(e) => setConfig({ ...config, autoRespond: e.target.checked })}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Enable AI Auto-Response to replies</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.trackOpens}
                    onChange={(e) => setConfig({ ...config, trackOpens: e.target.checked })}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Track email opens</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating AI Campaign...' : '🤖 Create AI Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && selectedCampaign && analytics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                📊 Analytics: {selectedCampaign.name}
              </h3>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">{analytics.totalProspects}</div>
                <div className="text-sm text-blue-700">Total Prospects</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-900">{analytics.contacted}</div>
                <div className="text-sm text-green-700">Contacted</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-900">{analytics.replied}</div>
                <div className="text-sm text-purple-700">Replied</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-900">{analytics.qualified}</div>
                <div className="text-sm text-orange-700">Qualified</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{analytics.emailsSent}</div>
                <div className="text-sm text-gray-700">Emails Sent</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{analytics.repliesReceived}</div>
                <div className="text-sm text-gray-700">Replies Received</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-indigo-900">
                  {analytics.responseRate.toFixed(1)}%
                </div>
                <div className="text-sm text-indigo-700">Response Rate</div>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-indigo-900">
                  {analytics.conversionRate.toFixed(1)}%
                </div>
                <div className="text-sm text-indigo-700">Conversion Rate</div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 