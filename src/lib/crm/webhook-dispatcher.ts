import crypto from 'crypto';
import { WebhookEndpoint } from '../types';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  tenant_id: string;
  data: any;
}

export function generateWebhookSignature(payloadString: string, secretKey: string): string {
  return crypto.createHmac('sha256', secretKey).update(payloadString).digest('hex');
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
  const signature = generateWebhookSignature(payloadString, endpoint.secret_key);

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
