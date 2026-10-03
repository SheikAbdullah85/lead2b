export type SystemRole = 'super_admin' | 'organizer_admin' | 'exhibitor_admin' | 'sales_rep';

export type LeadRating = 'hot' | 'warm' | 'cold' | 'urgent' | 'new';
export type LeadStatus = 'new' | 'qualified' | 'follow_up' | 'demo_required' | 'quotation_required' | 'negotiation' | 'won' | 'lost';
export type PriorityLevel = 'high' | 'medium' | 'low';
export type PurchaseTimeline = 'immediate' | '1-3 months' | '3-6 months' | '6-12 months' | 'future' | 'unknown';
export type CaptureMethod = 'QR' | 'badge' | 'business_card' | 'manual' | 'attendee_lookup';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface Organization {
  id: string;
  company_name: string;
  company_code: string;
  logo_url?: string;
  primary_contact_name?: string;
  email: string;
  phone?: string;
  country?: string;
  website?: string;
  active_status: boolean;
  subscription_plan: string;
  license_count: number;
  assigned_event_id?: string;
  assigned_event_name?: string;
  assigned_stand?: string;
  created_at: string;
  updated_at: string;
}

export interface BrandingSettings {
  id: string;
  tenant_id: string;
  company_name?: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  event_logo?: string;
  welcome_message: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  mobile?: string;
  avatar_url?: string;
  system_role: SystemRole;
  tenant_id?: string;
  is_active: boolean;
  is_demo?: boolean;
  created_at: string;
  // joined fields
  organization?: Organization;
  booth_number?: string;
}

export interface Event {
  id: string;
  event_name: string;
  event_code: string;
  description?: string;
  venue: string;
  city: string;
  country: string;
  start_date: string;
  end_date: string;
  organizer_name: string;
  logo_url?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  timezone: string;
  allow_offline_attendee_download: boolean;
  created_at: string;
  updated_at: string;
}

export interface Hall {
  id: string;
  event_id: string;
  hall_name: string;
  hall_code: string;
}

export interface Booth {
  id: string;
  event_id: string;
  hall_id?: string;
  tenant_id?: string;
  booth_name: string;
  booth_number: string;
}

export interface Attendee {
  id: string;
  event_id: string;
  registration_id?: string;
  badge_id: string;
  qr_token: string;
  first_name: string;
  last_name: string;
  company?: string;
  job_title?: string;
  email: string;
  mobile?: string;
  country?: string;
  industry?: string;
  visitor_type?: string;
  company_size?: string;
  website?: string;
  registration_source?: string;
  source?: string;
  consent_status: boolean;
  created_at?: string;
}

export interface Lead {
  id: string;
  tenant_id: string;
  event_id: string;
  attendee_id?: string;
  captured_by: string;
  booth_id?: string;
  
  // Contact
  first_name: string;
  last_name: string;
  full_name?: string;
  company?: string;
  job_title?: string;
  email?: string;
  mobile?: string;
  country?: string;
  website?: string;
  industry?: string;
  company_size?: string;

  // Qualification
  source: string;
  rating: LeadRating;
  status: LeadStatus;
  priority: PriorityLevel;
  product_interest?: string;
  requirement?: string;
  estimated_value?: number;
  purchase_timeline: PurchaseTimeline;
  assigned_to?: string;
  followup_required: boolean;
  followup_date?: string;
  collateral_sent?: string[];

  // Metadata & Sync
  capture_method: CaptureMethod;
  captured_at: string;
  latitude?: number;
  longitude?: number;
  device_id?: string;
  online_offline: 'online' | 'offline';
  sync_status: SyncStatus;
  idempotency_key?: string;
  
  // Consent
  consent_status: boolean;
  email_marketing_consent: boolean;
  privacy_policy_accepted: boolean;
  consent_timestamp: string;

  // Audit
  created_at: string;
  updated_at: string;

  // Local/Offline state
  local_id?: string;
  server_id?: string;
  last_sync_attempt?: string;
  retry_count?: number;

