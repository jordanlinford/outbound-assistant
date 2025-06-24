'use client';

import { useState, useEffect } from 'react';
import CSVLeadImporter from '@/components/CSVLeadImporter';
import OutboundCampaignManager from '@/components/OutboundCampaignManager';
import LinkedInContentTool from '@/components/LinkedInContentTool';

interface Lead {
  email: string;
  name?: string;
  company?: string;
  source?: string;
  signupDate?: string;
}

interface MarketingStats {
  totalLeads: number;
  activeCampaigns: number;
  emailsSent: number;
  linkedinPosts: number;
  responseRate: number;
}

export default function MarketingDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'campaigns' | 'linkedin' | 'automation'>('overview');
  const [showCSVImporter, setShowCSVImporter] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<MarketingStats>({
    totalLeads: 0,
    activeCampaigns: 0,
    emailsSent: 0,
    linkedinPosts: 0,
    responseRate: 0
  });

  useEffect(() => {
    // Load existing leads and stats
    loadMarketingData();
  }, []);

  const loadMarketingData = async () => {
    try {
      // This would typically fetch from your API
      // For now, we'll use mock data
      setStats({
        totalLeads: leads.length,
        activeCampaigns: 3,
        emailsSent: 245,
        linkedinPosts: 12,
        responseRate: 8.5
      });
    } catch (error) {
      console.error('Error loading marketing data:', error);
    }
  };

  const handleLeadsImported = (newLeads: Lead[]) => {
    setLeads(prev => [...prev, ...newLeads]);
    setStats(prev => ({ ...prev, totalLeads: prev.totalLeads + newLeads.length }));
  };

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'leads', label: '👥 Leads', icon: '👥' },
    { id: 'campaigns', label: '📧 Email Campaigns', icon: '📧' },
    { id: 'linkedin', label: '💼 LinkedIn', icon: '💼' },
    { id: 'automation', label: '🤖 Automation', icon: '🤖' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🚀 Marketing Assistant</h1>
              <p className="text-gray-600">Your AI-powered marketing automation hub</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCSVImporter(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <span>📊</span>
                <span>Import Leads</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">👥</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Leads</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📧</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeCampaigns}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📨</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Emails Sent</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.emailsSent}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">💼</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">LinkedIn Posts</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.linkedinPosts}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📈</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Response Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.responseRate}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">🚀 Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setShowCSVImporter(true)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-medium text-gray-900">Import Leads</div>
                  <div className="text-sm text-gray-600">Upload CSV from landing page</div>
                </button>
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="text-2xl mb-2">📧</div>
                  <div className="font-medium text-gray-900">Create Campaign</div>
                  <div className="text-sm text-gray-600">AI-powered email sequences</div>
                </button>
                <button
                  onClick={() => setActiveTab('linkedin')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="text-2xl mb-2">💼</div>
                  <div className="font-medium text-gray-900">Plan Content</div>
                  <div className="text-sm text-gray-600">LinkedIn content calendar</div>
                </button>
                <button
                  onClick={() => setActiveTab('automation')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="text-2xl mb-2">🤖</div>
                  <div className="font-medium text-gray-900">Automation</div>
                  <div className="text-sm text-gray-600">AI email responses</div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📋 Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="text-green-600">✅</div>
                  <div>
                    <div className="font-medium text-gray-900">Campaign "Product Launch" sent to 45 leads</div>
                    <div className="text-sm text-gray-600">2 hours ago</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="text-blue-600">📧</div>
                  <div>
                    <div className="font-medium text-gray-900">3 new email responses received</div>
                    <div className="text-sm text-gray-600">4 hours ago</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <div className="text-purple-600">💼</div>
                  <div>
                    <div className="font-medium text-gray-900">LinkedIn post generated and scheduled</div>
                    <div className="text-sm text-gray-600">1 day ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">👥 Lead Management</h3>
                <button
                  onClick={() => setShowCSVImporter(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Import CSV
                </button>
              </div>

              {leads.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No leads imported yet</h3>
                  <p className="text-gray-600 mb-4">
                    Import your landing page leads from CSV to get started
                  </p>
                  <button
                    onClick={() => setShowCSVImporter(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Import Your First Leads
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-900">{leads.length}</div>
                      <div className="text-sm text-blue-700">Total Leads</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-900">
                        {leads.filter(l => l.name).length}
                      </div>
                      <div className="text-sm text-green-700">With Names</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-900">
                        {leads.filter(l => l.company).length}
                      </div>
                      <div className="text-sm text-purple-700">With Companies</div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Company
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Source
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {leads.slice(0, 50).map((lead, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {lead.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {lead.name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {lead.company || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {lead.source || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => setActiveTab('campaigns')}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Add to Campaign
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="bg-white rounded-lg shadow p-6">
            <OutboundCampaignManager />
          </div>
        )}

        {activeTab === 'linkedin' && (
          <div className="bg-white rounded-lg shadow p-6">
            <LinkedInContentTool />
          </div>
        )}

        {activeTab === 'automation' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">🤖 Email Automation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Auto-Response System</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Automatically respond to incoming emails with AI-generated replies
                  </p>
                  <button
                    onClick={() => window.open('/automation', '_blank')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Configure Automation
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Follow-up Sequences</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Automatically send follow-ups to non-responders after 3 days
                  </p>
                  <button
                    onClick={() => setActiveTab('campaigns')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Sequence
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Automation Stats</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-900">24</div>
                  <div className="text-sm text-blue-700">Emails Automated Today</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-900">87%</div>
                  <div className="text-sm text-green-700">Response Accuracy</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-900">3</div>
                  <div className="text-sm text-yellow-700">Pending Human Review</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-900">156</div>
                  <div className="text-sm text-purple-700">Follow-ups Scheduled</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSV Importer Modal */}
      {showCSVImporter && (
        <CSVLeadImporter
          onLeadsImported={handleLeadsImported}
          onClose={() => setShowCSVImporter(false)}
        />
      )}
    </div>
  );
} 