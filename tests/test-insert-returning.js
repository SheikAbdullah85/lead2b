const { createClient } = require('@supabase/supabase-js');

async function testInsert() {
  const anonSupabase = createClient(
    'https://drgdprlusialscclyudf.supabase.co',
    'sb_publishable_5UoAFRnatoGCk0XKRq7BFw_-2Es9NzC'
  );

  const testLead = {
    tenant_id: '11111111-1111-1111-1111-111111111111',
    event_id: 'eeee1111-1111-1111-1111-111111111111',
    captured_by: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    first_name: 'Test',
    last_name: 'NoReturning',
    company: 'Test Co',
    email: `test_${Date.now()}@example.com`,
    source: 'qr_scan',
    capture_method: 'QR',
    rating: 'hot',
    status: 'new',
    sync_status: 'synced',
    idempotency_key: `no_ret_${Date.now()}`
  };

  // Test without .select()
  const { error } = await anonSupabase.from('leads').insert([testLead]);
  console.log('Insert WITHOUT .select():', error ? `FAILED: ${error.message}` : 'SUCCESS!');
}

testInsert().catch(console.error);
