interface RawPDLPerson {
  name: { first: string; last: string };
  email: string;
  job_title: string;
  job_company_name: string;
  linkedin_url?: string;
  email_status?: string; // deliverable, risky, undeliverable
}

export interface ProspectInput {
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  company: string;
  linkedinUrl?: string;
  industry?: string;
  companySize?: string;
  score?: number;
  reason?: string;
  dataSource?: string;
}

const PDL_ENDPOINT = 'https://api.peopledatalabs.com/v5/person/search';

export async function searchProspectsPDL(query: string, limit = 25): Promise<ProspectInput[]> {
  if (!process.env.PDL_API_KEY) throw new Error('PDL_API_KEY missing');
  const reqBody = {
    query,
    size: Math.min(limit, 100),
    sql: false,
    titlecase: true,
  } as any;

  const res = await fetch(PDL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': process.env.PDL_API_KEY,
    },
    body: JSON.stringify(reqBody),
  });

  if (!res.ok) {
    console.error('PDL error', await res.text());
    throw new Error(`PDL request failed: ${res.status}`);
  }

  const data = await res.json();
  const people: RawPDLPerson[] = data.data || [];

  return people.map((p) => ({
    firstName: p.name?.first || '',
    lastName: p.name?.last || '',
    email: p.email,
    title: p.job_title || '',
    company: p.job_company_name || '',
    linkedinUrl: p.linkedin_url,
    industry: '',
    companySize: '',
    score: 0,
    reason: 'Matches your search',
    dataSource: 'pdl',
  }));
} 