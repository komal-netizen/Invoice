import { createHmac } from 'crypto';

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  enabled: boolean;
  createdAt: string;
}

export type WebhookEvent =
  | 'invoice.created'
  | 'invoice.sent'
  | 'invoice.paid'
  | 'invoice.overdue'
  | 'invoice.updated'
  | 'invoice.deleted'
  | 'client.created'
  | 'client.updated'
  | 'project.created'
  | 'project.completed';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
}

/**
 * Send webhook to a configured endpoint with retry logic
 */
export async function sendWebhook(
  endpoint: WebhookEndpoint,
  payload: WebhookPayload,
  attempt = 1
): Promise<{ success: boolean; error?: string }> {
  if (!endpoint.enabled) {
    return { success: false, error: 'Endpoint disabled' };
  }

  if (!endpoint.events.includes(payload.event)) {
    return { success: true }; // Skip if event not subscribed
  }

  try {
    // Create signature
    const signature = createWebhookSignature(JSON.stringify(payload), endpoint.secret);

    // Send request
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': payload.event,
        'X-Webhook-Timestamp': payload.timestamp,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Retry logic (max 3 attempts with exponential backoff)
    if (attempt < 3) {
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      await new Promise((resolve) => setTimeout(resolve, delay));
      return sendWebhook(endpoint, payload, attempt + 1);
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Create HMAC signature for webhook payload
 */
export function createWebhookSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = createWebhookSignature(payload, secret);
  return signature === expected;
}

/**
 * Trigger webhooks for an event
 */
export async function triggerWebhooks(
  endpoints: WebhookEndpoint[],
  event: WebhookEvent,
  data: any
): Promise<void> {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const promises = endpoints
    .filter((e) => e.enabled && e.events.includes(event))
    .map((endpoint) => sendWebhook(endpoint, payload));

  // Fire and forget (don't wait for responses)
  Promise.allSettled(promises).then((results) => {
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Webhook ${endpoints[index].id} failed:`, result.reason);
      }
    });
  });
}

/**
 * Generate a secure webhook secret
 */
export function generateWebhookSecret(): string {
  // Generate a random 32-byte hex string
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Node.js environment
    const crypto = require('crypto');
    crypto.randomFillSync(array);
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
