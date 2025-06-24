'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function AutomationPage() {
  const { data: session, status } = useSession();
  const [automationStatus, setAutomationStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    autoReplyEnabled: true,
    maxEmailsPerHour: 20,
    businessHoursStart: 9,
    businessHoursEnd: 17,
    autoFollowUp: true,
    blacklistedDomains: 'noreply.com,no-reply.com,mailer-daemon.com'
  });

  useEffect(() => {
    checkAutomationStatus();
  }, []);

  const checkAutomationStatus = async () => {
    try {
      const response = await fetch('/api/email/automation/start');
      const data = await response.json();
      setAutomationStatus(data);
    } catch (error) {
      console.error('Error checking automation status:', error);
    }
  };

  const startAutomation = async () => {
    setLoading(true);
    try {
      const automationConfig = {
        autoReplyEnabled: config.autoReplyEnabled,
        maxEmailsPerHour: config.maxEmailsPerHour,
        businessHours: {
          start: config.businessHoursStart,
          end: config.businessHoursEnd,
          timezone: 'America/Los_Angeles'
        },
        autoFollowUp: config.autoFollowUp,
        blacklistedDomains: config.blacklistedDomains.split(',').map(d => d.trim())
      };

      const response = await fetch('/api/email/automation/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config: automationConfig }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAutomationStatus({ isRunning: true });
        alert('🤖 Email automation started successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to start automation');
      console.error('Error starting automation:', error);
    } finally {
      setLoading(false);
    }
  };

  const stopAutomation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/email/automation/start', {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        setAutomationStatus({ isRunning: false });
        alert('🛑 Email automation stopped');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to stop automation');
      console.error('Error stopping automation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) return <div>Please sign in to access automation.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🤖 Email Automation Dashboard</h1>
      
      {/* Status Card */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Automation Status</h2>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                automationStatus?.isRunning ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="font-medium">
                {automationStatus?.isRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
            {automationStatus?.isRunning && (
              <p className="text-sm text-gray-600 mt-2">
                Monitoring your Gmail inbox for new emails...
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            {!automationStatus?.isRunning ? (
              <button
                onClick={startAutomation}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Starting...' : '▶️ Start Automation'}
              </button>
            ) : (
              <button
                onClick={stopAutomation}
                disabled={loading}
                className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Stopping...' : '⏹️ Stop Automation'}
              </button>
            )}
            
            <button
              onClick={checkAutomationStatus}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Automation Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
                         <label className="flex items-center gap-2 mb-4">
               <input
                 type="checkbox"
                 checked={config.autoReplyEnabled}
                 onChange={(e) => setConfig({...config, autoReplyEnabled: e.target.checked})}
                 className="rounded"
                 aria-label="Enable automatic replies"
               />
               <span>Enable automatic replies</span>
             </label>
             
             <label className="flex items-center gap-2 mb-4">
               <input
                 type="checkbox"
                 checked={config.autoFollowUp}
                 onChange={(e) => setConfig({...config, autoFollowUp: e.target.checked})}
                 className="rounded"
                 aria-label="Enable automatic follow-up sequences"
               />
               <span>Enable automatic follow-up sequences</span>
             </label>
          </div>
          
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Max emails per hour:</label>
                             <input
                 type="number"
                 value={config.maxEmailsPerHour}
                 onChange={(e) => setConfig({...config, maxEmailsPerHour: parseInt(e.target.value)})}
                 className="w-full p-2 border rounded"
                 min="1"
                 max="100"
                 aria-label="Maximum emails per hour"
               />
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Business hours start:</label>
                                 <select
                   value={config.businessHoursStart}
                   onChange={(e) => setConfig({...config, businessHoursStart: parseInt(e.target.value)})}
                   className="w-full p-2 border rounded"
                   aria-label="Business hours start time"
                 >
                   {Array.from({length: 24}, (_, i) => (
                     <option key={i} value={i}>{i}:00</option>
                   ))}
                 </select>
               </div>
               
               <div>
                 <label className="block text-sm font-medium mb-1">Business hours end:</label>
                 <select
                   value={config.businessHoursEnd}
                   onChange={(e) => setConfig({...config, businessHoursEnd: parseInt(e.target.value)})}
                   className="w-full p-2 border rounded"
                   aria-label="Business hours end time"
                 >
                   {Array.from({length: 24}, (_, i) => (
                     <option key={i} value={i}>{i}:00</option>
                   ))}
                 </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Blacklisted domains (comma-separated):</label>
          <input
            type="text"
            value={config.blacklistedDomains}
            onChange={(e) => setConfig({...config, blacklistedDomains: e.target.value})}
            className="w-full p-2 border rounded"
            placeholder="noreply.com, no-reply.com, spam.com"
          />
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">🔄 How Email Automation Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded">
            <div className="text-2xl mb-2">📧</div>
            <h3 className="font-medium mb-2">1. Monitor Inbox</h3>
            <p className="text-sm text-gray-600">Continuously scans your Gmail for new unread emails</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded">
            <div className="text-2xl mb-2">🧠</div>
            <h3 className="font-medium mb-2">2. AI Analysis</h3>
            <p className="text-sm text-gray-600">Analyzes intent, sentiment, and urgency using AI</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded">
            <div className="text-2xl mb-2">✍️</div>
            <h3 className="font-medium mb-2">3. Generate Response</h3>
            <p className="text-sm text-gray-600">Creates personalized, context-aware replies</p>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded">
            <div className="text-2xl mb-2">📤</div>
            <h3 className="font-medium mb-2">4. Send & Follow-up</h3>
            <p className="text-sm text-gray-600">Sends responses and schedules follow-up sequences</p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h3 className="font-medium mb-2">🛡️ Safety Features:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Rate limiting to prevent spam detection</li>
            <li>• Business hours enforcement</li>
            <li>• Smart routing for complex emails requiring human review</li>
            <li>• Blacklist filtering for no-reply and spam emails</li>
            <li>• Duplicate response prevention</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 