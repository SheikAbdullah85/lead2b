import { WebhookEndpoint } from '../types';

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
