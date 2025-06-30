'use client';

import { useState } from 'react';
import { Button } from './ui/button';

interface EmailTemplate {
  id: string;
  subject: string;
  body: string;
  delay: number; // days
  type: 'initial' | 'follow_up' | 'breakup';
}

interface AISequenceGeneratorProps {
  onSequenceGenerated: (sequence: EmailTemplate[]) => void;
  onClose: () => void;
  targetIndustry?: string;
  valueProposition?: string;
}

export default function AISequenceGenerator({ 
  onSequenceGenerated, 
  onClose, 
  targetIndustry = '',
  valueProposition = ''
}: AISequenceGeneratorProps) {
  const [industry, setIndustry] = useState(targetIndustry);
  const [value, setValue] = useState(valueProposition);
  const [tone, setTone] = useState<'professional' | 'casual' | 'urgent' | 'friendly'>('professional');
  const [sequenceLength, setSequenceLength] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSequence, setGeneratedSequence] = useState<EmailTemplate[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [caseStudy, setCaseStudy] = useState('');
  const [callToAction, setCallToAction] = useState('Schedule a meeting');
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  // Manual sequence state
  const [manualSteps, setManualSteps] = useState<EmailTemplate[]>([{
    id: '1',
    subject: '',
    body: '',
    delay: 0,
    type: 'initial',
  }]);

  const toneDescriptions = {
    professional: 'Formal, business-focused language',
    casual: 'Conversational and approachable',
    urgent: 'Creates urgency and FOMO',
    friendly: 'Warm and relationship-building'
  };

  const generateSequence = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation (in production, call OpenAI/Claude API)
    const templates: EmailTemplate[] = [
      {
        id: '1',
        type: 'initial',
        delay: 0,
        subject: `Quick question about ${industry} growth at {{company}}`,
        body: `Hi {{firstName}},

I noticed {{company}} has been making some impressive moves in the ${industry} space. 

${value ? `We've been helping similar companies ${value.toLowerCase()}.` : 'We specialize in helping companies like yours scale efficiently.'}

${caseStudy ? `For example, ${caseStudy}` : 'Recently helped a similar company increase their revenue by 40% in 6 months.'}

Worth a quick 15-minute chat to see if there's a fit?

Best,
${senderName || 'Your Name'}
${companyName || 'Your Company'}`
      },
      {
        id: '2',
        type: 'follow_up',
        delay: 3,
        subject: `Re: ${industry} growth at {{company}}`,
        body: `Hi {{firstName}},

Just wanted to follow up on my previous email about helping {{company}} with ${industry.toLowerCase()} growth.

I understand you're probably busy, but I thought you might be interested in seeing how we helped [Similar Company] achieve:

• 40% increase in qualified leads
• 25% reduction in customer acquisition cost
• 60% faster sales cycle

Would love to share the specific strategies that made this possible.

Available for a brief call this week?

Best,
${senderName || 'Your Name'}`
      },
      {
        id: '3',
        type: 'follow_up',
        delay: 7,
        subject: `Last attempt - ${industry} case study for {{company}}`,
        body: `Hi {{firstName}},

I've reached out a couple of times about helping {{company}} with ${industry.toLowerCase()} growth.

Since I haven't heard back, I'm assuming this isn't a priority right now.

Before I close your file, I wanted to share one quick case study that might be relevant:

[Case Study Link] - How [Similar Company] grew from $2M to $10M ARR in 18 months

If this resonates, just reply with "interested" and I'll send over the full breakdown.

Otherwise, I'll leave you be.

Best,
${senderName || 'Your Name'}`
      },
      {
        id: '4',
        type: 'follow_up',
        delay: 14,
        subject: `Timing might be better now?`,
        body: `Hi {{firstName}},

Hope you've been well!

I reached out a few weeks ago about helping {{company}} with ${industry.toLowerCase()} growth.

Timing wasn't right then, but I wanted to check if anything has changed?

We just launched a new program specifically for ${industry} companies looking to scale, and I thought of {{company}}.

Worth a quick conversation?

Best,
${senderName || 'Your Name'}`
      },
      {
        id: '5',
        type: 'breakup',
        delay: 21,
        subject: `Moving on from {{company}}`,
        body: `Hi {{firstName}},

I've tried reaching out several times about helping {{company}} with ${industry.toLowerCase()} growth, but haven't heard back.

I'm going to assume this isn't a fit and remove you from my follow-up sequence.

If I was wrong and you'd like to explore how we can help {{company}} ${value.toLowerCase()}, just reply to this email.

Otherwise, best of luck with your ${industry.toLowerCase()} initiatives!

Best,
${senderName || 'Your Name'}

P.S. If you know someone else at {{company}} who might be interested, I'd appreciate an introduction.`
      }
    ];

    // Adjust tone based on selection
    if (tone === 'casual') {
      templates.forEach(template => {
        template.body = template.body
          .replace(/Best,/g, 'Cheers,')
          .replace(/Hi /g, 'Hey ')
          .replace(/Worth a quick/g, 'Want to grab a quick');
      });
    } else if (tone === 'urgent') {
      templates.forEach(template => {
        template.subject = `🚨 ${template.subject}`;
        template.body = template.body.replace(/Worth a quick/g, 'URGENT: Need a quick');
      });
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setGeneratedSequence(templates.slice(0, sequenceLength));
    setIsGenerating(false);
  };

  const handleSaveSequence = () => {
    onSequenceGenerated(generatedSequence);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">AI Email Sequence Generator</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" title="Close">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode toggle */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setMode('ai')}
            className={`px-4 py-2 rounded-md ${mode === 'ai' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-700 border border-gray-300'}`}
          >
            AI Generate
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`px-4 py-2 rounded-md ${mode === 'manual' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-700 border border-gray-300'}`}
          >
            Manual Compose
          </button>
        </div>

        {mode === 'ai' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corp"
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="John Smith"
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Industry
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="SaaS, E-commerce, Manufacturing, etc."
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Value Proposition
              </label>
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="increase revenue, reduce costs, improve efficiency, etc."
                className="w-full h-24 p-3 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="cta-input" className="block text-sm font-medium text-gray-700 mb-2">
                Primary Call-to-Action
              </label>
              <input
                id="cta-input"
                type="text"
                value={callToAction}
                onChange={(e) => setCallToAction(e.target.value)}
                placeholder="Book a demo, Reply with info, Visit website..."
                className="w-full p-3 border border-gray-300 rounded-md"
                title="Primary call to action"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Case Study / Social Proof
              </label>
              <textarea
                value={caseStudy}
                onChange={(e) => setCaseStudy(e.target.value)}
                placeholder="we helped TechCorp increase their leads by 300% in 90 days..."
                className="w-full h-24 p-3 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Tone
              </label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(toneDescriptions).map(([key, description]) => (
                  <button
                    key={key}
                    onClick={() => setTone(key as any)}
                    className={`p-3 border rounded-lg text-left transition-all ${
                      tone === key
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium capitalize">{key}</div>
                    <div className="text-xs text-gray-500">{description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sequence Length: {sequenceLength} emails
              </label>
              <input
                type="range"
                min="3"
                max="7"
                value={sequenceLength}
                onChange={(e) => setSequenceLength(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>3 emails</span>
                <span>7 emails</span>
              </div>
            </div>

            <Button
              onClick={generateSequence}
              disabled={isGenerating || !industry || !value}
              className="w-full"
            >
              {isGenerating ? 'Generating Sequence...' : 'Generate AI Sequence'}
            </Button>
          </div>

          {/* Preview Panel */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Email Sequence Preview</h3>
            
            {generatedSequence.length === 0 && !isGenerating && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">🤖</div>
                <p>Fill in the details and click "Generate AI Sequence" to see your personalized email sequence</p>
              </div>
            )}

            {isGenerating && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">AI is crafting your perfect sequence...</p>
              </div>
            )}

            {generatedSequence.map((email, index) => (
              <div key={email.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-sm font-medium text-indigo-600">
                      Email {index + 1} - {email.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <div className="text-xs text-gray-500">
                      {email.delay === 0 ? 'Send immediately' : `Send after ${email.delay} days`}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label htmlFor={`subject-${index}`} className="block text-xs font-medium text-gray-700 mb-1">Subject Line</label>
                    <div className="bg-gray-50 p-2 rounded text-sm">{email.subject}</div>
                  </div>
                  
                  <div>
                    <label htmlFor={`body-${index}`} className="block text-xs font-medium text-gray-700 mb-1">Email Body</label>
                    <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-line max-h-40 overflow-y-auto">
                      {email.body}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {generatedSequence.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0 pt-4">
                <Button variant="outline" onClick={() => setGeneratedSequence([])}>
                  Regenerate
                </Button>
                <Button variant="outline" onClick={() => {
                  setManualSteps(generatedSequence);
                  setMode('manual');
                }}>
                  Edit Sequence
                </Button>
                <Button onClick={handleSaveSequence}>
                  Use As-Is
                </Button>
              </div>
            )}
          </div>
        </div>
        ) : (
          <div className="space-y-6">
            {manualSteps.map((step, idx) => (
              <div key={step.id} className="border rounded-md p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Step {idx + 1}</h3>
                  {manualSteps.length > 1 && (
                    <button
                      className="text-red-500 text-sm"
                      onClick={() => setManualSteps(manualSteps.filter(s => s.id !== step.id))}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div>
                  <label htmlFor={`subject-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    id={`subject-${idx}`}
                    type="text"
                    value={step.subject}
                    onChange={e => {
                      const updated = [...manualSteps];
                      updated[idx].subject = e.target.value;
                      setManualSteps(updated);
                    }}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor={`body-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                  <textarea
                    id={`body-${idx}`}
                    value={step.body}
                    onChange={e => {
                      const updated = [...manualSteps];
                      updated[idx].body = e.target.value;
                      setManualSteps(updated);
                    }}
                    rows={6}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`delay-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">Delay (days)</label>
                    <input
                      id={`delay-${idx}`}
                      type="number"
                      value={step.delay}
                      min={0}
                      onChange={e => {
                        const updated = [...manualSteps];
                        updated[idx].delay = parseInt(e.target.value) || 0;
                        setManualSteps(updated);
                      }}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor={`type-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      id={`type-${idx}`}
                      value={step.type}
                      onChange={e => {
                        const updated = [...manualSteps];
                        updated[idx].type = e.target.value as EmailTemplate['type'];
                        setManualSteps(updated);
                      }}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="initial">Initial</option>
                      <option value="follow_up">Follow Up</option>
                      <option value="breakup">Breakup</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setManualSteps([...manualSteps, { id: Date.now().toString(), subject: '', body: '', delay: 0, type: 'follow_up' }])}
              >
                Add Step
              </Button>
              <div className="space-x-3">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button
                  onClick={() => {
                    onSequenceGenerated(manualSteps);
                    onClose();
                  }}
                  disabled={manualSteps.some(s => !s.subject || !s.body)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Save Sequence
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 