-- ==============================================================================
-- lead2b: Event Lead Capture & Sales Engagement Platform
-- Production PostgreSQL Database Schema & Row-Level Security (RLS)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. ORGANIZATIONS (TENANTS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    company_code VARCHAR(50) UNIQUE NOT NULL,
    logo_url TEXT,
    primary_contact_name VARCHAR(150),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    country VARCHAR(100),
    website VARCHAR(255),
    active_status BOOLEAN DEFAULT true,
    subscription_plan VARCHAR(50) DEFAULT 'event_standard',
    license_count INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. BRANDING SETTINGS (WHITE LABEL PER TENANT)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS branding_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    logo_url TEXT,
    primary_color VARCHAR(20) DEFAULT '#2563eb',
    secondary_color VARCHAR(20) DEFAULT '#1e293b',
    event_logo TEXT,
    welcome_message TEXT DEFAULT 'Welcome to lead2b Lead Capture',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_tenant_branding UNIQUE (tenant_id)
);

-- ------------------------------------------------------------------------------
-- 3. PROFILES & ROLES
-- ------------------------------------------------------------------------------
-- Roles: super_admin, organizer_admin, exhibitor_admin, sales_rep
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY, -- Maps to auth.users.id
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    mobile VARCHAR(50),
    avatar_url TEXT,
    system_role VARCHAR(50) DEFAULT 'sales_rep', -- super_admin | organizer_admin | exhibitor_admin | sales_rep
    tenant_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. EVENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name VARCHAR(255) NOT NULL,
    event_code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    venue VARCHAR(255),
    city VARCHAR(100),
    country VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    organizer_name VARCHAR(150),
    logo_url TEXT,
    status VARCHAR(30) DEFAULT 'active', -- draft | active | completed | archived
    timezone VARCHAR(50) DEFAULT 'UTC+04:00',
    allow_offline_attendee_download BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. HALLS & BOOTHS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS halls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    hall_name VARCHAR(100) NOT NULL,
    hall_code VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    hall_id UUID REFERENCES halls(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    booth_name VARCHAR(100) NOT NULL,
    booth_number VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. EVENT EXHIBITORS & EXHIBITOR USERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_exhibitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    booth_id UUID REFERENCES booths(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_event_exhibitor UNIQUE(event_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS exhibitor_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'sales_rep', -- exhibitor_admin | sales_rep
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    booth_id UUID REFERENCES booths(id) ON DELETE SET NULL,
    invite_code VARCHAR(100),
    invite_expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_tenant_user_event UNIQUE (tenant_id, user_id, event_id)
);

-- ------------------------------------------------------------------------------
-- 7. ATTENDEES (ORGANIZER MASTER LIST)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    registration_id VARCHAR(100),
    badge_id VARCHAR(100) NOT NULL,
    qr_token VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(150),
    job_title VARCHAR(150),
    email VARCHAR(255) NOT NULL,
    mobile VARCHAR(50),
    country VARCHAR(100),
    industry VARCHAR(100),
    visitor_type VARCHAR(50) DEFAULT 'Trade Visitor', -- VIP | Speaker | Press | Exhibitor | Trade Visitor
    company_size VARCHAR(50),
    website VARCHAR(255),
    registration_source VARCHAR(100) DEFAULT 'Online Pre-Registration',
    consent_status BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_event_badge UNIQUE (event_id, badge_id)
);

-- ------------------------------------------------------------------------------
-- 8. LEADS (CORE CAPTURED DATA)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    attendee_id UUID REFERENCES attendees(id) ON DELETE SET NULL,
    captured_by UUID NOT NULL REFERENCES profiles(id),
    booth_id UUID REFERENCES booths(id) ON DELETE SET NULL,
    
    -- Contact Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    company VARCHAR(150),
    job_title VARCHAR(150),
    email VARCHAR(255),
    mobile VARCHAR(50),
    country VARCHAR(100),
    website VARCHAR(255),
    industry VARCHAR(100),
    company_size VARCHAR(50),
    
    -- Qualification & Status
    source VARCHAR(50) DEFAULT 'qr_scan', -- qr_scan | badge | business_card | manual | attendee_lookup
    rating VARCHAR(20) DEFAULT 'warm', -- hot | warm | cold | urgent | new
    status VARCHAR(30) DEFAULT 'new', -- new | qualified | follow_up | demo_required | quotation_required | negotiation | won | lost
    priority VARCHAR(20) DEFAULT 'medium', -- high | medium | low
    product_interest TEXT,
    requirement TEXT,
    estimated_value NUMERIC(12,2),
    purchase_timeline VARCHAR(30) DEFAULT '1-3 months', -- immediate | 1-3 months | 3-6 months | 6-12 months | future | unknown
    assigned_to UUID REFERENCES profiles(id),
    followup_required BOOLEAN DEFAULT false,
    followup_date DATE,
    
    -- Capture Metadata & Sync
    capture_method VARCHAR(50) DEFAULT 'QR',
    captured_at TIMESTAMPTZ DEFAULT NOW(),
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    device_id VARCHAR(100),
    online_offline VARCHAR(10) DEFAULT 'online', -- online | offline
    sync_status VARCHAR(20) DEFAULT 'synced', -- pending | syncing | synced | failed
    idempotency_key VARCHAR(100),
    
    -- Privacy & Consent
    consent_status BOOLEAN DEFAULT true,
    email_marketing_consent BOOLEAN DEFAULT true,
    privacy_policy_accepted BOOLEAN DEFAULT true,
    consent_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Audit Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. LEAD NOTES & VOICE NOTES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    note_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_voice_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    audio_url TEXT NOT NULL,
    duration_seconds INTEGER,
    file_size INTEGER,
    transcription TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. LEAD QUALIFICATION FORMS & CONDITIONAL QUESTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    form_name VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS form_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES lead_forms(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS form_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES lead_forms(id) ON DELETE CASCADE,
    section_id UUID REFERENCES form_sections(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(30) NOT NULL, -- short_text | long_text | number | email | phone | dropdown | radio | checkbox | multi_select | date | currency | rating | yes_no
    is_required BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    -- Conditional display logic
    conditional_parent_id UUID REFERENCES form_questions(id) ON DELETE SET NULL,
    conditional_operator VARCHAR(20), -- equals | not_equals | contains
    conditional_value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS form_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES form_questions(id) ON DELETE CASCADE,
    option_label VARCHAR(255) NOT NULL,
    option_value VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lead_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES form_questions(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    answer_value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 11. FOLLOW-UP TASKS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES profiles(id),
    task_type VARCHAR(30) DEFAULT 'call', -- call | email | WhatsApp | demo | meeting | proposal | quotation | custom
    task_title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- high | medium | low
    status VARCHAR(30) DEFAULT 'open', -- open | in_progress | completed | cancelled
    reminder_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES profiles(id),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 12. FILES & ATTACHMENTS (CARD PHOTOS, AUDIO, ETC.)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES profiles(id),
    file_type VARCHAR(50) NOT NULL, -- business_card | voice_note | logo | document
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 13. NOTIFICATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- followup_due | lead_assigned | sync_failed | invite | system
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 14. CRM INTEGRATIONS & OUTBOUND WEBHOOKS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- salesforce | hubspot | zoho | dynamics | custom_webhook
    is_active BOOLEAN DEFAULT false,
    api_key_encrypted TEXT,
    webhook_url TEXT,
    field_mappings JSONB DEFAULT '{}', -- e.g. {"first_name": "FirstName", "company": "AccountName"}
    sync_frequency VARCHAR(30) DEFAULT 'realtime',
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_name VARCHAR(50) NOT NULL, -- lead.created | lead.updated | lead.qualified | lead.followup.created
    target_url TEXT NOT NULL,
    secret_key VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    failure_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 15. LICENSES & SUBSCRIPTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan VARCHAR(50) DEFAULT 'event_standard', -- per_event | per_exhibitor | annual_pro
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    allowed_events INTEGER DEFAULT 1,
    allowed_users INTEGER DEFAULT 10,
    lead_limit INTEGER DEFAULT 2500,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 16. AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- login | lead_created | lead_updated | export_generated | form_modified
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 17. SYNC QUEUE (SERVER RECEIVER LOG / IDEMPOTENCY)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    action VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(30) DEFAULT 'processed',
    retry_count INTEGER DEFAULT 0,
    last_attempt TIMESTAMPTZ DEFAULT NOW(),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR HIGH-VELOCITY READS AND SEARCH
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_event ON leads(event_id);
CREATE INDEX IF NOT EXISTS idx_leads_captured_by ON leads(captured_by);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_rating ON leads(rating);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_attendee ON leads(attendee_id);
CREATE INDEX IF NOT EXISTS idx_leads_idempotency ON leads(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_event_created ON leads(tenant_id, event_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attendees_event ON attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_attendees_badge ON attendees(event_id, badge_id);
CREATE INDEX IF NOT EXISTS idx_attendees_qr ON attendees(qr_token);
CREATE INDEX IF NOT EXISTS idx_attendees_search ON attendees(event_id, email, mobile);

CREATE INDEX IF NOT EXISTS idx_followups_lead ON followups(lead_id);
CREATE INDEX IF NOT EXISTS idx_followups_tenant ON followups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_followups_assigned ON followups(assigned_to, due_date);

CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_logs(tenant_id, created_at DESC);

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Helper function to get current user's profile
CREATE OR REPLACE FUNCTION get_current_profile()
RETURNS TABLE (
    user_id UUID,
    system_role VARCHAR,
    tenant_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.system_role, p.tenant_id
    FROM profiles p
    WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all sensitive tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_exhibitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibitor_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS POLICIES FOR LEADS
-- Exhibitor Admin can view/edit all company leads.
-- Sales Rep can create leads and view own leads (or all if granted).
-- Super Admin / Organizer Admin can view event leads.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Leads access policy" ON leads;
CREATE POLICY "Leads access policy" ON leads
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (
                p.system_role = 'super_admin'
                OR (p.tenant_id = leads.tenant_id AND (
                    p.system_role = 'exhibitor_admin'
                    OR leads.captured_by = auth.uid()
                    OR leads.assigned_to = auth.uid()
                ))
                OR (p.system_role = 'organizer_admin')
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (
                p.system_role = 'super_admin'
                OR (p.tenant_id = leads.tenant_id)
            )
        )
    );

-- ------------------------------------------------------------------------------
-- RLS POLICIES FOR ORGANIZATIONS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Organizations isolation" ON organizations;
CREATE POLICY "Organizations isolation" ON organizations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.system_role = 'super_admin' OR p.tenant_id = organizations.id)
        )
    );

DROP POLICY IF EXISTS "Organizations admin update" ON organizations;
CREATE POLICY "Organizations admin update" ON organizations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.system_role = 'super_admin' OR (p.tenant_id = organizations.id AND p.system_role = 'exhibitor_admin'))
        )
    );

