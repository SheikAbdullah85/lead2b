import Dexie, { type EntityTable } from 'dexie';
import { Lead, Attendee, LeadNote, FollowupTask, SyncQueueItem } from '../types';

export interface LocalLead extends Lead {
  local_id: string;
}

export interface AppSetting {
  key: string;
  value: any;
}

export class Lead2bDatabase extends Dexie {
  leads!: EntityTable<LocalLead, 'local_id'>;
  attendees!: EntityTable<Attendee, 'id'>;
  leadNotes!: EntityTable<LeadNote, 'id'>;
  followups!: EntityTable<FollowupTask, 'id'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;
  appSettings!: EntityTable<AppSetting, 'key'>;

  constructor() {
    super('lead2b_offline_db');
    this.version(1).stores({
      leads: 'local_id, id, tenant_id, event_id, sync_status, rating, status, captured_by, created_at, email, [tenant_id+sync_status]',
      attendees: 'id, event_id, badge_id, qr_token, email, [event_id+badge_id]',
      leadNotes: 'id, lead_id, tenant_id, sync_status, created_at',
      followups: 'id, lead_id, tenant_id, assigned_to, status, due_date, sync_status',
      syncQueue: 'id, idempotency_key, status, retry_count, created_at',
      appSettings: 'key',
    });
  }
}

export const localDb = new Lead2bDatabase();

// Preload initial offline attendees for testing if DB is empty
export async function seedLocalDatabaseIfNeeded(eventId: string) {
  const count = await localDb.attendees.where({ event_id: eventId }).count();
  if (count > 0) return;

  const demoAttendees: Attendee[] = [
    {
      id: 'att00001-0000-0000-0000-000000000001',
      event_id: eventId,
      badge_id: 'GITEX2026-ATT-00101',
      qr_token: 'lead2b:badge:GITEX2026-ATT-00101',
      first_name: 'Omar',
      last_name: 'Khashoggi',
      company: 'Emirates NBD',
      job_title: 'VP Technology & Digital Transformation',
      email: 'omar.k@emiratesnbd.example.com',
      mobile: '+971 50 445 6789',
      country: 'United Arab Emirates',
      industry: 'Banking & Finance',
      visitor_type: 'VIP',
      company_size: '5000+',
      consent_status: true,
    },
    {
      id: 'att00002-0000-0000-0000-000000000002',
      event_id: eventId,
      badge_id: 'GITEX2026-ATT-00102',
      qr_token: 'lead2b:badge:GITEX2026-ATT-00102',
      first_name: 'Jessica',
      last_name: 'Taylor',
      company: 'Accenture Middle East',
      job_title: 'Director of Enterprise AI',
      email: 'j.taylor@accenture.example.com',
      mobile: '+971 55 998 1234',
      country: 'United Arab Emirates',
      industry: 'Consulting & IT Services',
      visitor_type: 'VIP',
      company_size: '10000+',
      consent_status: true,
    },
    {
      id: 'att00003-0000-0000-0000-000000000003',
      event_id: eventId,
      badge_id: 'GITEX2026-ATT-00103',
      qr_token: 'lead2b:badge:GITEX2026-ATT-00103',
      first_name: 'Ahmed',
      last_name: 'Mansoor',
      company: 'Etisalat e&',
      job_title: 'Head of Cloud Infrastructure',
      email: 'ahmed.m@eand.example.com',
      mobile: '+971 50 112 3344',
      country: 'United Arab Emirates',
      industry: 'Telecommunications',
      visitor_type: 'Trade Visitor',
      company_size: '1000+',
      consent_status: true,
    },
    {
      id: 'att00004-0000-0000-0000-000000000004',
      event_id: eventId,
      badge_id: 'GITEX2026-ATT-00104',
      qr_token: 'lead2b:badge:GITEX2026-ATT-00104',
      first_name: 'Chen',
      last_name: 'Wei',
      company: 'Alibaba Cloud MENA',
      job_title: 'Senior Solutions Architect',
      email: 'chen.wei@alibabacloud.example.com',
      mobile: '+971 52 776 5432',
      country: 'China',
      industry: 'Cloud Services',
      visitor_type: 'Trade Visitor',
      company_size: '5000+',
      consent_status: true,
    },
    {
      id: 'att00005-0000-0000-0000-000000000005',
      event_id: eventId,
      badge_id: 'GITEX2026-ATT-00105',
      qr_token: 'lead2b:badge:GITEX2026-ATT-00105',
      first_name: 'Fatima',
      last_name: 'Al-Zahra',
      company: 'Dubai Municipality',
      job_title: 'Director of Smart Cities',
      email: 'fatima.z@dm.gov.example.com',
      mobile: '+971 50 778 9900',
      country: 'United Arab Emirates',
      industry: 'Government',
      visitor_type: 'VIP',
      company_size: '10000+',
      consent_status: true,
    }
  ];

  await localDb.attendees.bulkPut(demoAttendees);
}