  // Joined presentation data
  captured_by_name?: string;
  assigned_to_name?: string;
  notes_count?: number;
  followups_count?: number;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  tenant_id: string;
  user_id: string;
  user_name?: string;
  note_text: string;
  created_at: string;
  updated_at?: string;
  sync_status?: SyncStatus;
}

export interface LeadVoiceNote {
  id: string;
  lead_id: string;
  tenant_id: string;
  user_id: string;
  audio_url: string;
  duration_seconds?: number;
  file_size?: number;
  transcription?: string;
  created_at: string;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_label: string;
  option_value: string;
  display_order: number;
}

export interface FormQuestion {
  id: string;
  form_id: string;
  section_id?: string;
  question_text: string;
  question_type: 'short_text' | 'long_text' | 'number' | 'email' | 'phone' | 'dropdown' | 'radio' | 'checkbox' | 'multi_select' | 'date' | 'currency' | 'rating' | 'yes_no';
  is_required: boolean;
  display_order: number;
  conditional_parent_id?: string;
  conditional_operator?: 'equals' | 'not_equals' | 'contains';
  conditional_value?: string;
  options?: QuestionOption[];
}

export interface LeadForm {
  id: string;
  tenant_id: string;
  event_id?: string;
  form_name: string;
  description?: string;
  is_active: boolean;
  is_default: boolean;
  questions?: FormQuestion[];
  created_at: string;
}

export interface LeadAnswer {
  id: string;
  lead_id: string;
  question_id: string;
  tenant_id: string;
  answer_value: any;
  created_at: string;
}

export interface FollowupTask {
  id: string;
  tenant_id: string;
  event_id: string;
  lead_id: string;
  lead_name?: string;
  lead_company?: string;
  lead_mobile?: string;
  lead_email?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  task_type: 'call' | 'email' | 'WhatsApp' | 'demo' | 'meeting' | 'proposal' | 'quotation' | 'custom';
  task_title: string;
  description?: string;
  due_date: string;
  priority: PriorityLevel;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  reminder_at?: string;
  created_by: string;
  completed_at?: string;
  created_at: string;
  sync_status?: SyncStatus;
}

export interface License {
  id: string;
  tenant_id: string;
  tenant_name?: string;
  plan: string;
  start_date: string;
  expiry_date: string;
  allowed_events: number;
  allowed_users: number;
  lead_limit: number;
  is_active: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id?: string;
  event_id?: string;
  user_id?: string;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_data?: any;
  new_data?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface SyncQueueItem {
  id: string;
  tenant_id: string;
  user_id: string;
  idempotency_key: string;
  action: 'create_lead' | 'update_lead' | 'add_note' | 'add_voice_note' | 'create_followup' | 'save_answers';
  payload: any;
  status: SyncStatus;
  retry_count: number;
  last_attempt?: string;
  error_message?: string;
  created_at: string;
}

export interface CrmIntegration {
  id: string;
  tenant_id: string;
  provider: 'salesforce' | 'hubspot' | 'zoho' | 'dynamics' | 'custom_webhook';
  is_active: boolean;
  webhook_url?: string;
  field_mappings: Record<string, string>;
  sync_frequency: 'realtime' | 'hourly' | 'daily';
  last_synced_at?: string;
}

export interface WebhookEndpoint {
  id: string;
  tenant_id: string;
  event_name: 'lead.created' | 'lead.updated' | 'lead.qualified' | 'lead.followup.created' | 'lead.status.changed' | 'lead.exported';
  target_url: string;
  secret_key: string;
  is_active: boolean;
  failure_count: number;
  last_triggered_at?: string;
  created_at: string;
}

export interface CollateralAsset {
  id: string;
  title: string;
  category: 'whitepaper' | 'brochure' | 'pricing' | 'case_study';
  file_name: string;
  file_size: string;
  download_url: string;
  description: string;
  thumbnail_icon?: string;
}

export interface CollateralDispatch {
  id: string;
  lead_id: string;
  lead_email: string;
  lead_name: string;
  asset_ids: string[];
  asset_titles: string[];
  dispatch_status: 'queued' | 'sent' | 'opened';
  dispatched_at: string;
  sent_by_user_id: string;
  sent_by_name: string;
}
