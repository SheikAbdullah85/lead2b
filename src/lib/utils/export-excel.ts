import * as XLSX from 'xlsx';
import { Lead } from '../types';

export function exportLeadsToExcel(leads: Lead[], filename: string = 'lead2b_leads_export') {
  const formattedRows = leads.map((lead, index) => ({
    '#': index + 1,
    'Lead ID': lead.id,
    'Capture Date': new Date(lead.created_at || lead.captured_at).toLocaleString(),
    'First Name': lead.first_name,
    'Last Name': lead.last_name,
    'Full Name': `${lead.first_name} ${lead.last_name}`.trim(),
    'Company': lead.company || '',
    'Job Title': lead.job_title || '',
    'Email': lead.email || '',
    'Mobile': lead.mobile || '',
    'Country': lead.country || '',
    'Industry': lead.industry || '',
    'Rating': (lead.rating || '').toUpperCase(),
    'Status': lead.status || '',
    'Priority': lead.priority || '',
    'Product Interest': lead.product_interest || '',
    'Purchase Timeline': lead.purchase_timeline || '',
    'Requirement': lead.requirement || '',
    'Estimated Value (USD)': lead.estimated_value || '',
    'Followup Required': lead.followup_required ? 'YES' : 'NO',
    'Followup Date': lead.followup_date || '',
    'Capture Method': lead.capture_method || '',
    'Captured By': lead.captured_by_name || lead.captured_by || '',
    'Sync Status': lead.sync_status || 'synced',
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedRows);

  // Set column widths for polished presentation
  const colWidths = [
    { wch: 5 },  // #
    { wch: 38 }, // Lead ID
    { wch: 20 }, // Date
    { wch: 15 }, // First Name
    { wch: 15 }, // Last Name
    { wch: 22 }, // Full Name
    { wch: 25 }, // Company
    { wch: 25 }, // Job Title
    { wch: 28 }, // Email
    { wch: 18 }, // Mobile
    { wch: 15 }, // Country
    { wch: 20 }, // Industry
    { wch: 10 }, // Rating
    { wch: 15 }, // Status
    { wch: 10 }, // Priority
    { wch: 25 }, // Product Interest
    { wch: 18 }, // Timeline
    { wch: 35 }, // Requirement
    { wch: 18 }, // Value
    { wch: 12 }, // Followup
    { wch: 15 }, // Followup Date
    { wch: 15 }, // Method
    { wch: 20 }, // Captured By
    { wch: 12 }, // Sync Status
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Captured Leads');

  // Trigger download as .xlsx
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportLeadsToCsv(leads: Lead[], filename: string = 'lead2b_leads_export') {
  const formattedRows = leads.map((lead, index) => ({
    'Index': index + 1,
    'Capture Date': lead.created_at || lead.captured_at,
    'First Name': lead.first_name,
    'Last Name': lead.last_name,
    'Company': lead.company || '',
    'Job Title': lead.job_title || '',
    'Email': lead.email || '',
    'Mobile': lead.mobile || '',
    'Country': lead.country || '',
    'Rating': lead.rating,
    'Status': lead.status,
    'Product Interest': lead.product_interest || '',
    'Purchase Timeline': lead.purchase_timeline || '',
    'Followup Required': lead.followup_required ? 'Yes' : 'No',
    'Followup Date': lead.followup_date || '',
    'Captured By': lead.captured_by_name || lead.captured_by,
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedRows);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
