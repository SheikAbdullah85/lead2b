import { Lead } from '../types';

export const DEFAULT_CRM_MAPPINGS: Record<string, Record<string, string>> = {
  salesforce: {
    first_name: 'FirstName',
    last_name: 'LastName',
    company: 'Company',
    job_title: 'Title',
    email: 'Email',
    mobile: 'MobilePhone',
    country: 'Country',
    rating: 'Rating',
    status: 'Status',
    product_interest: 'ProductInterest__c',
    purchase_timeline: 'PurchaseTimeline__c',
  },
  hubspot: {
    first_name: 'firstname',
    last_name: 'lastname',
    company: 'company',
    job_title: 'jobtitle',
    email: 'email',
    mobile: 'phone',
    country: 'country',
    rating: 'lead_rating',
    status: 'hs_lead_status',
    product_interest: 'product_interest',
    purchase_timeline: 'buying_timeframe',
  },
  zoho: {
    first_name: 'First_Name',
    last_name: 'Last_Name',
    company: 'Company',
    job_title: 'Designation',
    email: 'Email',
    mobile: 'Mobile',
    country: 'Country',
    rating: 'Rating',
    status: 'Lead_Status',
    product_interest: 'Product_Details',
  },
  dynamics: {
    first_name: 'firstname',
    last_name: 'lastname',
    company: 'companyname',
    job_title: 'jobtitle',
    email: 'emailaddress1',
    mobile: 'mobilephone',
    country: 'address1_country',
    rating: 'leadqualitycode',
  },
  custom_webhook: {
    first_name: 'first_name',
    last_name: 'last_name',
    company: 'company_name',
    job_title: 'position',
    email: 'work_email',
    mobile: 'phone_number',
    rating: 'score_tier',
  }
};

export function transformLeadForCrm(lead: Lead, mappings: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {};

  Object.entries(mappings).forEach(([leadField, crmField]) => {
    const val = (lead as any)[leadField];
    if (val !== undefined && val !== null && val !== '') {
      result[crmField] = val;
    }
  });

  // Always include standard metadata
  result['external_lead_id'] = lead.id;
  result['source_system'] = 'lead2b';
  result['captured_at'] = lead.captured_at || lead.created_at;

  return result;
}
