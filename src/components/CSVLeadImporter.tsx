'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface Lead {
  email: string;
  name?: string;
  company?: string;
  source?: string;
  signupDate?: string;
}

interface CSVLeadImporterProps {
  onLeadsImported: (leads: Lead[]) => void;
  onClose: () => void;
}

export default function CSVLeadImporter({ onLeadsImported, onClose }: CSVLeadImporterProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<{[key: string]: string}>({});
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        setPreviewData(parsed);
        
        // Auto-detect common column mappings
        const headers = parsed[0]?.map(h => h.toLowerCase()) || [];
        const mapping: {[key: string]: string} = {};
        
        headers.forEach((header, index) => {
          if (header.includes('email') || header.includes('e-mail')) {
            mapping['email'] = index.toString();
          } else if (header.includes('name') || header.includes('first') || header.includes('last')) {
            mapping['name'] = index.toString();
          } else if (header.includes('company') || header.includes('organization')) {
            mapping['company'] = index.toString();
          } else if (header.includes('source') || header.includes('utm')) {
            mapping['source'] = index.toString();
          } else if (header.includes('date') || header.includes('signup') || header.includes('created')) {
            mapping['signupDate'] = index.toString();
          }
        });
        
        setColumnMapping(mapping);
        setStep('mapping');
      } catch (error) {
        alert('Error parsing CSV file. Please check the format.');
      } finally {
        setIsProcessing(false);
      }
    };
    
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
      'text/plain': ['.txt']
    },
    multiple: false
  });

  const processLeads = () => {
    if (!previewData.length) return;

    const headers = previewData[0];
    const dataRows = previewData.slice(1);
    
    const processedLeads: Lead[] = dataRows
      .filter(row => row.some(cell => cell.trim())) // Filter empty rows
      .map(row => {
        const lead: Lead = { email: '' };
        
        Object.entries(columnMapping).forEach(([field, columnIndex]) => {
          const value = row[parseInt(columnIndex)]?.trim();
          if (value) {
            (lead as any)[field] = value;
          }
        });
        
        // Validate email
        if (!lead.email || !lead.email.includes('@')) {
          return null;
        }
        
        return lead;
      })
      .filter(lead => lead !== null) as Lead[];

    setLeads(processedLeads);
    setStep('preview');
  };

  const confirmImport = () => {
    const duplicatesSkipped = (previewData.length - 1) - leads.length; // total rows minus valid leads

    onLeadsImported(leads);

    // Feedback toast (simple alert for now)
    alert(`Imported ${leads.length} prospect${leads.length !== 1 ? 's' : ''}. ${duplicatesSkipped > 0 ? `${duplicatesSkipped} duplicate${duplicatesSkipped !== 1 ? 's were' : ' was'} skipped.` : ''}`);

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            📊 Import Leads from CSV
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {step === 'upload' && (
          <div className="space-y-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <div className="text-4xl mb-4">📁</div>
              {isDragActive ? (
                <p className="text-blue-600">Drop your CSV file here...</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">
                    Drag & drop your CSV file here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports CSV files with email addresses from your landing page
                  </p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">💡 CSV Format Tips:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Include headers in the first row (email, name, company, etc.)</li>
                <li>• Email column is required</li>
                <li>• Common formats: email, name, company, source, signup_date</li>
                <li>• We'll auto-detect your columns in the next step</li>
              </ul>
            </div>

            {isProcessing && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Processing CSV file...</p>
              </div>
            )}
          </div>
        )}

        {step === 'mapping' && previewData.length > 0 && (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-4">🎯 Map Your CSV Columns</h4>
              <p className="text-sm text-gray-600 mb-4">
                We've detected {previewData.length - 1} rows. Please map your CSV columns to the correct fields:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { field: 'email', label: 'Email Address', required: true },
                { field: 'name', label: 'Name', required: false },
                { field: 'company', label: 'Company', required: false },
                { field: 'source', label: 'Source/UTM', required: false },
                { field: 'signupDate', label: 'Signup Date', required: false }
              ].map(({ field, label, required }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={columnMapping[field] || ''}
                    onChange={(e) => setColumnMapping({
                      ...columnMapping,
                      [field]: e.target.value
                    })}
                    aria-label={`Select column for ${label}`}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Select Column --</option>
                    {previewData[0]?.map((header, index) => (
                      <option key={index} value={index.toString()}>
                        {header} (Column {index + 1})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {previewData.length > 1 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">📋 Preview (First 3 Rows):</h5>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        {previewData[0].map((header, index) => (
                          <th key={index} className="text-left py-2 px-3 font-medium text-gray-700">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(1, 4).map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-gray-100">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="py-2 px-3 text-gray-600">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={processLeads}
                disabled={!columnMapping.email}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Process Leads
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">✅ Import Preview</h4>
              <p className="text-sm text-gray-600">
                Ready to import {leads.length} leads. Review the data below:
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-900">{leads.length}</div>
                  <div className="text-sm text-green-700">Total Leads</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-900">
                    {leads.filter(l => l.name).length}
                  </div>
                  <div className="text-sm text-green-700">With Names</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-900">
                    {leads.filter(l => l.company).length}
                  </div>
                  <div className="text-sm text-green-700">With Companies</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-900">
                    {leads.filter(l => l.source).length}
                  </div>
                  <div className="text-sm text-green-700">With Sources</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <h5 className="font-medium text-gray-900 mb-2">📋 Lead Preview:</h5>
              <div className="space-y-2">
                {leads.slice(0, 10).map((lead, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                    <div>
                      <div className="font-medium text-gray-900">{lead.email}</div>
                      <div className="text-sm text-gray-600">
                        {lead.name && `${lead.name} • `}
                        {lead.company && `${lead.company} • `}
                        {lead.source && `Source: ${lead.source}`}
                      </div>
                    </div>
                  </div>
                ))}
                {leads.length > 10 && (
                  <div className="text-sm text-gray-500 text-center py-2">
                    ... and {leads.length - 10} more leads
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setStep('mapping')}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={confirmImport}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Import {leads.length} Leads
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 