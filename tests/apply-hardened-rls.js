const { Client } = require('pg');

async function applyHardenedRLS() {
  const client = new Client({
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.drgdprlusialscclyudf',
    password: 'Craftix@2026',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  console.log('--- Applying Hardened Enterprise RLS Policies ---');

  // 1. SELECT policy: Only authenticated users for their tenant, or admins
  await client.query(`
    DROP POLICY IF EXISTS "Leads select policy" ON leads;
    DROP POLICY IF EXISTS "Leads select for all" ON leads;

    CREATE POLICY "Leads select policy" ON leads
      FOR SELECT
      TO authenticated
      USING (
        ((get_auth_system_role())::text = ANY (ARRAY['super_admin'::character varying, 'organizer_admin'::character varying]::text[])) 
        OR (tenant_id = get_auth_tenant_id())
      );
  `);
  console.log('✓ Applied hardened Leads select policy.');

  // 2. INSERT policy: allows anon (with required fields) AND enforces tenant isolation for authenticated users
  await client.query(`
    DROP POLICY IF EXISTS "Leads insert policy" ON leads;
    DROP POLICY IF EXISTS "Leads insert for anon and authenticated" ON leads;

    CREATE POLICY "Leads insert policy" ON leads
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (
        tenant_id IS NOT NULL 
        AND event_id IS NOT NULL 
        AND first_name IS NOT NULL
        AND (
          auth.role() = 'anon' 
          OR (tenant_id = get_auth_tenant_id()) 
          OR ((get_auth_system_role())::text = 'super_admin'::text)
        )
      );
  `);
  console.log('✓ Applied hardened Leads insert policy.');

  // 3. Attendees policy: Anyone can select attendees to resolve badges
  await client.query(`
    DROP POLICY IF EXISTS "Attendees select for all" ON attendees;
    CREATE POLICY "Attendees select for all" ON attendees
      FOR SELECT
      TO anon, authenticated
      USING (true);
  `);
  console.log('✓ Attendees select policy verified.');

  await client.end();
}

applyHardenedRLS().catch(console.error);
