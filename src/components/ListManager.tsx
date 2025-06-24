'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface List {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isDefault: boolean;
  createdAt: string;
  _count: {
    prospects: number;
    campaigns: number;
  };
}

interface Campaign {
  id: string;
  name: string;
  status: string;
}

interface CreateListData {
  name: string;
  description?: string;
  color?: string;
}

export default function ListManager() {
  const [lists, setLists] = useState<List[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [editingList, setEditingList] = useState<List | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateListData>({
    name: '',
    description: '',
    color: '#3B82F6',
  });

  const [connectForm, setConnectForm] = useState({
    campaignIds: [] as string[],
    autoEnroll: true,
  });

  useEffect(() => {
    fetchLists();
    fetchCampaigns();
  }, []);

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/lists');
      if (response.ok) {
        const data = await response.json();
        setLists(data);
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });

      if (response.ok) {
        const newList = await response.json();
        setLists([newList, ...lists]);
        setShowCreateModal(false);
        setCreateForm({ name: '', description: '', color: '#3B82F6' });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create list');
      }
    } catch (error) {
      console.error('Error creating list:', error);
      alert('Failed to create list');
    }
  };

  const handleUpdateList = async (listId: string, updates: Partial<CreateListData>) => {
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedList = await response.json();
        setLists(lists.map(list => list.id === listId ? updatedList : list));
        setEditingList(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update list');
      }
    } catch (error) {
      console.error('Error updating list:', error);
      alert('Failed to update list');
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLists(lists.filter(list => list.id !== listId));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete list');
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      alert('Failed to delete list');
    }
  };

  const handleConnectToCampaigns = async (listId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${connectForm.campaignIds[0]}/lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listIds: [listId],
          autoEnroll: connectForm.autoEnroll,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully connected list to ${result.connected} campaign(s)`);
        setShowConnectModal(false);
        setConnectForm({ campaignIds: [], autoEnroll: true });
        fetchLists(); // Refresh to show updated connection counts
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to connect list to campaigns');
      }
    } catch (error) {
      console.error('Error connecting list to campaigns:', error);
      alert('Failed to connect list to campaigns');
    }
  };

  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading lists...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Prospect Lists</h2>
          <p className="text-gray-600">Organize your prospects into lists for better campaign management</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          Create New List
        </Button>
      </div>

      {/* Lists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lists.map((list) => (
          <Card key={list.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: list.color || '#3B82F6' }}
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{list.name}</h3>
                  {list.isDefault && (
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingList(list)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Edit list"
                >
                  ✏️
                </button>
                {!list.isDefault && (
                  <button
                    onClick={() => handleDeleteList(list.id)}
                    className="text-gray-400 hover:text-red-600"
                    title="Delete list"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>

            {list.description && (
              <p className="text-gray-600 text-sm mb-4">{list.description}</p>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Prospects:</span>
                <span className="font-medium">{list._count.prospects}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Connected Campaigns:</span>
                <span className="font-medium">{list._count.campaigns}</span>
              </div>
            </div>

            <div className="mt-4 flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedList(list);
                  setShowConnectModal(true);
                }}
                className="flex-1"
              >
                Connect to Campaign
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = `/dashboard/lists/${list.id}`}
                className="flex-1"
              >
                View Prospects
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Create List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New List</h3>
            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  List Name *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter list name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex space-x-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        createForm.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Select color ${color}`}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                  Create List
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connect to Campaign Modal */}
      {showConnectModal && selectedList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Connect "{selectedList.name}" to Campaign
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Campaign
                </label>
                <select
                  value={connectForm.campaignIds[0] || ''}
                  onChange={(e) => setConnectForm({ 
                    ...connectForm, 
                    campaignIds: e.target.value ? [e.target.value] : [] 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title="Select campaign to connect list to"
                >
                  <option value="">Select a campaign...</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name} ({campaign.status})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoEnroll"
                  checked={connectForm.autoEnroll}
                  onChange={(e) => setConnectForm({ ...connectForm, autoEnroll: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="autoEnroll" className="text-sm text-gray-700">
                  Auto-enroll new prospects added to this list
                </label>
              </div>
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowConnectModal(false);
                    setSelectedList(null);
                    setConnectForm({ campaignIds: [], autoEnroll: true });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => selectedList && handleConnectToCampaigns(selectedList.id)}
                  disabled={!connectForm.campaignIds.length}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  Connect
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit List Modal */}
      {editingList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit List</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleUpdateList(editingList.id, {
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                color: formData.get('color') as string,
              });
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  List Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingList.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title="List name"
                  placeholder="Enter list name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  defaultValue={editingList.description || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  title="List description"
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex space-x-2">
                  {colorOptions.map((color) => (
                    <label key={color} className="cursor-pointer">
                      <input
                        type="radio"
                        name="color"
                        value={color}
                        defaultChecked={editingList.color === color}
                        className="sr-only"
                        title={`Select color ${color}`}
                        aria-label={`Select color ${color}`}
                      />
                      <div
                        className={`w-8 h-8 rounded-full border-2 ${
                          editingList.color === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingList(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                  Update List
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 