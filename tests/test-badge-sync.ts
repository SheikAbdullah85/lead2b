import { createClient } from '@supabase/supabase-js';
import { parseBadgeQr } from '../src/lib/utils/qr-parser';

const supabase = createClient(
  'https://drgdprlusialscclyudf.supabase.co',
  'sb_publishable_5UoAFRnatoGCk0XKRq7BFw_-2Es9NzC'
);

async function testBadgeScanSync() {
  console.log('--- Testing Badge Scan Sync to Supabase ---');

  // 1. Authenticate as Tariq (Sales Rep)
  const authRes = await supabase.auth.signInWithPassword({
    email: 'tariq@alphatech.com',
    password: 'Craftix@2026',
  });
  console.log('Auth result:', authRes.error ? authRes.error.message : 'SUCCESS', authRes.data.user?.id);

  // 2. Simulate QR token scan
  const sampleQrTokens = [
    'GITEX2026-ATT-00101',
    'lead2b:badge:GITEX2026-ATT-00102',
    'BEGIN:VCARD\nVERSION:3.0\nN:Smith;John\nFN:John Smith\nORG:TestCorp\nEMAIL:john@test.com\nTEL:+971501112233\nEND:VCARD'
  ];

  for (const qr of sampleQrTokens) {
    const parsed = parseBadgeQr(qr);
    console.log(`\nParsed QR [${qr.slice(0, 25)}...]:`, {
      badgeId: parsed.badgeId,
      name: `${parsed.firstName} ${parsed.lastName}`,
      email: parsed.email
    });

    const isUuid = (val?: string) =>
      typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    // 3. Attempt insert as done by sync-engine.ts
    const insertPayload = {
      tenant_id: '11111111-1111-1111-1111-111111111111',
      event_id: 'eeee1111-1111-1111-1111-111111111111',
      captured_by: authRes.data.user!.id,
      attendee_id: isUuid(parsed.badgeId) ? parsed.badgeId : null,
      first_name: parsed.firstName || 'Visitor',
      last_name: parsed.lastName || 'Badge',
      company: parsed.company || 'Exhibition Visitor',
      email: parsed.email || `badge_${Date.now()}@event.example.com`,
      mobile: parsed.phone || '+971 50 000 0000',
      source: 'qr_scan',
      rating: 'hot',
      status: 'demo_required',
      priority: 'high',
      product_interest: 'Enterprise AI Platform',
      requirement: 'Scanned at GITEX',
      purchase_timeline: '1-3 months',
      capture_method: 'QR',
      online_offline: 'online',
      sync_status: 'synced',
      idempotency_key: `test_badge_${Date.now()}_${Math.random()}`
    };

    const { data: dbLead, error: sbError } = await supabase
      .from('leads')
      .insert([insertPayload])
      .select('id, full_name, email, company')
      .single();

    if (sbError) {
      console.error('❌ Insert FAILED:', sbError);
    } else {
      console.log('✅ Insert SUCCEEDED:', dbLead);
      // Clean up test lead
      await supabase.from('leads').delete().eq('id', dbLead.id);
    }
  }
}

testBadgeScanSync().catch(console.error);
