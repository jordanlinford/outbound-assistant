'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AutoProspectFinder from '@/components/AutoProspectFinder';
import EmailWarmupDashboard from '@/components/EmailWarmupDashboard';
import SubscriptionManager from '@/components/SubscriptionManager';
import { EmailProviderStatus } from '@/components/EmailProviderStatus';
import { DashboardOnboarding } from '@/components/DashboardOnboarding';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showAuthSuccess, setShowAuthSuccess] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    // Show success message if user just authenticated
    if (searchParams.get('auth') === 'success' && session) {
      setShowAuthSuccess(true);
      // Remove the query parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      // Hide the message after 5 seconds
      setTimeout(() => setShowAuthSuccess(false), 5000);
    }
  }, [searchParams, session]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Authentication Success Message */}
      {showAuthSuccess && (
        <div className="rounded-md bg-green-50 p-4 border border-green-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Authentication Successful!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>You're now signed in and ready to use all features. Welcome to your dashboard!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to your AI BDR command center
        </p>
      </div>

      {/* Onboarding Guide */}
      <DashboardOnboarding />

      {/* Subscription Management */}
      <SubscriptionManager />

      {/* Email Provider Status */}
      <EmailProviderStatus />

      {/* Feature Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AutoProspectFinder />
        <EmailWarmupDashboard />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Campaigns</dt>
                  <dd className="text-lg font-medium text-gray-900">3</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Prospects</dt>
                  <dd className="text-lg font-medium text-gray-900">247</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Emails Sent</dt>
                  <dd className="text-lg font-medium text-gray-900">1,234</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Response Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">23.4%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-base font-semibold leading-6 text-gray-900 mb-4">🚀 Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="/dashboard/campaigns"
            className="relative group bg-blue-500 hover:bg-blue-600 rounded-lg px-6 py-4 text-white shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div>
              <span className="text-2xl mb-2 block">📧</span>
              <h3 className="text-sm font-medium">Create Campaign</h3>
              <p className="mt-1 text-xs text-white/80">Start a new outbound email campaign</p>
            </div>
          </a>
          
          <a
            href="/dashboard/linkedin"
            className="relative group bg-indigo-500 hover:bg-indigo-600 rounded-lg px-6 py-4 text-white shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div>
              <span className="text-2xl mb-2 block">✍️</span>
              <h3 className="text-sm font-medium">LinkedIn Content</h3>
              <p className="mt-1 text-xs text-white/80">Generate AI-powered LinkedIn posts</p>
            </div>
          </a>
          
          <a
            href="/dashboard/prospects"
            className="relative group bg-green-500 hover:bg-green-600 rounded-lg px-6 py-4 text-white shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div>
              <span className="text-2xl mb-2 block">👥</span>
              <h3 className="text-sm font-medium">Upload Prospects</h3>
              <p className="mt-1 text-xs text-white/80">Import your lead list</p>
            </div>
          </a>
          
          <a
            href="/dashboard/analytics"
            className="relative group bg-purple-500 hover:bg-purple-600 rounded-lg px-6 py-4 text-white shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div>
              <span className="text-2xl mb-2 block">📊</span>
              <h3 className="text-sm font-medium">View Analytics</h3>
              <p className="mt-1 text-xs text-white/80">Check campaign performance</p>
            </div>
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="flow-root">
            <ul className="-mb-8">
              <li>
                <div className="relative pb-8">
                  <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                  <div className="relative flex items-start space-x-3">
                    <div>
                      <div className="relative px-1">
                        <div className="h-8 w-8 bg-blue-500 rounded-full ring-8 ring-white flex items-center justify-center">
                          <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">Email sent to John Smith</span>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">Acme Inc • 2 hours ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              <li>
                <div className="relative pb-8">
                  <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                  <div className="relative flex items-start space-x-3">
                    <div>
                      <div className="relative px-1">
                        <div className="h-8 w-8 bg-green-500 rounded-full ring-8 ring-white flex items-center justify-center">
                          <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">Meeting booked with Sarah Johnson</span>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">TechCorp • 4 hours ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              <li>
                <div className="relative">
                  <div className="relative flex items-start space-x-3">
                    <div>
                      <div className="relative px-1">
                        <div className="h-8 w-8 bg-yellow-500 rounded-full ring-8 ring-white flex items-center justify-center">
                          <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">Reply received from Mike Brown</span>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">StartupX • 1 day ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 