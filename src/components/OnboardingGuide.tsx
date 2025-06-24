'use client';

import { useState } from 'react';
import { Button } from './ui/button';

interface OnboardingGuideProps {
  onClose: () => void;
}

export default function OnboardingGuide({ onClose }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Your Outbound BDR Assistant!",
      content: (
        <div className="space-y-4">
          <p className="text-lg">
            This tool will help you automate your outbound sales process like a professional BDR team.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">What you can do:</h4>
            <ul className="space-y-2 text-blue-800">
              <li>• Create and manage email campaigns</li>
              <li>• Add prospects individually or via CSV upload</li>
              <li>• Send personalized emails directly from your Gmail</li>
              <li>• Track responses and manage follow-ups</li>
              <li>• Scale your outreach like a pro sales team</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Step 1: Create Your First Campaign",
      content: (
        <div className="space-y-4">
          <p>
            Start by creating a campaign for your outreach. Think of campaigns as organized buckets for different types of prospects.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Campaign Examples:</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• "Q1 SaaS Founders Outreach"</li>
              <li>• "E-commerce Store Owners"</li>
              <li>• "Series A Startup CTOs"</li>
              <li>• "Local Business Owners"</li>
            </ul>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">💡 Tip:</span>
            <span>Keep campaigns focused on similar types of prospects for better personalization</span>
          </div>
        </div>
      )
    },
    {
      title: "Step 2: Add Prospects to Your Campaign",
      content: (
        <div className="space-y-4">
          <p>
            Once you have a campaign, add prospects who you want to reach out to.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Individual Add</h4>
              <p className="text-green-800 text-sm">
                Perfect for adding high-value prospects one by one with detailed information.
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">CSV Import</h4>
              <p className="text-purple-800 text-sm">
                Upload hundreds of prospects at once from your CRM or lead list.
              </p>
            </div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Required:</strong> Email address<br/>
              <strong>Recommended:</strong> First name, company, and title for better personalization
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Step 3: Send Personalized Emails",
      content: (
        <div className="space-y-4">
          <p>
            Now comes the magic! Send personalized emails that feel like they were written individually.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Personalization Variables:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
              <div><code className="bg-blue-200 px-1 rounded">{'{firstName}'}</code> → John</div>
              <div><code className="bg-blue-200 px-1 rounded">{'{company}'}</code> → Acme Corp</div>
              <div><code className="bg-blue-200 px-1 rounded">{'{title}'}</code> → CEO</div>
              <div><code className="bg-blue-200 px-1 rounded">{'{fullName}'}</code> → John Doe</div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Example Email:</h4>
            <div className="text-sm text-green-800 font-mono bg-white p-3 rounded border">
              Hi {'{firstName}'},<br/><br/>
              I noticed {'{company}'} is doing great work in the SaaS space. As a {'{title}'}, you probably know how challenging it can be to scale customer acquisition.<br/><br/>
              Would you be open to a quick 15-minute call this week to discuss how we've helped similar companies increase their revenue by 40%?<br/><br/>
              Best regards,<br/>
              [Your Name]
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Step 4: Track and Follow Up",
      content: (
        <div className="space-y-4">
          <p>
            Monitor your campaign performance and manage responses effectively.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">📊</div>
              <h4 className="font-semibold text-blue-900">Track Metrics</h4>
              <p className="text-sm text-blue-800">Monitor open rates, response rates, and meetings booked</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">📧</div>
              <h4 className="font-semibold text-green-900">Manage Responses</h4>
              <p className="text-sm text-green-800">Organize replies and schedule follow-ups</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">🎯</div>
              <h4 className="font-semibold text-purple-900">Optimize</h4>
              <p className="text-sm text-purple-800">Improve your templates based on performance</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Ready to Start Your Outbound Success!",
      content: (
        <div className="space-y-4">
          <p className="text-lg">
            You're all set to start generating leads like a professional BDR team!
          </p>
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">🚀 Pro Tips for Success:</h4>
            <ul className="space-y-2 text-gray-800">
              <li>• Start with 10-20 prospects to test your messaging</li>
              <li>• Personalize your subject lines for higher open rates</li>
              <li>• Follow up 2-3 times with value-added content</li>
              <li>• Track what works and iterate on your approach</li>
              <li>• Keep your emails short and focused on their problems</li>
            </ul>
          </div>
          <div className="text-center">
            <p className="text-gray-600 mb-4">Ready to create your first campaign?</p>
            <Button 
              onClick={onClose}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-3"
            >
              Let's Get Started! 🎯
            </Button>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">Getting Started Guide</h2>
            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep ? 'bg-blue-600' : 
                    index < currentStep ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" title="Close">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-8">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {steps[currentStep].title}
            </h3>
          </div>
          <div className="min-h-[300px]">
            {steps[currentStep].content}
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t">
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </div>
          <div className="flex space-x-3">
            {currentStep > 0 && (
              <Button variant="outline" onClick={prevStep}>
                Previous
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
                Next
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
} 