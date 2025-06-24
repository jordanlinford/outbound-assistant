'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface UsageData {
  usage: {
    emailsSent: number;
    campaignsCreated: number;
    linkedinPostsGenerated: number;
    aiResponsesGenerated: number;
  };
  serviceLevel: {
    id: string;
    name: string;
    price: number;
    limits: {
      emailsPerMonth: number;
      campaignsPerMonth: number;
      linkedinPostsPerMonth: number;
      aiResponsesPerMonth: number;
    };
  };
  percentages: {
    emails: number;
    campaigns: number;
    linkedin: number;
    aiResponses: number;
  };
  remaining: {
    emails: number | 'unlimited';
    campaigns: number | 'unlimited';
    linkedin: number | 'unlimited';
    aiResponses: number | 'unlimited';
  };
}

export default function SubscriptionManager() {
  const { data: session } = useSession();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchUsageData();
    }
  }, [session]);

  const fetchUsageData = async () => {
    try {
      const response = await fetch('/api/usage');
      if (response.ok) {
        const data = await response.json();
        setUsageData(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });
      
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        // If no Stripe customer exists, redirect to pricing
        window.location.href = '/pricing';
      }
    } catch (error) {
      console.error('Failed to open customer portal:', error);
      window.location.href = '/pricing';
    } finally {
      setPortalLoading(false);
    }
  };

  const handleUpgrade = async (planType: 'monthly' | 'yearly') => {
    setUpgradeLoading(planType);
    try {
      const priceId = planType === 'monthly' 
        ? 'price_1RdCioGCix0pRkbmNCWDgDwK'  // Monthly price ID
        : 'price_1RdCjFGCix0pRkbm0cYFJnjH'; // Yearly price ID
        
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setUpgradeLoading(null);
    }
  };

  const formatUsageLimit = (limit: number | 'unlimited') => {
    return limit === 'unlimited' || limit === -1 ? '∞' : limit.toLocaleString();
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 90) return { color: 'text-red-600', text: 'Critical' };
    if (percentage >= 75) return { color: 'text-yellow-600', text: 'High' };
    return { color: 'text-green-600', text: 'Good' };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!usageData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-red-600">Failed to load subscription data</p>
      </div>
    );
  }

  const isPro = usageData.serviceLevel.id !== 'free';
  const isYearly = usageData.serviceLevel.id === 'pro-yearly';
  const isMonthly = usageData.serviceLevel.id === 'pro-monthly';

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              {usageData.serviceLevel.name}
              {isPro && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Pro
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500">
              {isPro ? `$${usageData.serviceLevel.price}/${isYearly ? 'year' : 'month'}` : 'Free plan'}
            </p>
          </div>
          <div className="flex space-x-3">
            {isPro ? (
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                {portalLoading ? 'Loading...' : 'Manage Billing'}
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleUpgrade('monthly')}
                  disabled={upgradeLoading === 'monthly'}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {upgradeLoading === 'monthly' ? 'Loading...' : 'Upgrade Monthly'}
                </button>
                <button
                  onClick={() => handleUpgrade('yearly')}
                  disabled={upgradeLoading === 'yearly'}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {upgradeLoading === 'yearly' ? 'Loading...' : 'Upgrade Yearly (Save $100)'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900">Usage This Month</h4>
          {!isPro && (
            <span className="text-sm text-orange-600 font-medium">
              Free Trial - Limited Usage
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Emails */}
          <div className="p-4 border rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">📧 Emails Sent</span>
              <span className={`text-xs font-medium ${getUsageStatus(usageData.percentages.emails).color}`}>
                {getUsageStatus(usageData.percentages.emails).text}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {usageData.usage.emailsSent.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 mb-2">
              of {formatUsageLimit(usageData.serviceLevel.limits.emailsPerMonth)} limit
            </div>
            {usageData.serviceLevel.limits.emailsPerMonth !== -1 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProgressColor(usageData.percentages.emails)}`}
                  style={{ width: `${Math.min(usageData.percentages.emails, 100)}%` }}
                ></div>
              </div>
            )}
          </div>

          {/* Campaigns */}
          <div className="p-4 border rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">🎯 Campaigns</span>
              <span className={`text-xs font-medium ${getUsageStatus(usageData.percentages.campaigns).color}`}>
                {getUsageStatus(usageData.percentages.campaigns).text}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {usageData.usage.campaignsCreated}
            </div>
            <div className="text-sm text-gray-500 mb-2">
              of {formatUsageLimit(usageData.serviceLevel.limits.campaignsPerMonth)} limit
            </div>
            {usageData.serviceLevel.limits.campaignsPerMonth !== -1 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProgressColor(usageData.percentages.campaigns)}`}
                  style={{ width: `${Math.min(usageData.percentages.campaigns, 100)}%` }}
                ></div>
              </div>
            )}
          </div>

          {/* LinkedIn Posts */}
          <div className="p-4 border rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">💼 LinkedIn Posts</span>
              <span className={`text-xs font-medium ${getUsageStatus(usageData.percentages.linkedin).color}`}>
                {getUsageStatus(usageData.percentages.linkedin).text}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {usageData.usage.linkedinPostsGenerated}
            </div>
            <div className="text-sm text-gray-500 mb-2">
              of {formatUsageLimit(usageData.serviceLevel.limits.linkedinPostsPerMonth)} limit
            </div>
            {usageData.serviceLevel.limits.linkedinPostsPerMonth !== -1 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProgressColor(usageData.percentages.linkedin)}`}
                  style={{ width: `${Math.min(usageData.percentages.linkedin, 100)}%` }}
                ></div>
              </div>
            )}
          </div>

          {/* AI Responses */}
          <div className="p-4 border rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">🤖 AI Responses</span>
              <span className={`text-xs font-medium ${getUsageStatus(usageData.percentages.aiResponses).color}`}>
                {getUsageStatus(usageData.percentages.aiResponses).text}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {usageData.usage.aiResponsesGenerated}
            </div>
            <div className="text-sm text-gray-500 mb-2">
              of {formatUsageLimit(usageData.serviceLevel.limits.aiResponsesPerMonth)} limit
            </div>
            {usageData.serviceLevel.limits.aiResponsesPerMonth !== -1 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProgressColor(usageData.percentages.aiResponses)}`}
                  style={{ width: `${Math.min(usageData.percentages.aiResponses, 100)}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>

        {!isPro && (
          <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🚀</div>
              <div className="flex-1">
                <h5 className="text-sm font-medium text-indigo-900 mb-1">
                  Unlock Unlimited Power with Pro
                </h5>
                <p className="text-sm text-indigo-700 mb-3">
                  Get unlimited emails, campaigns, LinkedIn posts, and AI responses. Replace your entire BDR team and save $97,400/year.
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleUpgrade('monthly')}
                    disabled={upgradeLoading === 'monthly'}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {upgradeLoading === 'monthly' ? 'Loading...' : 'Start Monthly ($49.99/mo)'}
                  </button>
                  <button
                    onClick={() => handleUpgrade('yearly')}
                    disabled={upgradeLoading === 'yearly'}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {upgradeLoading === 'yearly' ? 'Loading...' : 'Save with Yearly ($500/yr)'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isPro && isMonthly && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-3">
              <div className="text-green-600">💡</div>
              <div className="flex-1">
                <h5 className="text-sm font-medium text-green-900 mb-1">
                  Save $100 with Yearly Billing
                </h5>
                <p className="text-sm text-green-700 mb-3">
                  Switch to yearly billing and save $100 compared to monthly payments.
                </p>
                <button
                  onClick={handleManageSubscription}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Switch to Yearly
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 