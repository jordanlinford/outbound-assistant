'use client';

import { useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import ListManager from '@/components/ListManager';

interface Prospect {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  status: 'new' | 'contacted' | 'replied' | 'meeting_booked';
  addedDate: string;
  campaignName?: string;
  lastInteraction?: string | null;
  lists?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

interface List {
  id: string;
  name: string;
  color: string;
}

export default function ProspectsPage() {
  const { data: session } = useSession();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showListManager, setShowListManager] = useState(false);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [newProspect, setNewProspect] = useState({
    name: '',
    email: '',
    company: '',
    title: '',
  });

  const [filterByList, setFilterByList] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (session) {
      fetchProspects();
      fetchLists();
    }
  }, [session]);

  const fetchProspects = async () => {
    try {
      const response = await fetch('/api/prospects');
      if (response.ok) {
        const data = await response.json();
        setProspects(data);
      }
    } catch (error) {
      console.error('Error fetching prospects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/lists');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched lists:', data);
        setLists(data);
      } else {
        console.error('Failed to fetch lists:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    }
  };

  const handleAddProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/prospects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prospects: [newProspect],
          listId: selectedList || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setProspects([...result.results, ...prospects]);
        setShowAddModal(false);
        setNewProspect({ name: '', email: '', company: '', title: '' });
        setSelectedList('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add prospect');
      }
    } catch (error) {
      console.error('Error adding prospect:', error);
      alert('Failed to add prospect');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const prospects = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim());
          return {
            name: values[headers.indexOf('name')] || '',
            email: values[headers.indexOf('email')] || '',
            company: values[headers.indexOf('company')] || '',
            title: values[headers.indexOf('title')] || '',
          };
        })
        .filter(p => p.email);

      const response = await fetch('/api/prospects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prospects,
          listId: selectedList || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully imported ${result.imported} prospects to ${result.listName}!`);
        fetchProspects();
        setShowImportModal(false);
        setSelectedList('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to import prospects');
      }
    } catch (error) {
      console.error('Error importing prospects:', error);
      alert('Failed to import prospects');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const createNewList = async (name: string) => {
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          color: '#3B82F6', // Default blue color
        }),
      });

      if (response.ok) {
        const newList = await response.json();
        setLists([...lists, newList]);
        setSelectedList(newList.id);
        console.log('Created new list:', newList);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create list');
      }
    } catch (error) {
      console.error('Error creating list:', error);
      alert('Failed to create list');
    }
  };

  const handleAddToList = async () => {
    if (!selectedList || selectedProspects.length === 0) return;

    try {
      const response = await fetch(`/api/lists/${selectedList}/prospects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prospectIds: selectedProspects,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Added ${result.added} prospects to list!`);
        fetchProspects();
        setShowAddToListModal(false);
        setSelectedProspects([]);
        setSelectedList('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add prospects to list');
      }
    } catch (error) {
      console.error('Error adding prospects to list:', error);
      alert('Failed to add prospects to list');
    }
  };

  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = !searchTerm || 
      prospect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.company.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesList = filterByList === 'all' || 
      prospect.lists?.some(list => list.id === filterByList);

    return matchesSearch && matchesList;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading prospects...</div>
      </div>
    );
  }

  if (showListManager) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => setShowListManager(false)}
            className="text-indigo-600 hover:text-indigo-800 mb-4"
          >
            ← Back to Prospects
          </button>
        </div>
        <ListManager />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prospects Library</h1>
            <p className="text-gray-600">Manage and organize your prospects</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowListManager(true)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Manage Lists
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Add Prospect
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Import CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search prospects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <select
              value={filterByList}
              onChange={(e) => setFilterByList(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Lists</option>
              {lists.map(list => (
                <option key={list.id} value={list.id}>{list.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProspects.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-indigo-700">
                {selectedProspects.length} prospect(s) selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowAddToListModal(true)}
                  className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                >
                  Add to List
                </button>
                <button
                  onClick={() => setSelectedProspects([])}
                  className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prospects Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProspects(filteredProspects.map(p => p.id));
                    } else {
                      setSelectedProspects([]);
                    }
                  }}
                  checked={selectedProspects.length === filteredProspects.length && filteredProspects.length > 0}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lists
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Campaign
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Added
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProspects.map((prospect) => (
              <tr key={prospect.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedProspects.includes(prospect.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProspects([...selectedProspects, prospect.id]);
                      } else {
                        setSelectedProspects(selectedProspects.filter(id => id !== prospect.id));
                      }
                    }}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{prospect.name}</div>
                    <div className="text-sm text-gray-500">{prospect.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {prospect.company}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {prospect.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {prospect.lists?.map(list => (
                      <span
                        key={list.id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: list.color }}
                      >
                        {list.name}
                      </span>
                    )) || (
                      <span className="text-xs text-gray-400">No lists</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    prospect.status === 'new' ? 'bg-blue-100 text-blue-800' :
                    prospect.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                    prospect.status === 'replied' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {prospect.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {prospect.campaignName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(prospect.addedDate).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProspects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No prospects found</div>
            {searchTerm || filterByList !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterByList('all');
                }}
                className="text-indigo-600 hover:text-indigo-800"
              >
                Clear filters
              </button>
            ) : (
              <button
                onClick={() => setShowAddModal(true)}
                className="text-indigo-600 hover:text-indigo-800"
              >
                Add your first prospect
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Prospect Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Prospect</h3>
            <form onSubmit={handleAddProspect} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={newProspect.name}
                  onChange={(e) => setNewProspect({...newProspect, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={newProspect.email}
                  onChange={(e) => setNewProspect({...newProspect, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={newProspect.company}
                  onChange={(e) => setNewProspect({...newProspect, company: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newProspect.title}
                  onChange={(e) => setNewProspect({...newProspect, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add to List
                </label>
                <select
                  value={selectedList}
                  onChange={(e) => setSelectedList(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a list (optional)</option>
                  {lists.map(list => (
                    <option key={list.id} value={list.id}>{list.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Add Prospect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Import Prospects from CSV</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add to List
                </label>
                <select
                  value={selectedList}
                  onChange={(e) => setSelectedList(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Default list</option>
                  {lists.map(list => (
                    <option key={list.id} value={list.id}>{list.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isImporting}
                  title="Upload CSV file"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  CSV should have columns: name, email, company, title
                </p>
              </div>
              {isImporting && (
                <div className="text-center py-4">
                  <div className="text-indigo-600">Importing prospects...</div>
                </div>
              )}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  disabled={isImporting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add to List Modal */}
      {showAddToListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Prospects to List</h3>
            <div className="space-y-4">
              <div className="text-xs text-gray-500 mb-2">
                Debug: {lists.length} lists available, {selectedProspects.length} prospects selected
                {lists.length === 0 && (
                  <div className="text-orange-600 mt-1">
                    No lists found. You can create one using the "Manage Lists" button or select "+ Create New List" below.
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select List
                </label>
                <select
                  value={selectedList}
                  onChange={(e) => {
                    console.log('Selected list changed to:', e.target.value);
                    if (e.target.value === 'create-new') {
                      // Handle create new list
                      const listName = prompt('Enter new list name:');
                      if (listName) {
                        createNewList(listName);
                      }
                    } else {
                      setSelectedList(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a list...</option>
                  {lists.map(list => (
                    <option key={list.id} value={list.id}>{list.name}</option>
                  ))}
                  {lists.length === 0 && (
                    <option value="create-new">+ Create New List</option>
                  )}
                  <option value="create-new">+ Create New List</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddToListModal(false);
                    setSelectedList('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddToList}
                  disabled={!selectedList}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  Add to List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 