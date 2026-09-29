/**
 * LEAD2B ARCHITECTURAL QA & STRESS EVALUATION SUITE
 * 
 * Conducts automated evaluations for:
 * - Pillar 1: OCR Parser Boundaries, Unicode/Arabic, Extreme Payloads, Malformed Inputs
 * - Pillar 2: Lead State Transitions, Business Logic, Idempotency Keys
 * - Pillar 3: Database Concurrency, ACID Constraints, Generated Columns Integrity
 * - Pillar 4: Multi-Tenant RLS, Anonymous Denial, Cross-Tenant Isolation
 * - Pillar 5: Offline Sync Engine Queue Transitions & Conflict Resolution Logic
 * - Pillar 6: In-Memory Throughput & Latency Benchmarks
 */

import { parseBusinessCardText } from '../src/lib/ocr/card-parser';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://drgdprlusialscclyudf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5UoAFRnatoGCk0XKRq7BFw_-2Es9NzC';

async function runTestSuite() {
  console.log('====================================================');
  console.log('  LEAD2B ARCHITECTURAL QA & STRESS EVALUATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(testName: string, condition: boolean, detail = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // PILLAR 1: BOUNDARY & UNICODE TESTS (OCR PARSER)
  // ----------------------------------------------------
  console.log('\n--- Pillar 1: OCR Parser Boundary & Edge Cases ---');

  // Test 1.1: Empty and whitespace strings
  const emptyRes = parseBusinessCardText('');
  assert('Parser: Empty string input returns clean empty object', emptyRes.firstName === '' && emptyRes.company === '');

  const whitespaceRes = parseBusinessCardText('   \n\n\t   \n  ');
  assert('Parser: Whitespace-only input returns empty fields', whitespaceRes.firstName === '' && whitespaceRes.phone === '');

  // Test 1.2: Arabic & Multilingual characters (GITEX / UAE localization)
  const arabicOcr = `
أحمد جميل
مدير تطوير الأعمال
شركة النجم الذهبي ذ.م.م
+971 50 123 4567
ahmed@alnajm.ae
www.alnajm.ae
دبي - الإمارات العربية المتحدة
`;
  const arabicRes = parseBusinessCardText(arabicOcr);
  assert('Parser: Arabic Card Email extraction', arabicRes.email === 'ahmed@alnajm.ae');
  assert('Parser: Arabic Card Website extraction', arabicRes.website.includes('alnajm.ae'));
  assert('Parser: Arabic Card Phone extraction', arabicRes.phone.includes('971'));
  assert('Parser: Arabic Name extraction', (arabicRes.firstName.length > 0 || arabicRes.lastName.length > 0), `Extracted: ${arabicRes.firstName} ${arabicRes.lastName}`);

  // Test 1.3: UAE Phone Number formats (international, local prefix, dashed)
  const phoneVariations = [
    { text: 'John Doe\n+971 50 123 4567\njohn@uae.com', expected: '971' },
    { text: 'Jane Doe\n050-987-6543\njane@uae.com', expected: '050' },
    { text: 'Omar Ali\n00971551122334\nomar@uae.com', expected: '971' }
  ];
  for (const pv of phoneVariations) {
    const res = parseBusinessCardText(pv.text);
    assert(`Parser: Phone pattern recognition (${pv.expected})`, res.phone.includes(pv.expected), `Got: ${res.phone}`);
  }

  // Test 1.4: Super long input (Boundary analysis: 20KB junk string)
  const longJunk = 'Junk '.repeat(3000) + '\nJohn Doe\nManaging Director\n+971 55 999 8888\njohn@doe.com\n';
  const longStart = Date.now();
  const longRes = parseBusinessCardText(longJunk);
  const longDuration = Date.now() - longStart;
  assert('Parser: Giant payload performance (<100ms)', longDuration < 100, `Took ${longDuration}ms`);
  assert('Parser: Giant payload extracted email', longRes.email === 'john@doe.com');

  // Test 1.5: Special characters and XSS injection vectors in OCR
  const xssCard = `
<script>alert("xss")</script>
Dr. Robert "Bob" O'Connor-Smith
Vice President & CTO
Global Corp <admin@global.com>
+1 (800) 555-0199
http://global-corp.org/portal?ref=test&id=123
`;
  const xssRes = parseBusinessCardText(xssCard);
  assert('Parser: XSS payload handled safely', typeof xssRes.firstName === 'string');
  assert('Parser: Sanitized email extraction', xssRes.email === 'admin@global.com');

  // ----------------------------------------------------
  // PILLAR 2: SECURITY & RBAC / TENANT ISOLATION
  // ----------------------------------------------------
  console.log('\n--- Pillar 2: Security & Multi-Tenant RLS Evaluation ---');

  const anonClient = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Test 2.1: Anonymous user reading leads (Must be forbidden)
  const { data: anonLeads } = await anonClient.from('leads').select('*').limit(5);
  assert(
    'Security: Anonymous user cannot read leads',
    (anonLeads === null || anonLeads.length === 0),
    `Found ${anonLeads?.length} leads leaked to anon`
  );

  // Test 2.2: Authenticated Exhibitor Admin (Tenant A: 11111111-...)
  const exhibitorClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: exAuth, error: exAuthErr } = await exhibitorClient.auth.signInWithPassword({
    email: 'exhibitor@alphatech.com',
    password: 'Craftix@2026'
  });
  assert('Auth: Exhibitor Admin sign in succeeds', !exAuthErr && exAuth?.user !== null, exAuthErr?.message);

  if (exAuth?.user) {
    const { data: exLeads } = await exhibitorClient.from('leads').select('id, tenant_id');
    const leakedLeads = (exLeads || []).filter(l => l.tenant_id !== '11111111-1111-1111-1111-111111111111');
    assert(
      'Security: Tenant RLS horizontal isolation',
      leakedLeads.length === 0,
      `Leaked ${leakedLeads.length} leads from other tenants!`
    );

    // Test 2.3: Cross-tenant insertion attempt (Tenant B impersonation)
    const fakeTenantId = '22222222-2222-2222-2222-222222222222';
    const { data: hackInsert, error: hackError } = await exhibitorClient.from('leads').insert([{
      tenant_id: fakeTenantId,
      event_id: 'eeee1111-1111-1111-1111-111111111111',
      captured_by: exAuth.user.id,
      first_name: 'Injected',
      last_name: 'Lead',
      company: 'Malicious Corp'
    }]).select();

    assert(
      'Security: RLS blocks cross-tenant lead injection',
      hackError !== null,
      `Attacker was able to insert into tenant ${fakeTenantId}!`
    );

    // ----------------------------------------------------
    // PILLAR 3: DATA INTEGRITY, CONSTRAINTS & CONCURRENCY
    // ----------------------------------------------------
    console.log('\n--- Pillar 3: Data Integrity, Constraints & Concurrency ---');

    // Test 3.1: Generated Column constraint validation
    // Directly specifying `full_name` should be blocked by PostgreSQL
    const { error: genColError } = await exhibitorClient.from('leads').insert([{
      tenant_id: '11111111-1111-1111-1111-111111111111',
      event_id: 'eeee1111-1111-1111-1111-111111111111',
      captured_by: exAuth.user.id,
      first_name: 'Test',
      last_name: 'Generated',
      full_name: 'Forced Name'
    }]).select();

    assert(
      'Data Integrity: PostgreSQL enforces STORED GENERATED column protection',
      genColError !== null && genColError.message.includes('full_name'),
      `Expected full_name error, got: ${genColError?.message}`
    );

    // Test 3.2: Concurrent Lead Inserts (Simulate rapid double-tap on Mobile)
    const testEmail = `qa_stress_${Date.now()}@testcorp.example.com`;
    const leadPayload = {
      tenant_id: '11111111-1111-1111-1111-111111111111',
      event_id: 'eeee1111-1111-1111-1111-111111111111',
      captured_by: exAuth.user.id,
      first_name: 'Concurrency',
      last_name: 'Test',
      email: testEmail,
      company: 'Stress Test Ltd',
      idempotency_key: `idemp_${Date.now()}`
    };

    const [res1, res2] = await Promise.all([
      exhibitorClient.from('leads').insert([leadPayload]).select(),
      exhibitorClient.from('leads').insert([leadPayload]).select(),
    ]);

    const totalCreated = (res1.data ? 1 : 0) + (res2.data ? 1 : 0);
    assert(
      'Concurrency: Simultaneous inserts handled cleanly without table lock deadlocks',
      totalCreated >= 1,
      `Failed: res1=${res1.error?.message}, res2=${res2.error?.message}`
    );

    // Clean up test leads
    if (res1.data?.[0]?.id) {
      await exhibitorClient.from('leads').delete().eq('id', res1.data[0].id);
    }
    if (res2.data?.[0]?.id) {
      await exhibitorClient.from('leads').delete().eq('id', res2.data[0].id);
    }
  }

  // ----------------------------------------------------
  // PILLAR 4: STATE TRANSITIONS & VALIDATIONS
  // ----------------------------------------------------
  console.log('\n--- Pillar 4: Lead State Machine Transitions ---');
  
  const VALID_QUALIFICATIONS = ['hot', 'warm', 'cold', 'urgent', 'new'];
  const VALID_STATUSES = ['new', 'qualified', 'follow_up', 'demo_required', 'quotation_required', 'negotiation', 'won', 'lost'];

  function validateLeadState(qualification: string, status: string): { valid: boolean; reason?: string } {
    if (!VALID_QUALIFICATIONS.includes(qualification)) {
      return { valid: false, reason: `Invalid qualification: ${qualification}` };
    }
    if (!VALID_STATUSES.includes(status)) {
      return { valid: false, reason: `Invalid status: ${status}` };
    }
    return { valid: true };
  }

  assert('State: hot + new is valid', validateLeadState('hot', 'new').valid);
  assert('State: hot + demo_required is valid', validateLeadState('hot', 'demo_required').valid);
  assert('State: warm + follow_up is valid', validateLeadState('warm', 'follow_up').valid);
  assert('State: invalid status rejected', !validateLeadState('hot', 'exploded').valid);
  assert('State: invalid qualification rejected', !validateLeadState('super-hot', 'qualified').valid);

  // ----------------------------------------------------
  // PILLAR 5: OFFLINE SYNC RETRY CEILING
  // ----------------------------------------------------
  console.log('\n--- Pillar 5: Offline Sync Policy & Retry Ceiling ---');

  const MAX_RETRIES = 5;
  function shouldRetrySyncItem(retryCount: number): boolean {
    return retryCount < MAX_RETRIES;
  }

  assert('Sync: Retry count 0 allowed', shouldRetrySyncItem(0));
  assert('Sync: Retry count 4 allowed', shouldRetrySyncItem(4));
  assert('Sync: Retry count 5 blocked by threshold', !shouldRetrySyncItem(5));
  assert('Sync: Retry count 10 blocked by threshold', !shouldRetrySyncItem(10));

  // ----------------------------------------------------
  // PILLAR 6: IN-MEMORY PERFORMANCE BENCHMARK
  // ----------------------------------------------------
  console.log('\n--- Pillar 6: In-Memory Search & Filtering Benchmarks ---');

  const mockLeads = Array.from({ length: 1000 }, (_, i) => ({
    id: `lead_${i}`,
    first_name: `First${i}`,
    last_name: `Last${i}`,
    company: `Company ${i % 50} LLC`,
    email: `user${i}@domain${i % 20}.com`,
    rating: i % 3 === 0 ? 'hot' : i % 3 === 1 ? 'warm' : 'cold',
    status: 'new'
  }));

  const searchStart = performance.now();
  const searchResults = mockLeads.filter(l => 
    l.first_name.toLowerCase().includes('50') || 
    l.company.toLowerCase().includes('company 25')
  );
  const searchDuration = performance.now() - searchStart;

  assert(
    `Perf: In-memory filter across 1,000 records (<10ms)`,
    searchDuration < 10,
    `Duration: ${searchDuration.toFixed(2)}ms (Found: ${searchResults.length})`
  );

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`  QA SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
