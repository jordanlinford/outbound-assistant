import { z } from 'zod';

// Common prospect data structure
export interface ProspectData {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  phone?: string;
  industry?: string;
  website?: string;
  linkedinUrl?: string;
  notes?: string;
}

// CRM Integration base class
export abstract class CRMIntegration {
  protected apiKey: string;
  protected baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  abstract fetchProspects(filters?: any): Promise<ProspectData[]>;
  abstract createProspect(prospect: ProspectData): Promise<string>;
  abstract updateProspectStatus(id: string, status: string): Promise<boolean>;
}

// HubSpot Integration
export class HubSpotIntegration extends CRMIntegration {
  constructor(apiKey: string) {
    super(apiKey, 'https://api.hubapi.com');
  }

  async fetchProspects(filters: {
    limit?: number;
    properties?: string[];
    filterGroups?: any[];
  } = {}): Promise<ProspectData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: filters.limit || 100,
          properties: filters.properties || [
            'email', 'firstname', 'lastname', 'company', 'jobtitle', 'phone', 'website'
          ],
          filterGroups: filters.filterGroups || []
        })
      });

      const data = await response.json();
      
      return data.results?.map((contact: any) => ({
        email: contact.properties.email,
        firstName: contact.properties.firstname,
        lastName: contact.properties.lastname,
        company: contact.properties.company,
        title: contact.properties.jobtitle,
        phone: contact.properties.phone,
        website: contact.properties.website,
      })) || [];
    } catch (error) {
      console.error('HubSpot fetch error:', error);
      return [];
    }
  }

  async createProspect(prospect: ProspectData): Promise<string> {
    const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          email: prospect.email,
          firstname: prospect.firstName,
          lastname: prospect.lastName,
          company: prospect.company,
          jobtitle: prospect.title,
          phone: prospect.phone,
        }
      })
    });

    const data = await response.json();
    return data.id;
  }

  async updateProspectStatus(id: string, status: string): Promise<boolean> {
    try {
      await fetch(`${this.baseUrl}/crm/v3/objects/contacts/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            hs_lead_status: status
          }
        })
      });
      return true;
    } catch (error) {
      console.error('HubSpot update error:', error);
      return false;
    }
  }
}

// Salesforce Integration
export class SalesforceIntegration extends CRMIntegration {
  private accessToken: string;

  constructor(clientId: string, clientSecret: string, accessToken: string) {
    super(clientId, 'https://your-instance.salesforce.com');
    this.accessToken = accessToken;
  }

  async fetchProspects(filters: {
    limit?: number;
    where?: string;
  } = {}): Promise<ProspectData[]> {
    try {
      const query = `SELECT Id, Email, FirstName, LastName, Company, Title, Phone FROM Lead ${filters.where || ''} LIMIT ${filters.limit || 100}`;
      
      const response = await fetch(`${this.baseUrl}/services/data/v57.0/query?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      return data.records?.map((lead: any) => ({
        email: lead.Email,
        firstName: lead.FirstName,
        lastName: lead.LastName,
        company: lead.Company,
        title: lead.Title,
        phone: lead.Phone,
      })) || [];
    } catch (error) {
      console.error('Salesforce fetch error:', error);
      return [];
    }
  }

  async createProspect(prospect: ProspectData): Promise<string> {
    const response = await fetch(`${this.baseUrl}/services/data/v57.0/sobjects/Lead`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Email: prospect.email,
        FirstName: prospect.firstName,
        LastName: prospect.lastName,
        Company: prospect.company,
        Title: prospect.title,
        Phone: prospect.phone,
      })
    });

    const data = await response.json();
    return data.id;
  }

  async updateProspectStatus(id: string, status: string): Promise<boolean> {
    try {
      await fetch(`${this.baseUrl}/services/data/v57.0/sobjects/Lead/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Status: status
        })
      });
      return true;
    } catch (error) {
      console.error('Salesforce update error:', error);
      return false;
    }
  }
}

// Pipedrive Integration
export class PipedriveIntegration extends CRMIntegration {
  constructor(apiKey: string, companyDomain: string) {
    super(apiKey, `https://${companyDomain}.pipedrive.com/api/v1`);
  }

  async fetchProspects(filters: {
    limit?: number;
    start?: number;
  } = {}): Promise<ProspectData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/persons?api_token=${this.apiKey}&limit=${filters.limit || 100}&start=${filters.start || 0}`);
      const data = await response.json();
      
      return data.data?.map((person: any) => ({
        email: person.email?.[0]?.value,
        firstName: person.first_name,
        lastName: person.last_name,
        company: person.org_name,
        title: person.job_title,
        phone: person.phone?.[0]?.value,
      })).filter((p: ProspectData) => p.email) || [];
    } catch (error) {
      console.error('Pipedrive fetch error:', error);
      return [];
    }
  }

  async createProspect(prospect: ProspectData): Promise<string> {
    const response = await fetch(`${this.baseUrl}/persons?api_token=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `${prospect.firstName} ${prospect.lastName}`.trim(),
        email: [{ value: prospect.email, primary: true }],
        phone: prospect.phone ? [{ value: prospect.phone, primary: true }] : undefined,
        job_title: prospect.title,
        org_name: prospect.company,
      })
    });

    const data = await response.json();
    return data.data?.id?.toString();
  }

  async updateProspectStatus(id: string, status: string): Promise<boolean> {
    // Pipedrive uses custom fields for status - this would need to be configured
    return true;
  }
}

