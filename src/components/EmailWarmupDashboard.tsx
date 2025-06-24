'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { EmailWarmupManager } from '@/lib/email-warmup';

interface WarmupStatus {
  phase: string;
  daysActive: number;
  currentLimit: number;
  nextMilestone: string;
  progress: number;
}

interface DeliverabilityMetrics {
  deliveryRate: number;
  openRate: number;
  replyRate: number;
  spamScore: number;
  domainReputation: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
}

export default function EmailWarmupDashboard() {
  const { data: session } = useSession();
  const [warmupStatus, setWarmupStatus] = useState<WarmupStatus | null>(null);
  const [deliverability, setDeliverability] = useState<DeliverabilityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      loadWarmupData();
    }
  }, [session]);

  const loadWarmupData = async () => {
    try {
      const response = await fetch('/api/email/warmup-status');
      if (response.ok) {
        const data = await response.json();
        setWarmupStatus(data.status);
        setDeliverability(data.deliverability);
      }
    } catch (error) {
      console.error('Error loading warmup data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeWarmup = async () => {
    try {
      const response = await fetch('/api/email/warmup-initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session?.user?.email })
      });

      if (response.ok) {
        loadWarmupData();
      }
    } catch (error) {
      console.error('Error initializing warmup:', error);
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'warming_up': return 'bg-yellow-100 text-yellow-800';
      case 'warmed_up': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReputationColor = (reputation: string) => {
    switch (reputation) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!warmupStatus) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            📧 Email Warmup Required
          </h3>
          <p className="text-gray-600 mb-4">
            Initialize email warmup to ensure high deliverability rates
          </p>
          <button
            onClick={initializeWarmup}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Start Email Warmup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warmup Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            📧 Email Warmup Status
          </h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPhaseColor(warmupStatus.phase)}`}>
            {warmupStatus.phase.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {warmupStatus.daysActive}
            </div>
            <div className="text-sm text-gray-500">Days Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {warmupStatus.currentLimit}
            </div>
            <div className="text-sm text-gray-500">Daily Email Limit</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {warmupStatus.progress}%
            </div>
            <div className="text-sm text-gray-500">Progress</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Warmup Progress</span>
            <span>{warmupStatus.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${warmupStatus.progress}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-blue-400">ℹ️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Next Milestone
              </h3>
              <div className="text-sm text-blue-700">
                {warmupStatus.nextMilestone}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deliverability Metrics */}
      {deliverability && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📊 Deliverability Metrics
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {deliverability.deliveryRate}%
              </div>
              <div className="text-sm text-gray-500">Delivery Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {deliverability.openRate}%
              </div>
              <div className="text-sm text-gray-500">Open Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {deliverability.replyRate}%
              </div>
              <div className="text-sm text-gray-500">Reply Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {deliverability.spamScore}
              </div>
              <div className="text-sm text-gray-500">Spam Score</div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Domain Reputation</span>
              <span className={`text-sm font-bold ${getReputationColor(deliverability.domainReputation)}`}>
                {deliverability.domainReputation.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              🎯 Recommendations
            </h3>
            <div className="space-y-2">
              {deliverability.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                  <div className="ml-3 text-sm text-gray-600">{rec}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          ⚡ Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={loadWarmupData}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            🔄 Refresh Status
          </button>
          <button
            onClick={() => window.open('/dashboard/campaigns', '_blank')}
            className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            🚀 Start Campaign
          </button>
        </div>
      </div>
    </div>
  );
} 