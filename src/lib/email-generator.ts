import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Contact {
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  industry?: string;
}

interface EmailStep {
  subject: string;
  body: string;
  delay: number;
}

const industryPrompts: Record<string, string> = {
  saas: `You are an expert B2B SaaS sales professional. Your goal is to generate a 3-step email sequence that:
1. Is personalized to the prospect's role and company
2. Focuses on value proposition and ROI
3. Includes social proof and case studies
4. Has a clear call-to-action
5. Is concise and professional

Format each email with:
- A compelling subject line
- A personalized greeting
- 2-3 short paragraphs
- A clear next step

The sequence should follow this structure:
1. Initial outreach with value proposition
2. Follow-up with social proof
3. Final attempt with case study

Keep the tone professional but conversational. Avoid generic templates.`,

  ecommerce: `You are an expert e-commerce growth consultant. Your goal is to generate a 3-step email sequence that:
1. Demonstrates understanding of their online store
2. Focuses on revenue growth and customer acquisition
3. Includes specific strategies and tactics
4. Has a clear ROI proposition
5. Is data-driven and results-focused

Format each email with:
- A compelling subject line
- A personalized greeting
- 2-3 short paragraphs
- A clear next step

The sequence should follow this structure:
1. Initial outreach with growth opportunity
2. Follow-up with specific strategies
3. Final attempt with case study

Keep the tone professional but conversational. Avoid generic templates.`,

  fintech: `You are an expert fintech solutions consultant. Your goal is to generate a 3-step email sequence that:
1. Addresses specific financial challenges
2. Focuses on compliance and security
3. Includes ROI and efficiency gains
4. Has a clear value proposition
5. Is professional and trustworthy

Format each email with:
- A compelling subject line
- A personalized greeting
- 2-3 short paragraphs
- A clear next step

The sequence should follow this structure:
1. Initial outreach with problem statement
2. Follow-up with solution overview
3. Final attempt with case study

Keep the tone professional and authoritative. Avoid generic templates.`,
};

export async function generateEmailSteps(
  template: string,
  contact: Contact
): Promise<EmailStep[]> {
  const systemPrompt = industryPrompts[template] || industryPrompts.saas;

  const userPrompt = `Generate a 3-step email sequence for:
Name: ${contact.firstName || 'Prospect'} ${contact.lastName || ''}
Company: ${contact.company || 'their company'}
Title: ${contact.title || 'their role'}
Industry: ${contact.industry || template}

The sequence should be personalized and relevant to their role and company.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the response into structured email steps
    const steps = parseEmailSteps(response);
    return steps;
  } catch (error) {
    console.error('Error generating email steps:', error);
    throw new Error('Failed to generate email sequence');
  }
}

function parseEmailSteps(response: string): EmailStep[] {
  // Split the response into individual emails
  const emailSections = response.split(/\n\n(?:Step|Email) \d+:/i);
  
  return emailSections
    .filter(section => section.trim())
    .map((section, index) => {
      const lines = section.split('\n');
      const subjectLine = lines.find(line => 
        line.toLowerCase().includes('subject:') || 
        line.toLowerCase().includes('subject line:')
      )?.split(':')[1]?.trim() || '';

      const body = lines
        .filter(line => !line.toLowerCase().includes('subject'))
        .join('\n')
        .trim();

      return {
        subject: subjectLine,
        body,
        delay: index === 0 ? 0 : index === 1 ? 3 : 5, // 0, 3, 5 days delay
      };
    })
    .slice(0, 3); // Ensure we only return 3 steps
}

// Example usage:
/*
const steps = await generateEmailSteps('saas', {
  firstName: 'John',
  company: 'Acme Inc',
  title: 'CTO',
  industry: 'Technology'
});
*/ 