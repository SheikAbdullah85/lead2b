const { createClient } = require('@supabase/supabase-js');
const nodeCrypto = require('crypto');

async function testSyncLogic() {
  const supabase = createClient(
    'https://drgdprlusialscclyudf.supabase.co',
    'sb_publishable_5UoAFRnatoGCk0XKRq7BFw_-2Es9NzC'
  );

  const serverLeadId = nodeCrypto.randomUUID();
  const idempotencyKey = `batch_scan_test_${Date.now()}`;

  const payload = {
    id: serverLeadId,
    tenant_id: '11111111-1111-1111-1111-111111111111',
    event_id: 'eeee1111-1111-1111-1111-111111111111',
    captured_by: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    first_name: 'Rashid',
    last_name: 'Al-Falasi',
    company: 'Emirates Post Group',
    job_title: 'Head of Logistics Tech',
    email: 'rashid.f@epg.example.com',
    mobile: '+971 50 889 0011',
    source: 'qr_scan',
    capture_method: 'QR',
    rating: 'hot',
    status: 'new',
    priority: 'high',
    product_interest: 'Enterprise AI Platform',
    purchase_timeline: '1-3 months',
    sync_status: 'synced',
    idempotency_key: idempotencyKey,
  };

  console.log('Sending insert with pre-generated UUID without .select()...');
  const { error } = await supabase.from('leads').insert([payload]);

  if (error) {
    console.error('❌ Insert failed:', error);
  } else {
    console.log('✅ Insert SUCCEEDED! Lead ID:', serverLeadId);
  }

  // Now verify with pgClient directly in the database
  const { Client } = require('pg');
  const pgClient = new Client({
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.drgdprlusialscclyudf',
    password: 'Craftix@2026',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });
  await pgClient.connect();
  const verifyRes = await pgClient.query('SELECT id, full_name, email, company, source FROM leads WHERE id = $1', [serverLeadId]);
  console.log('Database verification query:');
  console.table(verifyRes.rows);

  // Clean up
  await pgClient.query('DELETE FROM leads WHERE id = $1', [serverLeadId]);
  await pgClient.end();
}

testSyncLogic().catch(console.error);
