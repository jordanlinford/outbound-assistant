import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EmailStep {
  subject: string;
  body: string;
  delay: number;
}

interface IndustryTemplate {
  id: string;
  name: string;
  steps: EmailStep[];
}

const industryTemplates: IndustryTemplate[] = [
  {
    id: 'saas',
    name: 'SaaS',
    steps: [
      {
        subject: 'Quick question about {company}',
        body: 'Hi {firstName},\n\nI noticed you\'re using {competitor} at {company}. I\'d love to learn more about your experience and share how we\'ve helped similar companies...',
        delay: 0,
      },
      {
        subject: 'Following up - {company}',
        body: 'Hi {firstName},\n\nI wanted to follow up on my previous message. Would you be open to a quick chat about how we\'ve helped companies like yours...',
        delay: 3,
      },
      {
        subject: 'Last try - {company}',
        body: 'Hi {firstName},\n\nI understand you\'re busy. I\'ll leave you with this case study of how we helped {similarCompany} achieve {result}...',
        delay: 5,
      },
    ],
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    steps: [
      {
        subject: 'Helping {company} scale their online store',
        body: 'Hi {firstName},\n\nI noticed your impressive online store at {company}. I\'d love to share how we\'ve helped similar e-commerce businesses...',
        delay: 0,
      },
      {
        subject: 'E-commerce growth strategies for {company}',
        body: 'Hi {firstName},\n\nFollowing up to share some specific strategies we\'ve used to help e-commerce businesses like yours increase their...',
        delay: 3,
      },
      {
        subject: 'Case study: E-commerce growth',
        body: 'Hi {firstName},\n\nI wanted to share this case study of how we helped {similarCompany} achieve {result} in their e-commerce business...',
        delay: 5,
      },
    ],
  },
];

export default function EmailSequencer() {
  const router = useRouter();
  const [campaignName, setCampaignName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [steps, setSteps] = useState<EmailStep[]>(industryTemplates[0].steps);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTemplateChange = (templateId: string) => {
    const template = industryTemplates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setSteps(template.steps);
    }
  };

  const handleStepChange = (index: number, field: keyof EmailStep, value: string | number) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: campaignName,
          template: selectedTemplate,
          steps,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create campaign');
      }

      const data = await response.json();
      router.push(`/dashboard/campaigns/${data.id}`);
    } catch (error) {
      console.error('Error creating campaign:', error);
      // TODO: Add error handling UI
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <div>
          <label htmlFor="campaign-name" className="block text-sm font-medium text-gray-700">
            Campaign Name
          </label>
          <input
            type="text"
            id="campaign-name"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="template" className="block text-sm font-medium text-gray-700">
            Industry Template
          </label>
          <select
            id="template"
            value={selectedTemplate}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="">Select a template</option>
            {industryTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Email Sequence Steps</h3>
        {steps.map((step, index) => (
          <div key={index} className="rounded-lg border border-gray-200 p-4">
            <div className="mb-4">
              <label htmlFor={`step-${index}-subject`} className="block text-sm font-medium text-gray-700">
                Subject Line
              </label>
              <input
                type="text"
                id={`step-${index}-subject`}
                value={step.subject}
                onChange={(e) => handleStepChange(index, 'subject', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor={`step-${index}-body`} className="block text-sm font-medium text-gray-700">
                Email Body
              </label>
              <textarea
                id={`step-${index}-body`}
                value={step.body}
                onChange={(e) => handleStepChange(index, 'body', e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor={`step-${index}-delay`} className="block text-sm font-medium text-gray-700">
                Delay (days)
              </label>
              <input
                type="number"
                id={`step-${index}-delay`}
                value={step.delay}
                onChange={(e) => handleStepChange(index, 'delay', parseInt(e.target.value))}
                min={0}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Launching...' : 'Launch Campaign'}
        </button>
      </div>
    </form>
  );
} 