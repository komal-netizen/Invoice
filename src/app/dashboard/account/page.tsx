"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { Toggle } from "@/components/Toggle";
import type { PaymentTerm, Currency, CustomFieldType, BankAccount, TeamRoleDefinition } from "@/lib/types";
import { PAYMENT_TERMS_OPTIONS, CURRENCIES, CUSTOM_FIELD_TYPES, INVOICE_LIST_COLUMN_IDS, INVOICE_LIST_COLUMN_LABELS } from "@/lib/types";
import { defaultReminderSettings, defaultSettings } from "@/lib/defaults";
import { v4 as uuid } from "uuid";

const DEFAULT_CLIENT_TAGS = ["VIP", "Regular", "Retainer", "One-time"];

const TABS = [
  { id: "business", label: "Business information" },
  { id: "branding", label: "Branding" },
  { id: "payment", label: "Payment integrations" },
  { id: "terms", label: "Terms and conditions" },
  { id: "team", label: "Team & Labels" },
] as const;

const PAYMENT_METHOD_PLACEHOLDERS: Record<string, string> = {
  paypal: "PayPal email or link",
  wise: "Wise link or email",
  stripe: "Linked via STRIPE_SECRET_KEY in .env",
  bank: "Add bank accounts below",
  other: "Details (e.g. Venmo, Zelle)",
};

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500";
const labelClass = "block text-sm font-medium text-neutral-300";

