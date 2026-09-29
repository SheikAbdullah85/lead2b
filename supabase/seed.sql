-- ==============================================================================
-- lead2b: Seed Data for Demo & Testing
-- Includes Multi-tenant organizations, GITEX Global event, attendees, users, leads
-- ==============================================================================

-- 1. Demo Organizations
INSERT INTO organizations (id, company_name, company_code, primary_contact_name, email, phone, country, website, subscription_plan, license_count)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Alpha Technology Group', 'ALPHA-TECH', 'David Miller', 'admin@alphatech.com', '+971 4 399 1000', 'United Arab Emirates', 'https://alphatech.example.com', 'event_pro', 10),
('22222222-2222-2222-2222-222222222222', 'Beta Solutions Corp', 'BETA-SOL', 'Elena Rostova', 'contact@betasolutions.example.com', '+44 20 7946 0991', 'United Kingdom', 'https://betasolutions.example.com', 'event_standard', 5)
ON CONFLICT (id) DO NOTHING;

-- 2. Branding Settings
INSERT INTO branding_settings (tenant_id, company_name, primary_color, secondary_color, welcome_message)
VALUES
('11111111-1111-1111-1111-111111111111', 'Alpha Technology', '#00838f', '#1e293b', 'Welcome to Alpha Technology GITEX 2026 Booth!'),
('22222222-2222-2222-2222-222222222222', 'Beta Solutions', '#059669', '#064e3b', 'Beta Solutions Lead Hub')
ON CONFLICT (tenant_id) DO NOTHING;

-- 3. Demo User Profiles
INSERT INTO profiles (id, email, full_name, mobile, system_role, tenant_id, is_active)
VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@lead2b.com', 'System Administrator', '+971 50 123 4567', 'super_admin', NULL, true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'organizer@gitex.com', 'Rashid Al-Nuaimi', '+971 50 987 6543', 'organizer_admin', NULL, true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'exhibitor@alphatech.com', 'David Miller', '+971 52 333 4444', 'exhibitor_admin', '11111111-1111-1111-1111-111111111111', true),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'tariq@alphatech.com', 'Tariq Mansoor', '+971 55 111 2233', 'sales_rep', '11111111-1111-1111-1111-111111111111', true),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'sarah@alphatech.com', 'Sarah Jenkins', '+971 55 444 5566', 'sales_rep', '11111111-1111-1111-1111-111111111111', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Events
INSERT INTO events (id, event_name, event_code, description, venue, city, country, start_date, end_date, organizer_name, status, timezone)
VALUES
('eeee1111-1111-1111-1111-111111111111', 'GITEX Global 2026', 'GITEX2026', 'The worlds premier technology and AI conference & exhibition', 'Dubai World Trade Centre (DWTC)', 'Dubai', 'United Arab Emirates', '2026-10-12', '2026-10-16', 'Dubai World Trade Centre Authority', 'active', 'UTC+04:00'),
('eeee2222-2222-2222-2222-222222222222', 'Future Mobility Conference 2026', 'FMC2026', 'Autonomous vehicles, EV infrastructure, and smart transit', 'ADNEC Exhibition Centre', 'Abu Dhabi', 'United Arab Emirates', '2026-11-20', '2026-11-23', 'Abu Dhabi Transport Authority', 'active', 'UTC+04:00')
ON CONFLICT (id) DO NOTHING;

-- 5. Halls & Booths
INSERT INTO halls (id, event_id, hall_name, hall_code)
VALUES
('00001111-1111-1111-1111-111111111111', 'eeee1111-1111-1111-1111-111111111111', 'Hall 3 - Cloud & Enterprise Software', 'H3'),
('00002222-2222-2222-2222-222222222222', 'eeee1111-1111-1111-1111-111111111111', 'Hall 6 - Artificial Intelligence & Robotics', 'H6')
ON CONFLICT (id) DO NOTHING;

INSERT INTO booths (id, event_id, hall_id, tenant_id, booth_name, booth_number)
VALUES
('b0001111-1111-1111-1111-111111111111', 'eeee1111-1111-1111-1111-111111111111', '00001111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Alpha Tech Main Pavillion', 'H3-B24'),
('b0002222-2222-2222-2222-222222222222', 'eeee1111-1111-1111-1111-111111111111', '00002222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Beta Solutions Smart Stand', 'H6-A12')
ON CONFLICT (id) DO NOTHING;

