"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { defaultSettings, defaultReminderSettings } from "@/lib/defaults";
import { Toggle } from "@/components/Toggle";
import { TemplatePreview } from "@/components/TemplatePreview";
import type { InvoiceTemplate, PaymentTerm, Currency } from "@/lib/types";
import { INVOICE_TEMPLATES, TEMPLATE_LOGO_POSITION, PAYMENT_TERMS_OPTIONS, CURRENCIES, INVOICE_LIST_COLUMN_IDS, INVOICE_LIST_COLUMN_LABELS } from "@/lib/types";

const TEMPLATE_LABELS: Record<InvoiceTemplate, string> = {
  "modern-minimal": "Modern Minimal",
  "classic-professional": "Classic Professional",
  "creative-bold": "Creative Bold",
  "tech-startup": "Tech / Startup",
  elegant: "Elegant",
  corporate: "Corporate",
  landscape: "Landscape",
  blank: "Blank",
};

const LOGO_POSITION_LABEL: Record<string, string> = {
  left: "Logo left",
  right: "Logo right",
  topCenter: "Logo top center",
};

const TABS = [
  { id: "templates", label: "Templates" },
  { id: "configuration", label: "Configuration" },
  { id: "display", label: "Display" },
  { id: "email", label: "Email" },
] as const;

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500";
const labelClass = "block text-sm font-medium text-neutral-300";

