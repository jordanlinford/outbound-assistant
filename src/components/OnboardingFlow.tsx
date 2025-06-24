'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Connect Your Account',
    description: 'Link your email and calendar to get started',
  },
  {
    id: 2,
    title: 'Choose Template',
    description: 'Select an industry-specific email sequence',
  },
  {
    id: 3,
    title: 'Launch Campaign',
    description: 'Review and start your outreach',
  },
];

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<'gmail' | 'outlook' | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const handleProviderSelect = (provider: 'gmail' | 'outlook') => {
    setSelectedProvider(provider);
    if (provider === 'gmail') {
      window.location.href = '/api/auth/signin/google';
    }
    // TODO: Implement Outlook OAuth flow
  };

  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template);
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant={selectedProvider === 'gmail' ? 'default' : 'outline'}
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => handleProviderSelect('gmail')}
              >
                <Mail className="h-8 w-8" />
                <span>Connect Gmail</span>
              </Button>
              <Button
                variant={selectedProvider === 'outlook' ? 'default' : 'outline'}
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => handleProviderSelect('outlook')}
              >
                <Mail className="h-8 w-8" />
                <span>Connect Outlook</span>
              </Button>
            </div>
            {selectedProvider && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span>Successfully connected to {selectedProvider}</span>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Industry Template</label>
              <Select onValueChange={handleTemplateSelect} value={selectedTemplate}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saas">SaaS Outreach</SelectItem>
                  <SelectItem value="ecommerce">E-commerce Growth</SelectItem>
                  <SelectItem value="fintech">Fintech Partnership</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedTemplate && (
              <Card className="p-4">
                <h3 className="font-medium mb-2">Template Preview</h3>
                <div className="space-y-4">
                  <div className="text-sm">
                    <p className="font-medium">Step 1: Initial Outreach</p>
                    <p className="text-gray-600">Personalized introduction and value proposition</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Step 2: Follow-up</p>
                    <p className="text-gray-600">Reinforce value and address common objections</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Step 3: Call to Action</p>
                    <p className="text-gray-600">Clear next steps and meeting scheduling</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-medium mb-4">Campaign Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Email Provider</span>
                  <span className="font-medium">{selectedProvider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Template</span>
                  <span className="font-medium">{selectedTemplate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sequence Steps</span>
                  <span className="font-medium">3 emails</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Schedule</span>
                  <span className="font-medium">Every 3 days</span>
                </div>
              </div>
            </Card>
            <Button className="w-full" onClick={() => console.log('Launch campaign')}>
              Launch Campaign
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex-1 text-center ${
                step.id === currentStep ? 'text-primary' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2 ${
                  step.id === currentStep
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {step.id}
              </div>
              <div className="text-sm font-medium">{step.title}</div>
            </div>
          ))}
        </div>
        <div className="relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2" />
          <div
            className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">{steps[currentStep - 1].title}</h2>
        <p className="text-gray-600">{steps[currentStep - 1].description}</p>
      </div>

      {renderStep()}

      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={
            (currentStep === 1 && !selectedProvider) ||
            (currentStep === 2 && !selectedTemplate) ||
            currentStep === steps.length
          }
        >
          {currentStep === steps.length ? 'Launch' : 'Next'}
          {currentStep < steps.length && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
} 