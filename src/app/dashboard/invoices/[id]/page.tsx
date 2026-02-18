"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Suspense } from "react";
import { useStore } from "@/lib/store";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import type { Invoice, LineItem, InvoiceStatus, InvoiceActivity, CustomBlock, CustomBlockType } from "@/lib/types";
import { INVOICE_STATUSES, INVOICE_TEMPLATES, TEMPLATE_LOGO_POSITION, SERVICE_PRICING_TO_UNIT, CUSTOM_BLOCK_TYPES } from "@/lib/types";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { InvoiceTemplate, Product } from "@/lib/types";
import { getDefaultBlankBlocks } from "@/lib/defaults";
import { format } from "date-fns";
import { CURRENCIES } from "@/lib/types";
import { Toggle } from "@/components/Toggle";

const UNIT_OPTIONS = ["hours", "pieces", "each", "days", "weeks", "months", "project"];

const CrossIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const DEFAULT_SECTION_ORDER = [
  "header",
  "billTo",
  "lineItems",
  "totals",
  "payment",
  "lateFees",
  "notes",
  "terms",
];

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  paid: "Paid",
  overdue: "Overdue",
  outstanding: "Outstanding",
  scheduled: "Scheduled",
};

const TEMPLATE_LABELS: Record<InvoiceTemplate, string> = {
  "modern-minimal": "Modern Minimal",
  "classic-professional": "Classic Professional",
  "creative-bold": "Creative Bold",
  "tech-startup": "Tech / Startup",
  elegant: "Elegant",
  corporate: "Corporate",
  landscape: "Landscape",
  blank: "Blank (build your own)",
};

function formatAddress(addr: { street?: string; city?: string; state?: string; zip?: string; country?: string } | undefined) {
  if (!addr) return "";
  const parts = [addr.street, [addr.city, addr.state, addr.zip].filter(Boolean).join(", "), addr.country].filter(Boolean);
  return parts.join("\n");
}

/** Safe date format: returns fallback if date string is invalid */
function formatDateSafe(dateStr: string | undefined, fmt: string, fallback = "—") {
  if (dateStr == null || dateStr === "") return fallback;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return fallback;
  return format(d, fmt);
}

