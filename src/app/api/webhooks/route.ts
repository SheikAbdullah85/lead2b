import { NextRequest, NextResponse } from 'next/server';
import { WebhookEndpoint } from '@/lib/types';
import { dispatchWebhookEvent } from '@/lib/crm/webhook-dispatcher';

let webhooksStore: WebhookEndpoint[] = [
  {
    id: 'wh_001',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    event_name: 'lead.created',
    target_url: 'https://webhook.site/demo-lead2b-target',
    secret_key: 'whsec_demo_secret_key_gitex_2026',
    is_active: true,
    failure_count: 0,
    created_at: new Date().toISOString(),
  }
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenant_id');

  const list = tenantId ? webhooksStore.filter((w) => w.tenant_id === tenantId) : webhooksStore;
  return NextResponse.json({ webhooks: list });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === 'test_dispatch') {
      const webhook = webhooksStore.find((w) => w.id === body.webhook_id);
      if (!webhook) {
        return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
      }

      const testResult = await dispatchWebhookEvent(webhook, webhook.event_name, {
        test: true,
        message: 'This is a test webhook payload from lead2b',
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, result: testResult });
    }

    // Create new webhook
    const newWebhook: WebhookEndpoint = {
      id: `wh_${Date.now()}`,
      tenant_id: body.tenant_id || '11111111-1111-1111-1111-111111111111',
      event_name: body.event_name || 'lead.created',
      target_url: body.target_url,
      secret_key: body.secret_key || `whsec_${Math.random().toString(36).substring(2, 15)}`,
      is_active: true,
      failure_count: 0,
      created_at: new Date().toISOString(),
    };

    webhooksStore.push(newWebhook);
    return NextResponse.json({ success: true, webhook: newWebhook });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
