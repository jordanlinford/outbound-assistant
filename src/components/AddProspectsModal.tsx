'use client';

import { useState } from 'react';
import { Button } from './ui/button';

interface AddProspectsModalProps {
  campaignId: string;
  onClose: () => void;
  onProspectsAdded: () => void;
}

export default function AddProspectsModal({ campaignId, onClose, onProspectsAdded }: AddProspectsModalProps) {
  const [method, setMethod] = useState<'individual' | 'csv'>('individual');
  const [prospect, setProspect] = useState({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    title: '',
  });
  const [csvData, setCsvData] = useState('');
  const [adding, setAdding] = useState(false);

  const addIndividualProspect = async () => {
    if (!prospect.email) return;

    setAdding(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/prospects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prospects: [prospect],
        }),
      });

      if (response.ok) {
        onProspectsAdded();
        onClose();
      } else {
        alert('Failed to add prospect');
      }
    } catch (error) {
      console.error('Error adding prospect:', error);
      alert('Failed to add prospect');
    } finally {
      setAdding(false);
    }
  };

  const addCSVProspects = async () => {
    if (!csvData.trim()) return;

    const lines = csvData.trim().split('\n');
    const prospects = lines.slice(1).map(line => {
      const [email, firstName, lastName, company, title] = line.split(',').map(s => s.trim());
      return { email, firstName, lastName, company, title };
    }).filter(p => p.email);

    if (prospects.length === 0) {
      alert('No valid prospects found in CSV data');
      return;
    }

    setAdding(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/prospects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prospects,
        }),
      });

      if (response.ok) {
        onProspectsAdded();
        onClose();
      } else {
        alert('Failed to add prospects');
      }
    } catch (error) {
      console.error('Error adding prospects:', error);
      alert('Failed to add prospects');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Add Prospects</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" title="Close">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Method Selection */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setMethod('individual')}
              className={`px-4 py-2 rounded-md ${method === 'individual' 
                ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                : 'bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            >
              Add Individual
            </button>
            <button
              onClick={() => setMethod('csv')}
              className={`px-4 py-2 rounded-md ${method === 'csv' 
                ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                : 'bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            >
              Import CSV
            </button>
          </div>
        </div>

        {method === 'individual' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={prospect.firstName}
                  onChange={(e) => setProspect({ ...prospect, firstName: e.target.value })}
                  placeholder="John"
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={prospect.lastName}
                  onChange={(e) => setProspect({ ...prospect, lastName: e.target.value })}
                  placeholder="Doe"
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={prospect.email}
                onChange={(e) => setProspect({ ...prospect, email: e.target.value })}
                placeholder="john@company.com"
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <input
                type="text"
                value={prospect.company}
                onChange={(e) => setProspect({ ...prospect, company: e.target.value })}
                placeholder="Acme Corp"
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={prospect.title}
                onChange={(e) => setProspect({ ...prospect, title: e.target.value })}
                placeholder="CEO"
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={addIndividualProspect}
                disabled={!prospect.email || adding}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {adding ? 'Adding...' : 'Add Prospect'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSV Data
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Paste your CSV data below. First line should be headers: email,firstName,lastName,company,title
              </p>
              <textarea
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder="email,firstName,lastName,company,title&#10;john@acme.com,John,Doe,Acme Corp,CEO&#10;jane@startup.io,Jane,Smith,Startup Inc,CTO"
                rows={10}
                className="w-full p-3 border border-gray-300 rounded-md font-mono text-sm"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={addCSVProspects}
                disabled={!csvData.trim() || adding}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {adding ? 'Adding...' : 'Import Prospects'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 