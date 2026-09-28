import * as XLSX from 'xlsx';
import { Attendee } from '../types';

export interface ColumnMapping {
  badge_id: string;
  first_name: string;
  last_name: string;
  email: string;
  company?: string;
  job_title?: string;
  mobile?: string;
  country?: string;
  industry?: string;
  visitor_type?: string;
}

export interface ParseResult {
  headers: string[];
  sampleRows: Record<string, any>[];
  totalRows: number;
  rawRows: Record<string, any>[];
}

export interface ValidationSummary {
  validAttendees: Partial<Attendee>[];
  errors: { row: number; reason: string; data: any }[];
  duplicates: { row: number; badge_id: string }[];
}

export async function parseAttendeeFile(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  if (rawRows.length === 0) {
    throw new Error('The uploaded spreadsheet is empty.');
  }

  const headers = Object.keys(rawRows[0]);
  const sampleRows = rawRows.slice(0, 5);

  return {
    headers,
    sampleRows,
    totalRows: rawRows.length,
    rawRows,
  };
}

export function validateAndMapAttendees(
  rows: Record<string, any>[],
  mapping: ColumnMapping,
  eventId: string,
  existingBadgeIds: Set<string> = new Set()
): ValidationSummary {
  const validAttendees: Partial<Attendee>[] = [];
  const errors: { row: number; reason: string; data: any }[] = [];
  const duplicates: { row: number; badge_id: string }[] = [];
  const seenInBatch = new Set<string>();

  rows.forEach((row, index) => {
    const rowNum = index + 2; // Accounting for 1-based index and header row
    const badge_id = String(row[mapping.badge_id] || '').trim();
    const first_name = String(row[mapping.first_name] || '').trim();
    const last_name = String(row[mapping.last_name] || '').trim();
    const email = String(row[mapping.email] || '').trim().toLowerCase();

    // Check required fields
    if (!badge_id) {
      errors.push({ row: rowNum, reason: 'Missing Badge ID', data: row });
      return;
    }
    if (!first_name) {
      errors.push({ row: rowNum, reason: 'Missing First Name', data: row });
      return;
    }
    if (!email || !email.includes('@')) {
      errors.push({ row: rowNum, reason: 'Invalid or missing email address', data: row });
      return;
    }

    // Check duplicates
    if (existingBadgeIds.has(badge_id) || seenInBatch.has(badge_id)) {
      duplicates.push({ row: rowNum, badge_id });
      return;
    }
    seenInBatch.add(badge_id);

    validAttendees.push({
      event_id: eventId,
      badge_id,
      qr_token: `lead2b:badge:${badge_id}`,
      first_name,
      last_name,
      email,
      company: mapping.company ? String(row[mapping.company] || '').trim() : undefined,
      job_title: mapping.job_title ? String(row[mapping.job_title] || '').trim() : undefined,
      mobile: mapping.mobile ? String(row[mapping.mobile] || '').trim() : undefined,
      country: mapping.country ? String(row[mapping.country] || '').trim() : undefined,
      industry: mapping.industry ? String(row[mapping.industry] || '').trim() : undefined,
      visitor_type: mapping.visitor_type ? String(row[mapping.visitor_type] || '').trim() : 'Trade Visitor',
      consent_status: true,
      registration_source: 'Bulk Import',
    });
  });

  return { validAttendees, errors, duplicates };
}
