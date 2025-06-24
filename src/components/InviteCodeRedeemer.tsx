'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface InviteCodeRedeemerProps {
  onSuccess?: () => void;
  className?: string;
}

export default function InviteCodeRedeemer({ onSuccess, className = '' }: InviteCodeRedeemerProps) {
  const { data: session } = useSession();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationInfo, setValidationInfo] = useState<{
    serviceLevelId: string;
    description?: string;
  } | null>(null);

  const handleValidate = async () => {
    if (!code.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setLoading(true);
    setError('');
    setValidationInfo(null);

    try {
      const response = await fetch('/api/invite-codes/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (data.valid) {
        setValidationInfo({
          serviceLevelId: data.serviceLevelId,
          description: data.description,
        });
        setError('');
      } else {
        setError(data.error || 'Invalid invite code');
        setValidationInfo(null);
      }
    } catch (err) {
      setError('Failed to validate invite code. Please try again.');
      setValidationInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!validationInfo) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/invite-codes/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('🎉 Invite code redeemed successfully! Your account has been upgraded.');
        setCode('');
        setValidationInfo(null);
        onSuccess?.();
      } else {
        setError(data.error || 'Failed to redeem invite code');
      }
    } catch (err) {
      setError('Failed to redeem invite code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getServiceLevelName = (serviceLevelId: string) => {
    switch (serviceLevelId) {
      case 'pro-monthly':
        return 'AI BDR Team (Monthly) - $49.99/month';
      case 'pro-yearly':
        return 'AI BDR Team (Yearly) - $500/year';
      default:
        return 'Pro Access';
    }
  };

  if (!session) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <p className="text-blue-800">Please log in to redeem an invite code.</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="text-2xl mr-3">🎉</div>
          <div>
            <p className="text-green-800 font-medium">Success!</p>
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <div className="text-2xl mr-3">🎫</div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Have an Invite Code?</h3>
          <p className="text-sm text-gray-600">Get free access to Pro features</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="invite-code" className="block text-sm font-medium text-gray-700 mb-2">
            Enter your invite code
          </label>
          <div className="flex space-x-3">
            <input
              id="invite-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., BETA2024"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
              disabled={loading}
            />
            {!validationInfo ? (
              <button
                onClick={handleValidate}
                disabled={loading || !code.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Checking...' : 'Validate'}
              </button>
            ) : (
              <button
                onClick={handleRedeem}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Redeeming...' : 'Redeem'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {validationInfo && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-start">
              <div className="text-green-500 mr-3 mt-0.5">✓</div>
              <div>
                <p className="text-green-800 font-medium">Valid invite code!</p>
                <p className="text-green-700 text-sm mt-1">
                  This will give you access to: <strong>{getServiceLevelName(validationInfo.serviceLevelId)}</strong>
                </p>
                {validationInfo.description && (
                  <p className="text-green-600 text-sm mt-1">{validationInfo.description}</p>
                )}
                <p className="text-green-600 text-sm mt-2">Click "Redeem" to activate your free access!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 