function AccountPageContent() {
  const searchParams = useSearchParams();
  const settings = useStore((s) => s.settings ?? defaultSettings);
  const updateSettings = useStore((s) => s.updateSettings);
  const customFieldDefinitions = useStore((s) => s.customFieldDefinitions);
  const addCustomFieldDefinition = useStore((s) => s.addCustomFieldDefinition);
  const updateCustomFieldDefinition = useStore((s) => s.updateCustomFieldDefinition);
  const deleteCustomFieldDefinition = useStore((s) => s.deleteCustomFieldDefinition);
  const serviceCustomFieldDefinitions = useStore((s) => s.serviceCustomFieldDefinitions);
  const addServiceCustomFieldDefinition = useStore((s) => s.addServiceCustomFieldDefinition);
  const updateServiceCustomFieldDefinition = useStore((s) => s.updateServiceCustomFieldDefinition);
  const deleteServiceCustomFieldDefinition = useStore((s) => s.deleteServiceCustomFieldDefinition);
  const addTeamRole = useStore((s) => s.addTeamRole);
  const updateTeamRole = useStore((s) => s.updateTeamRole);
  const deleteTeamRole = useStore((s) => s.deleteTeamRole);

  const tabFromUrl = searchParams.get("tab");
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("business");
  useEffect(() => {
    if (tabFromUrl && TABS.some((t) => t.id === tabFromUrl)) setTab(tabFromUrl as (typeof TABS)[number]["id"]);
  }, [tabFromUrl]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-white">Account Settings</h1>
      <p className="mt-1 text-sm text-neutral-400">Manage your business information, branding, payment methods, and terms. For invoice-specific settings, visit <Link href="/dashboard/settings" className="text-orange-400 hover:underline">Invoice Settings</Link>.</p>

      <div className="mt-6 flex gap-1 rounded-lg border border-neutral-800 bg-neutral-900 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
              tab === t.id ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "business" && (
          <section>
            <h2 className="text-lg font-medium text-white">Business information</h2>
            <p className="mt-1 text-sm text-neutral-400">Shown on all invoices.</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className={labelClass}>Business name</label>
                <input
                  type="text"
                  value={settings.business.name}
                  onChange={(e) => updateSettings({ business: { ...settings.business, name: e.target.value } })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <input
                  type="text"
                  value={settings.business.address.street}
                  onChange={(e) =>
                    updateSettings({
                      business: {
                        ...settings.business,
                        address: { ...settings.business.address, street: e.target.value },
                      },
                    })
                  }
                  className={inputClass}
                  placeholder="Street"
                />
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <input
                    value={settings.business.address.city}
                    onChange={(e) =>
                      updateSettings({
                        business: {
                          ...settings.business,
                          address: { ...settings.business.address, city: e.target.value },
                        },
                      })
                    }
                    className={inputClass}
                    placeholder="City"
                  />
                  <input
                    value={settings.business.address.state}
                    onChange={(e) =>
                      updateSettings({
                        business: {
                          ...settings.business,
                          address: { ...settings.business.address, state: e.target.value },
                        },
                      })
                    }
                    className={inputClass}
                    placeholder="State"
                  />
                  <input
                    value={settings.business.address.zip}
                    onChange={(e) =>
                      updateSettings({
                        business: {
                          ...settings.business,
                          address: { ...settings.business.address, zip: e.target.value },
                        },
                      })
                    }
                    className={inputClass}
                    placeholder="ZIP"
                  />
                </div>
                <input
                  value={settings.business.address.country}
                  onChange={(e) =>
                    updateSettings({
                      business: {
                        ...settings.business,
                        address: { ...settings.business.address, country: e.target.value },
                      },
                    })
                  }
                  className="mt-2 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500"
                  placeholder="Country"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    value={settings.business.email}
                    onChange={(e) => updateSettings({ business: { ...settings.business, email: e.target.value } })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input
                    type="tel"
                    value={settings.business.phone}
                    onChange={(e) => updateSettings({ business: { ...settings.business, phone: e.target.value } })}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Website</label>
                  <input
                    type="url"
                    value={settings.business.website}
                    onChange={(e) => updateSettings({ business: { ...settings.business, website: e.target.value } })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Tax ID / VAT</label>
                  <input
                    type="text"
                    value={settings.business.taxId}
                    onChange={(e) => updateSettings({ business: { ...settings.business, taxId: e.target.value } })}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-4">
                <h3 className="text-sm font-medium text-white">Company logo</h3>
                <p className="mt-1 text-xs text-neutral-400">This logo appears on invoices when you enable &quot;Show logo&quot; in the invoice editor.</p>
                <div className="mt-3 flex flex-wrap items-start gap-4">
                  {settings.business.logoUrl ? (
                    <div className="flex h-16 w-32 shrink-0 items-center justify-center overflow-hidden rounded border border-neutral-600 bg-neutral-900">
                      <img src={settings.business.logoUrl} alt="Company logo" className="max-h-14 w-auto max-w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <label className={labelClass}>Logo image URL</label>
                    <input
                      type="url"
                      value={settings.business.logoUrl ?? ""}
                      onChange={(e) =>
                        updateSettings({
                          business: { ...settings.business, logoUrl: e.target.value.trim() || undefined },
                        })
                      }
                      className={inputClass}
                      placeholder="https://yoursite.com/logo.png"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-8 border-t border-neutral-800 pt-8">
                <h3 className="text-sm font-medium text-white">Default invoice settings</h3>
                <p className="mt-1 text-xs text-neutral-400">Used when creating new invoices.</p>
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

        {tab === "payment" && (
          <section>
            <h2 className="text-lg font-medium text-white">Payment integrations</h2>
            <p className="mt-1 text-sm text-neutral-400">Configure which payment methods to offer. Details appear on invoices.</p>
            <p className="mt-2 text-xs text-neutral-500">To accept payments and send invoices from the platform: add <code className="rounded bg-neutral-800 px-1">STRIPE_SECRET_KEY</code> and optionally <code className="rounded bg-neutral-800 px-1">RESEND_API_KEY</code> in <code className="rounded bg-neutral-800 px-1">.env.local</code> (see .env.local.example).</p>
            <ul className="mt-4 space-y-3">
              {(defaultSettings.paymentMethods.map((d) => {
                const pm = (settings.paymentMethods ?? []).find((p) => p.id === d.id);
                return pm ? { ...d, ...pm } : d;
              })).map((pm) => (
                <li
                  key={pm.id}
                  className="flex flex-wrap items-center gap-4 rounded-lg border border-neutral-700 bg-neutral-800/50 p-3"
                >
                  <label className="flex items-center gap-2">
                    <Toggle
                      checked={pm.enabled}
                      onChange={(v) => {
                        const current = defaultSettings.paymentMethods.map((d) => (settings.paymentMethods ?? []).find((p) => p.id === d.id) ? { ...d, ...(settings.paymentMethods ?? []).find((p) => p.id === d.id)! } : d);
                        const next = current.map((p) => (p.id === pm.id ? { ...p, enabled: v } : p));
                        updateSettings({ paymentMethods: next });
                      }}
                      aria-label={`Enable ${pm.name}`}
                    />
                    <span className="text-sm font-medium text-white">{pm.name}</span>
                  </label>
                  {"details" in pm && pm.id !== "bank" && (
                    <input
                      type="text"
                      value={pm.details ?? ""}
                      onChange={(e) => {
                        const current = defaultSettings.paymentMethods.map((d) => (settings.paymentMethods ?? []).find((p) => p.id === d.id) ? { ...d, ...(settings.paymentMethods ?? []).find((p) => p.id === d.id)! } : d);
                        const next = current.map((p) => (p.id === pm.id ? { ...p, details: e.target.value } : p));
                        updateSettings({ paymentMethods: next });
                      }}
                      className="min-w-[200px] flex-1 rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-sm text-white placeholder:text-neutral-500"
                      placeholder={PAYMENT_METHOD_PLACEHOLDERS[pm.id] ?? "Account details or email"}
                    />
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <h3 className="text-sm font-medium text-white">Bank accounts</h3>
              <p className="mt-1 text-xs text-neutral-400">Shown on invoices when Bank Transfer is enabled. Add one or more accounts.</p>
              {(settings.bankAccounts ?? []).map((acc) => (
                <div
                  key={acc.id}
                  className="mt-3 rounded-lg border border-neutral-700 bg-neutral-800/50 p-4 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white">{acc.accountName || "Bank account"}</span>
                    <button
                      type="button"
                      onClick={() => updateSettings({ bankAccounts: (settings.bankAccounts ?? []).filter((a) => a.id !== acc.id) })}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Account name</label>
                      <input
                        value={acc.accountName}
                        onChange={(e) => updateSettings({
                          bankAccounts: (settings.bankAccounts ?? []).map((a) =>
                            a.id === acc.id ? { ...a, accountName: e.target.value } : a
                          ),
                        })}
                        className={inputClass}
                        placeholder="e.g. My Business Ltd"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Bank name</label>
                      <input
                        value={acc.bankName}
                        onChange={(e) => updateSettings({
                          bankAccounts: (settings.bankAccounts ?? []).map((a) =>
                            a.id === acc.id ? { ...a, bankName: e.target.value } : a
                          ),
                        })}
                        className={inputClass}
                        placeholder="e.g. Chase Bank"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Account number</label>
                      <input
                        value={acc.accountNumber ?? ""}
                        onChange={(e) => updateSettings({
                          bankAccounts: (settings.bankAccounts ?? []).map((a) =>
                            a.id === acc.id ? { ...a, accountNumber: e.target.value || undefined } : a
                          ),
                        })}
                        className={inputClass}
                        placeholder="Account number"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Sort code</label>
                      <input
                        value={acc.sortCode ?? ""}
                        onChange={(e) => updateSettings({
                          bankAccounts: (settings.bankAccounts ?? []).map((a) =>
                            a.id === acc.id ? { ...a, sortCode: e.target.value || undefined } : a
                          ),
                        })}
                        className={inputClass}
                        placeholder="e.g. 12-34-56 (UK)"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Routing number</label>
                      <input
                        value={acc.routingNumber ?? ""}
                        onChange={(e) => updateSettings({
                          bankAccounts: (settings.bankAccounts ?? []).map((a) =>
                            a.id === acc.id ? { ...a, routingNumber: e.target.value || undefined } : a
                          ),
                        })}
                        className={inputClass}
                        placeholder="e.g. US routing number"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>IBAN</label>
                      <input
                        value={acc.iban ?? ""}
                        onChange={(e) => updateSettings({
                          bankAccounts: (settings.bankAccounts ?? []).map((a) =>
                            a.id === acc.id ? { ...a, iban: e.target.value || undefined } : a
                          ),
                        })}
                        className={inputClass}
                        placeholder="IBAN (international)"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>SWIFT / BIC</label>
                      <input
                        value={acc.swift ?? ""}
                        onChange={(e) => updateSettings({
                          bankAccounts: (settings.bankAccounts ?? []).map((a) =>
                            a.id === acc.id ? { ...a, swift: e.target.value || undefined } : a
                          ),
                        })}
                        className={inputClass}
                        placeholder="SWIFT/BIC code"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Other details</label>
                    <textarea
                      value={acc.otherDetails ?? ""}
                      onChange={(e) => updateSettings({
                        bankAccounts: (settings.bankAccounts ?? []).map((a) =>
                          a.id === acc.id ? { ...a, otherDetails: e.target.value || undefined } : a
                        ),
                      })}
                      rows={2}
                      className={inputClass}
                      placeholder="Reference, branch, etc."
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => updateSettings({
                  bankAccounts: [...(settings.bankAccounts ?? []), { id: uuid(), accountName: "", bankName: "", accountNumber: "", sortCode: "", iban: "", swift: "", routingNumber: "", otherDetails: "" }],
                })}
                className="mt-3 rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
              >
                + Add bank account
              </button>
            </div>
          </section>
        )}

        {tab === "terms" && (
          <section>
            <h2 className="text-lg font-medium text-white">Terms and conditions</h2>
            <p className="mt-1 text-sm text-neutral-400">Default terms and conditions applied to new invoices. You can edit per invoice in the invoice editor.</p>
            <div className="mt-4">
              <label className={labelClass}>Default terms and conditions</label>
              <textarea
                value={settings.invoiceDefaults?.defaultTermsAndConditions ?? ""}
                onChange={(e) => updateSettings({
                  invoiceDefaults: {
                    ...settings.invoiceDefaults,
                    defaultTermsAndConditions: e.target.value,
                  },
                })}
                rows={10}
                className={inputClass}
                placeholder="e.g. Payment is due within 30 days. Late payments may incur a 5% fee..."
              />
            </div>
          </section>
        )}

        {tab === "team" && (
          <>
            <TeamRolesSection
              roles={settings.teamRoles ?? defaultSettings.teamRoles ?? []}
              onAdd={(name, color) => addTeamRole({ name, color })}
              onUpdate={(id, data) => updateTeamRole(id, data)}
              onDelete={(id) => deleteTeamRole(id)}
              inputClass={inputClass}
              labelClass={labelClass}
            />
            
            <section className="mt-8">
              <h2 className="text-lg font-medium text-white">Project team labels</h2>
              <p className="mt-1 text-sm text-neutral-400">
                Custom labels for the two lead slots on project detail pages (e.g. "Account Lead", "Creative Lead"). Leave blank to use defaults.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>First lead role label</label>
                  <input
                    type="text"
                    value={settings.projectLeadLabels?.projectManager ?? ""}
                    onChange={(e) =>
                      updateSettings({
                        projectLeadLabels: {
                          ...settings.projectLeadLabels,
                          projectManager: e.target.value.trim() || undefined,
                        },
                      })
                    }
                    className={inputClass}
                    placeholder="Project Manager"
                  />
                </div>
                <div>
                  <label className={labelClass}>Second lead role label</label>
                  <input
                    type="text"
                    value={settings.projectLeadLabels?.leadDeveloper ?? ""}
                    onChange={(e) =>
                      updateSettings({
                        projectLeadLabels: {
                          ...settings.projectLeadLabels,
                          leadDeveloper: e.target.value.trim() || undefined,
                        },
                      })
                    }
                    className={inputClass}
                    placeholder="Lead Developer"
                  />
                </div>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-medium text-white">Navigation labels</h2>
              <p className="mt-1 text-sm text-neutral-400">
                Customize section labels in the sidebar and page titles (e.g. "Studio" instead of "Team"). Leave blank to use defaults.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Team section name</label>
                  <input
                    type="text"
                    value={settings.teamSectionLabel ?? ""}
                    onChange={(e) =>
                      updateSettings({
                        teamSectionLabel: e.target.value.trim() || undefined,
                      })
                    }
                    className={inputClass}
                    placeholder="Team"
                  />
                  <p className="mt-1 text-xs text-neutral-500">Used in sidebar and Team page title</p>
                </div>
                <div>
                  <label className={labelClass}>My Tasks link name</label>
                  <input
                    type="text"
                    value={settings.myTasksLabel ?? ""}
                    onChange={(e) =>
                      updateSettings({
                        myTasksLabel: e.target.value.trim() || undefined,
                      })
                    }
                    className={inputClass}
                    placeholder="My Tasks"
                  />
                  <p className="mt-1 text-xs text-neutral-500">Used in sidebar and My Tasks page title</p>
                </div>
              </div>
            </section>
          </>
        )}

        {tab === "branding" && (
          <section>
            <h2 className="text-lg font-medium text-white">Branding</h2>
            <p className="mt-1 text-sm text-neutral-400">Colors, fonts, and text used across your platform and invoices.</p>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-white mb-3">Brand Colors</h3>
                <div className="flex flex-wrap gap-6">
                  <div>
                    <label className={labelClass}>Primary color</label>
                    <div className="mt-1 flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                        className="h-10 w-20 cursor-pointer rounded border border-neutral-600 bg-neutral-800"
                      />
                      <input
                        type="text"
                        value={settings.primaryColor}
                        onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                        className="w-32 rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Secondary color</label>
                    <div className="mt-1 flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => updateSettings({ secondaryColor: e.target.value })}
                        className="h-10 w-20 cursor-pointer rounded border border-neutral-600 bg-neutral-800"
                      />
                      <input
                        type="text"
                        value={settings.secondaryColor}
                        onChange={(e) => updateSettings({ secondaryColor: e.target.value })}
                        className="w-32 rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white mb-3">Typography</h3>
                <div>
                  <label className={labelClass}>Font family</label>
                  <select
                    value={settings.fontFamily || "system-ui"}
                    onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                    className={inputClass}
                  >
                    <optgroup label="System Fonts">
                      <option value="system-ui">System Default</option>
                    </optgroup>
                    <optgroup label="Modern & Clean">
                      <option value="Inter">Inter - Modern, versatile</option>
                      <option value="Plus Jakarta Sans">Plus Jakarta Sans - Geometric, friendly</option>
                      <option value="Manrope">Manrope - Balanced, professional</option>
                      <option value="DM Sans">DM Sans - Clean, readable</option>
                      <option value="Work Sans">Work Sans - Contemporary</option>
                    </optgroup>
                    <optgroup label="Creative & Bold">
                      <option value="Outfit">Outfit - Bold, geometric</option>
                      <option value="Space Grotesk">Space Grotesk - Modern, unique</option>
                      <option value="Sora">Sora - Tech-forward</option>
                    </optgroup>
                    <optgroup label="Elegant & Serif">
                      <option value="Playfair Display">Playfair Display - Elegant, high-contrast</option>
                      <option value="Crimson Pro">Crimson Pro - Classic, sophisticated</option>
                      <option value="Lora">Lora - Balanced serif</option>
                    </optgroup>
                  </select>
                  <p className="mt-2 text-xs text-neutral-400">
                    Font preview: <span style={{ fontFamily: settings.fontFamily || "system-ui" }} className="font-medium">The quick brown fox jumps over the lazy dog</span>
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white mb-3">Invoice Text</h3>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Header text</label>
                    <input
                      type="text"
                      value={settings.headerText}
                      onChange={(e) => updateSettings({ headerText: e.target.value })}
                      className={inputClass}
                      placeholder="Appears at the top of invoices"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Footer text</label>
                    <input
                      type="text"
                      value={settings.footerText}
                      onChange={(e) => updateSettings({ footerText: e.target.value })}
                      className={inputClass}
                      placeholder="Appears at the bottom of invoices"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-6 py-8 text-neutral-400">Loading...</div>}>
      <AccountPageContent />
    </Suspense>
  );
}

function ClientTagsSection({
  tags,
  onUpdate,
  inputClass,
  labelClass,
}: {
  tags: string[];
  onUpdate: (tags: string[]) => void;
  inputClass: string;
  labelClass: string;
}) {
  const [newTag, setNewTag] = useState("");

  const handleAdd = () => {
    const t = newTag.trim();
    if (!t || tags.includes(t)) return;
    onUpdate([...tags, t]);
    setNewTag("");
  };

  const handleRemove = (tag: string) => {
    onUpdate(tags.filter((x) => x !== tag));
  };

  return (
    <section>
      <h2 className="text-lg font-medium text-white">Client tags</h2>
      <p className="mt-1 text-sm text-neutral-400">Tags available when editing clients. Add or remove tags.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-neutral-700 px-3 py-1 text-sm text-white"
          >
            {tag}
            <button
              type="button"
              onClick={() => handleRemove(tag)}
              className="ml-1 rounded hover:bg-neutral-600 p-0.5"
              aria-label={`Remove ${tag}`}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </span>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
          className={inputClass}
          placeholder="New tag name"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
        >
          Add tag
        </button>
      </div>
    </section>
  );
}

function TeamRolesSection({
  roles,
  onAdd,
  onUpdate,
  onDelete,
  inputClass,
  labelClass,
}: {
  roles: TeamRoleDefinition[];
  onAdd: (name: string, color?: string) => void;
  onUpdate: (id: string, data: Partial<Pick<TeamRoleDefinition, "name" | "color">>) => void;
  onDelete: (id: string) => void;
  inputClass: string;
  labelClass: string;
}) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    onAdd(name, newColor || undefined);
    setNewName("");
    setNewColor("#6366f1");
  };

  const startEdit = (r: TeamRoleDefinition) => {
    setEditingId(r.id);
    setEditName(r.name);
    setEditColor(r.color ?? "");
  };

  const saveEdit = () => {
    if (editingId) {
      onUpdate(editingId, { name: editName.trim() || undefined, color: editColor.trim() || undefined });
      setEditingId(null);
    }
  };

  return (
    <section>
      <h2 className="text-lg font-medium text-white">Team roles</h2>
      <p className="mt-1 text-sm text-neutral-400">
        Roles shown when adding or editing team members (e.g. Creative Director, Designer). Add, edit, or remove. Optional color is used on the Team page.
      </p>
      <div className="mt-4 space-y-2">
        {roles.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2"
          >
            {editingId === r.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={inputClass + " flex-1"}
                  placeholder="Role name"
                  aria-label="Role name"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editColor || "#6366f1"}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded border border-neutral-600 bg-neutral-800"
                    aria-label="Role color"
                  />
                  <input
                    type="text"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className={inputClass + " w-24"}
                    placeholder="#6366f1"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    aria-label="Role color hex"
                  />
                </div>
                <button type="button" onClick={saveEdit} className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm text-white hover:bg-orange-400">
                  Save
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="rounded-lg border border-neutral-600 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-700">
                  Cancel
                </button>
              </>
            ) : (
              <>
                {r.color && (
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border border-neutral-600"
                    style={{ backgroundColor: r.color }}
                    title={r.color}
                  />
                )}
                <span className="flex-1 font-medium text-white">{r.name}</span>
                <button type="button" onClick={() => startEdit(r)} className="text-sm text-orange-400 hover:underline">
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      if (window.confirm(`Remove "${r.name}"? Team members with this role will have their role cleared.`)) {
                        onDelete(r.id);
                      }
                    }
                  }}
                  className="text-sm text-red-400 hover:underline"
                  aria-label={`Remove ${r.name} role`}
                >
                  Remove
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-neutral-700 bg-neutral-900/50 p-4">
        <h3 className="text-sm font-medium text-white mb-3">Add New Role</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-neutral-400 mb-1">Role Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
              className={inputClass}
              placeholder="e.g. Creative Director"
              aria-label="New role name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="h-10 w-12 cursor-pointer rounded border border-neutral-600 bg-neutral-800"
                title="Pick a color"
                aria-label="Role color picker"
              />
              <input
                type="text"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className={inputClass + " w-28"}
                placeholder="#6366f1"
                pattern="^#[0-9A-Fa-f]{6}$"
                aria-label="Role color hex code"
              />
            </div>
          </div>
          <button type="button" onClick={handleAdd} className="rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-400">
            Add role
          </button>
        </div>
        <p className="mt-2 text-xs text-neutral-500">Hex format: #6366f1 (or use color picker)</p>
      </div>
    </section>
  );
}

function ClientCodeStructureSection({
  format,
  nextNumber,
  onUpdate,
  inputClass,
  labelClass,
}: {
  format: string;
  nextNumber: number;
  onUpdate: (format: string, nextNumber: number) => void;
  inputClass: string;
  labelClass: string;
}) {
  return (
    <section>
      <h2 className="text-lg font-medium text-white">Client code structure</h2>
      <p className="mt-1 text-sm text-neutral-400">
        Every new client gets a unique code. Use {"{000}"} for the next number and {"{YYYY}"} for the year. Example: <code className="rounded bg-neutral-800 px-1">C-{"{000}"}</code> → C-001, or <code className="rounded bg-neutral-800 px-1">CL-{"{YYYY}"}-{"{000}"}</code> → CL-2026-001.
      </p>
      <div className="mt-4 space-y-4">
        <div>
          <label className={labelClass}>Format</label>
          <input
            type="text"
            value={format}
            onChange={(e) => onUpdate(e.target.value, nextNumber)}
            className={inputClass}
            placeholder="C-{000}"
          />
        </div>
        <div>
          <label className={labelClass}>Next number (used for the next new client)</label>
          <input
            type="number"
            min={1}
            value={nextNumber}
            onChange={(e) => onUpdate(format, Math.max(1, parseInt(e.target.value, 10) || 1))}
            className={inputClass}
          />
        </div>
      </div>
    </section>
  );
}

function InvoiceNumberStructureSection({
  numberFormat,
  nextNumber,
  onUpdate,
  inputClass,
  labelClass,
}: {
  numberFormat: string;
  nextNumber: number;
  onUpdate: (numberFormat: string, nextNumber: number) => void;
  inputClass: string;
  labelClass: string;
}) {
  return (
    <section>
      <h2 className="text-lg font-medium text-white">Invoice number structure</h2>
      <p className="mt-1 text-sm text-neutral-400">
        When you create a new invoice, this format is used. Use {"{YYYY}"} for year and {"{000}"} for the next number. Example: <code className="rounded bg-neutral-800 px-1">INV-{"{YYYY}"}-{"{000}"}</code> → INV-2026-005.
      </p>
      <div className="mt-4 space-y-4">
        <div>
          <label className={labelClass}>Number format</label>
          <input
            type="text"
            value={numberFormat}
            onChange={(e) => onUpdate(e.target.value, nextNumber)}
            className={inputClass}
            placeholder="INV-{YYYY}-{000}"
          />
        </div>
        <div>
          <label className={labelClass}>Next number (used for the next new invoice)</label>
          <input
            type="number"
            min={1}
            value={nextNumber}
            onChange={(e) => onUpdate(numberFormat, Math.max(1, parseInt(e.target.value, 10) || 1))}
            className={inputClass}
          />
        </div>
      </div>
    </section>
  );
}

function InvoiceListColumnsSection({
  columns,
  onUpdate,
  labelClass,
}: {
  columns: string[];
  onUpdate: (columns: string[]) => void;
  inputClass: string;
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

function ClientFormFieldsSection({
  definitions,
  onAdd,
  onUpdate,
  onDelete,
  inputClass,
  labelClass,
  title = "Client form fields",
  description = "Custom fields shown on client profiles. Add, edit, or remove fields.",
}: {
  definitions: { id: string; name: string; type: CustomFieldType; required: boolean; defaultValue?: string; options?: string[] }[];
  onAdd: (def: { name: string; type: CustomFieldType; required: boolean; defaultValue?: string; options?: string[] }) => void;
  onUpdate: (id: string, data: Partial<{ name: string; type: CustomFieldType; required: boolean; defaultValue?: string; options?: string[] }>) => void;
  onDelete: (id: string) => void;
  inputClass: string;
  labelClass: string;
  title?: string;
  description?: string;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<CustomFieldType>("text");
  const [newRequired, setNewRequired] = useState(false);
  const [newOptions, setNewOptions] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd({
      name: newName.trim(),
      type: newType,
      required: newRequired,
      options: newType === "dropdown" ? newOptions.split(",").map((o) => o.trim()).filter(Boolean) : undefined,
    });
    setNewName("");
    setNewType("text");
    setNewRequired(false);
    setNewOptions("");
    setAdding(false);
  };

  return (
    <section>
      <h2 className="text-lg font-medium text-white">{title}</h2>
      <p className="mt-1 text-sm text-neutral-400">{description}</p>
      <ul className="mt-4 space-y-2">
        {definitions.map((def) => (
          <li key={def.id} className="flex items-center justify-between rounded-lg border border-neutral-700 bg-neutral-800/50 p-3">
            <div>
              <span className="font-medium text-white">{def.name}</span>
              <span className="ml-2 text-xs text-neutral-400">({def.type}{def.required ? ", required" : ""})</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingId(editingId === def.id ? null : def.id)}
                className="text-sm text-orange-400 hover:underline"
              >
                {editingId === def.id ? "Done" : "Edit"}
              </button>
              <button
                type="button"
                onClick={() => onDelete(def.id)}
                className="text-sm text-red-400 hover:underline"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      {adding ? (
        <div className="mt-4 rounded-lg border border-neutral-700 bg-neutral-900 p-4 space-y-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className={inputClass}
            placeholder="Field name"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as CustomFieldType)}
            className={inputClass}
          >
            {CUSTOM_FIELD_TYPES.map((t) => (
              <option key={t} value={t}>{t === "longtext" ? "Long text" : t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          {newType === "dropdown" && (
            <input
              type="text"
              value={newOptions}
              onChange={(e) => setNewOptions(e.target.value)}
              className={inputClass}
              placeholder="Options (comma-separated)"
            />
          )}
          <label className="flex items-center gap-2">
            <Toggle checked={newRequired} onChange={setNewRequired} aria-label="Required" />
            <span className="text-sm text-neutral-300">Required</span>
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setAdding(false)} className="rounded-lg border border-neutral-600 px-4 py-2 text-sm text-white hover:bg-neutral-700">Cancel</button>
            <button type="button" onClick={handleAdd} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400">Add field</button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-4 rounded-lg border border-neutral-600 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          + Add custom field
        </button>
      )}
    </section>
  );
}
