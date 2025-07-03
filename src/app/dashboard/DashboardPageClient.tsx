'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AutoProspectFinder from '@/components/AutoProspectFinder';
import EmailWarmupDashboard from '@/components/EmailWarmupDashboard';
import SubscriptionManager from '@/components/SubscriptionManager';
import { EmailProviderStatus } from '@/components/EmailProviderStatus';
import { DashboardOnboarding } from '@/components/DashboardOnboarding';

const enableAutoProspectFinder = process.env.NEXT_PUBLIC_ENABLE_AUTO_PROSPECT_FINDER === 'true';

export default function DashboardPageClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showAuthSuccess, setShowAuthSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get('auth') === 'success' && session) {
      setShowAuthSuccess(true);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      setTimeout(() => setShowAuthSuccess(false), 5000);
    }
  }, [searchParams, session]);

  if (status === 'unauthenticated') {
    return (
      <div className="p-8 text-center">
        <p className="text-lg">You must be signed in to view the dashboard.</p>
        <button
          className="mt-4 px-4 py-2 rounded bg-indigo-600 text-white"
          onClick={() => router.push('/login')}
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {showAuthSuccess && (
        <div className="rounded-md bg-green-50 p-4 border border-green-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Authentication Successful!</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>You're now signed in and ready to use all features. Welcome to your dashboard!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Welcome to your AI BDR command center</p>
      </div>

      <DashboardOnboarding />
      <SubscriptionManager />
      <EmailProviderStatus />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {enableAutoProspectFinder && <AutoProspectFinder />}
        <EmailWarmupDashboard />
      </div>
    </div>
  );
} 