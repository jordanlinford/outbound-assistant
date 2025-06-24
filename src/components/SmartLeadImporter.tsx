'use client';

import { useState } from 'react';
import { Button } from './ui/button';

interface Lead {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  linkedinUrl?: string;
  phone?: string;
  industry?: string;
  companySize?: string;
}

interface SmartLeadImporterProps {
  onLeadsImported: (leads: Lead[]) => void;
  onClose: () => void;
}

export default function SmartLeadImporter({ onLeadsImported, onClose }: SmartLeadImporterProps) {
  const [importMethod, setImportMethod] = useState<'csv' | 'linkedin' | 'domain' | 'manual'>('csv');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [linkedinUrls, setLinkedinUrls] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [jobTitles, setJobTitles] = useState('CEO, CTO, VP Sales, Head of Marketing');
  const [manualLeads, setManualLeads] = useState<Lead[]>([
    { email: '', firstName: '', lastName: '', company: '', title: '' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [enrichmentResults, setEnrichmentResults] = useState<Lead[]>([]);

  const handleCSVUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const leads: Lead[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim());
          const lead: Lead = {
            email: values[headers.indexOf('email')] || '',
            firstName: values[headers.indexOf('firstname') || headers.indexOf('first_name')] || '',
            lastName: values[headers.indexOf('lastname') || headers.indexOf('last_name')] || '',
            company: values[headers.indexOf('company')] || '',
            title: values[headers.indexOf('title') || headers.indexOf('job_title')] || '',
            linkedinUrl: values[headers.indexOf('linkedin')] || '',
            phone: values[headers.indexOf('phone')] || '',
          };
          if (lead.email) leads.push(lead);
        }
      }
      
      setEnrichmentResults(leads);
    } catch (error) {
      console.error('Error processing CSV:', error);
    }
    setIsProcessing(false);
  };

  const handleLinkedInEnrichment = async () => {
    setIsProcessing(true);
    try {
      const urls = linkedinUrls.split('\n').filter(url => url.trim());
      const leads: Lead[] = [];
      
      for (const url of urls) {
        // Simulate LinkedIn enrichment (in production, use a service like Apollo or ZoomInfo)
        const mockLead: Lead = {
          email: `contact@${url.split('/in/')[1]?.split('/')[0] || 'example'}.com`,
          firstName: 'John',
          lastName: 'Doe',
          company: 'Example Corp',
          title: 'VP of Sales',
          linkedinUrl: url.trim(),
        };
        leads.push(mockLead);
      }
      
      setEnrichmentResults(leads);
    } catch (error) {
      console.error('Error enriching LinkedIn profiles:', error);
    }
    setIsProcessing(false);
  };

  const handleDomainEnrichment = async () => {
    setIsProcessing(true);
    try {
      const titles = jobTitles.split(',').map(t => t.trim());
      const leads: Lead[] = [];
      
      // Simulate domain-based lead generation
      for (const title of titles) {
        const mockLead: Lead = {
          email: `${title.toLowerCase().replace(/\s+/g, '.')}@${companyDomain}`,
          firstName: 'Jane',
          lastName: 'Smith',
          company: companyDomain.replace(/\.(com|org|net)$/, ''),
          title: title,
        };
        leads.push(mockLead);
      }
      
      setEnrichmentResults(leads);
    } catch (error) {
      console.error('Error enriching domain:', error);
    }
    setIsProcessing(false);
  };

  const addManualLead = () => {
    setManualLeads([...manualLeads, { email: '', firstName: '', lastName: '', company: '', title: '' }]);
  };

  const updateManualLead = (index: number, field: keyof Lead, value: string) => {
    const updated = [...manualLeads];
    updated[index] = { ...updated[index], [field]: value };
    setManualLeads(updated);
  };

  const handleImport = () => {
    let finalLeads: Lead[] = [];
    
    if (importMethod === 'manual') {
      finalLeads = manualLeads.filter(lead => lead.email && lead.firstName);
    } else {
      finalLeads = enrichmentResults;
    }
    
    onLeadsImported(finalLeads);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Smart Lead Import</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" title="Close">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Import Method Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Import Method</label>
          <div className="grid grid-cols-4 gap-4">
            {[
              { key: 'csv', label: 'CSV Upload', icon: '📄' },
              { key: 'linkedin', label: 'LinkedIn URLs', icon: '💼' },
              { key: 'domain', label: 'Company Domain', icon: '🌐' },
              { key: 'manual', label: 'Manual Entry', icon: '✏️' },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setImportMethod(key as any)}
                className={`p-4 border rounded-lg text-center transition-all ${
                  importMethod === key
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{icon}</div>
                <div className="text-sm font-medium">{label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* CSV Upload */}
        {importMethod === 'csv' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              title="Upload CSV file with lead data"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCsvFile(file);
                  handleCSVUpload(file);
                }
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Expected columns: email, firstname, lastname, company, title, linkedin, phone
            </p>
          </div>
        )}

        {/* LinkedIn URLs */}
        {importMethod === 'linkedin' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LinkedIn Profile URLs (one per line)
            </label>
            <textarea
              value={linkedinUrls}
              onChange={(e) => setLinkedinUrls(e.target.value)}
              placeholder="https://linkedin.com/in/john-doe&#10;https://linkedin.com/in/jane-smith"
              title="Enter LinkedIn profile URLs, one per line"
              className="w-full h-32 p-3 border border-gray-300 rounded-md"
            />
            <Button
              onClick={handleLinkedInEnrichment}
              disabled={!linkedinUrls.trim() || isProcessing}
              className="mt-2"
            >
              {isProcessing ? 'Enriching...' : 'Enrich Profiles'}
            </Button>
          </div>
        )}

        {/* Company Domain */}
        {importMethod === 'domain' && (
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Domain
              </label>
              <input
                type="text"
                value={companyDomain}
                onChange={(e) => setCompanyDomain(e.target.value)}
                placeholder="example.com"
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Job Titles (comma separated)
              </label>
              <input
                type="text"
                value={jobTitles}
                onChange={(e) => setJobTitles(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
            <Button
              onClick={handleDomainEnrichment}
              disabled={!companyDomain.trim() || isProcessing}
            >
              {isProcessing ? 'Finding Contacts...' : 'Find Contacts'}
            </Button>
          </div>
        )}

        {/* Manual Entry */}
        {importMethod === 'manual' && (
          <div className="mb-6">
            <div className="space-y-4">
              {manualLeads.map((lead, index) => (
                <div key={index} className="grid grid-cols-5 gap-3 p-4 border border-gray-200 rounded-lg">
                  <input
                    type="email"
                    placeholder="Email"
                    value={lead.email}
                    onChange={(e) => updateManualLead(index, 'email', e.target.value)}
                    className="p-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="First Name"
                    value={lead.firstName}
                    onChange={(e) => updateManualLead(index, 'firstName', e.target.value)}
                    className="p-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={lead.lastName}
                    onChange={(e) => updateManualLead(index, 'lastName', e.target.value)}
                    className="p-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Company"
                    value={lead.company}
                    onChange={(e) => updateManualLead(index, 'company', e.target.value)}
                    className="p-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Job Title"
                    value={lead.title}
                    onChange={(e) => updateManualLead(index, 'title', e.target.value)}
                    className="p-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              ))}
            </div>
            <Button onClick={addManualLead} variant="outline" className="mt-4">
              + Add Another Lead
            </Button>
          </div>
        )}

        {/* Results Preview */}
        {enrichmentResults.length > 0 && importMethod !== 'manual' && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Found {enrichmentResults.length} leads
            </h3>
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {enrichmentResults.map((lead, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900">{lead.firstName} {lead.lastName}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{lead.email}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{lead.company}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{lead.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={
              (importMethod === 'manual' && manualLeads.filter(l => l.email).length === 0) ||
              (importMethod !== 'manual' && enrichmentResults.length === 0)
            }
          >
            Import {
              importMethod === 'manual' 
                ? manualLeads.filter(l => l.email).length 
                : enrichmentResults.length
            } Leads
          </Button>
        </div>
      </div>
    </div>
  );
} 