'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface ProspectCriteria {
  industries: string[];
  companySizes: string[];
  jobTitles: string[];
  locations: string[];
  technologies: string[];
  keywords: string[];
  excludeCompanies?: string[];
}

interface FoundProspect {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  industry: string;
  companySize: string;
  score: number;
  linkedinUrl?: string;
  reason: string;
  dataSource: 'ai' | 'linkedin' | 'apollo' | 'manual';
  confidence: number;
  companyWebsite?: string;
  phoneNumber?: string;
  location?: string;
}

interface SearchResults {
  prospects: FoundProspect[];
  total: number;
  sources: {
    ai: number;
    linkedin: number;
    apollo: number;
  };
  excludedDuplicates?: number;
  searchVariation?: string;
}

export default function AutoProspectFinder() {
  const { data: session } = useSession();
  const [criteria, setCriteria] = useState<ProspectCriteria>({
    industries: [],
    companySizes: [],
    jobTitles: [],
    locations: [],
    technologies: [],
    keywords: [],
    excludeCompanies: []
  });
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customJobTitle, setCustomJobTitle] = useState('');

  const industryOptions = [
    'Technology', 'SaaS', 'E-commerce', 'Healthcare', 'Finance', 'Marketing',
    'Real Estate', 'Manufacturing', 'Education', 'Consulting', 'Legal', 
    'Media', 'Retail', 'Non-profit', 'Government', 'Energy', 'Transportation'
  ];

  const companySizeOptions = [
    '1-10 employees', '11-50 employees', '51-200 employees', 
    '201-500 employees', '501-1000 employees', '1000+ employees'
  ];

  const jobTitleOptions = [
    'CEO', 'CTO', 'CMO', 'CFO', 'VP Sales', 'VP Marketing', 'VP Operations',
    'Director', 'Manager', 'Founder', 'Co-founder', 'Head of Growth',
    'Head of Sales', 'Head of Marketing', 'Head of Engineering', 'President'
  ];

  const locationOptions = [
    'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia',
    'San Francisco Bay Area', 'New York City', 'Los Angeles', 'Chicago', 'Boston',
    'Austin', 'Seattle', 'Denver', 'Atlanta', 'Miami', 'Toronto', 'London', 'Berlin'
  ];

  const technologyOptions = [
    'Salesforce', 'HubSpot', 'Slack', 'Microsoft Office', 'Google Workspace',
    'AWS', 'Azure', 'Shopify', 'WordPress', 'React', 'Python', 'JavaScript',
    'Docker', 'Kubernetes', 'Zoom', 'Asana', 'Trello', 'Jira'
  ];

  const findProspects = async () => {
    if (criteria.industries.length === 0 && criteria.jobTitles.length === 0) {
      alert('Please select at least one industry or job title');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch('/api/prospects/auto-find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criteria })
      });

      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);

        if (results.total === 0) {
          alert('No prospects found for the given criteria.');
        }
        // Show user feedback about duplicates excluded
        if (results.excludedDuplicates > 0) {
          console.log(`ℹ️ Excluded ${results.excludedDuplicates} prospects you already have`);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to find prospects');
      }
    } catch (error) {
      console.error('Error finding prospects:', error);
      alert('Failed to find prospects. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const importSelected = async () => {
    const selected = searchResults?.prospects.filter(p => selectedProspects.includes(p.email)) || [];
    
    try {
      const response = await fetch('/api/prospects/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospects: selected })
      });

      if (response.ok) {
        alert(`Successfully imported ${selected.length} prospects!`);
        setSelectedProspects([]);
      }
    } catch (error) {
      console.error('Error importing prospects:', error);
      alert('Failed to import prospects. Please try again.');
    }
  };

  const selectAll = () => {
    if (searchResults?.prospects) {
      setSelectedProspects(searchResults.prospects.map(p => p.email));
    }
  };

  const clearSelection = () => {
    setSelectedProspects([]);
  };

  const getDataSourceBadge = (source: string) => {
    const badges = {
      ai: { color: 'bg-blue-100 text-blue-800', label: 'AI Generated' },
      linkedin: { color: 'bg-linkedin text-white', label: 'LinkedIn' },
      apollo: { color: 'bg-purple-100 text-purple-800', label: 'Apollo' }
    };
    const badge = badges[source as keyof typeof badges] || badges.ai;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const addCustomJobTitle = () => {
    const trimmed = customJobTitle.trim();
    if (!trimmed) return;
    setCriteria(prev => ({
      ...prev,
      jobTitles: [...prev.jobTitles, trimmed]
    }));
    setCustomJobTitle('');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          🎯 Auto Prospect Finder
        </h2>
        <p className="text-gray-600">
          Describe your ideal customer and we'll find them automatically using AI + multiple data sources
        </p>
      </div>

      {/* Criteria Form */}
      <div className="space-y-6 mb-6">
        {/* Basic Criteria */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industries *
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
              {industryOptions.map(industry => (
                <label key={industry} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={criteria.industries.includes(industry)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCriteria(prev => ({
                          ...prev,
                          industries: [...prev.industries, industry]
                        }));
                      } else {
                        setCriteria(prev => ({
                          ...prev,
                          industries: prev.industries.filter(i => i !== industry)
                        }));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{industry}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Titles *
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
              {jobTitleOptions.map(title => (
                <label key={title} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={criteria.jobTitles.includes(title)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCriteria(prev => ({
                          ...prev,
                          jobTitles: [...prev.jobTitles, title]
                        }));
                      } else {
                        setCriteria(prev => ({
                          ...prev,
                          jobTitles: prev.jobTitles.filter(t => t !== title)
                        }));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{title}</span>
                </label>
              ))}
            </div>

            {/* Custom / wildcard job title input */}
            <div className="mt-4">
              <label htmlFor="custom-job-title" className="block text-sm font-medium text-gray-700 mb-1">
                Add custom / wildcard job title
              </label>
              <div className="flex gap-2">
                <input
                  id="custom-job-title"
                  type="text"
                  value={customJobTitle}
                  onChange={(e) => setCustomJobTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomJobTitle();
                    }
                  }}
                  placeholder="e.g. *Growth*, Revenue Ops, *Engineer*"
                  className="flex-1 p-2 border rounded"
                />
                <button
                  type="button"
                  onClick={addCustomJobTitle}
                  className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Display selected custom titles as chips */}
            {criteria.jobTitles.filter(t => !jobTitleOptions.includes(t)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {criteria.jobTitles.filter(t => !jobTitleOptions.includes(t)).map(title => (
                  <span
                    key={title}
                    className="inline-flex items-center bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full"
                  >
                    {title}
                    <button
                      type="button"
                      onClick={() => setCriteria(prev => ({
                        ...prev,
                        jobTitles: prev.jobTitles.filter(t => t !== title)
                      }))}
                      className="ml-1 text-indigo-600 hover:text-indigo-800"
                      aria-label={`Remove ${title}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Size
            </label>
            <div className="space-y-2">
              {companySizeOptions.map(size => (
                <label key={size} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={criteria.companySizes.includes(size)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCriteria(prev => ({
                          ...prev,
                          companySizes: [...prev.companySizes, size]
                        }));
                      } else {
                        setCriteria(prev => ({
                          ...prev,
                          companySizes: prev.companySizes.filter(s => s !== size)
                        }));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{size}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keywords
            </label>
            <textarea
              value={criteria.keywords.join(', ')}
              onChange={(e) => setCriteria(prev => ({
                ...prev,
                keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
              }))}
              placeholder="AI, automation, SaaS, funding, startup, growth..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              rows={3}
            />
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
        >
          {showAdvanced ? '▼ Hide Advanced Options' : '▶ Show Advanced Options'}
        </button>

        {/* Advanced Criteria */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Locations
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
                {locationOptions.map(location => (
                  <label key={location} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={criteria.locations.includes(location)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCriteria(prev => ({
                            ...prev,
                            locations: [...prev.locations, location]
                          }));
                        } else {
                          setCriteria(prev => ({
                            ...prev,
                            locations: prev.locations.filter(l => l !== location)
                          }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{location}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Technologies Used
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
                {technologyOptions.map(tech => (
                  <label key={tech} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={criteria.technologies.includes(tech)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCriteria(prev => ({
                            ...prev,
                            technologies: [...prev.technologies, tech]
                          }));
                        } else {
                          setCriteria(prev => ({
                            ...prev,
                            technologies: prev.technologies.filter(t => t !== tech)
                          }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{tech}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exclude Companies
              </label>
              <textarea
                value={criteria.excludeCompanies?.join(', ') || ''}
                onChange={(e) => setCriteria(prev => ({
                  ...prev,
                  excludeCompanies: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                }))}
                placeholder="Company names to exclude from results..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                rows={2}
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={findProspects}
        disabled={isSearching || (criteria.industries.length === 0 && criteria.jobTitles.length === 0)}
        className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed mb-6 font-medium"
      >
        {isSearching ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Finding Prospects...
          </span>
        ) : 'Find Prospects'}
      </button>

      {/* Results */}
      {searchResults && (
        <div>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">
                Found {searchResults.total} Qualified Prospects
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={selectAll}
                  className="text-indigo-600 hover:text-indigo-800 text-sm"
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  Clear
                </button>
                <button
                  onClick={importSelected}
                  disabled={selectedProspects.length === 0}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Import Selected ({selectedProspects.length})
                </button>
              </div>
            </div>

            {/* Data Source Summary */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
              <span className="font-medium">Sources:</span>
              {searchResults.sources.ai > 0 && <span>AI Generated: {searchResults.sources.ai}</span>}
              {searchResults.sources.linkedin > 0 && <span>LinkedIn: {searchResults.sources.linkedin}</span>}
              {searchResults.sources.apollo > 0 && <span>Apollo: {searchResults.sources.apollo}</span>}
              {(searchResults.excludedDuplicates || 0) > 0 && (
                <span className="text-green-600">
                  ✓ Excluded {searchResults.excludedDuplicates} duplicates
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {searchResults.prospects.map((prospect) => (
              <div key={prospect.email} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedProspects.includes(prospect.email)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProspects(prev => [...prev, prospect.email]);
                        } else {
                          setSelectedProspects(prev => prev.filter(email => email !== prospect.email));
                        }
                      }}
                      className="mt-1"
                      aria-label={`Select ${prospect.firstName} ${prospect.lastName}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">
                          {prospect.firstName} {prospect.lastName}
                        </h4>
                        {getDataSourceBadge(prospect.dataSource)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {prospect.title} at {prospect.company}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                        <span>{prospect.industry}</span>
                        <span>•</span>
                        <span>{prospect.companySize}</span>
                        {prospect.location && (
                          <>
                            <span>•</span>
                            <span>{prospect.location}</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-green-600 mb-2">
                        {prospect.reason}
                      </p>
                      <div className="flex items-center space-x-4 text-xs">
                        <a 
                          href={`mailto:${prospect.email}`} 
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          {prospect.email}
                        </a>
                        {prospect.linkedinUrl && (
                          <a 
                            href={prospect.linkedinUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            LinkedIn
                          </a>
                        )}
                        {prospect.companyWebsite && (
                          <a 
                            href={prospect.companyWebsite} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-gray-800"
                          >
                            Website
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-indigo-600">
                      {prospect.score}%
                    </div>
                    <div className="text-xs text-gray-500">Match Score</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {Math.round(prospect.confidence * 100)}% confidence
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 