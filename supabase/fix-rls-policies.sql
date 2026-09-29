-- ==============================================================================
-- Zero-Recursion Production RLS Policies for lead2b
-- Using SECURITY DEFINER Helper Functions
-- ==============================================================================

-- 1. Helper Functions (SECURITY DEFINER bypasses RLS to prevent recursion)
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_auth_system_role()
RETURNS VARCHAR AS $$
  SELECT system_role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. PROFILES
DROP POLICY IF EXISTS "Profiles read own and tenant" ON profiles;
DROP POLICY IF EXISTS "Profiles update own" ON profiles;
DROP POLICY IF EXISTS "Profiles super admin full" ON profiles;
DROP POLICY IF EXISTS "Profiles read all authenticated" ON profiles;

CREATE POLICY "Profiles read all authenticated" ON profiles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Profiles update own" ON profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Profiles super admin full" ON profiles
    FOR ALL
    TO authenticated
    USING (public.get_auth_system_role() = 'super_admin');

-- 3. EVENTS
DROP POLICY IF EXISTS "Events viewable by public" ON events;
DROP POLICY IF EXISTS "Events manage by admins" ON events;

CREATE POLICY "Events viewable by public" ON events
    FOR SELECT
    USING (true);

CREATE POLICY "Events manage by admins" ON events
    FOR ALL
    TO authenticated
    USING (public.get_auth_system_role() IN ('super_admin', 'organizer_admin'));

-- 4. HALLS & BOOTHS
DROP POLICY IF EXISTS "Halls viewable by all" ON halls;
DROP POLICY IF EXISTS "Booths viewable by all" ON booths;

CREATE POLICY "Halls viewable by all" ON halls
    FOR SELECT
    USING (true);

CREATE POLICY "Booths viewable by all" ON booths
    FOR SELECT
    USING (true);

-- 5. ORGANIZATIONS & BRANDING
DROP POLICY IF EXISTS "Organizations viewable by all authenticated" ON organizations;
DROP POLICY IF EXISTS "Organizations admin update" ON organizations;

CREATE POLICY "Organizations viewable by all authenticated" ON organizations
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Organizations admin update" ON organizations
    FOR UPDATE
    TO authenticated
    USING (
        public.get_auth_system_role() = 'super_admin'
        OR (organizations.id = public.get_auth_tenant_id() AND public.get_auth_system_role() = 'exhibitor_admin')
    );

DROP POLICY IF EXISTS "Branding viewable by all" ON branding_settings;
DROP POLICY IF EXISTS "Branding admin update" ON branding_settings;

CREATE POLICY "Branding viewable by all" ON branding_settings
    FOR SELECT
    USING (true);

CREATE POLICY "Branding admin update" ON branding_settings
    FOR ALL
    TO authenticated
    USING (
        public.get_auth_system_role() = 'super_admin'
        OR (branding_settings.tenant_id = public.get_auth_tenant_id() AND public.get_auth_system_role() = 'exhibitor_admin')
    );

-- 6. ATTENDEES (Master List)
DROP POLICY IF EXISTS "Attendees access policy" ON attendees;
DROP POLICY IF EXISTS "Attendees organizer management" ON attendees;

CREATE POLICY "Attendees access policy" ON attendees
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Attendees organizer management" ON attendees
    FOR ALL
    TO authenticated
    USING (public.get_auth_system_role() IN ('super_admin', 'organizer_admin'));

-- 7. LEADS (Core Lead Data)
DROP POLICY IF EXISTS "Leads select policy" ON leads;
DROP POLICY IF EXISTS "Leads insert policy" ON leads;
DROP POLICY IF EXISTS "Leads update policy" ON leads;
DROP POLICY IF EXISTS "Leads delete policy" ON leads;

CREATE POLICY "Leads select policy" ON leads
    FOR SELECT
    TO authenticated
    USING (
        public.get_auth_system_role() IN ('super_admin', 'organizer_admin')
        OR leads.tenant_id = public.get_auth_tenant_id()
    );

CREATE POLICY "Leads insert policy" ON leads
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_auth_system_role() = 'super_admin'
        OR leads.tenant_id = public.get_auth_tenant_id()
    );

CREATE POLICY "Leads update policy" ON leads
    FOR UPDATE
    TO authenticated
    USING (
        public.get_auth_system_role() IN ('super_admin', 'organizer_admin')
        OR (leads.tenant_id = public.get_auth_tenant_id() AND (
            public.get_auth_system_role() = 'exhibitor_admin'
            OR leads.captured_by = auth.uid()
            OR leads.assigned_to = auth.uid()
        ))
    );

CREATE POLICY "Leads delete policy" ON leads
    FOR DELETE
    TO authenticated
    USING (
        public.get_auth_system_role() = 'super_admin'
        OR (leads.tenant_id = public.get_auth_tenant_id() AND public.get_auth_system_role() = 'exhibitor_admin')
    );

-- 8. FORMS, QUESTIONS, OPTIONS
DROP POLICY IF EXISTS "Forms viewable by all authenticated" ON lead_forms;
DROP POLICY IF EXISTS "Questions viewable by all authenticated" ON form_questions;
DROP POLICY IF EXISTS "Options viewable by all authenticated" ON form_options;

CREATE POLICY "Forms viewable by all authenticated" ON lead_forms
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Questions viewable by all authenticated" ON form_questions
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Options viewable by all authenticated" ON form_options
    FOR SELECT
    TO authenticated
    USING (true);

-- 9. FOLLOWUPS & NOTES
DROP POLICY IF EXISTS "Followups tenant isolation" ON followups;
CREATE POLICY "Followups tenant isolation" ON followups
    FOR ALL
    TO authenticated
    USING (
        public.get_auth_system_role() = 'super_admin'
        OR followups.tenant_id = public.get_auth_tenant_id()
    );

DROP POLICY IF EXISTS "Lead notes isolation" ON lead_notes;
CREATE POLICY "Lead notes isolation" ON lead_notes
    FOR ALL
    TO authenticated
    USING (
        public.get_auth_system_role() = 'super_admin'
        OR lead_notes.tenant_id = public.get_auth_tenant_id()
    );

-- 10. LICENSES
DROP POLICY IF EXISTS "Licenses viewable by tenant and admin" ON licenses;
CREATE POLICY "Licenses viewable by tenant and admin" ON licenses
    FOR SELECT
    TO authenticated
    USING (
        public.get_auth_system_role() = 'super_admin'
        OR licenses.tenant_id = public.get_auth_tenant_id()
    );