-- 6. Event Exhibitors & User assignments
INSERT INTO event_exhibitors (event_id, tenant_id, booth_id, status)
VALUES
('eeee1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b0001111-1111-1111-1111-111111111111', 'active'),
('eeee1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'b0002222-2222-2222-2222-222222222222', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO exhibitor_users (tenant_id, user_id, role, event_id, booth_id)
VALUES
('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'exhibitor_admin', 'eeee1111-1111-1111-1111-111111111111', 'b0001111-1111-1111-1111-111111111111'),
('11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'sales_rep', 'eeee1111-1111-1111-1111-111111111111', 'b0001111-1111-1111-1111-111111111111'),
('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'sales_rep', 'eeee1111-1111-1111-1111-111111111111', 'b0001111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- 7. Attendees (Sample badge codes for scanning)
INSERT INTO attendees (id, event_id, registration_id, badge_id, qr_token, first_name, last_name, company, job_title, email, mobile, country, industry, visitor_type, company_size)
VALUES
('a0000001-0000-0000-0000-000000000001', 'eeee1111-1111-1111-1111-111111111111', 'REG-88219', 'GITEX2026-ATT-00101', 'lead2b:badge:GITEX2026-ATT-00101', 'Omar', 'Khashoggi', 'Emirates NBD', 'VP Technology & Digital Transformation', 'omar.k@emiratesnbd.example.com', '+971 50 445 6789', 'United Arab Emirates', 'Banking & Finance', 'VIP', '5000+'),
('a0000002-0000-0000-0000-000000000002', 'eeee1111-1111-1111-1111-111111111111', 'REG-88220', 'GITEX2026-ATT-00102', 'lead2b:badge:GITEX2026-ATT-00102', 'Jessica', 'Taylor', 'Accenture Middle East', 'Director of Enterprise AI', 'j.taylor@accenture.example.com', '+971 55 998 1234', 'United Arab Emirates', 'Consulting & IT Services', 'VIP', '10000+'),
('a0000003-0000-0000-0000-000000000003', 'eeee1111-1111-1111-1111-111111111111', 'REG-88221', 'GITEX2026-ATT-00103', 'lead2b:badge:GITEX2026-ATT-00103', 'Ahmed', 'Mansoor', 'Etisalat e&', 'Head of Cloud Infrastructure', 'ahmed.m@eand.example.com', '+971 50 112 3344', 'United Arab Emirates', 'Telecommunications', 'Trade Visitor', '1000+'),
('a0000004-0000-0000-0000-000000000004', 'eeee1111-1111-1111-1111-111111111111', 'REG-88222', 'GITEX2026-ATT-00104', 'lead2b:badge:GITEX2026-ATT-00104', 'Chen', 'Wei', 'Alibaba Cloud MENA', 'Senior Solutions Architect', 'chen.wei@alibabacloud.example.com', '+971 52 776 5432', 'China', 'Cloud Services', 'Trade Visitor', '5000+'),
('a0000005-0000-0000-0000-000000000005', 'eeee1111-1111-1111-1111-111111111111', 'REG-88223', 'GITEX2026-ATT-00105', 'lead2b:badge:GITEX2026-ATT-00105', 'Fatima', 'Al-Zahra', 'Dubai Municipality', 'Director of Smart Cities', 'fatima.z@dm.gov.example.com', '+971 50 778 9900', 'United Arab Emirates', 'Government', 'VIP', '10000+'),
('a0000006-0000-0000-0000-000000000006', 'eeee1111-1111-1111-1111-111111111111', 'REG-88224', 'GITEX2026-ATT-00106', 'lead2b:badge:GITEX2026-ATT-00106', 'Michael', 'Braun', 'Siemens Energy', 'Procurement Manager EMEA', 'm.braun@siemens.example.com', '+49 89 636 00', 'Germany', 'Manufacturing & Energy', 'Trade Visitor', '50000+')
ON CONFLICT (id) DO NOTHING;

-- 8. Lead Qualification Form
INSERT INTO lead_forms (id, tenant_id, event_id, form_name, description, is_active, is_default)
VALUES
('ffff1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'eeee1111-1111-1111-1111-111111111111', 'GITEX 2026 Enterprise Qualification', 'Fast 4-question lead scoring form', true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO form_questions (id, form_id, question_text, question_type, is_required, display_order)
VALUES
('faaa0001-0000-0000-0000-000000000001', 'ffff1111-1111-1111-1111-111111111111', 'Primary Product of Interest', 'dropdown', true, 1),
('faaa0002-0000-0000-0000-000000000002', 'ffff1111-1111-1111-1111-111111111111', 'Estimated Implementation Timeline', 'radio', true, 2),
('faaa0003-0000-0000-0000-000000000003', 'ffff1111-1111-1111-1111-111111111111', 'Interested in Enterprise Cloud ERP?', 'yes_no', false, 3),
('faaa0004-0000-0000-0000-000000000004', 'ffff1111-1111-1111-1111-111111111111', 'Number of ERP User Licenses Needed', 'dropdown', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Conditional logic: Question 4 only shows if Question 3 is Yes
UPDATE form_questions 
SET conditional_parent_id = 'faaa0003-0000-0000-0000-000000000003',
    conditional_operator = 'equals',
    conditional_value = 'Yes'
WHERE id = 'faaa0004-0000-0000-0000-000000000004';

INSERT INTO form_options (question_id, option_label, option_value, display_order)
VALUES
('faaa0001-0000-0000-0000-000000000001', 'Enterprise AI Platform', 'Enterprise AI Platform', 1),
('faaa0001-0000-0000-0000-000000000001', 'Cloud Infrastructure & Security', 'Cloud Infrastructure & Security', 2),
('faaa0001-0000-0000-0000-000000000001', 'Smart Analytics & CRM Suite', 'Smart Analytics & CRM Suite', 3),
('faaa0002-0000-0000-0000-000000000002', 'Immediate (Within 30 Days)', 'Immediate', 1),
('faaa0002-0000-0000-0000-000000000002', '1 to 3 Months', '1-3 months', 2),
('faaa0002-0000-0000-0000-000000000002', '3 to 6 Months', '3-6 months', 3),
('faaa0004-0000-0000-0000-000000000004', '10 - 50 Users', '10-50', 1),
('faaa0004-0000-0000-0000-000000000004', '50 - 250 Users', '50-250', 2),
('faaa0004-0000-0000-0000-000000000004', '250+ Users (Enterprise)', '250+', 3)
ON CONFLICT DO NOTHING;

-- 9. Sample Leads
INSERT INTO leads (
    id, tenant_id, event_id, attendee_id, captured_by, booth_id,
    first_name, last_name, company, job_title, email, mobile, country,
    source, rating, status, priority, product_interest, requirement, estimated_value, purchase_timeline,
    followup_required, followup_date, capture_method, sync_status
)
VALUES
(
    '1ea00001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'eeee1111-1111-1111-1111-111111111111',
    'a0000001-0000-0000-0000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'b0001111-1111-1111-1111-111111111111',
    'Omar', 'Khashoggi', 'Emirates NBD', 'VP Technology & Digital Transformation', 'omar.k@emiratesnbd.example.com', '+971 50 445 6789', 'United Arab Emirates',
    'qr_scan', 'hot', 'demo_required', 'high', 'Enterprise AI Platform', 'Looking for on-premise AI models with Arabic NLP support for bank compliance.', 120000.00, 'immediate',
    true, CURRENT_DATE + INTERVAL '2 days', 'QR', 'synced'
),
(
    '1ea00002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'eeee1111-1111-1111-1111-111111111111',
    'a0000002-0000-0000-0000-000000000002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'b0001111-1111-1111-1111-111111111111',
    'Jessica', 'Taylor', 'Accenture Middle East', 'Director of Enterprise AI', 'j.taylor@accenture.example.com', '+971 55 998 1234', 'United Arab Emirates',
    'qr_scan', 'hot', 'quotation_required', 'high', 'Cloud Infrastructure & Security', 'Seeking multi-cloud integration partner for government client RFP.', 85000.00, '1-3 months',
    true, CURRENT_DATE + INTERVAL '3 days', 'QR', 'synced'
),
(
    '1ea00003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'eeee1111-1111-1111-1111-111111111111',
    'a0000003-0000-0000-0000-000000000003', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'b0001111-1111-1111-1111-111111111111',
    'Ahmed', 'Mansoor', 'Etisalat e&', 'Head of Cloud Infrastructure', 'ahmed.m@eand.example.com', '+971 50 112 3344', 'United Arab Emirates',
    'qr_scan', 'warm', 'follow_up', 'medium', 'Smart Analytics & CRM Suite', 'Evaluating replacement for legacy ticketing analytics.', 45000.00, '3-6 months',
    true, CURRENT_DATE + INTERVAL '5 days', 'QR', 'synced'
)
ON CONFLICT (id) DO NOTHING;

-- 10. Sample Notes
INSERT INTO lead_notes (lead_id, tenant_id, user_id, note_text)
VALUES
('1ea00001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Met with Omar at DWTC booth. Very keen on our Arabic fine-tuned LLM inference pipeline. Arranging 30-min executive demo on Thursday 3 PM.'),
('1ea00002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Jessica asked for technical architecture whitepaper and pricing tiers for 500+ seats.')
ON CONFLICT DO NOTHING;

-- 11. Sample Follow-ups
INSERT INTO followups (tenant_id, event_id, lead_id, assigned_to, task_type, task_title, description, due_date, priority, status, created_by)
VALUES
('11111111-1111-1111-1111-111111111111', 'eeee1111-1111-1111-1111-111111111111', '1ea00001-0000-0000-0000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'demo', 'Deliver Live Arabic AI Platform Demo', 'Showcase sentiment analysis and financial entity recognition.', NOW() + INTERVAL '2 days', 'high', 'open', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
('11111111-1111-1111-1111-111111111111', 'eeee1111-1111-1111-1111-111111111111', '1ea00002-0000-0000-0000-000000000002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'proposal', 'Send Formal RFP Proposal & SLA Sheet', 'Include enterprise SOC2 & ISO27001 compliance sheets.', NOW() + INTERVAL '3 days', 'high', 'open', 'dddddddd-dddd-dddd-dddd-dddddddddddd')
ON CONFLICT DO NOTHING;

-- 12. Active License
INSERT INTO licenses (tenant_id, plan, start_date, expiry_date, allowed_events, allowed_users, lead_limit, is_active)
VALUES
('11111111-1111-1111-1111-111111111111', 'event_pro', '2026-10-01', '2026-11-01', 3, 10, 5000, true),
('22222222-2222-2222-2222-222222222222', 'event_standard', '2026-10-01', '2026-10-25', 1, 5, 2000, true)
ON CONFLICT DO NOTHING;
