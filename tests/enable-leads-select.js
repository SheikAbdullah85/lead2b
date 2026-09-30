const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

async function enableLeadsSelect() {
  const client = new Client({
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.drgdprlusialscclyudf',
    password: 'Craftix@2026',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  console.log('1. Updating Leads SELECT policy in PostgreSQL...');
  await client.query(`
    DROP POLICY IF EXISTS "Leads select policy" ON leads;
    DROP POLICY IF EXISTS "Leads select for all" ON leads;

    CREATE POLICY "Leads select for all" ON leads
      FOR SELECT
      TO anon, authenticated
      USING (true);
  `);

  console.log('✓ Successfully enabled SELECT for anon and authenticated on leads table.');
  await client.end();

  // Test anon select and anon insert with .select()
  console.log('2. Testing anon client select & insert with .select()...');
  const anonSupabase = createClient(
    'https://drgdprlusialscclyudf.supabase.co',
    'sb_publishable_5UoAFRnatoGCk0XKRq7BFw_-2Es9NzC'
  );

  // Test SELECT
  const { data: leads, error: selectErr } = await anonSupabase
    .from('leads')
    .select('id, first_name, last_name, company, email, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  console.log('Anon SELECT test:', selectErr ? `FAILED: ${selectErr.message}` : `SUCCESS: Loaded ${leads.length} leads!`);
  if (leads && leads.length > 0) {
    console.table(leads);
  }

  // Test INSERT with .select()
  const testLead = {
    tenant_id: '11111111-1111-1111-1111-111111111111',
    event_id: 'eeee1111-1111-1111-1111-111111111111',
    captured_by: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    first_name: 'BatchTest',
    last_name: 'Visitor',
    company: 'Sync Verification LLC',
    email: `batch_test_${Date.now()}@example.com`,
    source: 'qr_scan',
    capture_method: 'QR',
    rating: 'hot',
    status: 'new',
    sync_status: 'synced',
    idempotency_key: `batch_test_key_${Date.now()}`
  };

  const { data: inserted, error: insertErr } = await anonSupabase
    .from('leads')
    .insert([testLead])
    .select('id, first_name, last_name, company, email')
    .single();

  console.log('Anon INSERT with .select() test:', insertErr ? `FAILED: ${insertErr.message}` : `SUCCESS: Inserted Lead ID ${inserted.id} (${inserted.first_name} ${inserted.last_name})!`);
}

enableLeadsSelect().catch(console.error);
