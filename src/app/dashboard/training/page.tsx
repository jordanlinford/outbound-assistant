"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface Profile {
  about?: string;
  uniqueValue?: string;
  targetCustomers?: string;
  mainPainPoints?: string;
  tonePreference?: string;
  callToActions?: string;
}

export default function TrainingPage() {
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/training/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/training/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setMessage('Saved!');
      } else {
        setMessage('Failed to save');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">AI Training</h1>
      <p className="text-gray-600 max-w-prose">Provide details about your business, product, and ideal customers. The AI will incorporate this context whenever it writes emails for you.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">About Your Company</label>
          <textarea
            value={profile.about || ''}
            onChange={e => setProfile({ ...profile, about: e.target.value })}
            rows={4}
            className="w-full p-3 border rounded-md"
            placeholder="Describe what your company does..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Unique Value / Differentiator</label>
          <textarea
            value={profile.uniqueValue || ''}
            onChange={e => setProfile({ ...profile, uniqueValue: e.target.value })}
            rows={3}
            className="w-full p-3 border rounded-md"
            placeholder="What makes you different from competitors?"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ideal Customers</label>
          <textarea
            value={profile.targetCustomers || ''}
            onChange={e => setProfile({ ...profile, targetCustomers: e.target.value })}
            rows={3}
            className="w-full p-3 border rounded-md"
            placeholder="Industries, sizes, job titles you target..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Main Pain Points You Solve</label>
          <textarea
            value={profile.mainPainPoints || ''}
            onChange={e => setProfile({ ...profile, mainPainPoints: e.target.value })}
            rows={3}
            className="w-full p-3 border rounded-md"
            placeholder="e.g. low conversion rates, high churn, manual processes..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tone Preference</label>
          <input
            type="text"
            value={profile.tonePreference || ''}
            onChange={e => setProfile({ ...profile, tonePreference: e.target.value })}
            className="w-full p-3 border rounded-md"
            placeholder="friendly, professional, humorous..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Preferred Calls-to-Action (comma separated)</label>
          <input
            type="text"
            value={profile.callToActions || ''}
            onChange={e => setProfile({ ...profile, callToActions: e.target.value })}
            className="w-full p-3 border rounded-md"
            placeholder="Schedule a call, Reply with info, Click link..."
          />
        </div>
      </div>

      <div className="flex items-center space-x-3 pt-4">
        <Button onClick={saveProfile} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
          {saving ? 'Saving...' : 'Save'}
        </Button>
        {message && <span className="text-sm text-gray-600">{message}</span>}
      </div>
    </div>
  );
} 