function SendInvoiceModal({
  toEmail,
  clientName,
  invoice,
  businessName,
  businessAddress,
  businessEmail,
  defaultSubject,
  defaultBody,
  onClose,
  onSent,
}: {
  toEmail: string;
  clientName?: string;
  invoice: Invoice;
  businessName: string;
  businessAddress?: string;
  businessEmail?: string;
  defaultSubject: string;
  defaultBody: string;
  onClose: () => void;
  onSent: (viewToken: string, sentEmail: boolean) => void;
}) {
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ viewUrl: string; sentEmail: boolean } | null>(null);

  const handleSendFromPlatform = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/invoices/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice,
          clientEmail: toEmail,
          clientName: clientName || undefined,
          businessName: businessName || undefined,
          businessAddress: businessAddress || undefined,
          businessEmail: businessEmail || undefined,
          subject,
          body,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      onSent(data.viewToken, data.sentEmail ?? false);
      setResult({ viewUrl: data.viewUrl, sentEmail: data.sentEmail });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const handleOpenInEmailClient = () => {
    const viewUrl = result?.viewUrl ?? "";
    const mailto = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + (viewUrl ? "\n\nView invoice: " + viewUrl : ""))}`;
    window.open(mailto, "_blank", "noopener");
  };

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-md rounded-xl border border-neutral-700 bg-neutral-900 p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-white">Invoice link ready</h2>
          {result.sentEmail ? (
            <p className="mt-1 text-sm text-neutral-400">Sent to {toEmail}</p>
          ) : (
            <p className="mt-1 text-sm text-neutral-400">Copy the link below to send to your client.</p>
          )}
          <div className="mt-4 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={result.viewUrl}
              className="flex-1 rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(result.viewUrl); }}
              className="rounded-lg bg-neutral-700 px-3 py-2 text-sm text-white hover:bg-neutral-600"
            >
              Copy
            </button>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            {!result.sentEmail && (
              <button
                type="button"
                onClick={handleOpenInEmailClient}
                className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
              >
                Open in email client
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-neutral-700 bg-neutral-900 p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white">Send invoice</h2>
        <p className="mt-1 text-sm text-neutral-400">Send to {toEmail} from the platform (email + payment link).</p>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <div className="mt-4">
          <label className="block text-sm font-medium text-neutral-300">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500"
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-neutral-300">Message</label>
          <textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500"
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSendFromPlatform}
            disabled={sending}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InvoiceEditorContent() {
  const params = useParams();
  const id = params.id as string;
  const searchParams = useSearchParams();
  const invoice = useStore((s) => s.invoices.find((i) => i.id === id));
  const updateInvoice = useStore((s) => s.updateInvoice);
  const getClient = useStore((s) => s.getClient);
  const updateClient = useStore((s) => s.updateClient);
  const updateProject = useStore((s) => s.updateProject);
  const updateSettings = useStore((s) => s.updateSettings);
  const settings = useStore((s) => s.settings);
  const projects = useStore((s) => s.projects);
  const products = useStore((s) => s.products);

  const client = invoice ? getClient(invoice.clientId) : null;
  const project = invoice?.projectId ? projects.find((p) => p.id === invoice.projectId) : null;
  const business = settings.business;

  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [previewLinkCopied, setPreviewLinkCopied] = useState(false);
  const [rehydrateDone, setRehydrateDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [serviceSuggestLineId, setServiceSuggestLineId] = useState<string | null>(null);
  const [serviceSuggestValue, setServiceSuggestValue] = useState("");
  const [activities, setActivities] = useState<InvoiceActivity[]>([]);
  const [sidebarTab, setSidebarTab] = useState<"design" | "settings">("design");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [saveTemplateModalOpen, setSaveTemplateModalOpen] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState("");
  const isPreviewUrl = searchParams.get("preview") === "1";

  const BLOCK_TYPE_LABELS: Record<CustomBlockType, string> = {
    heading: "Heading",
    from: "From (your business)",
    billTo: "Bill to",
    shipTo: "Ship to",
    lineItems: "Line items",
    totals: "Totals",
    paymentTerms: "Payment terms",
    paymentDetails: "Payment details",
    notes: "Notes",
    terms: "Terms and conditions",
    customText: "Custom text",
    divider: "Divider",
  };

  useEffect(() => {
    if (!invoice?.viewToken) return;
    fetch(`/api/invoices/activities/${encodeURIComponent(invoice.viewToken)}`)
      .then((r) => (r.ok ? r.json() : { activities: [] }))
      .then((data) => setActivities(Array.isArray(data.activities) ? data.activities : []))
      .catch(() => setActivities([]));
  }, [invoice?.viewToken]);

  useEffect(() => {
    if (!invoice || (invoice.template ?? settings.template) !== "blank") return;
    const blocks = invoice.customBlocks ?? [];
    if (blocks.length === 0) {
      const defaultBlocks = getDefaultBlankBlocks().map((b) => ({ ...b, id: crypto.randomUUID() }));
      updateInvoice(invoice.id, { customBlocks: defaultBlocks });
    }
  }, [invoice?.id, invoice?.template, invoice?.customBlocks?.length, settings.template, updateInvoice]);

  useEffect(() => {
    if ((invoice?.template ?? settings.template) !== "blank" || !invoice?.customBlocks?.length) return;
    let cleanup: (() => void) | null = null;
    const t = setTimeout(() => {
      const els = document.querySelectorAll("[data-resizable-heading]");
      let throttle: ReturnType<typeof setTimeout> | null = null;
      const ro = new ResizeObserver((entries) => {
        if (throttle) clearTimeout(throttle);
        throttle = setTimeout(() => {
          entries.forEach((entry) => {
            const el = entry.target as HTMLElement;
            const blockId = el.getAttribute("data-block-id");
            if (!blockId) return;
            const w = el.offsetWidth;
            const h = el.offsetHeight;
            const blocks = invoice.customBlocks ?? [];
            const block = blocks.find((b) => b.id === blockId);
            if (!block || (Number(block.settings?.headingWidth) === w && Number(block.settings?.headingHeight) === h)) return;
            const next = blocks.map((b) =>
              b.id === blockId ? { ...b, settings: { ...b.settings, headingWidth: w, headingHeight: h } } : b
            );
            updateInvoice(invoice.id, { customBlocks: next });
          });
        }, 250);
      });
      els.forEach((el) => ro.observe(el));
      cleanup = () => {
        ro.disconnect();
        if (throttle) clearTimeout(throttle);
      };
    }, 100);
    return () => {
      clearTimeout(t);
      cleanup?.();
    };
  }, [invoice?.id, invoice?.template, invoice?.customBlocks?.length, settings.template, updateInvoice]);

  const serviceSuggestions: Product[] =
    serviceSuggestLineId && serviceSuggestValue.trim().length >= 1
      ? products.filter((p) => p.name.toLowerCase().includes(serviceSuggestValue.trim().toLowerCase())).slice(0, 8)
      : [];

  // Wait for client mount so store has rehydrated from localStorage (avoids hydration mismatch)
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setRehydrateDone(true), 600);
    return () => clearTimeout(t);
  }, []);

  // Open preview when URL has ?preview=1 (once we have invoice)
  useEffect(() => {
    if (isPreviewUrl && invoice) setPreviewOpen(true);
  }, [isPreviewUrl, invoice]);

  const previewUrl = typeof window !== "undefined" ? `${window.location.origin}/dashboard/invoices/${id}?preview=1` : "";

  const copyPreviewLink = () => {
    if (!previewUrl) return;
    navigator.clipboard.writeText(previewUrl);
    setPreviewLinkCopied(true);
    setTimeout(() => setPreviewLinkCopied(false), 2000);
  };

  // Same content on server and first client render to avoid hydration error
  if (!mounted) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-neutral-500 dark:text-neutral-400">Loading...</p>
      </div>
    );
  }

  if (!invoice && isPreviewUrl && !rehydrateDone) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-neutral-500 dark:text-neutral-400">Loading preview...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-neutral-500 dark:text-neutral-400">Invoice not found.</p>
        <Link href="/dashboard/invoices" className="mt-4 inline-block text-orange-600 hover:underline dark:text-orange-400">
          Back to Invoices
        </Link>
      </div>
    );
  }

  const sectionOrder = invoice.sectionOrder ?? DEFAULT_SECTION_ORDER;

  const recalc = (lineItems: LineItem[], taxRate: number, discountType: "none" | "percent" | "fixed", discountValue: number) => {
    const subtotal = lineItems.reduce((s, li) => s + (li.quantity * li.price), 0);
    const taxAmount = subtotal * (taxRate / 100);
    let discountAmount = 0;
    if (discountType === "percent") discountAmount = subtotal * (discountValue / 100);
    else if (discountType === "fixed") discountAmount = discountValue;
    const total = Math.max(0, subtotal + taxAmount - discountAmount);
    return { subtotal, taxAmount, discountAmount, total };
  };

  const { subtotal, taxAmount, discountAmount, total } = recalc(
    invoice.lineItems,
    invoice.applyTax ? invoice.taxRate : 0,
    invoice.discountType,
    invoice.discountValue
  );

  const syncTotals = () => {
    const items = invoice.lineItems.map((li) => ({ ...li, total: li.quantity * li.price }));
    const r = recalc(items, invoice.applyTax ? invoice.taxRate : 0, invoice.discountType, invoice.discountValue);
    updateInvoice(id, {
      lineItems: items,
      subtotal: r.subtotal,
      taxAmount: r.taxAmount,
      discountAmount: r.discountAmount,
      total: r.total,
    });
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      items: "",
      itemDescription: "",
      quantity: 1,
      unit: "each",
      price: 0,
      total: 0,
    };
    updateInvoice(id, { lineItems: [...invoice.lineItems, newItem] });
  };

  const updateLineItem = (itemId: string, updates: Partial<LineItem>) => {
    const next = invoice.lineItems.map((li) =>
      li.id === itemId ? { ...li, ...updates, total: (updates.quantity ?? li.quantity) * (updates.price ?? li.price) } : li
    );
    const r = recalc(
      next,
      invoice.applyTax ? invoice.taxRate : 0,
      invoice.discountType,
      invoice.discountValue
    );
    updateInvoice(id, {
      lineItems: next,
      subtotal: r.subtotal,
      taxAmount: r.taxAmount,
      discountAmount: r.discountAmount,
      total: r.total,
    });
  };

  const removeLineItem = (itemId: string) => {
    const next = invoice.lineItems.filter((li) => li.id !== itemId);
    const r = recalc(next, invoice.applyTax ? invoice.taxRate : 0, invoice.discountType, invoice.discountValue);
    updateInvoice(id, {
      lineItems: next,
      subtotal: r.subtotal,
      taxAmount: r.taxAmount,
      discountAmount: r.discountAmount,
      total: r.total,
    });
  };

  const handleDownloadPDF = () => {
    setPreviewOpen(true);
    setTimeout(() => {
      window.print();
      setPreviewOpen(false);
    }, 300);
  };

  const headingSize = invoice.headingFontSize ?? 24;
  const logoUrl = invoice.logoUrl ?? business.logoUrl;
  const canvasStyle: React.CSSProperties = {
    backgroundColor: invoice.backgroundColor ?? undefined,
    backgroundImage: invoice.backgroundImageUrl ? `url(${invoice.backgroundImageUrl})` : undefined,
    backgroundSize: invoice.backgroundImageUrl ? "cover" : undefined,
  };

  const effectiveTemplate: InvoiceTemplate = invoice.template ?? settings.template;
  const logoPosition = TEMPLATE_LOGO_POSITION[effectiveTemplate] ?? "left";

  const textInputClass = "w-full min-w-0 bg-transparent border-0 outline-none p-0 text-inherit focus:ring-0 placeholder:text-neutral-500 dark:placeholder:text-neutral-500";
  /** Line-item inputs: visible focus and caret so field is clearly editable */
  const businessBlock = (
    <div>
      {previewOpen ? (
        <h1 style={{ fontSize: headingSize }} className="font-semibold text-neutral-900 dark:text-white">
          {business.name || "Your Company"}
        </h1>
      ) : (
        <input
          key="business-name"
          type="text"
          defaultValue={business.name || ""}
          onBlur={(e) => updateSettings({ business: { ...business, name: e.target.value } })}
          placeholder="Your Company"
          className={`font-semibold text-neutral-900 dark:text-white ${textInputClass}`}
          style={{ fontSize: headingSize }}
        />
      )}
      {previewOpen ? (
        business.address && (business.address.street || business.address.city) ? (
          <p className="mt-1 whitespace-pre-line text-sm text-neutral-500 dark:text-neutral-400">
            {formatAddress(business.address)}
          </p>
        ) : null
      ) : (
        <textarea
          key="business-address"
          defaultValue={formatAddress(business.address)}
          onBlur={(e) => {
            const lines = e.target.value.split("\n");
            updateSettings({
              business: {
                ...business,
                address: {
                  ...business.address,
                  street: lines[0] ?? "",
                  city: lines[1] ?? "",
                  state: "",
                  zip: "",
                  country: lines[2] ?? "",
                },
              },
            });
          }}
          rows={2}
          placeholder="Address"
          className={`mt-1 block w-full resize-none text-sm text-neutral-500 dark:text-neutral-400 ${textInputClass}`}
        />
      )}
      {previewOpen ? (
        business.email ? <p className="text-sm text-neutral-500 dark:text-neutral-400">{business.email}</p> : null
      ) : (
        <input
          key="business-email"
          type="text"
          defaultValue={business.email || ""}
          onBlur={(e) => updateSettings({ business: { ...business, email: e.target.value } })}
          placeholder="Email"
          className={`block text-sm text-neutral-500 dark:text-neutral-400 ${textInputClass}`}
        />
      )}
      {previewOpen ? (
        business.phone ? <p className="text-sm text-neutral-500 dark:text-neutral-400">{business.phone}</p> : null
      ) : (
        <input
          key="business-phone"
          type="text"
          defaultValue={business.phone || ""}
          onBlur={(e) => updateSettings({ business: { ...business, phone: e.target.value } })}
          placeholder="Phone"
          className={`block text-sm text-neutral-500 dark:text-neutral-400 ${textInputClass}`}
        />
      )}
      {invoice.displayTaxId && (
        previewOpen ? (
          business.taxId ? <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Tax ID: {business.taxId}</p> : null
        ) : (
          <input
            key="business-taxid"
            type="text"
            defaultValue={business.taxId || ""}
            onBlur={(e) => updateSettings({ business: { ...business, taxId: e.target.value } })}
            placeholder="Tax ID"
            className={`mt-1 block text-sm text-neutral-500 dark:text-neutral-400 ${textInputClass}`}
          />
        )
      )}
    </div>
  );

  const headingAlign = invoice.headingAlignment ?? "right";
  const headingColorStyle = invoice.headingColor ? { color: invoice.headingColor } : {};
  const headingBgStyle = invoice.headingBackgroundColor ? { backgroundColor: invoice.headingBackgroundColor } : {};
  const invoiceTitleBlock = (
    <div className={headingAlign === "center" ? "text-center" : headingAlign === "left" ? "text-left" : "text-right"}>
      <h2
        style={{
          fontSize: Math.round(headingSize * 1.1),
          ...headingColorStyle,
          ...headingBgStyle,
          ...(invoice.headingBackgroundColor ? { padding: "0.25rem 0.5rem" } : {}),
        }}
        className={`font-semibold ${!invoice.headingColor ? "text-neutral-900 dark:text-white" : ""}`}
      >
        INVOICE
      </h2>
      {invoice.showReferenceNumber && (
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Ref:{" "}
          {previewOpen ? (
            invoice.referenceNumber || ""
          ) : (
            <input
              key={`ref-${id}`}
              type="text"
              defaultValue={invoice.referenceNumber ?? ""}
              onBlur={(e) => updateInvoice(id, { referenceNumber: e.target.value })}
              placeholder="Ref number"
              className={`inline-block min-w-[80px] text-neutral-500 dark:text-neutral-400 ${textInputClass}`}
            />
          )}
        </p>
      )}
    </div>
  );

  const logoBlock = invoice.showLogo
    ? logoUrl
      ? (
          <img src={logoUrl} alt="" className="h-12 w-auto object-contain" />
        )
      : (
          <div className="flex h-12 min-w-[120px] items-center justify-center rounded border border-dashed border-neutral-600 bg-neutral-800/50 px-3 text-center text-xs text-neutral-500 dark:border-neutral-500 dark:text-neutral-400">
            Add logo in User profile → Business
          </div>
        )
    : null;

  const wrapSection = (sectionId: string, _label: string, content: React.ReactNode) => (
    <div key={sectionId} className="mt-4 first:mt-0">{content}</div>
  );

  const sections: Record<string, React.ReactNode> = {
    header: (
      <>
        {logoPosition === "left" && (
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              {logoBlock}
              {businessBlock}
            </div>
            {invoiceTitleBlock}
          </div>
        )}
        {logoPosition === "right" && (
          <div className="flex flex-wrap items-start justify-between gap-6">
            {businessBlock}
            <div className="flex flex-col items-end gap-2">
              {logoBlock}
              {invoiceTitleBlock}
            </div>
          </div>
        )}
        {logoPosition === "topCenter" && (
          <div>
            <div className="flex justify-center mb-4">
              {logoBlock}
            </div>
            <div className="flex flex-wrap items-start justify-between gap-6">
              {businessBlock}
              {invoiceTitleBlock}
            </div>
          </div>
        )}
      </>
    ),
    billTo: (
      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Bill To</p>
          {!client ? (
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">No client</p>
          ) : previewOpen ? (
            <>
              <p className="mt-1 font-medium text-neutral-900 dark:text-white">{client.companyName}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{client.contactName}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{client.email}</p>
              {client.address && (client.address.street || client.address.city) && (
                <p className="mt-1 whitespace-pre-line text-sm text-neutral-500 dark:text-neutral-400">
                  {formatAddress(client.address)}
                </p>
              )}
              {invoice.displayTaxId && client.taxId && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Tax ID: {client.taxId}</p>
              )}
            </>
          ) : (
            <>
              <input
                key={`client-company-${client.id}`}
                type="text"
                defaultValue={client.companyName || ""}
                onBlur={(e) => updateClient(client.id, { companyName: e.target.value })}
                placeholder="Company name"
                className={`mt-1 block font-medium text-neutral-900 dark:text-white ${textInputClass}`}
              />
              <input
                key={`client-contact-${client.id}`}
                type="text"
                defaultValue={client.contactName || ""}
                onBlur={(e) => updateClient(client.id, { contactName: e.target.value })}
                placeholder="Contact name"
                className={`block text-sm text-neutral-500 dark:text-neutral-400 ${textInputClass}`}
              />
              <input
                key={`client-email-${client.id}`}
                type="text"
                defaultValue={client.email || ""}
                onBlur={(e) => updateClient(client.id, { email: e.target.value })}
                placeholder="Email"
                className={`block text-sm text-neutral-500 dark:text-neutral-400 ${textInputClass}`}
              />
              <textarea
                key={`client-address-${client.id}`}
                defaultValue={formatAddress(client.address)}
                onBlur={(e) => {
                  const lines = e.target.value.split("\n");
                  updateClient(client.id, {
                    address: {
                      ...client.address,
                      street: lines[0] ?? "",
                      city: lines[1] ?? "",
                      state: "",
                      zip: "",
                      country: lines[2] ?? "",
                    },
                  });
                }}
                rows={2}
                placeholder="Address"
                className={`mt-1 block w-full resize-none text-sm text-neutral-500 dark:text-neutral-400 ${textInputClass}`}
              />
              {invoice.displayTaxId && (
                <input
                  key={`client-taxid-${client.id}`}
                  type="text"
                  defaultValue={client.taxId || ""}
                  onBlur={(e) => updateClient(client.id, { taxId: e.target.value })}
                  placeholder="Tax ID"
                  className={`block text-sm text-neutral-500 dark:text-neutral-400 ${textInputClass}`}
                />
              )}
            </>
          )}
        </div>
        <div className="text-right">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Invoice #:</span>{" "}
          {previewOpen ? (
            <span className="text-sm text-neutral-900 dark:text-white">{invoice.invoiceNumber}</span>
          ) : (
            <input
              key={`inv-num-${id}`}
              type="text"
              defaultValue={invoice.invoiceNumber}
              onBlur={(e) => updateInvoice(id, { invoiceNumber: e.target.value })}
              className={`inline-block text-right text-sm text-neutral-900 dark:text-white ${textInputClass}`}
            />
          )}
          {previewOpen ? (
            <>
              <p className="text-sm text-neutral-900 dark:text-white"><span className="text-neutral-500 dark:text-neutral-400">Issued:</span> {formatDateSafe(invoice.issueDate, "MMM d, yyyy")}</p>
              <p className="text-sm text-neutral-900 dark:text-white"><span className="text-neutral-500 dark:text-neutral-400">Due:</span> {formatDateSafe(invoice.dueDate, "MMM d, yyyy")}</p>
            </>
          ) : (
            <>
              <div className="text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Issued:</span>{" "}
                <input
                  type="date"
                  value={invoice.issueDate}
                  onChange={(e) => updateInvoice(id, { issueDate: e.target.value })}
                  className={`invoice-date-input inline-block text-neutral-200 dark:text-neutral-300 ${textInputClass}`}
                />
              </div>
              <div className="mt-1 text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Due:</span>{" "}
                <input
                  type="date"
                  value={invoice.dueDate}
                  onChange={(e) => updateInvoice(id, { dueDate: e.target.value })}
                  className={`invoice-date-input inline-block text-neutral-200 dark:text-neutral-300 ${textInputClass}`}
                />
              </div>
            </>
          )}
        </div>
      </div>
    ),
    lineItems: (
      <>
        {project && (
          <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
            <span className="font-medium text-neutral-900 dark:text-white">Project:</span>{" "}
            {previewOpen ? (
              project.name
            ) : (
              <input
                key={`project-${project.id}`}
                type="text"
                defaultValue={project.name}
                onBlur={(e) => updateProject(project.id, { name: e.target.value })}
                placeholder="Project name"
                className={`inline-block min-w-[120px] text-neutral-900 dark:text-white ${textInputClass}`}
              />
            )}
          </p>
        )}
        <div className="overflow-x-auto">
          {/* Header row */}
          <div className="grid grid-cols-[minmax(280px,2fr)_80px_80px_90px_40px] gap-2 border-b-2 border-neutral-200 dark:border-neutral-700 pb-2 mb-2 text-sm">
            <div className="font-medium text-neutral-700 dark:text-neutral-300">Item name</div>
            <div className="font-medium text-neutral-700 dark:text-neutral-300 text-right">Price</div>
            <div className="font-medium text-neutral-700 dark:text-neutral-300 text-right">Qty</div>
            <div className="font-medium text-neutral-700 dark:text-neutral-300 text-right">Amount</div>
            {!previewOpen && <div />}
          </div>
          {/* Line item rows: item name + description, price, qty, amount */}
          {invoice.lineItems.map((li) => (
            <div
              key={li.id}
              className="grid grid-cols-[minmax(280px,2fr)_80px_80px_90px_40px] gap-2 border-b border-neutral-200 dark:border-neutral-700 py-3 items-start text-sm"
            >
              <div className="min-w-0 flex flex-col gap-1 relative">
                {previewOpen ? (
                  <>
                    <span className="text-neutral-900 dark:text-white font-medium">{li.items || "—"}</span>
                    {li.itemDescription && <span className="text-xs text-neutral-500 dark:text-neutral-400">{li.itemDescription}</span>}
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={serviceSuggestLineId === li.id ? serviceSuggestValue : li.items}
                      onChange={(e) => {
                        setServiceSuggestLineId(li.id);
                        setServiceSuggestValue(e.target.value);
                      }}
                      onFocus={() => {
                        setServiceSuggestLineId(li.id);
                        setServiceSuggestValue(li.items);
                      }}
                      onBlur={() => {
                        const val = serviceSuggestLineId === li.id ? serviceSuggestValue : li.items;
                        updateLineItem(li.id, { items: val });
                        setServiceSuggestLineId(null);
                      }}
                      placeholder="Item name (type for service suggestions)"
                      className="w-full bg-transparent border-0 outline-none p-0 py-1 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:ring-0 focus:outline-none"
                      aria-label="Item name"
                    />
                    {serviceSuggestLineId === li.id && serviceSuggestions.length > 0 && (
                      <div className="absolute left-0 top-full z-50 mt-0.5 max-h-48 w-full min-w-[200px] overflow-auto rounded-lg border border-neutral-600 bg-neutral-900 py-1 shadow-xl">
                        {serviceSuggestions.map((svc) => (
                          <button
                            key={svc.id}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm text-white hover:bg-neutral-700"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              const unit = SERVICE_PRICING_TO_UNIT[svc.pricingType ?? "per hour"];
                              updateLineItem(li.id, {
                                items: svc.name,
                                itemDescription: svc.description ?? undefined,
                                unit,
                                price: svc.defaultPrice ?? 0,
                              });
                              setServiceSuggestValue(svc.name);
                              setServiceSuggestLineId(null);
                            }}
                          >
                            <span className="font-medium">{svc.name}</span>
                            <span className="ml-2 text-neutral-400">
                              {svc.defaultPrice.toLocaleString("en-US", { style: "currency", currency: invoice.currency })}
                              {svc.pricingType ? ` · ${svc.pricingType}` : ""}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    <input
                      type="text"
                      defaultValue={li.itemDescription ?? ""}
                      onBlur={(e) => updateLineItem(li.id, { itemDescription: e.target.value || undefined })}
                      placeholder="Item description"
                      className="w-full bg-transparent border-0 outline-none p-0 py-0.5 text-xs text-neutral-600 dark:text-neutral-400 placeholder:text-neutral-500 focus:ring-0 focus:outline-none"
                      aria-label="Item description"
                    />
                  </>
                )}
              </div>
              <div className="text-right">
                {previewOpen ? (
                  <span className="text-neutral-900 dark:text-white">{li.price.toLocaleString("en-US", { style: "currency", currency: invoice.currency })}</span>
                ) : (
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    defaultValue={li.price}
                    onBlur={(e) => updateLineItem(li.id, { price: Number(e.target.value) || 0 })}
                    className="w-full bg-transparent border-0 outline-none p-0 py-1 text-sm text-right text-neutral-900 dark:text-white focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    aria-label="Price"
                  />
                )}
              </div>
              <div className="text-right">
                {previewOpen ? (
                  <span className="text-neutral-900 dark:text-white">{li.quantity}</span>
                ) : (
                  <input
                    type="number"
                    min={0}
                    defaultValue={li.quantity}
                    onBlur={(e) => updateLineItem(li.id, { quantity: Number(e.target.value) || 0 })}
                    className="w-full bg-transparent border-0 outline-none p-0 py-1 text-sm text-right text-neutral-900 dark:text-white focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    aria-label="Qty"
                  />
                )}
              </div>
              <div className="text-right font-medium text-neutral-900 dark:text-white">
                {(li.quantity * li.price).toLocaleString("en-US", { style: "currency", currency: invoice.currency })}
              </div>
              {!previewOpen && (
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeLineItem(li.id)}
                    className="rounded p-1 text-red-600 hover:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/10"
                    aria-label="Remove line"
                  >
                    <CrossIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {!previewOpen && (
            <button
              type="button"
              onClick={addLineItem}
              className="mt-3 w-full rounded-lg border-2 border-dashed border-neutral-400 dark:border-neutral-600 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:border-orange-500 hover:text-orange-500 dark:hover:border-orange-400 dark:hover:text-orange-400 transition-colors"
            >
              + Add item
            </button>
          )}
        </div>
      </>
    ),
    totals: (
      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500 dark:text-neutral-400">Subtotal</span>
            <span className="text-neutral-900 dark:text-white">{subtotal.toLocaleString("en-US", { style: "currency", currency: invoice.currency })}</span>
          </div>
          {invoice.applyTax && (
            <div className="flex justify-between items-center gap-2">
              {previewOpen ? (
                <span className="text-neutral-500 dark:text-neutral-400">{invoice.taxName} ({invoice.taxRate}%)</span>
              ) : (
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <input
                    key={`taxname-${id}`}
                    type="text"
                    defaultValue={invoice.taxName ?? ""}
                    onBlur={(e) => updateInvoice(id, { taxName: e.target.value })}
                    placeholder="Tax name"
                    className={`flex-1 min-w-0 text-neutral-500 dark:text-neutral-400 ${textInputClass}`}
                  />
                  <span className="text-neutral-500 dark:text-neutral-400 shrink-0">({invoice.taxRate}%)</span>
                </div>
              )}
              <span className="text-neutral-900 dark:text-white shrink-0">{taxAmount.toLocaleString("en-US", { style: "currency", currency: invoice.currency })}</span>
            </div>
          )}
          {(invoice.discountType === "percent" || invoice.discountType === "fixed") && (
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Discount</span>
              <span className="text-neutral-900 dark:text-white">-{discountAmount.toLocaleString("en-US", { style: "currency", currency: invoice.currency })}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold dark:border-neutral-700">
            <span className="text-neutral-900 dark:text-white">Total</span>
            <span className="text-neutral-900 dark:text-white">{total.toLocaleString("en-US", { style: "currency", currency: invoice.currency })}</span>
          </div>
        </div>
      </div>
    ),
    payment: invoice.paymentMethods.length > 0 || !previewOpen ? (
      <div className="rounded-lg bg-neutral-100 p-4 dark:bg-neutral-800">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Payment details</p>
        {previewOpen ? (
          <>
            {invoice.paymentMethods.length > 0 && <p className="mt-1 text-sm text-neutral-900 dark:text-white">{invoice.paymentMethods.join(", ")}</p>}
            {invoice.paymentMethods.some((n) => n === "Bank Transfer") && (settings.bankAccounts ?? []).length > 0 && (
              <div className="mt-2 space-y-2">
                {(settings.bankAccounts ?? []).map((acc) => (
                  <div key={acc.id} className="rounded bg-neutral-200/50 dark:bg-neutral-700/50 p-2 text-sm text-neutral-900 dark:text-white">
                    {acc.accountName && <p className="font-medium">{acc.accountName}</p>}
                    {acc.bankName && <p>{acc.bankName}</p>}
                    {acc.accountNumber && <p>Account: {acc.accountNumber}</p>}
                    {(acc.sortCode || acc.routingNumber) && <p>{acc.sortCode ? `Sort code: ${acc.sortCode}` : `Routing: ${acc.routingNumber}`}</p>}
                    {acc.iban && <p>IBAN: {acc.iban}</p>}
                    {acc.swift && <p>SWIFT: {acc.swift}</p>}
                    {acc.otherDetails && <p className="whitespace-pre-line text-neutral-600 dark:text-neutral-300">{acc.otherDetails}</p>}
                  </div>
                ))}
              </div>
            )}
            {["PayPal", "Wise", "Other"].map((name) => {
              const pm = (settings.paymentMethods ?? []).find((p) => p.name === name && invoice.paymentMethods.includes(name));
              if (!pm?.details) return null;
              return <p key={name} className="mt-1 text-sm text-neutral-900 dark:text-white"><span className="font-medium">{name}:</span> {pm.details}</p>;
            })}
            {invoice.paymentDetails && <p className="mt-2 whitespace-pre-line text-sm text-neutral-900 dark:text-white">{invoice.paymentDetails}</p>}
          </>
        ) : (
          <>
            {invoice.paymentMethods.length > 0 && <p className="mt-1 text-sm text-neutral-900 dark:text-white">{invoice.paymentMethods.join(", ")}</p>}
            {invoice.paymentMethods.some((n) => n === "Bank Transfer") && (settings.bankAccounts ?? []).length > 0 && (
              <div className="mt-2 space-y-2">
                {(settings.bankAccounts ?? []).map((acc) => (
                  <div key={acc.id} className="rounded bg-neutral-200/50 dark:bg-neutral-700/50 p-2 text-sm text-neutral-900 dark:text-white">
                    {acc.accountName && <p className="font-medium">{acc.accountName}</p>}
                    {acc.bankName && <p>{acc.bankName}</p>}
                    {acc.accountNumber && <p>Account: {acc.accountNumber}</p>}
                    {(acc.sortCode || acc.routingNumber) && <p>{acc.sortCode ? `Sort code: ${acc.sortCode}` : `Routing: ${acc.routingNumber}`}</p>}
                    {acc.iban && <p>IBAN: {acc.iban}</p>}
                    {acc.swift && <p>SWIFT: {acc.swift}</p>}
                    {acc.otherDetails && <p className="whitespace-pre-line text-neutral-600 dark:text-neutral-300">{acc.otherDetails}</p>}
                  </div>
                ))}
              </div>
            )}
            {["PayPal", "Wise", "Other"].map((name) => {
              const pm = (settings.paymentMethods ?? []).find((p) => p.name === name && invoice.paymentMethods.includes(name));
              if (!pm?.details) return null;
              return <p key={name} className="mt-1 text-sm text-neutral-900 dark:text-white"><span className="font-medium">{name}:</span> {pm.details}</p>;
            })}
            <textarea
              key={`payment-${id}`}
              defaultValue={invoice.paymentDetails ?? ""}
              onBlur={(e) => updateInvoice(id, { paymentDetails: e.target.value })}
              placeholder="Additional payment instructions (optional)"
              rows={3}
              className={`mt-2 w-full resize-none text-sm text-neutral-900 dark:text-white ${textInputClass}`}
            />
          </>
        )}
      </div>
    ) : null,
    lateFees: invoice.lateFeeEnabled || !previewOpen ? (
      <div className="text-sm text-neutral-500 dark:text-neutral-400">
        <p className="font-medium text-neutral-900 dark:text-white">Late fees</p>
        {previewOpen ? (
          invoice.lateFeePolicy ? <p className="mt-1">{invoice.lateFeePolicy}</p> : null
        ) : (
          <textarea
            key={`latefee-${id}`}
            defaultValue={invoice.lateFeePolicy ?? ""}
            onBlur={(e) => updateInvoice(id, { lateFeePolicy: e.target.value })}
            placeholder="Late fee policy (e.g. 1.5% per month)"
            rows={2}
            className={`mt-1 w-full resize-none text-neutral-900 dark:text-white ${textInputClass}`}
          />
        )}
      </div>
    ) : null,
    notes: (
      <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700">
        {previewOpen ? (
          invoice.notes ? <p className="text-sm text-neutral-500 dark:text-neutral-400">{invoice.notes}</p> : null
        ) : (
          <textarea
            key={`notes-${id}`}
            defaultValue={invoice.notes ?? ""}
            onBlur={(e) => updateInvoice(id, { notes: e.target.value })}
            placeholder="Notes (optional)"
            rows={3}
            className={`w-full resize-none text-sm text-neutral-500 dark:text-neutral-400 ${textInputClass}`}
          />
        )}
      </div>
    ),
    terms: (invoice.termsAndConditions != null && invoice.termsAndConditions !== "") || !previewOpen ? (
      <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Terms and conditions</p>
        {previewOpen ? (
          invoice.termsAndConditions ? <p className="mt-1 whitespace-pre-line text-sm text-neutral-600 dark:text-neutral-300">{invoice.termsAndConditions}</p> : null
        ) : (
          <textarea
            key={`terms-${id}`}
            defaultValue={invoice.termsAndConditions ?? ""}
            onBlur={(e) => updateInvoice(id, { termsAndConditions: e.target.value || undefined })}
            placeholder="Default from Settings → Terms and conditions"
            rows={5}
            className={`mt-1 w-full resize-none text-sm text-neutral-600 dark:text-neutral-300 ${textInputClass}`}
          />
        )}
      </div>
    ) : null,
  };

  const sortedBlankBlocks = (invoice.customBlocks ?? []).slice().sort((a, b) => a.order - b.order);

  const renderBlankBlock = (block: CustomBlock) => {
    const blockHeadingSize = Number(block.settings?.headingFontSize) || 28;
    const headingText = (block.settings?.headingText as string) || "INVOICE";
    const headingColor = (block.settings?.headingColor as string) || "#ffffff";
    const headingBg = (block.settings?.headingBackgroundColor as string) || "";
    const headingPosition = (block.settings?.headingPosition as string) || "left";
    const headingNoPadding = Boolean(block.settings?.headingNoPadding);
    const headingWidth = block.settings?.headingWidth as number | undefined;
    const headingHeight = block.settings?.headingHeight as number | undefined;
    const customContent = (block.settings?.content as string) ?? "";
    switch (block.type) {
      case "heading": {
        const justifyMap = { left: "justify-start", center: "justify-center", right: "justify-end" } as const;
        const paddingClass = headingNoPadding ? "p-0" : "px-4 py-2";
        return (
          <div
            key={block.id}
            className={`flex flex-wrap items-start gap-4 border-b border-neutral-700 pb-4 ${paddingClass} ${justifyMap[headingPosition as keyof typeof justifyMap] ?? "justify-start"}`}
          >
            <div
              className="relative overflow-hidden rounded min-w-[120px] min-h-[40px]"
              data-resizable-heading
              data-block-id={block.id}
              style={{
                width: headingWidth ? `${headingWidth}px` : "auto",
                height: headingHeight ? `${headingHeight}px` : "auto",
                maxWidth: "100%",
                ...(previewOpen ? {} : { resize: "both" as const }),
                color: headingColor,
                backgroundColor: headingBg || undefined,
              }}
            >
              <div className="p-2 h-full flex items-center">
                <h1 style={{ fontSize: blockHeadingSize }} className="font-semibold w-full">
                  {previewOpen ? headingText : (
                    <input
                      defaultValue={headingText}
                      onBlur={(e) => {
                        const next = (invoice.customBlocks ?? []).map((b) => b.id === block.id ? { ...b, settings: { ...b.settings, headingText: e.target.value } } : b);
                        updateInvoice(id, { customBlocks: next });
                      }}
                      className={`font-semibold w-full bg-transparent border-0 outline-none ${textInputClass}`}
                      style={{ fontSize: blockHeadingSize, color: headingColor }}
                    />
                  )}
                </h1>
              </div>
            </div>
            <div className={`text-sm text-neutral-500 dark:text-neutral-400 ${headingPosition === "right" ? "order-first" : "text-right"}`}>
              <p>Invoice # {invoice.invoiceNumber}</p>
              <p>Issued: {formatDateSafe(invoice.issueDate, "MMM d, yyyy")}</p>
              <p>Due: {formatDateSafe(invoice.dueDate, "MMM d, yyyy")}</p>
            </div>
          </div>
        );
      }
      case "from":
        return <div key={block.id} className="mt-4">{businessBlock}</div>;
      case "billTo":
        return <div key={block.id} className="mt-4">{sections.billTo}</div>;
      case "shipTo":
        return (
          <div key={block.id} className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Ship To</p>
            {client ? (
              <p className="mt-1 text-sm text-neutral-900 dark:text-white">{formatAddress(client.address)}</p>
            ) : <p className="mt-1 text-sm text-neutral-500">No client</p>}
          </div>
        );
      case "lineItems":
        return <div key={block.id} className="mt-4">{sections.lineItems}</div>;
      case "totals":
        return <div key={block.id} className="mt-4">{sections.totals}</div>;
      case "paymentDetails":
        return (
          <div key={block.id} className="mt-4">
            {sections.payment ?? (
              <div className="rounded-lg bg-neutral-100 p-4 dark:bg-neutral-800">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Payment details</p>
                {invoice.paymentMethods?.length > 0 && <p className="mt-1 text-sm text-neutral-900 dark:text-white">{invoice.paymentMethods.join(", ")}</p>}
                {invoice.paymentDetails && <p className="mt-2 whitespace-pre-line text-sm text-neutral-900 dark:text-white">{invoice.paymentDetails}</p>}
              </div>
            )}
          </div>
        );
      case "paymentTerms":
        return (
          <div key={block.id} className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Payment terms</p>
            {previewOpen ? (
              <p className="mt-1 text-sm text-neutral-900 dark:text-white">{customContent || "—"}</p>
            ) : (
              <textarea
                defaultValue={customContent}
                onBlur={(e) => {
                  const next = (invoice.customBlocks ?? []).map((b) => b.id === block.id ? { ...b, settings: { ...b.settings, content: e.target.value } } : b);
                  updateInvoice(id, { customBlocks: next });
                }}
                rows={2}
                className={`mt-1 w-full text-sm text-neutral-900 dark:text-white ${textInputClass}`}
                placeholder="e.g. Payment is due within 30 days."
              />
            )}
          </div>
        );
      case "notes":
        return <div key={block.id} className="mt-4">{sections.notes}</div>;
      case "terms":
        return (
          <div key={block.id} className="mt-4 pt-4 border-t border-neutral-700">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Terms and conditions</p>
            {previewOpen ? (
              invoice.termsAndConditions ? <p className="mt-1 whitespace-pre-line text-sm text-neutral-600 dark:text-neutral-300">{invoice.termsAndConditions}</p> : <p className="mt-1 text-sm text-neutral-500">—</p>
            ) : (
              <textarea
                defaultValue={invoice.termsAndConditions ?? ""}
                onBlur={(e) => updateInvoice(id, { termsAndConditions: e.target.value || undefined })}
                placeholder="Terms and conditions"
                rows={4}
                className={`mt-1 w-full text-sm text-neutral-600 dark:text-neutral-300 ${textInputClass}`}
              />
            )}
          </div>
        );
      case "customText":
        return (
          <div key={block.id} className="mt-4">
            {previewOpen ? (
              <p className="whitespace-pre-line text-sm text-neutral-700 dark:text-neutral-300">{customContent || "—"}</p>
            ) : (
              <textarea
                defaultValue={customContent}
                onBlur={(e) => {
                  const next = (invoice.customBlocks ?? []).map((b) => b.id === block.id ? { ...b, settings: { ...b.settings, content: e.target.value } } : b);
                  updateInvoice(id, { customBlocks: next });
                }}
                rows={3}
                className={`w-full text-sm text-neutral-700 dark:text-neutral-300 ${textInputClass}`}
                placeholder="Custom text block"
              />
            )}
          </div>
        );
      case "divider":
        return <hr key={block.id} className="my-4 border-neutral-700" />;
      default:
        return null;
    }
  };

  const InvCanvasBlank = () => (
    <div
      className="invoice-canvas-print min-h-[600px] rounded-xl border border-neutral-700 bg-neutral-900 p-8 shadow-sm print:border print:border-neutral-300 print:shadow-none"
      style={canvasStyle}
    >
      {sortedBlankBlocks.map(renderBlankBlock)}
    </div>
  );

  const InvCanvas = () => {
    const headerText = invoice.headerText ?? settings.headerText;
    const footerText = invoice.footerText ?? settings.footerText;
    
    return (
      <div
        className="invoice-canvas-print min-h-[600px] rounded-xl border border-neutral-700 bg-neutral-900 p-8 shadow-sm print:border print:border-neutral-300 print:shadow-none"
        style={canvasStyle}
      >
        {headerText && (
          <div className="mb-6 border-b border-neutral-700 pb-4 text-center text-sm text-neutral-400 dark:text-neutral-500">
            {headerText}
          </div>
        )}
        {sectionOrder.map((sid) => {
          const content = sections[sid];
          if (content == null) return null;
          const labels: Record<string, string> = {
            header: "Header & logo",
            billTo: "Bill To & dates",
            lineItems: "Line items",
            totals: "Totals",
            payment: "Payment details",
            lateFees: "Late fees",
            notes: "Notes",
            terms: "Terms and conditions",
          };
          return wrapSection(sid, labels[sid] ?? sid, content);
        })}
        {footerText && (
          <div className="mt-6 border-t border-neutral-700 pt-4 text-center text-sm text-neutral-400 dark:text-neutral-500">
            {footerText}
          </div>
        )}
      </div>
    );
  };

  /** Landscape template: top bar, Invoice + 3-col block, Services table, black footer with notes & payment */
  const InvCanvasLandscape = () => {
    const landscapeMain = "bg-white text-neutral-900";
    const landscapeFooter = "bg-black text-white";
    return (
      <div className="invoice-canvas-print min-h-[600px] rounded-xl border border-neutral-700 overflow-hidden shadow-sm print:border print:border-neutral-300">
        <div className={`p-8 ${landscapeMain} relative isolate`} style={{ backgroundColor: invoice.backgroundColor || "#ffffff" }}>
          {/* Top bar: company name left, invoice # right */}
          <div className="flex items-center justify-between text-sm text-neutral-700">
            {previewOpen ? (
              <span>{business.name || "Your Company"}</span>
            ) : (
              <input
                key="land-top-business-name"
                type="text"
                defaultValue={business.name || ""}
                onBlur={(e) => updateSettings({ business: { ...business, name: e.target.value } })}
                placeholder="Your Company"
                className={`max-w-[200px] ${textInputClass}`}
              />
            )}
            {previewOpen ? (
              <span>No. {invoice.invoiceNumber}</span>
            ) : (
              <input
                key="land-invoice-number"
                type="text"
                defaultValue={invoice.invoiceNumber}
                onBlur={(e) => updateInvoice(id, { invoiceNumber: e.target.value })}
                placeholder="Invoice #"
                className={`text-right max-w-[120px] ${textInputClass}`}
              />
            )}
          </div>
          {/* Invoice heading + Billed to | From | Issued/Due */}
          <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
            <h2 style={{ fontSize: Math.round((invoice.headingFontSize ?? 24) * 1.2) }} className="font-bold text-neutral-900">
              Invoice
            </h2>
            <div className="grid grid-cols-3 gap-6 min-w-[420px] text-sm">
              <div>
                <p className="font-semibold text-neutral-900">Billed to</p>
                {previewOpen ? (
                  <>
                    <p className="mt-1 text-neutral-700">{client?.companyName}</p>
                    <p className="text-neutral-600">{client?.email}</p>
                    {client?.address && (client.address.street || client.address.city) && (
                      <p className="mt-1 text-neutral-600">Address : {formatAddress(client.address).replace(/\n/g, ", ")}</p>
                    )}
                  </>
                ) : client ? (
                  <>
                    <input key="land-billed-company" type="text" defaultValue={client.companyName || ""} onBlur={(e) => updateClient(client.id, { companyName: e.target.value })} placeholder="Company" className={`mt-1 block w-full text-neutral-700 ${textInputClass}`} />
                    <input key="land-billed-email" type="text" defaultValue={client.email || ""} onBlur={(e) => updateClient(client.id, { email: e.target.value })} placeholder="Email" className={`block w-full text-neutral-600 ${textInputClass}`} />
                    <input key="land-billed-address" type="text" defaultValue={formatAddress(client.address)} onBlur={(e) => { const lines = e.target.value.split("\n"); updateClient(client.id, { address: { ...client.address, street: lines[0] ?? "", city: lines[1] ?? "", country: lines[2] ?? "" } }); }} placeholder="Address" className={`mt-1 block w-full resize-none text-neutral-600 ${textInputClass}`} />
                  </>
                ) : null}
              </div>
              <div>
                <p className="font-semibold text-neutral-900">From</p>
                {previewOpen ? (
                  <>
                    <p className="mt-1 text-neutral-700">{business.name || "Your Company"}</p>
                    <p className="text-neutral-600">{business.email}</p>
                    {business.address && (business.address.street || business.address.city) && (
                      <p className="mt-1 text-neutral-600">Address : {formatAddress(business.address).replace(/\n/g, ", ")}</p>
                    )}
                  </>
                ) : (
                  <>
                    <input key="land-from-name" type="text" defaultValue={business.name || ""} onBlur={(e) => updateSettings({ business: { ...business, name: e.target.value } })} placeholder="Your Company" className={`mt-1 block w-full text-neutral-700 ${textInputClass}`} />
                    <input key="land-from-email" type="text" defaultValue={business.email || ""} onBlur={(e) => updateSettings({ business: { ...business, email: e.target.value } })} placeholder="Email" className={`block w-full text-neutral-600 ${textInputClass}`} />
                    <input key="land-from-address" type="text" defaultValue={formatAddress(business.address)} onBlur={(e) => { const lines = e.target.value.split("\n"); updateSettings({ business: { ...business, address: { ...business.address, street: lines[0] ?? "", city: lines[1] ?? "", country: lines[2] ?? "" } } }); }} placeholder="Address" className={`mt-1 block w-full text-neutral-600 ${textInputClass}`} />
                  </>
                )}
              </div>
              <div>
                <p className="font-semibold text-neutral-900">Issued Date</p>
                {previewOpen ? (
                  <p className="mt-1 text-neutral-700">{formatDateSafe(invoice.issueDate, "d MMMM, yyyy")}</p>
                ) : (
                  <input key="land-issue-date" type="date" defaultValue={invoice.issueDate} onBlur={(e) => updateInvoice(id, { issueDate: e.target.value })} className="invoice-date-input-landscape mt-1 block w-full text-sm text-neutral-900" aria-label="Issue date" />
                )}
                <p className="mt-2 font-semibold text-neutral-900">Due Date</p>
                {previewOpen ? (
                  <p className="mt-1 text-neutral-700">{formatDateSafe(invoice.dueDate, "d MMMM, yyyy")}</p>
                ) : (
                  <input key="land-due-date" type="date" defaultValue={invoice.dueDate} onBlur={(e) => updateInvoice(id, { dueDate: e.target.value })} className="invoice-date-input-landscape mt-1 block w-full text-sm text-neutral-900" aria-label="Due date" />
                )}
              </div>
            </div>
          </div>
          <hr className="my-6 border-neutral-200" />
          {/* Line items: item name + description, price, qty, amount */}
          <p className="text-sm font-semibold text-neutral-900">Items</p>
          <div className="mt-2 overflow-x-auto text-sm">
            <div className="grid grid-cols-[minmax(280px,2fr)_80px_80px_90px_40px] gap-2 border-b-2 border-neutral-200 pb-2 mb-2">
              <div className="font-medium text-neutral-700">Item name</div>
              <div className="font-medium text-neutral-700 text-right">Price</div>
              <div className="font-medium text-neutral-700 text-right">Qty</div>
              <div className="font-medium text-neutral-700 text-right">Amount</div>
              {!previewOpen && <div />}
            </div>
            {invoice.lineItems.map((li) => (
              <div
                key={li.id}
                className="grid grid-cols-[minmax(280px,2fr)_80px_80px_90px_40px] gap-2 border-b border-neutral-200 py-3 items-start"
              >
                <div className="min-w-0 flex flex-col gap-1 relative">
                  {previewOpen ? (
                    <>
                      <span className="text-neutral-900 font-medium">{li.items || "—"}</span>
                      {li.itemDescription && <span className="text-xs text-neutral-600">{li.itemDescription}</span>}
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={serviceSuggestLineId === li.id ? serviceSuggestValue : li.items}
                        onChange={(e) => {
                          setServiceSuggestLineId(li.id);
                          setServiceSuggestValue(e.target.value);
                        }}
                        onFocus={() => {
                          setServiceSuggestLineId(li.id);
                          setServiceSuggestValue(li.items);
                        }}
                        onBlur={() => {
                          const val = serviceSuggestLineId === li.id ? serviceSuggestValue : li.items;
                          updateLineItem(li.id, { items: val });
                          setServiceSuggestLineId(null);
                        }}
                        placeholder="Item name (type for service suggestions)"
                        className="w-full bg-transparent border-0 outline-none p-0 py-1 text-sm text-neutral-900 placeholder:text-neutral-500 focus:ring-0 focus:outline-none"
                        aria-label="Item name"
                      />
                      {serviceSuggestLineId === li.id && serviceSuggestions.length > 0 && (
                        <div className="absolute left-0 top-full z-50 mt-0.5 max-h-48 w-full min-w-[200px] overflow-auto rounded-lg border border-neutral-600 bg-neutral-900 py-1 shadow-xl">
                          {serviceSuggestions.map((svc) => (
                            <button
                              key={svc.id}
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm text-white hover:bg-neutral-700"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                const unit = SERVICE_PRICING_TO_UNIT[svc.pricingType ?? "per hour"];
                                updateLineItem(li.id, {
                                  items: svc.name,
                                  itemDescription: svc.description ?? undefined,
                                  unit,
                                  price: svc.defaultPrice ?? 0,
                                });
                                setServiceSuggestValue(svc.name);
                                setServiceSuggestLineId(null);
                              }}
                            >
                              <span className="font-medium">{svc.name}</span>
                              <span className="ml-2 text-neutral-400">
                                {svc.defaultPrice.toLocaleString("en-US", { style: "currency", currency: invoice.currency })}
                                {svc.pricingType ? ` · ${svc.pricingType}` : ""}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      <input
                        type="text"
                        defaultValue={li.itemDescription ?? ""}
                        onBlur={(e) => updateLineItem(li.id, { itemDescription: e.target.value || undefined })}
                        placeholder="Item description"
                        className="w-full bg-transparent border-0 outline-none p-0 py-0.5 text-xs text-neutral-600 placeholder:text-neutral-500 focus:ring-0 focus:outline-none"
                        aria-label="Item description"
                      />
                    </>
                  )}
                </div>
                <div className="text-right">
                  {previewOpen ? (
                    <span className="text-neutral-900">{li.price.toLocaleString("en-US", { style: "currency", currency: invoice.currency })}</span>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      defaultValue={li.price}
                      onBlur={(e) => updateLineItem(li.id, { price: Number(e.target.value) || 0 })}
                      className="w-full bg-transparent border-0 outline-none p-0 py-1 text-sm text-right text-neutral-900 focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      aria-label="Price"
                    />
                  )}
                </div>
                <div className="text-right">
                  {previewOpen ? (
                    <span className="text-neutral-900">{li.quantity}</span>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      defaultValue={li.quantity}
                      onBlur={(e) => updateLineItem(li.id, { quantity: Number(e.target.value) || 0 })}
                      className="w-full bg-transparent border-0 outline-none p-0 py-1 text-sm text-right text-neutral-900 focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      aria-label="Qty"
                    />
                  )}
                </div>
                <div className="text-right font-medium text-neutral-900">
                  {(li.quantity * li.price).toLocaleString("en-US", { style: "currency", currency: invoice.currency })}
                </div>
                {!previewOpen && (
                  <div className="flex items-center justify-center">
                    <button type="button" onClick={() => removeLineItem(li.id)} className="rounded p-1 text-red-600 hover:bg-red-500/10" aria-label="Remove line">
                      <CrossIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {!previewOpen && (
            <button
              type="button"
              onClick={addLineItem}
              className="mt-3 w-full rounded-lg border-2 border-dashed border-neutral-400 py-3 text-sm font-medium text-neutral-500 hover:border-orange-500 hover:text-orange-500 transition-colors"
            >
              + Add item
            </button>
          )}
          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-56 space-y-1 text-sm text-right">
              <div className="flex justify-between">
                <span className="text-neutral-600">SubTotal</span>
                <span className="text-neutral-900">{subtotal.toLocaleString("en-US", { style: "currency", currency: invoice.currency })}</span>
              </div>
              {invoice.applyTax && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">{invoice.taxName} ({invoice.taxRate}%)</span>
                  <span className="text-neutral-900">{taxAmount.toLocaleString("en-US", { style: "currency", currency: invoice.currency })}</span>
                </div>
              )}
              {(invoice.discountType === "percent" || invoice.discountType === "fixed") && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">Discount</span>
                  <span className="text-neutral-900">-{discountAmount.toLocaleString("en-US", { style: "currency", currency: invoice.currency })}</span>
                </div>
              )}
              <hr className="border-neutral-200" />
              <div className="flex justify-between font-semibold text-neutral-900">
                <span>Total</span>
                <span>{total.toLocaleString("en-US", { style: "currency", currency: invoice.currency })}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Black footer */}
        <div className={`p-6 ${landscapeFooter}`}>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="font-semibold text-white">Note:</p>
              {invoice.notes ? (
                <ul className="mt-2 list-none space-y-1 text-sm text-neutral-200">
                  {invoice.notes.split(/\n/).filter(Boolean).map((line, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-400">→</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : !previewOpen ? (
                <textarea
                  key="land-notes"
                  defaultValue={invoice.notes ?? ""}
                  onBlur={(e) => updateInvoice(id, { notes: e.target.value })}
                  rows={3}
                  placeholder="Invoices are due within..."
                  className="mt-2 w-full bg-transparent border-0 border-b border-neutral-600 px-0 py-1 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500"
                />
              ) : (
                <p className="mt-2 text-sm text-neutral-400">—</p>
              )}
            </div>
            <div>
              <p className="font-semibold text-white">Payment Info</p>
              {previewOpen ? (
                <>
                  {invoice.paymentMethods?.length > 0 && <p className="mt-1 text-sm text-neutral-300">{invoice.paymentMethods.join(", ")}</p>}
                  {invoice.paymentMethods?.includes("Bank Transfer") && (settings.bankAccounts ?? []).length > 0 && (
                    <div className="mt-2 space-y-1 text-sm text-neutral-200">
                      {(settings.bankAccounts ?? []).map((acc) => (
                        <div key={acc.id}>
                          {acc.accountName && <span className="font-medium">{acc.accountName}</span>}
                          {acc.bankName && <span> · {acc.bankName}</span>}
                          {acc.accountNumber && <p>Account: {acc.accountNumber}</p>}
                          {acc.iban && <p>IBAN: {acc.iban}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {["PayPal", "Wise"].map((name) => {
                    const pm = (settings.paymentMethods ?? []).find((p) => p.name === name && invoice.paymentMethods?.includes(name));
                    if (!pm?.details) return null;
                    return <p key={name} className="mt-1 text-sm text-neutral-200">{name}: {pm.details}</p>;
                  })}
                  {invoice.paymentDetails && <p className="mt-2 whitespace-pre-line text-sm text-neutral-200">{invoice.paymentDetails}</p>}
                </>
              ) : (
                <>
                  {invoice.paymentMethods?.length > 0 && <p className="mt-1 text-sm text-neutral-300">{invoice.paymentMethods.join(", ")}</p>}
                  {invoice.paymentMethods?.includes("Bank Transfer") && (settings.bankAccounts ?? []).length > 0 && (
                    <div className="mt-2 space-y-1 text-sm text-neutral-200">
                      {(settings.bankAccounts ?? []).map((acc) => (
                        <div key={acc.id}>
                          {acc.accountName && <span className="font-medium">{acc.accountName}</span>}
                          {acc.bankName && <span> · {acc.bankName}</span>}
                          {acc.accountNumber && <p>Account: {acc.accountNumber}</p>}
                          {acc.iban && <p>IBAN: {acc.iban}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  <textarea
                    key="land-payment"
                    defaultValue={invoice.paymentDetails ?? ""}
                    onBlur={(e) => updateInvoice(id, { paymentDetails: e.target.value })}
                    rows={3}
                    placeholder="Additional payment instructions..."
                    className="mt-2 w-full bg-transparent border-0 border-b border-neutral-600 px-0 py-1 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500"
                  />
                </>
              )}
            </div>
          </div>
          {((invoice.termsAndConditions != null && invoice.termsAndConditions !== "") || !previewOpen) && (
            <div className="px-6 pb-4">
              <p className="font-semibold text-white">Terms and conditions</p>
              {previewOpen && invoice.termsAndConditions ? (
                <p className="mt-1 whitespace-pre-line text-sm text-neutral-200">{invoice.termsAndConditions}</p>
              ) : !previewOpen ? (
                <textarea
                  key="land-terms"
                  defaultValue={invoice.termsAndConditions ?? ""}
                  onBlur={(e) => updateInvoice(id, { termsAndConditions: e.target.value || undefined })}
                  rows={3}
                  placeholder="Default from Settings"
                  className="mt-2 w-full bg-transparent border-0 border-b border-neutral-600 px-0 py-1 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500"
                />
              ) : null}
            </div>
          )}
          <div className="mt-6 flex items-end justify-between">
            <p className="text-lg font-bold text-white">Thank you!</p>
            <p className="text-sm text-neutral-300">{business.email}</p>
          </div>
          <div className="mt-4 h-0.5 w-full bg-amber-400" />
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link href="/dashboard/invoices" className="text-sm text-neutral-400 hover:text-white">
          ← Invoices
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => setSendModalOpen(true)}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
          >
            Send invoice
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-lg border border-neutral-600 bg-neutral-800 p-2 text-neutral-300 hover:bg-neutral-700 hover:text-white"
              aria-label="More actions"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" aria-hidden onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-neutral-700 bg-neutral-900 py-1 shadow-xl">
                  <button
                    type="button"
                    onClick={() => { updateInvoice(id, {}); setMenuOpen(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-800"
                  >
                    Save as draft
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleDownloadPDF(); setMenuOpen(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-800"
                  >
                    Download PDF
                  </button>
                  <a
                    href={`/dashboard/invoices/${id}?preview=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-800"
                    onClick={() => setMenuOpen(false)}
                  >
                    Open preview in new tab
                  </a>
                  <button
                    type="button"
                    onClick={() => { copyPreviewLink(); setMenuOpen(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-800"
                  >
                    {previewLinkCopied ? "Copy link (copied!)" : "Copy preview link"}
                  </button>
                  <Link
                    href="/dashboard/invoices"
                    className="block w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-800"
                    onClick={() => setMenuOpen(false)}
                  >
                    Save & close
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {effectiveTemplate === "blank" ? <InvCanvasBlank /> : effectiveTemplate === "landscape" ? <InvCanvasLandscape /> : <InvCanvas />}

        <aside className="space-y-4">
          <div className="flex rounded-lg border border-neutral-800 bg-neutral-900 p-1">
            <button
              type="button"
              onClick={() => setSidebarTab("design")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                sidebarTab === "design" ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343L12.657 5.657A2 2 0 0114.828 5h2.172a2 2 0 012.828 2.828l-1.414 1.414M7 17h.01" />
              </svg>
              Design
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab("settings")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                sidebarTab === "settings" ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          </div>

          {sidebarTab === "design" && (
            <div className="space-y-6">
              {effectiveTemplate === "blank" ? (
                <>
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                    <h3 className="text-sm font-medium text-white">Template</h3>
                    <select
                      value={effectiveTemplate}
                      onChange={(e) => updateInvoice(id, { template: e.target.value as InvoiceTemplate })}
                      className="mt-2 w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1.5 text-sm text-white"
                    >
                      {INVOICE_TEMPLATES.map((t) => (
                        <option key={t} value={t}>{TEMPLATE_LABELS[t]}</option>
                      ))}
                    </select>
                    {(settings.customTemplates ?? []).length > 0 && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-neutral-400">Load saved template</label>
                        <select
                          className="mt-1 w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1.5 text-sm text-white"
                          value=""
                          onChange={(e) => {
                            const tid = e.target.value;
                            if (!tid) return;
                            const t = (settings.customTemplates ?? []).find((ct) => ct.id === tid);
                            if (t) updateInvoice(id, { customBlocks: t.blocks.map((b) => ({ ...b, id: crypto.randomUUID() })) });
                            e.target.value = "";
                          }}
                        >
                          <option value="">Choose...</option>
                          {(settings.customTemplates ?? []).map((ct) => (
                            <option key={ct.id} value={ct.id}>{ct.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                    <h3 className="text-sm font-medium text-white">Blocks</h3>
                    <p className="mt-1 text-xs text-neutral-400">Drag to reorder. Click to edit settings.</p>
                    <DndContext
                      sensors={useSensors(useSensor(PointerSensor))}
                      collisionDetection={closestCenter}
                      onDragEnd={(event: DragEndEvent) => {
                        const { active, over } = event;
                        if (!over || active.id === over.id) return;
                        const blocks = sortedBlankBlocks.slice();
                        const oldIndex = blocks.findIndex((b) => b.id === active.id);
                        const newIndex = blocks.findIndex((b) => b.id === over.id);
                        if (oldIndex === -1 || newIndex === -1) return;
                        const reordered = blocks.slice();
                        const [removed] = reordered.splice(oldIndex, 1);
                        reordered.splice(newIndex, 0, removed);
                        const updated = reordered.map((b, i) => ({ ...b, order: i }));
                        updateInvoice(id, { customBlocks: updated });
                      }}
                    >
                      <SortableContext items={sortedBlankBlocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                        <ul className="mt-3 space-y-1">
                          {sortedBlankBlocks.map((block, index) => (
                            <SortableBlockItem
                              key={block.id}
                              block={block}
                              index={index}
                              totalBlocks={sortedBlankBlocks.length}
                              isSelected={selectedBlockId === block.id}
                              onSelect={() => setSelectedBlockId(block.id)}
                              onMoveUp={() => {
                                const blocks = sortedBlankBlocks.slice();
                                const prev = blocks[index - 1];
                                const curr = blocks[index];
                                const next = (invoice.customBlocks ?? []).map((b) => {
                                  if (b.id === prev.id) return { ...b, order: curr.order };
                                  if (b.id === curr.id) return { ...b, order: prev.order };
                                  return b;
                                });
                                updateInvoice(id, { customBlocks: next });
                              }}
                              onMoveDown={() => {
                                const blocks = sortedBlankBlocks.slice();
                                const curr = blocks[index];
                                const nextBl = blocks[index + 1];
                                const next = (invoice.customBlocks ?? []).map((b) => {
                                  if (b.id === curr.id) return { ...b, order: nextBl.order };
                                  if (b.id === nextBl.id) return { ...b, order: curr.order };
                                  return b;
                                });
                                updateInvoice(id, { customBlocks: next });
                              }}
                              onRemove={() => {
                                const next = (invoice.customBlocks ?? []).filter((b) => b.id !== block.id);
                                updateInvoice(id, { customBlocks: next });
                                if (selectedBlockId === block.id) setSelectedBlockId(null);
                              }}
                              blockLabel={BLOCK_TYPE_LABELS[block.type]}
                            />
                          ))}
                        </ul>
                      </SortableContext>
                    </DndContext>
                    <ul className="hidden">
                      {sortedBlankBlocks.map((block, index) => (
                        <li
                          key={block.id}
                          className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-sm ${selectedBlockId === block.id ? "border-orange-500 bg-neutral-800" : "border-neutral-700 bg-neutral-800/50"}`}
                        >
                          <span className="cursor-grab text-neutral-500" title="Drag to reorder">⋮⋮</span>
                          <button type="button" className="flex-1 text-left text-white hover:underline" onClick={() => setSelectedBlockId(block.id)}>
                            {BLOCK_TYPE_LABELS[block.type]}
                          </button>
                          <div className="flex gap-1">
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const blocks = (invoice.customBlocks ?? []).slice().sort((a, b) => a.order - b.order);
                                  const prev = blocks[index - 1];
                                  const curr = blocks[index];
                                  const next = blocks.map((b) => {
                                    if (b.id === prev.id) return { ...b, order: curr.order };
                                    if (b.id === curr.id) return { ...b, order: prev.order };
                                    return b;
                                  });
                                  updateInvoice(id, { customBlocks: next });
                                }}
                                className="rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                                aria-label="Move up"
                              >
                                ↑
                              </button>
                            )}
                            {index < sortedBlankBlocks.length - 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const blocks = (invoice.customBlocks ?? []).slice().sort((a, b) => a.order - b.order);
                                  const curr = blocks[index];
                                  const nextBl = blocks[index + 1];
                                  const next = blocks.map((b) => {
                                    if (b.id === curr.id) return { ...b, order: nextBl.order };
                                    if (b.id === nextBl.id) return { ...b, order: curr.order };
                                    return b;
                                  });
                                  updateInvoice(id, { customBlocks: next });
                                }}
                                className="rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                                aria-label="Move down"
                              >
                                ↓
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const next = (invoice.customBlocks ?? []).filter((b) => b.id !== block.id);
                                updateInvoice(id, { customBlocks: next });
                                if (selectedBlockId === block.id) setSelectedBlockId(null);
                              }}
                              className="rounded p-1 text-red-400 hover:bg-red-500/20"
                              aria-label="Remove block"
                            >
                              ×
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-neutral-400">Add block</label>
                      <select
                        className="mt-1 w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1.5 text-sm text-white"
                        value=""
                        onChange={(e) => {
                          const type = e.target.value as CustomBlockType;
                          if (!type) return;
                          const blocks = (invoice.customBlocks ?? []).slice().sort((a, b) => a.order - b.order);
                          const maxOrder = blocks.length === 0 ? -1 : Math.max(...blocks.map((b) => b.order));
                          const newBlock: CustomBlock = { id: crypto.randomUUID(), type, order: maxOrder + 1 };
                          updateInvoice(id, { customBlocks: [...blocks, newBlock] });
                          setSelectedBlockId(newBlock.id);
                          e.target.value = "";
                        }}
                      >
                        <option value="">Choose a block...</option>
                        {CUSTOM_BLOCK_TYPES.map((t) => (
                          <option key={t} value={t}>{BLOCK_TYPE_LABELS[t]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {selectedBlockId && (() => {
                    const block = sortedBlankBlocks.find((b) => b.id === selectedBlockId);
                    if (!block) return null;
                    return (
                      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                        <h3 className="text-sm font-medium text-white">Block settings</h3>
                        <p className="mt-1 text-xs text-neutral-400">{BLOCK_TYPE_LABELS[block.type]}</p>
                        <div className="mt-3 space-y-3">
                          {block.type === "heading" && (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-neutral-400">Heading text</label>
                                <input
                                  type="text"
                                  value={(block.settings?.headingText as string) ?? "INVOICE"}
                                  onChange={(e) => {
                                    const next = (invoice.customBlocks ?? []).map((b) => b.id === block.id ? { ...b, settings: { ...b.settings, headingText: e.target.value } } : b);
                                    updateInvoice(id, { customBlocks: next });
                                  }}
                                  className="mt-1 w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1.5 text-sm text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-neutral-400">Heading size (px)</label>
                                <input
                                  type="number"
                                  min={12}
                                  max={120}
                                  value={Number(block.settings?.headingFontSize) || 28}
                                  onChange={(e) => {
                                    const v = Number(e.target.value) || 28;
                                    const next = (invoice.customBlocks ?? []).map((b) => b.id === block.id ? { ...b, settings: { ...b.settings, headingFontSize: v } } : b);
                                    updateInvoice(id, { customBlocks: next });
                                  }}
                                  className="mt-1 w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1.5 text-sm text-white"
                                />
                                <p className="mt-0.5 text-xs text-neutral-500">12–120px</p>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-neutral-400">Heading color</label>
                                <div className="mt-1 flex gap-2">
                                  <input
                                    type="color"
                                    value={(block.settings?.headingColor as string) || "#ffffff"}
                                    onChange={(e) => {
                                      const next = (invoice.customBlocks ?? []).map((b) => b.id === block.id ? { ...b, settings: { ...b.settings, headingColor: e.target.value } } : b);
                                      updateInvoice(id, { customBlocks: next });
                                    }}
                                    className="h-9 w-14 cursor-pointer rounded border border-neutral-600 bg-neutral-800"
                                  />
                                  <input
                                    type="text"
                                    value={(block.settings?.headingColor as string) || "#ffffff"}
                                    onChange={(e) => {
                                      const next = (invoice.customBlocks ?? []).map((b) => b.id === block.id ? { ...b, settings: { ...b.settings, headingColor: e.target.value } } : b);
                                      updateInvoice(id, { customBlocks: next });
                                    }}
                                    className="flex-1 rounded border border-neutral-600 bg-neutral-800 px-2 py-1.5 text-sm text-white"
                                    placeholder="#ffffff"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-neutral-400">Heading background</label>
                                <div className="mt-1 flex gap-2">
                                  <input
                                    type="color"
                                    value={(block.settings?.headingBackgroundColor as string) || ""}
                                    onChange={(e) => {
                                      const next = (invoice.customBlocks ?? []).map((b) => b.id === block.id ? { ...b, settings: { ...b.settings, headingBackgroundColor: e.target.value } } : b);
                                      updateInvoice(id, { customBlocks: next });
                                    }}
                                    className="h-9 w-14 cursor-pointer rounded border border-neutral-600 bg-neutral-800"
                                  />
                                  <input
                                    type="text"
                                    value={(block.settings?.headingBackgroundColor as string) || ""}
                                    onChange={(e) => {
                                      const next = (invoice.customBlocks ?? []).map((b) => b.id === block.id ? { ...b, settings: { ...b.settings, headingBackgroundColor: e.target.value } } : b);
                                      updateInvoice(id, { customBlocks: next });
                                    }}
                                    className="flex-1 rounded border border-neutral-600 bg-neutral-800 px-2 py-1.5 text-sm text-white"
                                    placeholder="Leave empty for transparent"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-neutral-400">Position</label>
                                <select
                                  value={(block.settings?.headingPosition as string) || "left"}
                                  onChange={(e) => {
                                    const next = (invoice.customBlocks ?? []).map((b) => b.id === block.id ? { ...b, settings: { ...b.settings, headingPosition: e.target.value } } : b);
                                    updateInvoice(id, { customBlocks: next });
                                  }}
                                  className="mt-1 w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1.5 text-sm text-white"
                                >
                                  <option value="left">Left</option>
                                  <option value="center">Center</option>
                                  <option value="right">Right (e.g. top right)</option>
                                </select>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`heading-no-padding-${block.id}`}
                                  checked={Boolean(block.settings?.headingNoPadding)}
                                  onChange={(e) => {
                                    const next = (invoice.customBlocks ?? []).map((b) => b.id === block.id ? { ...b, settings: { ...b.settings, headingNoPadding: e.target.checked } } : b);
                                    updateInvoice(id, { customBlocks: next });
                                  }}
                                  className="h-4 w-4 rounded border-neutral-600 accent-orange-500"
                                />
                                <label htmlFor={`heading-no-padding-${block.id}`} className="text-xs text-neutral-400">No padding (flush to edge)</label>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs font-medium text-neutral-400">Width (px)</label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={Number(block.settings?.headingWidth) || ""}
                                    onChange={(e) => {
                                      const v = e.target.value === "" ? undefined : Number(e.target.value);
                                      const next = (invoice.customBlocks ?? []).map((b) => b.id === block.id ? { ...b, settings: { ...b.settings, headingWidth: v } } : b);
                                      updateInvoice(id, { customBlocks: next });
                                    }}
                                    className="mt-1 w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1.5 text-sm text-white"
                                    placeholder="Auto"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-neutral-400">Height (px)</label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={Number(block.settings?.headingHeight) || ""}
                                    onChange={(e) => {
                                      const v = e.target.value === "" ? undefined : Number(e.target.value);
                                      const next = (invoice.customBlocks ?? []).map((b) => b.id === block.id ? { ...b, settings: { ...b.settings, headingHeight: v } } : b);
                                      updateInvoice(id, { customBlocks: next });
                                    }}
                                    className="mt-1 w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1.5 text-sm text-white"
                                    placeholder="Auto"
                                  />
                                </div>
                              </div>
                              <p className="text-xs text-neutral-500">Drag the corner of the heading box on the canvas to resize (Figma-style). Set width/height here to lock size.</p>
                            </>
                          )}
                          {(block.type === "paymentTerms" || block.type === "customText") && (
                            <div>
                              <label className="block text-xs font-medium text-neutral-400">Content</label>
                              <textarea
                                value={(block.settings?.content as string) ?? ""}
                                onChange={(e) => {
                                  const next = (invoice.customBlocks ?? []).map((b) => b.id === block.id ? { ...b, settings: { ...b.settings, content: e.target.value } } : b);
                                  updateInvoice(id, { customBlocks: next });
                                }}
                                rows={4}
                                className="mt-1 w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1.5 text-sm text-white"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                    <button
                      type="button"
                      onClick={() => setSaveTemplateModalOpen(true)}
                      className="w-full rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-400"
                    >
                      Save as template
                    </button>
                    <p className="mt-2 text-xs text-neutral-400">Save this layout to use on future invoices.</p>
                  </div>
                </>
              ) : (
                <>
              <CollapsibleSection title="Template & Colors" defaultOpen={true}>
                <p className="text-xs text-neutral-400 mb-3">Background & heading design</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400">Template</label>
                    <select
                      value={effectiveTemplate}
                      onChange={(e) => updateInvoice(id, { template: e.target.value as InvoiceTemplate })}
                      className="mt-1 w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1.5 text-sm text-white"
                    >
                      {INVOICE_TEMPLATES.map((t) => (
                        <option key={t} value={t}>{TEMPLATE_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400">Background color</label>
                    <input
                      type="color"
                      value={invoice.backgroundColor || "#1f2937"}
                      onChange={(e) => updateInvoice(id, { backgroundColor: e.target.value })}
                      className="mt-1 h-9 w-full cursor-pointer rounded border border-neutral-600 bg-neutral-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400">Invoice heading size (px)</label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="range"
                        min={14}
                        max={36}
                        value={invoice.headingFontSize ?? 24}
                        onChange={(e) => updateInvoice(id, { headingFontSize: Number(e.target.value) })}
                        className="flex-1 accent-orange-500"
                      />
                      <span className="w-8 text-sm text-neutral-400">{invoice.headingFontSize ?? 24}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400">Invoice heading alignment</label>
                    <select
                      value={invoice.headingAlignment ?? "right"}
                      onChange={(e) => updateInvoice(id, { headingAlignment: e.target.value as "left" | "center" | "right" })}
                      className="mt-1 w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1.5 text-sm text-white"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400">Heading color</label>
                    <div className="mt-1 flex gap-2">
                      <input
                        type="color"
                        value={invoice.headingColor && /^#[0-9A-Fa-f]{6}$/.test(invoice.headingColor) ? invoice.headingColor : "#ffffff"}
                        onChange={(e) => updateInvoice(id, { headingColor: e.target.value })}
                        className="h-9 w-14 cursor-pointer rounded border border-neutral-600 bg-neutral-800"
                      />
                      <input
                        type="text"
                        value={invoice.headingColor || ""}
                        onChange={(e) => updateInvoice(id, { headingColor: e.target.value || undefined })}
                        className="flex-1 rounded border border-neutral-600 bg-neutral-800 px-2 py-1.5 text-sm text-white"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400">Heading background</label>
                    <div className="mt-1 flex gap-2">
                      <input
                        type="color"
                        value={invoice.headingBackgroundColor && /^#[0-9A-Fa-f]{6}$/.test(invoice.headingBackgroundColor) ? invoice.headingBackgroundColor : "#1f2937"}
                        onChange={(e) => updateInvoice(id, { headingBackgroundColor: e.target.value })}
                        className="h-9 w-14 cursor-pointer rounded border border-neutral-600 bg-neutral-800"
                      />
                      <input
                        type="text"
                        value={invoice.headingBackgroundColor || ""}
                        onChange={(e) => updateInvoice(id, { headingBackgroundColor: e.target.value || undefined })}
                        className="flex-1 rounded border border-neutral-600 bg-neutral-800 px-2 py-1.5 text-sm text-white"
                        placeholder="Transparent if empty"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500">Drag sections in the invoice to reorder them.</p>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Display Options" defaultOpen={true}>
                <ul className="space-y-3">
                  <li className="flex items-center justify-between">
                    <span className="text-sm text-neutral-300">Show logo</span>
                    <Toggle checked={invoice.showLogo} onChange={(v) => updateInvoice(id, { showLogo: v })} aria-label="Show logo" />
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-sm text-neutral-300">Show Units column</span>
                    <Toggle checked={invoice.showUnits !== false} onChange={(v) => updateInvoice(id, { showUnits: v })} aria-label="Show Units" />
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-sm text-neutral-300">Late fees</span>
                    <Toggle checked={invoice.lateFeeEnabled} onChange={(v) => updateInvoice(id, { lateFeeEnabled: v })} aria-label="Late fees" />
                  </li>
                  {invoice.lateFeeEnabled && (
                    <li>
                      <label className="block text-sm text-neutral-400">Late fee %</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={invoice.lateFeePercent ?? 5}
                        onChange={(e) => updateInvoice(id, { lateFeePercent: Number(e.target.value) || 0 })}
                        className="mt-1 w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-sm text-white"
                      />
                    </li>
                  )}
                  <li className="flex items-center justify-between">
                    <span className="text-sm text-neutral-300">Apply tax</span>
                    <Toggle checked={invoice.applyTax} onChange={(v) => updateInvoice(id, { applyTax: v })} aria-label="Apply tax" />
                  </li>
                  {invoice.applyTax && (
                    <li>
                      <label className="block text-sm text-neutral-400">Tax rate %</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={invoice.taxRate}
                        onChange={(e) => updateInvoice(id, { taxRate: Number(e.target.value) || 0 })}
                        className="mt-1 w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-sm text-white"
                      />
                    </li>
                  )}
                  <li className="flex items-center justify-between">
                    <span className="text-sm text-neutral-300">Display Tax ID</span>
                    <Toggle checked={invoice.displayTaxId} onChange={(v) => updateInvoice(id, { displayTaxId: v })} aria-label="Display Tax ID" />
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-sm text-neutral-300">Shipping address</span>
                    <Toggle checked={invoice.shippingAddress} onChange={(v) => updateInvoice(id, { shippingAddress: v })} aria-label="Shipping address" />
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-sm text-neutral-300">Reference number</span>
                    <Toggle checked={invoice.showReferenceNumber} onChange={(v) => updateInvoice(id, { showReferenceNumber: v })} aria-label="Reference number" />
                  </li>
                  {invoice.showReferenceNumber && (
                    <li>
                      <input
                        type="text"
                        value={invoice.referenceNumber ?? ""}
                        onChange={(e) => updateInvoice(id, { referenceNumber: e.target.value })}
                        placeholder="PO / Reference #"
                        className="w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-sm text-white placeholder:text-neutral-500"
                      />
                    </li>
                  )}
                </ul>
              </CollapsibleSection>
                </>
              )}
            </div>
          )}

          {sidebarTab === "settings" && (
            <div className="space-y-1">
          <CollapsibleSection title="Invoice Status" defaultOpen={true}>
            <div className="space-y-2">
              <label className="block text-xs text-neutral-400">Status</label>
              <select
                value={invoice.status}
                onChange={(e) => updateInvoice(id, { status: e.target.value as InvoiceStatus })}
                className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white"
              >
                {INVOICE_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              {project && <p className="text-sm text-neutral-400">Project: {project.name}</p>}
            </div>
          </CollapsibleSection>

          {(invoice.viewToken || invoice.sentAt || activities.length > 0) && (
            <CollapsibleSection title="Activity" defaultOpen={false}>
              <p className="text-xs text-neutral-400">When the invoice was sent, opened, and paid.</p>
              <ul className="mt-3 space-y-2">
                {invoice.sentAt && !activities.some((a) => a.type === "sent") && (
                  <li className="flex items-start gap-2 text-xs">
                    <span className="shrink-0 rounded bg-neutral-700 px-1.5 py-0.5 text-neutral-300">Sent</span>
                    <span className="text-neutral-400">{formatDateSafe(invoice.sentAt, "MMM d, yyyy 'at' HH:mm")}</span>
                  </li>
                )}
                {activities
                  .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
                  .map((a, i) => (
                    <li key={`${a.type}-${a.at}-${i}`} className="flex items-start gap-2 text-xs">
                      <span className="shrink-0 rounded px-1.5 py-0.5 font-medium text-neutral-200 bg-neutral-700">
                        {a.type === "sent" ? "Sent" : a.type === "opened" ? "Opened" : a.type === "reopened" ? "Reopened" : "Paid"}
                      </span>
                      <span className="text-neutral-400">{formatDateSafe(a.at, "MMM d, yyyy 'at' HH:mm")}</span>
                    </li>
                  ))}
              </ul>
            </CollapsibleSection>
          )}

          <CollapsibleSection title="Tax & Discounts" defaultOpen={true}>
            <div className="space-y-2">
              <select
                value={invoice.discountType}
                onChange={(e) => {
                  const t = e.target.value as "none" | "percent" | "fixed";
                  const r = recalc(invoice.lineItems, invoice.applyTax ? invoice.taxRate : 0, t, t === "percent" ? invoice.discountValue : t === "fixed" ? invoice.discountValue : 0);
                  updateInvoice(id, { discountType: t, discountAmount: r.discountAmount, total: r.total });
                }}
                className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white"
              >
                <option value="none">None</option>
                <option value="percent">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
              {(invoice.discountType === "percent" || invoice.discountType === "fixed") && (
                <input
                  type="number"
                  min={0}
                  value={invoice.discountValue}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0;
                    const r = recalc(invoice.lineItems, invoice.applyTax ? invoice.taxRate : 0, invoice.discountType, v);
                    updateInvoice(id, { discountValue: v, discountAmount: r.discountAmount, total: r.total });
                  }}
                  className="w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-sm text-white placeholder:text-neutral-500"
                  placeholder={invoice.discountType === "percent" ? "e.g. 10" : "Amount"}
                />
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Currency & Payment" defaultOpen={false}>
            <div className="space-y-2">
              <select
                value={invoice.currency}
                onChange={(e) => updateInvoice(id, { currency: e.target.value as any })}
                className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div>
                <label className="block text-xs text-neutral-400">Late fee policy text</label>
                <textarea
                  value={invoice.lateFeePolicy ?? ""}
                  onChange={(e) => updateInvoice(id, { lateFeePolicy: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-sm text-white placeholder:text-neutral-500"
                  placeholder="e.g. 5% late fee after 30 days"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400">Notes to client</label>
                <textarea
                  value={invoice.notes ?? ""}
                  onChange={(e) => updateInvoice(id, { notes: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-sm text-white placeholder:text-neutral-500"
                  placeholder="Thank you for your business..."
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400">Payment details / instructions</label>
                <textarea
                  value={invoice.paymentDetails ?? ""}
                  onChange={(e) => updateInvoice(id, { paymentDetails: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-sm text-white placeholder:text-neutral-500"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400">Terms and conditions</label>
                <textarea
                  value={invoice.termsAndConditions ?? ""}
                  onChange={(e) => updateInvoice(id, { termsAndConditions: e.target.value || undefined })}
                  rows={4}
                  className="mt-1 w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-sm text-white placeholder:text-neutral-500"
                  placeholder="Default from Settings → Terms and conditions"
                />
              </div>
            </div>
          </CollapsibleSection>
            </div>
          )}
        </aside>
      </div>

      {previewOpen && (
        <div className="invoice-preview-print fixed inset-0 z-[100] overflow-auto bg-neutral-950 p-8">
          <div className="invoice-print-document mx-auto max-w-3xl print:max-w-none">
            <div className="mb-6 flex justify-end print:hidden">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 dark:bg-orange-500 dark:hover:bg-orange-400"
              >
                Close preview
              </button>
            </div>
            <div className="invoice-canvas-print">
              {effectiveTemplate === "blank" ? <InvCanvasBlank /> : effectiveTemplate === "landscape" ? <InvCanvasLandscape /> : <InvCanvas />}
            </div>
          </div>
        </div>
      )}

      {sendModalOpen && client?.email && (
        <SendInvoiceModal
          toEmail={client.email}
          clientName={client.contactName || client.companyName}
          invoice={invoice}
          businessName={business.name}
          businessAddress={formatAddress(business.address)}
          businessEmail={business.email}
          defaultSubject={settings.email.invoiceSubject.replace(/\{invoiceNumber\}/g, invoice.invoiceNumber).replace(/\{businessName\}/g, business.name)}
          defaultBody={settings.email.invoiceBody}
          onClose={() => setSendModalOpen(false)}
          onSent={(viewToken, _sentEmail) => {
            updateInvoice(id, { viewToken, status: "pending", sentAt: new Date().toISOString() });
          }}
        />
      )}

      {saveTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-neutral-700 bg-neutral-900 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white">Save as template</h2>
            <p className="mt-1 text-sm text-neutral-400">Save this layout to use on future invoices.</p>
            <input
              type="text"
              value={saveTemplateName}
              onChange={(e) => setSaveTemplateName(e.target.value)}
              placeholder="Template name"
              className="mt-4 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500"
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setSaveTemplateModalOpen(false); setSaveTemplateName(""); }}
                className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const name = saveTemplateName.trim();
                  if (!name) return;
                  const customTemplates = settings.customTemplates ?? [];
                  const newTemplate = {
                    id: crypto.randomUUID(),
                    name,
                    blocks: sortedBlankBlocks.map((b) => ({ ...b, id: crypto.randomUUID() })),
                  };
                  updateSettings({ customTemplates: [...customTemplates, newTemplate] });
                  setSaveTemplateModalOpen(false);
                  setSaveTemplateName("");
                }}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sortable block item component
function SortableBlockItem({
  block,
  index,
  totalBlocks,
  isSelected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onRemove,
  blockLabel
}: {
  block: CustomBlock;
  index: number;
  totalBlocks: number;
  isSelected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  blockLabel: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-sm ${isSelected ? "border-orange-500 bg-neutral-800" : "border-neutral-700 bg-neutral-800/50"}`}
    >
      <span {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-neutral-500" title="Drag to reorder">⋮⋮</span>
      <button type="button" className="flex-1 text-left text-white hover:underline" onClick={onSelect}>
        {blockLabel}
      </button>
      <div className="flex gap-1">
        {index > 0 && (
          <button
            type="button"
            onClick={onMoveUp}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-white"
            aria-label="Move up"
          >
            ↑
          </button>
        )}
        {index < totalBlocks - 1 && (
          <button
            type="button"
            onClick={onMoveDown}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-white"
            aria-label="Move down"
          >
            ↓
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-red-400 hover:bg-red-900/30 hover:text-red-300"
          aria-label="Remove block"
        >
          ×
        </button>
      </div>
    </li>
  );
}

export default function InvoiceEditorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[40vh] items-center justify-center text-neutral-500 dark:text-neutral-400">
        Loading...
      </div>
    }>
      <InvoiceEditorContent />
    </Suspense>
  );
}
