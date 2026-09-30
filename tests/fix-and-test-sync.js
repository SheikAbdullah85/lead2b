const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

async function fixAndTestSync() {
  console.log('--- Applying Policy Fix in PostgreSQL ---');
  const pgClient = new Client({
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.drgdprlusialscclyudf',
    password: 'Craftix@2026',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await pgClient.connect();

  // Allow anon to insert captured leads with valid tenant_id and event_id
  await pgClient.query(`
    DROP POLICY IF EXISTS "Leads insert policy" ON leads;
    DROP POLICY IF EXISTS "Leads insert for anon and authenticated" ON leads;

    CREATE POLICY "Leads insert for anon and authenticated" ON leads
        FOR INSERT
        TO anon, authenticated
        WITH CHECK (
            tenant_id IS NOT NULL AND event_id IS NOT NULL AND first_name IS NOT NULL
        );

    -- Allow badge lookup for attendee scanner
    DROP POLICY IF EXISTS "Attendees access policy" ON attendees;
    DROP POLICY IF EXISTS "Attendees select for all" ON attendees;

    CREATE POLICY "Attendees select for all" ON attendees
        FOR SELECT
        TO anon, authenticated
        USING (true);
  `);
  console.log('✓ Successfully updated RLS policies in PostgreSQL.');
  await pgClient.end();

  // Now test with anonymous Supabase client
  console.log('\n--- Testing with ANONYMOUS Supabase client ---');
  const anonSupabase = createClient(
    'https://drgdprlusialscclyudf.supabase.co',
    'sb_publishable_5UoAFRnatoGCk0XKRq7BFw_-2Es9NzC'
  );

  // 1. Test Attendee Lookup as anon
  const { data: attendees, error: attErr } = await anonSupabase
    .from('attendees')
    .select('badge_id, first_name, last_name, company')
    .eq('badge_id', 'GITEX2026-ATT-00101')
    .single();

  console.log('Anon Attendee Lookup:', attErr ? `FAILED: ${attErr.message}` : `SUCCESS: ${attendees.first_name} ${attendees.last_name} (${attendees.company})`);

  // 2. Test Lead Insert as anon (Simulating badge scan sync)
  const testLead = {
    tenant_id: '11111111-1111-1111-1111-111111111111',
    event_id: 'eeee1111-1111-1111-1111-111111111111',
    captured_by: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    first_name: 'Omar',
    last_name: 'Khashoggi',
    company: 'Emirates NBD',
    email: 'omar.k@emiratesnbd.example.com',
    source: 'qr_scan',
    capture_method: 'QR',
    rating: 'hot',
    status: 'demo_required',
    sync_status: 'synced',
    idempotency_key: `badge_test_${Date.now()}`
  };

  const { data: inserted, error: insErr } = await anonSupabase
    .from('leads')
    .insert([testLead])
    .select('id, full_name, email, sync_status')
    .single();

  console.log('Anon Lead Sync Insert:', insErr ? `FAILED: ${insErr.message}` : `SUCCESS: ID ${inserted.id}, ${inserted.full_name}`);

  // 3. Test that anon STILL CANNOT read leads (Privacy & Isolation preserved)
  const { data: readLeads } = await anonSupabase.from('leads').select('*').limit(5);
  console.log('Anon Read Leads Protection:', (readLeads === null || readLeads.length === 0) ? 'PROTECTED (Zero leads leaked to anon)' : `LEAK DETECTED: ${readLeads.length} leads returned`);
}

fixAndTestSync().catch(console.error);
