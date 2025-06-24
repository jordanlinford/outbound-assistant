'use client';

import { useState } from 'react';

export default function MarketingDemo() {
  const [currentStep, setCurrentStep] = useState(1);
  const [demoData, setDemoData] = useState({
    leads: [] as any[],
    campaign: null as any,
    linkedinPosts: [] as any[]
  });

  const steps = [
    {
      id: 1,
      title: "📊 Import Landing Page Leads",
      description: "Upload CSV file with email addresses from your landing page",
      action: "Import CSV"
    },
    {
      id: 2,
      title: "📧 Create AI Email Campaign",
      description: "AI generates personalized email sequences with follow-ups",
      action: "Create Campaign"
    },
    {
      id: 3,
      title: "🤖 Enable Auto-Responses",
      description: "AI automatically responds to replies and handles objections",
      action: "Enable Automation"
    },
    {
      id: 4,
      title: "💼 Plan LinkedIn Content",
      description: "Generate content calendar to build brand recognition",
      action: "Plan Content"
    },
    {
      id: 5,
      title: "🚀 Launch & Monitor",
      description: "Everything runs automatically with smart intervention points",
      action: "Launch"
    }
  ];

  const simulateStep = async (stepId: number) => {
    switch (stepId) {
      case 1:
        // Simulate CSV import
        const mockLeads = [
          { email: 'john@startup.com', name: 'John Doe', company: 'StartupCo', source: 'landing-page' },
          { email: 'sarah@techfirm.com', name: 'Sarah Smith', company: 'TechFirm', source: 'landing-page' },
          { email: 'mike@innovate.io', name: 'Mike Johnson', company: 'InnovateCorp', source: 'landing-page' }
        ];
        setDemoData(prev => ({ ...prev, leads: mockLeads }));
        break;
      
      case 2:
        // Simulate campaign creation
        const mockCampaign = {
          name: 'Product Launch Outreach',
          industry: 'SaaS',
          tone: 'Professional',
          sequences: [
            { step: 1, subject: 'Quick question about your workflow', delay: 0 },
            { step: 2, subject: 'Following up on my previous email', delay: 3 },
            { step: 3, subject: 'Last attempt - thought you might be interested', delay: 7 }
          ]
        };
        setDemoData(prev => ({ ...prev, campaign: mockCampaign }));
        break;
      
      case 4:
        // Simulate LinkedIn content planning
        const mockPosts = [
          { date: '2025-06-18', type: 'industry-insight', content: 'The future of SaaS automation...' },
          { date: '2025-06-20', type: 'company-update', content: 'Excited to share our latest feature...' },
          { date: '2025-06-22', type: 'thought-leadership', content: 'Why most startups fail at email marketing...' }
        ];
        setDemoData(prev => ({ ...prev, linkedinPosts: mockPosts }));
        break;
    }
    
    setCurrentStep(stepId + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🚀 Marketing Assistant Demo
          </h1>
          <p className="text-lg text-gray-600">
            See how your complete AI marketing workflow works
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep > step.id 
                    ? 'bg-green-500 text-white' 
                    : currentStep === step.id 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step.id ? '✓' : step.id}
                </div>
                <div className="text-xs text-gray-600 mt-2 text-center max-w-20">
                  {step.title.split(' ').slice(1).join(' ')}
                </div>
                {index < steps.length - 1 && (
                  <div className={`absolute w-full h-0.5 top-5 left-1/2 -translate-x-1/2 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`} style={{ width: '80px', marginLeft: '40px' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {currentStep <= steps.length && (
            <div className="text-center">
              <div className="text-6xl mb-4">
                {steps[currentStep - 1]?.title.split(' ')[0]}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {steps[currentStep - 1]?.title}
              </h2>
              <p className="text-gray-600 mb-8">
                {steps[currentStep - 1]?.description}
              </p>

              {/* Step-specific content */}
              {currentStep === 1 && (
                <div className="bg-blue-50 rounded-lg p-6 mb-6">
                  <h3 className="font-medium text-blue-900 mb-2">Sample CSV Format:</h3>
                  <div className="text-sm text-blue-800 font-mono bg-white rounded p-3">
                    email,name,company,source<br/>
                    john@startup.com,John Doe,StartupCo,landing-page<br/>
                    sarah@techfirm.com,Sarah Smith,TechFirm,landing-page
                  </div>
                </div>
              )}

              {currentStep === 2 && demoData.leads.length > 0 && (
                <div className="bg-green-50 rounded-lg p-6 mb-6">
                  <h3 className="font-medium text-green-900 mb-2">✅ Leads Imported: {demoData.leads.length}</h3>
                  <div className="text-sm text-green-800">
                    {demoData.leads.map((lead, i) => (
                      <div key={i}>{lead.name} ({lead.email})</div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 3 && demoData.campaign && (
                <div className="bg-purple-50 rounded-lg p-6 mb-6">
                  <h3 className="font-medium text-purple-900 mb-2">📧 Campaign Created: {demoData.campaign.name}</h3>
                  <div className="text-sm text-purple-800">
                    <div>Industry: {demoData.campaign.industry}</div>
                    <div>Tone: {demoData.campaign.tone}</div>
                    <div>Sequence Steps: {demoData.campaign.sequences.length}</div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="bg-yellow-50 rounded-lg p-6 mb-6">
                  <h3 className="font-medium text-yellow-900 mb-2">🤖 Automation Features:</h3>
                  <div className="text-sm text-yellow-800 space-y-1">
                    <div>✅ Auto-reply to incoming emails</div>
                    <div>✅ 3-day follow-up sequences</div>
                    <div>✅ Smart routing for complex inquiries</div>
                    <div>✅ Rate limiting (20 emails/hour)</div>
                  </div>
                </div>
              )}

              {currentStep === 5 && demoData.linkedinPosts.length > 0 && (
                <div className="bg-indigo-50 rounded-lg p-6 mb-6">
                  <h3 className="font-medium text-indigo-900 mb-2">💼 LinkedIn Content Planned: {demoData.linkedinPosts.length} posts</h3>
                  <div className="text-sm text-indigo-800 space-y-1">
                    {demoData.linkedinPosts.map((post, i) => (
                      <div key={i}>{post.date}: {post.type}</div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep > steps.length && (
                <div className="bg-green-50 rounded-lg p-6 mb-6">
                  <h3 className="font-medium text-green-900 mb-4">🎉 Your Marketing Assistant is Ready!</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
                    <div className="bg-white rounded p-3">
                      <div className="font-medium">Email Automation</div>
                      <div>• {demoData.leads.length} leads imported</div>
                      <div>• {demoData.campaign?.sequences.length || 0}-step sequence</div>
                      <div>• Auto-responses enabled</div>
                    </div>
                    <div className="bg-white rounded p-3">
                      <div className="font-medium">LinkedIn Strategy</div>
                      <div>• {demoData.linkedinPosts.length} posts planned</div>
                      <div>• Content calendar ready</div>
                      <div>• Brand building active</div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep <= steps.length && (
                <button
                  onClick={() => simulateStep(currentStep)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {steps[currentStep - 1]?.action}
                </button>
              )}

              {currentStep > steps.length && (
                <div className="space-x-4">
                  <button
                    onClick={() => window.open('/dashboard/marketing', '_blank')}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Open Marketing Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setCurrentStep(1);
                      setDemoData({ leads: [], campaign: null, linkedinPosts: [] });
                    }}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                  >
                    Reset Demo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-bold text-gray-900 mb-2">Smart Targeting</h3>
            <p className="text-sm text-gray-600">
              AI personalizes every email based on prospect data and industry insights
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-bold text-gray-900 mb-2">Full Automation</h3>
            <p className="text-sm text-gray-600">
              Set it and forget it - AI handles responses, follow-ups, and scheduling
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-3">📈</div>
            <h3 className="font-bold text-gray-900 mb-2">Real Results</h3>
            <p className="text-sm text-gray-600">
              Track opens, replies, conversions with detailed analytics and insights
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 