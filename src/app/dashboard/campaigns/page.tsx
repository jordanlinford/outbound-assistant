'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import CampaignEmailSender from '@/components/CampaignEmailSender';
import AddProspectsModal from '@/components/AddProspectsModal';
import OnboardingGuide from '@/components/OnboardingGuide';
import AISequenceGenerator from '@/components/AISequenceGenerator';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: string;
  _count?: {
    prospects: number;
    sequences: number;
  };
  prospects?: Array<{
    id: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    title?: string;
  }>;
  callToAction?: string;
}

export default function CampaignsPage() {
  const { data: session } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEmailSender, setShowEmailSender] = useState<string | null>(null);
  const [showAddProspects, setShowAddProspects] = useState<string | null>(null);
  const [showSequenceGen, setShowSequenceGen] = useState<string | null>(null);
  const [sequenceSaving, setSequenceSaving] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedCampaignData, setSelectedCampaignData] = useState<Campaign | null>(null);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    callToAction: 'Schedule a meeting',
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Show onboarding for new users
  useEffect(() => {
    if (!loading && campaigns.length === 0) {
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [loading, campaigns.length]);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async () => {
    if (!newCampaign.name.trim()) return;

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCampaign),
      });

      if (response.ok) {
        const campaign = await response.json();
        setCampaigns([campaign, ...campaigns]);
        setNewCampaign({ name: '', description: '', callToAction: 'Schedule a meeting' });
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const launchCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/launch`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error launching campaign:', error);
    }
  };

  const updateCampaignStatus = async (campaignId: string, status: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error updating campaign status:', error);
    }
  };

  const openEmailSender = async (campaignId: string) => {
    try {
      // Fetch campaign with prospects
      const response = await fetch(`/api/campaigns/${campaignId}`);
      if (response.ok) {
        const campaign = await response.json();
        if (campaign.prospects && campaign.prospects.length > 0) {
          setSelectedCampaignData(campaign);
          setShowEmailSender(campaignId);
        } else {
          alert('This campaign has no prospects. Please add prospects first.');
        }
      }
    } catch (error) {
      console.error('Error fetching campaign details:', error);
    }
  };

  // Save AI-generated sequences to backend
  const saveGeneratedSequence = async (campaignId: string, sequence: any[]) => {
    setSequenceSaving(true);
    try {
      await Promise.all(
        sequence.map((email: any, idx: number) =>
          fetch(`/api/campaigns/${campaignId}/sequences`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: email.subject || `Email ${idx + 1}`,
              type: email.type.toUpperCase(),
              content: email.body,
              delay: email.delay ?? 0,
              order: idx + 1,
            }),
          })
        )
      );
      fetchCampaigns();
    } catch (err) {
      console.error('Error saving sequence', err);
      alert('Failed to save AI sequence');
    } finally {
      setSequenceSaving(false);
      setShowSequenceGen(null);
    }
  };

  // Ensure status checks are case-insensitive
  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading campaigns...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Campaigns</h1>
          <p className="text-gray-600">Manage your outbound email campaigns</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Create Campaign
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{campaigns.length}</div>
          <div className="text-sm text-gray-600">Total Campaigns</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">
            {campaigns.filter(c => c.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Active Campaigns</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-orange-600">
            {campaigns.reduce((sum, c) => sum + (c._count?.prospects || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">Total Prospects</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-purple-600">
            {campaigns.filter(c => c.status === 'draft').length}
          </div>
          <div className="text-sm text-gray-600">Draft Campaigns</div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Your Campaigns</h2>
        </div>
        
        {campaigns.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500 mb-4">No campaigns yet</div>
            <div className="space-x-3">
              <Button 
                onClick={() => setShowOnboarding(true)}
                variant="outline"
              >
                📚 Getting Started Guide
              </Button>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create Your First Campaign
              </Button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="p-6">
                {/* Responsive layout: stack on small screens, side-by-side on md+ */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">{campaign.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </span>
                    </div>
                    {campaign.description && (
                      <p className="text-gray-600 mt-1">{campaign.description}</p>
                    )}
                    {campaign.callToAction && (
                      <p className="text-purple-700 bg-purple-100 inline-block px-2 py-0.5 rounded text-xs mt-1">CTA: {campaign.callToAction}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>{campaign._count?.prospects || 0} prospects</span>
                      <span>•</span>
                      <span>Created {new Date(campaign.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {campaign.status.toLowerCase() === 'draft' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={() => setShowSequenceGen(campaign.id)}
                        >
                          Generate Sequence
                        </Button>
                        <Button
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                          onClick={() => setShowAddProspects(campaign.id)}
                        >
                          Add Prospects
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => launchCampaign(campaign.id)}
                        >
                          Launch
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openEmailSender(campaign.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Send Emails
                        </Button>
                      </>
                    )}
                    
                    {campaign.status.toLowerCase() === 'active' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                          onClick={() => setShowAddProspects(campaign.id)}
                        >
                          Add Prospects
                        </Button>
                        <Button
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                          onClick={() => updateCampaignStatus(campaign.id, 'paused')}
                        >
                          Pause
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openEmailSender(campaign.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Send More
                        </Button>
                      </>
                    )}
                    
                    {campaign.status.toLowerCase() === 'paused' && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => updateCampaignStatus(campaign.id, 'active')}
                      >
                        Resume
                      </Button>
                    )}

                    {/* Fallback – render basic actions if status is something else (e.g. COMPLETED) */}
                    {!['draft','active','paused'].includes(campaign.status.toLowerCase()) && (
                      <>
                        <Button
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                          onClick={() => setShowAddProspects(campaign.id)}
                        >
                          Add Prospects
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openEmailSender(campaign.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Send Emails
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create New Campaign</h2>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
                title="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="e.g., Q1 Outreach to SaaS Founders"
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  placeholder="Brief description of this campaign..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label htmlFor="ctaSelect" className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Call To Action
                </label>
                <select
                  id="ctaSelect"
                  value={newCampaign.callToAction}
                  onChange={(e) => setNewCampaign({ ...newCampaign, callToAction: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md"
                >
                  <option>Schedule a meeting</option>
                  <option>Click link</option>
                  <option>Respond to question</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={createCampaign}
                disabled={!newCampaign.name.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create Campaign
              </Button>
            </div>
          </div>
        </div>
      )}

             {/* Add Prospects Modal */}
       {showAddProspects && (
         <AddProspectsModal
           campaignId={showAddProspects}
           onClose={() => setShowAddProspects(null)}
           onProspectsAdded={() => {
             fetchCampaigns();
             setShowAddProspects(null);
           }}
         />
       )}

       {/* Onboarding Guide */}
       {showOnboarding && (
         <OnboardingGuide
           onClose={() => {
             setShowOnboarding(false);
             localStorage.setItem('hasSeenOnboarding', 'true');
           }}
         />
       )}

       {/* Email Sender Modal */}
       {showEmailSender && selectedCampaignData && (
         <CampaignEmailSender
           campaignId={showEmailSender}
           prospects={selectedCampaignData.prospects || []}
           onClose={() => {
             setShowEmailSender(null);
             setSelectedCampaignData(null);
           }}
           onEmailsSent={() => {
             fetchCampaigns();
             setShowEmailSender(null);
             setSelectedCampaignData(null);
           }}
         />
       )}

       {/* AI Sequence Generator */}
       {showSequenceGen && (
         <AISequenceGenerator
           onClose={() => setShowSequenceGen(null)}
           onSequenceGenerated={(seq) => saveGeneratedSequence(showSequenceGen, seq)}
         />
       )}
    </div>
  );
} 