'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import SubscriptionManager from '@/components/SubscriptionManager';

interface SubscriptionDetails {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  serviceLevelId: string;
  serviceLevelName: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
}

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchSubscriptionDetails();
    }
  }, [session]);

  const fetchSubscriptionDetails = async () => {
    try {
      const response = await fetch('/api/subscription/details');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionDetails(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    setActionLoading(action);
    try {
      switch (action) {
        case 'portal':
          const portalResponse = await fetch('/api/stripe/portal', { method: 'POST' });
          const { url } = await portalResponse.json();
          window.location.href = url;
          break;
        case 'upgrade-yearly':
          const upgradeResponse = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priceId: 'price_1RdCjFGCix0pRkbm0cYFJnjH' }),
          });
          const upgradeData = await upgradeResponse.json();
          if (upgradeData.url) window.location.href = upgradeData.url;
          break;
        case 'upgrade-monthly':
          const monthlyResponse = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priceId: 'price_1RdCioGCix0pRkbmNCWDgDwK' }),
          });
          const monthlyData = await monthlyResponse.json();
          if (monthlyData.url) window.location.href = monthlyData.url;
          break;
      }
    } catch (error) {
      console.error(`Error with ${action}:`, error);
      alert('Something went wrong. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const isPro = subscriptionDetails?.serviceLevelId !== 'free';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-600">Manage your AI BDR subscription and billing</p>
      </div>

      {/* Subscription Manager Component */}
      <SubscriptionManager />

      {/* Detailed Subscription Information */}
      {isPro && subscriptionDetails && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Current Plan</h3>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-medium text-gray-900">
                  {subscriptionDetails.serviceLevelName}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscriptionDetails.status)}`}>
                  {subscriptionDetails.status}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Billing Amount</h3>
              <p className="text-lg font-medium text-gray-900">
                ${subscriptionDetails.price}/{subscriptionDetails.billingCycle === 'yearly' ? 'year' : 'month'}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Current Period</h3>
              <p className="text-sm text-gray-900">
                {formatDate(subscriptionDetails.currentPeriodStart)} - {formatDate(subscriptionDetails.currentPeriodEnd)}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Next Billing Date</h3>
              <p className="text-sm text-gray-900">
                {subscriptionDetails.cancelAtPeriodEnd 
                  ? 'Canceled - ends ' + formatDate(subscriptionDetails.currentPeriodEnd)
                  : formatDate(subscriptionDetails.currentPeriodEnd)
                }
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Manage Your Subscription</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleAction('portal')}
                disabled={actionLoading === 'portal'}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading === 'portal' ? 'Loading...' : 'Manage Billing & Payment'}
              </button>

              {subscriptionDetails.billingCycle === 'monthly' && (
                <button
                  onClick={() => handleAction('upgrade-yearly')}
                  disabled={actionLoading === 'upgrade-yearly'}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'upgrade-yearly' ? 'Loading...' : 'Switch to Yearly (Save $100)'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Free Plan Information */}
      {!isPro && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="text-3xl">🆓</div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Free Trial</h2>
              <p className="text-gray-600 mb-4">
                You're currently on the free trial. Upgrade to unlock unlimited features and replace your entire BDR team.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 border">
                  <h3 className="font-medium text-gray-900 mb-2">Monthly Plan</h3>
                  <div className="text-2xl font-bold text-indigo-600 mb-1">$49.99/mo</div>
                  <p className="text-sm text-gray-600">Perfect for getting started</p>
                  <button
                    onClick={() => handleAction('upgrade-monthly')}
                    disabled={actionLoading === 'upgrade-monthly'}
                    className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {actionLoading === 'upgrade-monthly' ? 'Loading...' : 'Start Monthly Plan'}
                  </button>
                </div>

                <div className="bg-white rounded-lg p-4 border border-green-300 relative">
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Best Value
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">Yearly Plan</h3>
                  <div className="text-2xl font-bold text-green-600 mb-1">$500/yr</div>
                  <p className="text-sm text-gray-600">Save $100 vs monthly</p>
                  <button
                    onClick={() => handleAction('upgrade-yearly')}
                    disabled={actionLoading === 'upgrade-yearly'}
                    className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {actionLoading === 'upgrade-yearly' ? 'Loading...' : 'Start Yearly Plan'}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">What you get with Pro:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Unlimited emails & campaigns</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>24/7 automated follow-ups</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>LinkedIn automation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>AI email responses</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Advanced analytics</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Priority support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing History</h2>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📄</div>
          <p>Access your complete billing history through the Stripe portal</p>
          <button
            onClick={() => handleAction('portal')}
            disabled={actionLoading === 'portal'}
            className="mt-3 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          >
            {actionLoading === 'portal' ? 'Loading...' : 'View Billing History'}
          </button>
        </div>
      </div>
    </div>
  );
} 