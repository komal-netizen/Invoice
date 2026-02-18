/**
 * In-memory store for public invoice snapshots and activities.
 * Used by API routes for send → view → paid flow. In production you’d use a DB.
 */
import type { Invoice, InvoiceActivity } from "./types";

export interface PublicInvoiceSnapshot {
  invoice: Invoice;
  clientEmail: string;
  clientName?: string;
  businessName?: string;
  businessAddress?: string;
  businessEmail?: string;
  paymentLinkUrl?: string;
  activities: InvoiceActivity[];
}

const store = new Map<string, PublicInvoiceSnapshot>();

export function setPublicInvoice(viewToken: string, data: Omit<PublicInvoiceSnapshot, "activities">) {
  const existing = store.get(viewToken);
  store.set(viewToken, {
    ...data,
    activities: existing?.activities ?? [],
  });
}

export function getPublicInvoice(viewToken: string): PublicInvoiceSnapshot | undefined {
  return store.get(viewToken);
}

export function appendActivity(viewToken: string, activity: InvoiceActivity) {
  const snap = store.get(viewToken);
  if (!snap) return;
  snap.activities.push(activity);
}

export function setPaymentLink(viewToken: string, paymentLinkUrl: string) {
  const snap = store.get(viewToken);
  if (snap) snap.paymentLinkUrl = paymentLinkUrl;
}
