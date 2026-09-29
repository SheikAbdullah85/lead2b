import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * k6 Load & Concurrency Test: High-Throughput Lead Ingestion
 * 
 * Simulates 500 concurrent exhibition sales reps at peak trade show hours.
 * Validates:
 * - p95 Latency < 400ms
 * - p99 Latency < 800ms
 * - Error rate < 1%
 * - Idempotency key conflict tolerance
 */

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Warm-up to 50 virtual users
    { duration: '1m',  target: 250 },  // Ramp-up to 250 VUs
    { duration: '2m',  target: 500 },  // Sustained peak exhibition rush (500 VUs)
    { duration: '30s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<400', 'p(99)<800'],
    http_req_failed: ['rate<0.01'], // <1% errors permitted
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://app.dxb.llc';

export default function () {
  const vuId = __VU;
  const iterId = __ITER;
  const timestamp = Date.now();
  const idempotencyKey = `k6_idemp_${vuId}_${iterId}_${timestamp}`;

  const payload = JSON.stringify({
    id: `queue_${idempotencyKey}`,
    tenant_id: '11111111-1111-1111-1111-111111111111',
    user_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    idempotency_key: idempotencyKey,
    action: 'create_lead',
    payload: {
      tenant_id: '11111111-1111-1111-1111-111111111111',
      event_id: 'eeee1111-1111-1111-1111-111111111111',
      captured_by: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      first_name: `VU_${vuId}`,
      last_name: `Lead_${iterId}`,
      company: `Enterprise Corp ${vuId}`,
      email: `lead_${vuId}_${iterId}_${timestamp}@loadtest.example.com`,
      mobile: '+971 50 000 1111',
      rating: 'hot',
      status: 'new',
      purchase_timeline: '1-3 months',
    },
    status: 'pending',
    retry_count: 0,
    created_at: new Date().toISOString(),
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': idempotencyKey,
    },
    timeout: '5s',
  };

  // Primary API Sync Ingestion Call
  const res = http.post(`${BASE_URL}/api/sync`, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has valid response': (r) => r.body.includes('synced') || r.body.includes('lead'),
  });

  // Replay Attack / Idempotency Test (Send duplicate immediate call)
  if (Math.random() < 0.1) {
    const replayRes = http.post(`${BASE_URL}/api/sync`, payload, params);
    check(replayRes, {
      'idempotency replay returns 200 or already_processed': (r) =>
        r.status === 200 && (r.body.includes('already_processed') || r.body.includes('status')),
    });
  }

  sleep(Math.random() * 2 + 1); // Realistic 1-3s pause between visitor scans
}