-- ------------------------------------------------------------------------------
-- RLS POLICIES FOR ATTENDEES (Organizers manage, Exhibitors search within registered event)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Attendees access policy" ON attendees;
CREATE POLICY "Attendees access policy" ON attendees
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Attendees organizer management" ON attendees;
CREATE POLICY "Attendees organizer management" ON attendees
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.system_role IN ('super_admin', 'organizer_admin')
        )
    );

-- ------------------------------------------------------------------------------
-- RLS POLICIES FOR FORMS & FOLLOWUPS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Forms tenant isolation" ON lead_forms;
CREATE POLICY "Forms tenant isolation" ON lead_forms
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.system_role = 'super_admin' OR p.tenant_id = lead_forms.tenant_id)
        )
    );

DROP POLICY IF EXISTS "Followups tenant isolation" ON followups;
CREATE POLICY "Followups tenant isolation" ON followups
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.system_role = 'super_admin' OR p.tenant_id = followups.tenant_id)
        )
    );

DROP POLICY IF EXISTS "Branding tenant isolation" ON branding_settings;
CREATE POLICY "Branding tenant isolation" ON branding_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.system_role = 'super_admin' OR p.tenant_id = branding_settings.tenant_id)
        )
    );

-- ------------------------------------------------------------------------------
-- AUTOMATIC TIMESTAMP TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_leads_timestamp ON leads;
CREATE TRIGGER update_leads_timestamp
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE PROCEDURE update_timestamp_column();

DROP TRIGGER IF EXISTS update_events_timestamp ON events;
CREATE TRIGGER update_events_timestamp
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE PROCEDURE update_timestamp_column();

DROP TRIGGER IF EXISTS update_orgs_timestamp ON organizations;
CREATE TRIGGER update_orgs_timestamp
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE PROCEDURE update_timestamp_column();
