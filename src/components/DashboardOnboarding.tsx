'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: string;
  href?: string;
}

export function DashboardOnboarding() {
  const { data: session } = useSession();
  const [isVisible, setIsVisible] = useState(true);
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'email-provider',
      title: 'Connect Your Email',
      description: 'Connect Gmail or Outlook to start sending campaigns',
      completed: false,
      action: 'Connect Email',
      href: '#email-provider'
    },
    {
      id: 'first-campaign',
      title: 'Create Your First Campaign',
      description: 'Set up an outbound email sequence to reach prospects',
      completed: false,
      action: 'Create Campaign',
      href: '/dashboard/campaigns'
    },
    {
      id: 'add-prospects',
      title: 'Add Prospects',
      description: 'Upload or find prospects to target with your campaigns',
      completed: false,
      action: 'Find Prospects',
      href: '/dashboard/prospects'
    }
  ]);

  useEffect(() => {
    // Check completion status (you can implement actual checks here)
    checkCompletionStatus();
  }, []);

  const checkCompletionStatus = async () => {
    try {
      // Check email provider status
      const emailResponse = await fetch('/api/email/gmail-test');
      const emailData = await emailResponse.json();
      
      // Check if user has campaigns
      const campaignsResponse = await fetch('/api/campaigns');
      const campaignsData = await campaignsResponse.json();

      setSteps(prev => prev.map(step => {
        switch (step.id) {
          case 'email-provider':
            return { ...step, completed: emailData.gmail?.status === 'ready' };
          case 'first-campaign':
            return { ...step, completed: campaignsData.length > 0 };
          case 'add-prospects':
            return { ...step, completed: false }; // You can implement prospect check
          default:
            return step;
        }
      }));
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const isCompleted = completedSteps === totalSteps;

  if (!isVisible || isCompleted) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">🚀</span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Welcome to your AI BDR Assistant!
              </h3>
              <p className="text-sm text-gray-600">
                Let's get you set up in just a few steps ({completedSteps}/{totalSteps} completed)
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {step.completed ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                        <span className="text-xs text-gray-500">{index + 1}</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${step.completed ? 'text-green-700' : 'text-gray-900'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                
                {!step.completed && step.action && (
                  <a
                    href={step.href}
                    className="inline-flex items-center px-3 py-1 border border-blue-300 shadow-sm text-xs font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {step.action}
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-100 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Pro tip:</strong> Complete these steps to unlock the full power of your AI BDR. 
                  Each step takes less than 2 minutes!
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 ml-4">
          <button
            type="button"
            className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setIsVisible(false)}
          >
            <span className="sr-only">Close onboarding</span>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 