// Airtable Integration (popular for lead databases)
export class AirtableIntegration extends CRMIntegration {
  private baseId: string;
  private tableName: string;

  constructor(apiKey: string, baseId: string, tableName: string = 'Prospects') {
    super(apiKey, 'https://api.airtable.com/v0');
    this.baseId = baseId;
    this.tableName = tableName;
  }

  async fetchProspects(filters: {
    maxRecords?: number;
    view?: string;
    filterByFormula?: string;
  } = {}): Promise<ProspectData[]> {
    try {
      const params = new URLSearchParams();
      if (filters.maxRecords) params.append('maxRecords', filters.maxRecords.toString());
      if (filters.view) params.append('view', filters.view);
      if (filters.filterByFormula) params.append('filterByFormula', filters.filterByFormula);

      const response = await fetch(`${this.baseUrl}/${this.baseId}/${this.tableName}?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });

      const data = await response.json();
      
      return data.records?.map((record: any) => ({
        email: record.fields.Email,
        firstName: record.fields['First Name'],
        lastName: record.fields['Last Name'],
        company: record.fields.Company,
        title: record.fields.Title,
        phone: record.fields.Phone,
        industry: record.fields.Industry,
        website: record.fields.Website,
      })).filter((p: ProspectData) => p.email) || [];
    } catch (error) {
      console.error('Airtable fetch error:', error);
      return [];
    }
  }

  async createProspect(prospect: ProspectData): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.baseId}/${this.tableName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          Email: prospect.email,
          'First Name': prospect.firstName,
          'Last Name': prospect.lastName,
          Company: prospect.company,
          Title: prospect.title,
          Phone: prospect.phone,
          Industry: prospect.industry,
          Website: prospect.website,
        }
      })
    });

    const data = await response.json();
    return data.id;
  }

  async updateProspectStatus(id: string, status: string): Promise<boolean> {
    try {
      await fetch(`${this.baseUrl}/${this.baseId}/${this.tableName}/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            Status: status
          }
        })
      });
      return true;
    } catch (error) {
      console.error('Airtable update error:', error);
      return false;
    }
  }
}

// Factory function to create CRM integrations
export function createCRMIntegration(
  type: 'hubspot' | 'salesforce' | 'pipedrive' | 'airtable',
  config: any
): CRMIntegration {
  switch (type) {
    case 'hubspot':
      return new HubSpotIntegration(config.apiKey);
    case 'salesforce':
      return new SalesforceIntegration(config.clientId, config.clientSecret, config.accessToken);
    case 'pipedrive':
      return new PipedriveIntegration(config.apiKey, config.companyDomain);
    case 'airtable':
      return new AirtableIntegration(config.apiKey, config.baseId, config.tableName);
    default:
      throw new Error(`Unsupported CRM type: ${type}`);
  }
}

// Webhook handler for real-time updates
export async function handleCRMWebhook(
  crmType: string,
  payload: any,
  signature?: string
): Promise<{ action: string; prospect: ProspectData | null }> {
  // Verify webhook signature (implementation depends on CRM)
  
  switch (crmType) {
    case 'hubspot':
      return handleHubSpotWebhook(payload);
    case 'salesforce':
      return handleSalesforceWebhook(payload);
    default:
      return { action: 'unknown', prospect: null };
  }
}

function handleHubSpotWebhook(payload: any) {
  // HubSpot webhook processing
  return { action: 'contact_updated', prospect: null };
}

function handleSalesforceWebhook(payload: any) {
  // Salesforce webhook processing
  return { action: 'lead_updated', prospect: null };
} 