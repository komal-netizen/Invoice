"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import type { Invoice, LineItem } from "@/lib/types";

function formatAddress(addr: string | undefined) {
  if (!addr) return "";
  return addr.trim();
}

function formatDateSafe(dateStr: string | undefined, fmt: string, fallback = "—") {
  if (!dateStr) return fallback;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return fallback;
  return format(d, fmt);
}

interface PublicData {
  invoice: Invoice;
  clientEmail: string;
  clientName?: string;
  businessName?: string | null;
  businessAddress?: string | null;
  businessEmail?: string | null;
  paymentLinkUrl?: string | null;
}

export default function ViewInvoicePage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<PublicData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!token) return;
    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    if (searchParams?.get("paid") === "1") setPaid(true);

    fetch(`/api/invoices/public/${encodeURIComponent(token)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Invoice not found");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 px-4 py-16 text-center">
        <p className="text-neutral-400">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-neutral-950 px-4 py-16 text-center">
        <p className="text-neutral-500">Loading invoice…</p>
      </div>
    );
  }

  const inv = data.invoice;
  const currency = inv.currency || "USD";

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div
          className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl"
          style={{ backgroundColor: inv.backgroundColor ?? undefined }}
        >
          <header className="flex flex-wrap items-start justify-between gap-6 border-b border-neutral-700 pb-6">
            <div>
              <h1 className="text-xl font-semibold text-white">
                {data.businessName || "Invoice"}
              </h1>
              {data.businessAddress && (
                <p className="mt-1 whitespace-pre-line text-sm text-neutral-400">
                  {formatAddress(data.businessAddress)}
                </p>
              )}
              {data.businessEmail && (
                <p className="text-sm text-neutral-400">{data.businessEmail}</p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-lg font-semibold text-white">INVOICE</h2>
              <p className="mt-1 text-sm text-neutral-400">No. {inv.invoiceNumber}</p>
              <p className="text-sm text-neutral-400">
                Issued: {formatDateSafe(inv.issueDate, "MMM d, yyyy")}
              </p>
              <p className="text-sm text-neutral-400">
                Due: {formatDateSafe(inv.dueDate, "MMM d, yyyy")}
              </p>
            </div>
          </header>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Bill To</p>
              <p className="mt-1 font-medium text-white">{data.clientName || "Client"}</p>
              <p className="text-sm text-neutral-400">{data.clientEmail}</p>
            </div>
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-neutral-700 text-left text-neutral-400">
                  <th className="pb-2 font-medium">Item</th>
                  <th className="pb-2 text-right font-medium">Price</th>
                  <th className="pb-2 text-right font-medium">Qty</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(inv.lineItems || []).map((li: LineItem) => (
                  <tr key={li.id} className="border-b border-neutral-700">
                    <td className="py-3">
                      <span className="font-medium text-white">{li.items || "—"}</span>
                      {li.itemDescription && (
                        <p className="text-xs text-neutral-500">{li.itemDescription}</p>
                      )}
                    </td>
                    <td className="py-3 text-right text-neutral-300">
                      {(li.price ?? 0).toLocaleString("en-US", { style: "currency", currency })}
                    </td>
                    <td className="py-3 text-right text-neutral-300">{li.quantity ?? 0}</td>
                    <td className="py-3 text-right font-medium text-white">
                      {((li.quantity ?? 0) * (li.price ?? 0)).toLocaleString("en-US", { style: "currency", currency })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal</span>
                <span>{(inv.subtotal ?? 0).toLocaleString("en-US", { style: "currency", currency })}</span>
              </div>
              {inv.applyTax && (
                <div className="flex justify-between text-neutral-400">
                  <span>{inv.taxName} ({inv.taxRate}%)</span>
                  <span>{(inv.taxAmount ?? 0).toLocaleString("en-US", { style: "currency", currency })}</span>
                </div>
              )}
              {(inv.discountType === "percent" || inv.discountType === "fixed") && (
                <div className="flex justify-between text-neutral-400">
                  <span>Discount</span>
                  <span>-{(inv.discountAmount ?? 0).toLocaleString("en-US", { style: "currency", currency })}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-neutral-700 pt-2 text-base font-semibold text-white">
                <span>Total</span>
                <span>{(inv.total ?? 0).toLocaleString("en-US", { style: "currency", currency })}</span>
              </div>
            </div>
          </div>

          {inv.paymentDetails && (
            <div className="mt-6 rounded-lg bg-neutral-800/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Payment details</p>
              <p className="mt-1 whitespace-pre-line text-sm text-neutral-300">{inv.paymentDetails}</p>
            </div>
          )}

          {inv.notes && (
            <p className="mt-6 border-t border-neutral-700 pt-6 text-sm text-neutral-500">{inv.notes}</p>
          )}

          {inv.termsAndConditions && (
            <div className="mt-6 border-t border-neutral-700 pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Terms and conditions</p>
              <p className="mt-1 whitespace-pre-line text-sm text-neutral-400">{inv.termsAndConditions}</p>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          {paid && (
            <p className="rounded-lg bg-green-900/40 px-4 py-2 text-sm font-medium text-green-300">
              Thank you — your payment was received.
            </p>
          )}
          {!paid && data.paymentLinkUrl && (
            <a
              href={data.paymentLinkUrl}
              className="rounded-lg bg-orange-500 px-6 py-3 text-sm font-medium text-white hover:bg-orange-400"
            >
              Pay with Stripe
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
