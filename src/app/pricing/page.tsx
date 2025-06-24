'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { SERVICE_LEVELS, FREE_TIER } from '@/lib/stripe-client';
import InviteCodeRedeemer from '@/components/InviteCodeRedeemer';

export default function PricingPage() {
  const { data: session } = useSession();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string, planId: string) => {
    if (!session) {
      window.location.href = '/login';
      return;
    }

    setLoading(planId);
    try {
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
      console.error('Checkout error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const currentPlan = billingCycle === 'monthly' 
    ? SERVICE_LEVELS.find(level => level.id === 'pro-monthly')
    : SERVICE_LEVELS.find(level => level.id === 'pro-yearly');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-16">
      {/* Navigation Header */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <nav className="flex items-center justify-between p-6 lg:px-8">
          <div className="flex lg:flex-1">
            <a href="/" className="-m-1.5 p-1.5 flex items-center">
              <img 
                src="/outbound-assistant-logo.svg" 
                alt="Outbound Assistant" 
                className="h-8 w-auto"
              />
            </a>
          </div>
          <div className="flex flex-1 justify-end gap-x-6">
            <a href="/login" className="text-sm font-semibold leading-6 text-gray-900 hover:text-indigo-600">
              Log in
            </a>
            <a
              href="/signup"
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Start Free Trial
            </a>
          </div>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Replace Your Entire BDR Team for $50/Month
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stop burning cash on expensive hires. Get the same results (or better) with AI that works 24/7.
          </p>
          
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-2">
              <span className="text-red-600 font-bold text-lg">🔥 Limited Time:</span>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-800 mb-1">
                Save $97,400/year vs hiring BDRs
              </div>
              <div className="text-sm text-red-700">
                That's 163x ROI in your first year alone
              </div>
            </div>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-100 p-1 rounded-lg flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors relative ${
                billingCycle === 'yearly'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Save $100
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {FREE_TIER.name}
              </h3>
              <p className="text-gray-600 mb-4">
                {FREE_TIER.description}
              </p>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                $0
                <span className="text-lg font-normal text-gray-600">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {FREE_TIER.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              disabled
              className="w-full bg-gray-100 text-gray-400 py-3 px-6 rounded-lg font-medium cursor-not-allowed"
            >
              Current Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-indigo-500 p-8 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-indigo-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Outbound Assistant Pro
              </h3>
              <p className="text-gray-600 mb-4">
                {currentPlan?.description}
              </p>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                ${billingCycle === 'monthly' ? '49.99' : '500'}
                <span className="text-lg font-normal text-gray-600">
                  /{billingCycle === 'monthly' ? 'month' : 'year'}
                </span>
              </div>
              {billingCycle === 'yearly' && (
                <p className="text-green-600 font-medium">
                  Save $100 compared to monthly billing
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {currentPlan?.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(currentPlan?.priceId || '', currentPlan?.id || '')}
              disabled={loading === currentPlan?.id}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === currentPlan?.id ? 'Processing...' : 'Get Started'}
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. You'll continue to have access to Pro features until the end of your billing period.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What's included in "unlimited"?
              </h3>
              <p className="text-gray-600">
                Unlimited means no artificial limits on emails, campaigns, or AI responses. We only ask that you use the service reasonably and in compliance with our terms of service.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee. If you're not satisfied with Outbound Assistant, contact us within 30 days for a full refund.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I upgrade from free to pro?
              </h3>
              <p className="text-gray-600">
                Absolutely! You can upgrade to Pro at any time. Your free usage will immediately be upgraded to unlimited, and you'll get access to all Pro features.
              </p>
            </div>
          </div>
        </div>

        {/* Invite Code Section */}
        <div className="mt-20 max-w-2xl mx-auto">
          <InviteCodeRedeemer 
            onSuccess={() => window.location.reload()} 
            className="mb-12"
          />
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to automate your outbound sales?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of entrepreneurs who are scaling their outreach with AI.
          </p>
          <button
            onClick={() => handleSubscribe(currentPlan?.priceId || '', currentPlan?.id || '')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors"
          >
            Start Your Free Trial
          </button>
        </div>
      </div>
    </div>
  );
} 