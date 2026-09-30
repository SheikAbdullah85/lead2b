import { WebhookEndpoint, Lead } from '../types';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  tenant_id: string;
  data: any;
}

export async function generateWebhookSignature(payloadString: string, secretKey: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(payloadString));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function dispatchWebhookEvent(
  endpoint: WebhookEndpoint,
  event: string,
  data: any
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    tenant_id: endpoint.tenant_id,
    data,
  };

  const payloadString = JSON.stringify(payload);
  const signature = await generateWebhookSignature(payloadString, endpoint.secret_key);

  try {
    const res = await fetch(endpoint.target_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Lead2b-Signature': signature,
        'X-Lead2b-Event': event,
        'User-Agent': 'lead2b-Webhook-Dispatcher/1.0',
      },
      body: payloadString,
      signal: AbortSignal.timeout(5000), // 5 sec timeout
    });

    return {
      success: res.ok,
      statusCode: res.status,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Webhook dispatch failed',
    };
  }
}

/**
 * Enterprise Hot Lead Alert Payload Formatter
 * Formats rich notifications for Slack, MS Teams, and Enterprise CRM Gateways
 */
export function formatHotLeadNotification(lead: Partial<Lead>) {
  const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Visitor';
  const company = lead.company || 'Enterprise Visitor';
  const title = lead.job_title ? `, ${lead.job_title}` : '';
  const email = lead.email || 'N/A';
  const phone = lead.mobile || 'N/A';
  const rep = lead.captured_by_name || 'Booth Rep';
  const solution = lead.product_interest || 'Enterprise Solution';
  const timeline = lead.purchase_timeline || 'Immediate';
  const notes = lead.requirement || 'High priority interest recorded at booth.';

  return {
    summary: `🔥 HOT LEAD ALERT: ${name} (${company}) captured at booth!`,
    lead_id: lead.id,
    contact: {
      name,
      title: lead.job_title,
      company,
      email,
      phone,
    },
    qualification: {
      tier: 'HOT',
      priority: lead.priority || 'high',
      solution,
      timeline,
      notes,
    },
    event_context: {
      event_name: 'GITEX Global 2026',
      booth: 'Stand H3-B24',
      captured_by: rep,
      timestamp: new Date().toISOString(),
    },
    // Slack / Teams Block Kit format
    slack_blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🔥 HOT B2B LEAD CAPTURED — GITEX GLOBAL' },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Prospect:*\n${name} (${company})` },
          { type: 'mrkdwn', text: `*Designation:*\n${lead.job_title || 'Executive'}` },
          { type: 'mrkdwn', text: `*Email:*\n${email}` },
          { type: 'mrkdwn', text: `*Mobile:*\n${phone}` },
          { type: 'mrkdwn', text: `*Product Interest:*\n${solution}` },
          { type: 'mrkdwn', text: `*Buying Timeline:*\n${timeline}` },
        ],
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Booth Conversation & Pain Points:*\n_${notes}_` },
      },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `Captured by *${rep}* • Auto-routed to CRM Pipeline` },
        ],
      },
    ],
  };
}

/**
 * Automatically dispatches hot lead alerts to all active configured webhooks
 */
export async function dispatchHotLeadAlert(lead: Partial<Lead>): Promise<void> {
  if (lead.rating !== 'hot' && lead.rating !== 'urgent') return;

  const payload = formatHotLeadNotification(lead);

  // In-memory or simulated webhook trigger for active tenant endpoints
  console.log(`[Webhook Dispatcher] ⚡ HOT LEAD ALERT dispatched for ${lead.first_name} ${lead.last_name} (${lead.company})`);

  if (typeof fetch !== 'undefined') {
    try {
      fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'hot_lead_alert',
          lead_id: lead.id,
          payload,
        }),
      }).catch((e) => {});
    } catch (e) {}
  }
}