function InvoiceSettingsContent() {
  const searchParams = useSearchParams();
  const settings = useStore((s) => s.settings ?? defaultSettings);
  const updateSettings = useStore((s) => s.updateSettings);
  const [hoveredTemplate, setHoveredTemplate] = useState<InvoiceTemplate | null>(null);

  const tabFromUrl = searchParams.get("tab");
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("templates");
  useEffect(() => {
    if (tabFromUrl && TABS.some((t) => t.id === tabFromUrl)) setTab(tabFromUrl as (typeof TABS)[number]["id"]);
  }, [tabFromUrl]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-white">Invoice Settings</h1>
      <p className="mt-1 text-sm text-neutral-400">Configure invoice templates, numbering, display, and email settings. For business details, visit <Link href="/dashboard/account" className="text-orange-400 hover:underline">Account Settings</Link>.</p>

      <div className="mt-6 flex gap-1 rounded-lg border border-neutral-800 bg-neutral-900 p-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 md:px-4 py-2 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
              tab === t.id ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "templates" && (
          <section>
            <h2 className="text-lg font-medium text-white">Default invoice template</h2>
            <p className="mt-1 text-sm text-neutral-400">Choose your default invoice template. New invoices will use this design.</p>
            <div className="mt-4 grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-3">
              {INVOICE_TEMPLATES.map((t) => {
                const pos = TEMPLATE_LOGO_POSITION[t];
                const isSelected = settings.template === t;
                const isHovered = hoveredTemplate === t;
                
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => updateSettings({ template: t })}
                    onMouseEnter={() => setHoveredTemplate(t)}
                    onMouseLeave={() => setHoveredTemplate(null)}
                    className={`group relative rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                      isSelected
                        ? "border-orange-500 bg-orange-950/30 shadow-lg shadow-orange-500/10"
                        : "border-neutral-700 bg-neutral-900 hover:border-neutral-600 hover:shadow-md hover:-translate-y-0.5"
                    }`}
                    aria-label={`Select ${TEMPLATE_LABELS[t]} template`}
                  >
                    <div className="relative h-20 rounded-lg bg-neutral-800/50 overflow-hidden">
                      <TemplatePreview 
                        template={t} 
                        className={`text-neutral-400 transition-colors ${
                          isSelected ? "text-neutral-300" : "group-hover:text-neutral-300"
                        }`}
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 rounded-full bg-orange-500 p-1">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                          </svg>
                        </div>
                      )}
                      {isHovered && !isSelected && (
                        <div className="absolute inset-0 bg-neutral-900/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <span className="text-xs text-neutral-300 font-medium">Preview</span>
                        </div>
                      )}
                    </div>
                    
                    <span className="mt-3 block text-sm font-medium text-white">
                      {TEMPLATE_LABELS[t]}
                    </span>
                    <span className="mt-1 block text-xs text-neutral-400">
                      {LOGO_POSITION_LABEL[pos] ?? pos}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {tab === "configuration" && (
          <section>
            <h2 className="text-lg font-medium text-white">Invoice configuration</h2>
            <p className="mt-1 text-sm text-neutral-400">Default settings used when creating new invoices.</p>
            <div className="mt-4 space-y-6">
              <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-4">
                <h3 className="text-sm font-medium text-white">Invoice numbering</h3>
                <p className="mt-1 text-xs text-neutral-400">
                  Use {"{YYYY}"} for year and {"{000}"} for the next number. Example: <code className="rounded bg-neutral-800 px-1">INV-{"{YYYY}"}-{"{000}"}</code> → INV-2026-005.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Number format</label>
                    <input
                      type="text"
                      value={settings.invoiceDefaults.numberFormat}
                      onChange={(e) =>
                        updateSettings({
                          invoiceDefaults: { ...settings.invoiceDefaults, numberFormat: e.target.value },
                        })
                      }
                      className={inputClass}
                      placeholder="INV-{YYYY}-{000}"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Next number</label>
                    <input
                      type="number"
                      min={1}
                      value={settings.invoiceDefaults.nextNumber}
                      onChange={(e) =>
                        updateSettings({
                          invoiceDefaults: { ...settings.invoiceDefaults, nextNumber: Number(e.target.value) || 1 },
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-4">
                <h3 className="text-sm font-medium text-white">Payment defaults</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Default payment terms</label>
                    <select
                      value={settings.invoiceDefaults.defaultPaymentTerms}
                      onChange={(e) =>
                        updateSettings({
                          invoiceDefaults: {
                            ...settings.invoiceDefaults,
                            defaultPaymentTerms: e.target.value as PaymentTerm,
                          },
                        })
                      }
                      className={inputClass}
                    >
                      {PAYMENT_TERMS_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Default currency</label>
                    <select
                      value={settings.invoiceDefaults.defaultCurrency}
                      onChange={(e) =>
                        updateSettings({
                          invoiceDefaults: {
                            ...settings.invoiceDefaults,
                            defaultCurrency: e.target.value as Currency,
                          },
                        })
                      }
                      className={inputClass}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-4">
                <h3 className="text-sm font-medium text-white">Tax and fees</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Default late fee %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={settings.invoiceDefaults.defaultLateFeePercent}
                      onChange={(e) =>
                        updateSettings({
                          invoiceDefaults: {
                            ...settings.invoiceDefaults,
                            defaultLateFeePercent: Number(e.target.value) || 0,
                          },
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Default tax rate %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={settings.invoiceDefaults.defaultTaxRate}
                      onChange={(e) =>
                        updateSettings({
                          invoiceDefaults: {
                            ...settings.invoiceDefaults,
                            defaultTaxRate: Number(e.target.value) || 0,
                          },
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className={labelClass}>Default tax name</label>
                  <input
                    type="text"
                    value={settings.invoiceDefaults.defaultTaxName}
                    onChange={(e) =>
                      updateSettings({
                        invoiceDefaults: { ...settings.invoiceDefaults, defaultTaxName: e.target.value },
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <label className="mt-4 flex items-center gap-2">
                  <Toggle
                    checked={settings.invoiceDefaults.displayTaxId}
                    onChange={(v) =>
                      updateSettings({
                        invoiceDefaults: { ...settings.invoiceDefaults, displayTaxId: v },
                      })
                    }
                    aria-label="Show tax ID on invoices by default"
                  />
                  <span className="text-sm text-neutral-300">Show tax ID on invoices by default</span>
                </label>
              </div>
            </div>
          </section>
        )}

        {tab === "display" && (
          <InvoiceListColumnsSection
            columns={settings.invoiceListColumns ?? defaultSettings.invoiceListColumns ?? []}
            onUpdate={(invoiceListColumns) => updateSettings({ invoiceListColumns })}
            labelClass={labelClass}
          />
        )}

        {tab === "email" && (
          <section>
            <h2 className="text-lg font-medium text-white">Email templates</h2>
            <p className="mt-1 text-sm text-neutral-400">Used when sending invoices. Use {"{invoiceNumber}"} and {"{businessName}"} as placeholders.</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className={labelClass}>Invoice email subject</label>
                <input
                  type="text"
                  value={settings.email.invoiceSubject}
                  onChange={(e) => updateSettings({ email: { ...settings.email, invoiceSubject: e.target.value } })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Invoice email body</label>
                <textarea
                  value={settings.email.invoiceBody}
                  onChange={(e) => updateSettings({ email: { ...settings.email, invoiceBody: e.target.value } })}
                  rows={3}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Reminder subject</label>
                <input
                  type="text"
                  value={settings.email.reminderSubject}
                  onChange={(e) => updateSettings({ email: { ...settings.email, reminderSubject: e.target.value } })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Reminder body</label>
                <textarea
                  rows={3}
                  value={settings.email.reminderBody}
                  onChange={(e) => updateSettings({ email: { ...settings.email, reminderBody: e.target.value } })}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-neutral-500">Use {"{invoiceNumber}"} as placeholder.</p>
              </div>
              <div className="border-t border-neutral-700 pt-4 mt-4">
                <h3 className="text-sm font-medium text-neutral-300">Reminder schedule</h3>
                <p className="mt-1 text-xs text-neutral-500">When to send payment reminders for overdue invoices.</p>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className={labelClass}>First reminder (days after due date)</label>
                    <input
                      type="number"
                      min={0}
                      value={(settings.reminders ?? defaultReminderSettings).firstReminderDaysAfterDue}
                      onChange={(e) => updateSettings({ reminders: { ...(settings.reminders ?? defaultReminderSettings), firstReminderDaysAfterDue: Math.max(0, parseInt(e.target.value, 10) || 0) } })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Repeat reminder every (days)</label>
                    <input
                      type="number"
                      min={1}
                      value={(settings.reminders ?? defaultReminderSettings).reminderRepeatDays}
                      onChange={(e) => updateSettings({ reminders: { ...(settings.reminders ?? defaultReminderSettings), reminderRepeatDays: Math.max(1, parseInt(e.target.value, 10) || 1) } })}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Toggle
                      checked={(settings.reminders ?? defaultReminderSettings).autoRemindersEnabled}
                      onChange={(v) => updateSettings({ reminders: { ...(settings.reminders ?? defaultReminderSettings), autoRemindersEnabled: v } })}
                    />
                    <span className="text-sm text-neutral-300">Show overdue invoices due for reminder</span>
                  </div>
                </div>
              </div>
              <div>
                <label className={labelClass}>Thank you email subject</label>
                <input
                  type="text"
                  value={settings.email.thankYouSubject}
                  onChange={(e) => updateSettings({ email: { ...settings.email, thankYouSubject: e.target.value } })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email signature</label>
                <textarea
                  value={settings.email.signature}
                  onChange={(e) => updateSettings({ email: { ...settings.email, signature: e.target.value } })}
                  rows={3}
                  className={inputClass}
                />
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function InvoiceSettingsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-6 py-8 text-neutral-400">Loading...</div>}>
      <InvoiceSettingsContent />
    </Suspense>
  );
}

function InvoiceListColumnsSection({
  columns,
  onUpdate,
  labelClass,
}: {
  columns: string[];
  onUpdate: (columns: string[]) => void;
  labelClass: string;
}) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= columns.length) return;
    const next = [...columns];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);
    onUpdate(next);
  };

  const remove = (index: number) => {
    onUpdate(columns.filter((_, i) => i !== index));
  };

  const add = (columnId: string) => {
    if (columns.includes(columnId)) return;
    onUpdate([...columns, columnId]);
  };

  const availableToAdd = INVOICE_LIST_COLUMN_IDS.filter((id) => !columns.includes(id));

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (toIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const fromIndex = draggedIndex ?? parseInt(e.dataTransfer.getData("text/plain"), 10);
    setDraggedIndex(null);
    if (Number.isNaN(fromIndex) || fromIndex === toIndex) return;
    move(fromIndex, toIndex);
  };

  return (
    <section>
      <h2 className="text-lg font-medium text-white">Invoice list columns</h2>
      <p className="mt-1 text-sm text-neutral-400">
        Drag to reorder columns on the Invoices dashboard. Remove or add fields below.
      </p>
      <ul className="mt-4 space-y-2">
        {columns.map((colId, index) => (
          <li
            key={colId}
            draggable
            onDragStart={handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={handleDrop(index)}
            onDragEnd={() => setDraggedIndex(null)}
            className={`flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800/50 p-3 ${draggedIndex === index ? "opacity-50" : ""}`}
          >
            <span className="cursor-grab text-neutral-500" aria-hidden>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
            </span>
            <span className="font-medium text-white">{INVOICE_LIST_COLUMN_LABELS[colId] ?? colId}</span>
            <button
              type="button"
              onClick={() => remove(index)}
              className="ml-auto rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-red-400"
              aria-label={`Remove ${INVOICE_LIST_COLUMN_LABELS[colId]}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </li>
        ))}
      </ul>
      {availableToAdd.length > 0 && (
        <div className="mt-4">
          <label className={labelClass}>Add column</label>
          <select
            className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white"
            value=""
            onChange={(e) => {
              const v = e.target.value;
              if (v) add(v);
              e.target.value = "";
            }}
          >
            <option value="">—</option>
            {availableToAdd.map((id) => (
              <option key={id} value={id}>{INVOICE_LIST_COLUMN_LABELS[id] ?? id}</option>
            ))}
          </select>
        </div>
      )}
    </section>
  );
}
