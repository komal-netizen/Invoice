"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { NewClientModal } from "@/components/NewClientModal";
import { EmptyState } from "@/components/EmptyState";
import { Toggle } from "@/components/Toggle";
import type { ClientTag, CustomFieldType } from "@/lib/types";
import { CUSTOM_FIELD_TYPES } from "@/lib/types";
import { defaultSettings } from "@/lib/defaults";

const DEFAULT_TAGS = ["VIP", "Regular", "Retainer", "One-time"];

const AVAILABLE_CLIENT_FIELDS = [
  { id: "code", label: "Code" },
  { id: "company", label: "Company" },
  { id: "contact", label: "Contact" },
  { id: "email", label: "Email" },
  { id: "status", label: "Status" },
  { id: "tags", label: "Tags" },
  { id: "invoices", label: "Invoices" },
  { id: "outstanding", label: "Outstanding" },
] as const;

const DEFAULT_CLIENT_FIELDS = ["company", "contact", "email", "status"];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function escapeCsvCell(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (inQuotes) cur += c;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

export default function ClientsPage() {
  const [mounted, setMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [menuOpen, setMenuOpen] = useState(false);
  const [fieldsMenuOpen, setFieldsMenuOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [clientMenuOpen, setClientMenuOpen] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [importMessage, setImportMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  const clients = useStore((s) => s.clients);
  const addClient = useStore((s) => s.addClient);
  const deleteClient = useStore((s) => s.deleteClient);
  const invoices = useStore((s) => s.invoices);
  const settings = useStore((s) => s.settings ?? null);
  const updateSettings = useStore((s) => s.updateSettings);
  const customFieldDefinitions = useStore((s) => s.customFieldDefinitions);
  const addCustomFieldDefinition = useStore((s) => s.addCustomFieldDefinition);
  const updateCustomFieldDefinition = useStore((s) => s.updateCustomFieldDefinition);
  const deleteCustomFieldDefinition = useStore((s) => s.deleteCustomFieldDefinition);
  const clientTags = settings?.clientTags ?? DEFAULT_TAGS;
  const selectedFields = settings?.clientListFields ?? DEFAULT_CLIENT_FIELDS;

  const toggleField = (fieldId: string) => {
    const currentFields = settings?.clientListFields ?? DEFAULT_CLIENT_FIELDS;
    const newFields = currentFields.includes(fieldId)
      ? currentFields.filter((f) => f !== fieldId)
      : [...currentFields, fieldId];
    
    // Ensure at least one field is always selected
    if (newFields.length === 0) return;
    
    updateSettings({ clientListFields: newFields });
  };

  const clientStats = useMemo(() => {
    const map: Record<string, { totalInvoices: number; outstanding: number; totalPaid: number }> = {};
    for (const inv of invoices) {
      if (!map[inv.clientId]) map[inv.clientId] = { totalInvoices: 0, outstanding: 0, totalPaid: 0 };
      map[inv.clientId].totalInvoices += 1;
      if (inv.status === "paid") map[inv.clientId].totalPaid += inv.total;
      else if (inv.status !== "draft" && inv.status !== "scheduled") map[inv.clientId].outstanding += inv.total;
    }
    return map;
  }, [invoices]);

  const filtered = useMemo(() => {
    let list = clients;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.companyName.toLowerCase().includes(q) ||
          c.contactName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.code && c.code.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((c) => (c.status ?? "active") === statusFilter);
    }
    if (tagFilter !== "all") {
      list = list.filter((c) => c.tags.includes(tagFilter as ClientTag));
    }
    return list;
  }, [clients, search, statusFilter, tagFilter]);

  const allTags = useMemo(() => {
    const set = new Set<string>(clientTags);
    clients.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [clients, clientTags]);

  const hasActiveFilters = statusFilter !== "all" || tagFilter !== "all";

  const handleExportCsv = () => {
    const headers = ["Code", "Company", "Contact", "Email", "Phone", "Website", "Street", "City", "State", "ZIP", "Country", "Tax ID", "Tags"];
    const rows = clients.map((c) => [
      escapeCsvCell(c.code ?? ""),
      escapeCsvCell(c.companyName),
      escapeCsvCell(c.contactName),
      escapeCsvCell(c.email),
      escapeCsvCell(c.phone ?? ""),
      escapeCsvCell(c.website ?? ""),
      escapeCsvCell(c.address?.street ?? ""),
      escapeCsvCell(c.address?.city ?? ""),
      escapeCsvCell(c.address?.state ?? ""),
      escapeCsvCell(c.address?.zip ?? ""),
      escapeCsvCell(c.address?.country ?? ""),
      escapeCsvCell(c.taxId ?? ""),
      escapeCsvCell(c.tags.join("; ")),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        setImportMessage({ type: "err", text: "CSV must have a header row and at least one data row." });
        return;
      }
      const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
      const companyIdx = header.findIndex((h) => h === "company" || h === "companyname");
      const contactIdx = header.findIndex((h) => h === "contact" || h === "contactname");
      const emailIdx = header.findIndex((h) => h === "email");
      const phoneIdx = header.findIndex((h) => h === "phone");
      const websiteIdx = header.findIndex((h) => h === "website");
      const streetIdx = header.findIndex((h) => h === "street");
      const cityIdx = header.findIndex((h) => h === "city");
      const stateIdx = header.findIndex((h) => h === "state");
      const zipIdx = header.findIndex((h) => h === "zip" || h === "zip code");
      const countryIdx = header.findIndex((h) => h === "country");
      const taxIdIdx = header.findIndex((h) => h === "tax id" || h === "taxid");
      const tagsIdx = header.findIndex((h) => h === "tags");

      if (companyIdx === -1 || contactIdx === -1 || emailIdx === -1) {
        setImportMessage({ type: "err", text: "CSV must include Company, Contact, and Email columns." });
        return;
      }
      let added = 0;
      for (let i = 1; i < lines.length; i++) {
        const cells = parseCsvLine(lines[i]);
        const companyName = (cells[companyIdx] ?? "").trim();
        const contactName = (cells[contactIdx] ?? "").trim();
        const email = (cells[emailIdx] ?? "").trim();
        if (!companyName || !contactName || !email) continue;
        const tagsStr = (cells[tagsIdx] ?? "").trim();
        const tags = tagsStr ? tagsStr.split(/[;,]/).map((t) => t.trim()).filter(Boolean) : [];
        addClient({
          companyName,
          contactName,
          email,
          tags: tags as ClientTag[],
          phone: phoneIdx >= 0 && cells[phoneIdx] ? cells[phoneIdx].trim() || undefined : undefined,
          website: websiteIdx >= 0 && cells[websiteIdx] ? cells[websiteIdx].trim() || undefined : undefined,
          taxId: taxIdIdx >= 0 && cells[taxIdIdx] ? cells[taxIdIdx].trim() || undefined : undefined,
          address:
            (streetIdx >= 0 && cells[streetIdx]) || (cityIdx >= 0 && cells[cityIdx])
              ? {
                  street: streetIdx >= 0 ? cells[streetIdx].trim() : undefined,
                  city: cityIdx >= 0 ? cells[cityIdx].trim() : undefined,
                  state: stateIdx >= 0 ? cells[stateIdx].trim() : undefined,
                  zip: zipIdx >= 0 ? cells[zipIdx].trim() : undefined,
                  country: countryIdx >= 0 ? cells[countryIdx].trim() : undefined,
                }
              : undefined,
        });
        added++;
      }
      setImportMessage({ type: "ok", text: `Imported ${added} client(s).` });
      setMenuOpen(false);
    };
    reader.readAsText(file);
  };

  const inputClass =
    "rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500";
  const selectClass = "rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white";

  if (!mounted) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-white">Clients</h1>
        <div className="mt-8 flex min-h-[200px] items-center justify-center">
          <p className="text-neutral-500 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-white">Clients</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-neutral-600 bg-neutral-800/50 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-md p-2 ${viewMode === "grid" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white"}`}
              title="Grid view"
              aria-label="Grid view"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-md p-2 ${viewMode === "list" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white"}`}
              title="List view"
              aria-label="List view"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-400"
          >
            New Client
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-lg border border-neutral-600 bg-neutral-800 p-2 text-neutral-300 hover:bg-neutral-700 hover:text-white"
              aria-label="More actions"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" aria-hidden onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-neutral-700 bg-neutral-900 py-1 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setFieldsMenuOpen(true);
                      setMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-800"
                  >
                    Customize fields
                  </button>
                  <div className="my-1 border-t border-neutral-800" />
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-800"
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-800"
                  >
                    Import CSV
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleImportCsv}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsModalOpen(true);
                      setMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-800"
                  >
                    Client settings
                  </button>
                </div>
              </>
            )}
          </div>
          {fieldsMenuOpen && (
            <>
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-md rounded-xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Customize Fields</h3>
                    <button
                      type="button"
                      onClick={() => setFieldsMenuOpen(false)}
                      className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-neutral-400 mb-4">Select which fields to display in the client list</p>
                  <div className="space-y-1">
                    {AVAILABLE_CLIENT_FIELDS.map((field) => (
                      <button
                        key={field.id}
                        type="button"
                        onClick={() => toggleField(field.id)}
                        className="flex w-full items-center justify-between px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800 rounded-lg"
                      >
                        <span>{field.label}</span>
                        {selectedFields.includes(field.id) && (
                          <svg className="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {importMessage && (
        <p
          className={`mt-4 text-sm ${importMessage.type === "ok" ? "text-green-400" : "text-red-400"}`}
          role="alert"
        >
          {importMessage.text}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputClass}
        />
        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterMenuOpen(!filterMenuOpen)}
            className={`relative flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
              hasActiveFilters
                ? "border-orange-500 bg-orange-500 text-white hover:bg-orange-400"
                : "border-neutral-600 bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
            }`}
            title="Filter clients"
            aria-label="Filter clients"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-xs font-medium text-white">
                {(statusFilter !== "all" ? 1 : 0) + (tagFilter !== "all" ? 1 : 0)}
              </span>
            )}
          </button>
          {filterMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFilterMenuOpen(false)} />
              <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-lg border border-neutral-700 bg-neutral-900 py-2 shadow-xl max-h-96 overflow-y-auto">
                {/* Status Filter Section */}
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Filter by Status
                </div>
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${
                    statusFilter === "all"
                      ? "bg-orange-500/10 text-orange-400"
                      : "text-neutral-200 hover:bg-neutral-800"
                  }`}
                >
                  <span>All</span>
                  {statusFilter === "all" && (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("active")}
                  className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${
                    statusFilter === "active"
                      ? "bg-orange-500/10 text-orange-400"
                      : "text-neutral-200 hover:bg-neutral-800"
                  }`}
                >
                  <span>Active</span>
                  {statusFilter === "active" && (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("archived")}
                  className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${
                    statusFilter === "archived"
                      ? "bg-orange-500/10 text-orange-400"
                      : "text-neutral-200 hover:bg-neutral-800"
                  }`}
                >
                  <span>Archived</span>
                  {statusFilter === "archived" && (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Divider */}
                <div className="my-2 border-t border-neutral-800" />

                {/* Tag Filter Section */}
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Filter by Tag
                </div>
                <button
                  type="button"
                  onClick={() => setTagFilter("all")}
                  className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${
                    tagFilter === "all"
                      ? "bg-orange-500/10 text-orange-400"
                      : "text-neutral-200 hover:bg-neutral-800"
                  }`}
                >
                  <span>All tags</span>
                  {tagFilter === "all" && (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setTagFilter(tag)}
                    className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${
                      tagFilter === tag
                        ? "bg-orange-500/10 text-orange-400"
                        : "text-neutral-200 hover:bg-neutral-800"
                    }`}
                  >
                    <span>{tag}</span>
                    {tagFilter === tag && (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}

                {/* Clear All Filters */}
                {hasActiveFilters && (
                  <>
                    <div className="my-2 border-t border-neutral-800" />
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("all");
                        setTagFilter("all");
                      }}
                      className="w-full px-4 py-2 text-sm text-orange-400 hover:bg-neutral-800 text-center"
                    >
                      Clear all filters
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon={
              <svg className="h-8 w-8 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            }
            title={clients.length === 0 ? "No clients yet" : "No matching clients"}
            description={
              clients.length === 0
                ? "Start by adding your first client. Keep track of client information, manage projects, and create invoices all in one place."
                : "No clients match your current filters. Try adjusting your search criteria, status, or tag filters."
            }
            action={
              clients.length === 0
                ? {
                    label: "Add Your First Client",
                    onClick: () => setModalOpen(true),
                  }
                : undefined
            }
          />
        </div>
      ) : viewMode === "list" ? (
        <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-700 bg-neutral-800/50">
                {selectedFields.includes("code") && <th className="p-3 font-medium text-neutral-300">Code</th>}
                {selectedFields.includes("company") && <th className="p-3 font-medium text-neutral-300">Company</th>}
                {selectedFields.includes("contact") && <th className="p-3 font-medium text-neutral-300">Contact</th>}
                {selectedFields.includes("email") && <th className="p-3 font-medium text-neutral-300">Email</th>}
                {selectedFields.includes("status") && <th className="p-3 font-medium text-neutral-300">Status</th>}
                {selectedFields.includes("tags") && <th className="p-3 font-medium text-neutral-300">Tags</th>}
                {selectedFields.includes("invoices") && <th className="p-3 font-medium text-neutral-300 text-right">Invoices</th>}
                {selectedFields.includes("outstanding") && <th className="p-3 font-medium text-neutral-300 text-right">Outstanding</th>}
                <th className="p-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => {
                const stats = clientStats[client.id] || { totalInvoices: 0, outstanding: 0, totalPaid: 0 };
                return (
                  <tr
                    key={client.id}
                    className="border-b border-neutral-800 hover:bg-neutral-800/50"
                  >
                    {selectedFields.includes("code") && <td className="p-3 text-neutral-400">{client.code ?? "—"}</td>}
                    {selectedFields.includes("company") && (
                      <td className="p-3">
                        <Link
                          href={`/dashboard/clients/${client.id}`}
                          className="font-medium text-orange-400 hover:underline"
                        >
                          {client.companyName}
                        </Link>
                      </td>
                    )}
                    {selectedFields.includes("contact") && <td className="p-3 text-neutral-300">{client.contactName}</td>}
                    {selectedFields.includes("email") && <td className="p-3 text-neutral-400">{client.email}</td>}
                    {selectedFields.includes("status") && (
                      <td className="p-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            (client.status ?? "active") === "archived" ? "bg-neutral-600 text-neutral-400" : "bg-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {(client.status ?? "active") === "archived" ? "Archived" : "Active"}
                        </span>
                      </td>
                    )}
                    {selectedFields.includes("tags") && (
                      <td className="p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {client.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-orange-900/40 px-2 py-0.5 text-xs font-medium text-orange-300"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                    )}
                    {selectedFields.includes("invoices") && (
                      <td className="p-3 text-right text-neutral-400">
                        {stats.totalInvoices} invoice{stats.totalInvoices !== 1 ? "s" : ""}
                      </td>
                    )}
                    {selectedFields.includes("outstanding") && (
                      <td className="p-3 text-right font-medium text-white">
                        {stats.outstanding.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                      </td>
                    )}
                    <td className="p-3">
                      <Link
                        href={`/dashboard/clients/${client.id}`}
                        className="text-orange-400 hover:text-orange-300"
                        title="View client details"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => {
            const stats = clientStats[client.id] || { totalInvoices: 0, outstanding: 0, totalPaid: 0 };
            const initials = getInitials(client.companyName);
            return (
              <div
                key={client.id}
                className="relative rounded-xl border border-neutral-800 bg-neutral-900 p-5 transition-colors hover:border-neutral-700"
              >
                <div className="flex items-start gap-4">
                  {/* Logo/Initials */}
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 font-semibold">
                    {initials}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="block space-y-1"
                    >
                      <h3 className="font-semibold text-white truncate">{client.companyName}</h3>
                      {selectedFields.includes("contact") && (
                        <p className="text-sm text-neutral-400 truncate">{client.contactName}</p>
                      )}
                      {selectedFields.includes("email") && (
                        <p className="text-sm text-neutral-500 truncate">{client.email}</p>
                      )}
                      {selectedFields.includes("status") && (
                        <div className="pt-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              (client.status ?? "active") === "archived" ? "bg-neutral-600 text-neutral-400" : "bg-emerald-500/20 text-emerald-400"
                            }`}
                          >
                            {(client.status ?? "active") === "archived" ? "Archived" : "Active"}
                          </span>
                        </div>
                      )}
                      {selectedFields.includes("tags") && client.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-2">
                          {client.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-orange-900/40 px-2 py-0.5 text-xs font-medium text-orange-300"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {(selectedFields.includes("invoices") || selectedFields.includes("outstanding") || selectedFields.includes("code")) && (
                        <div className="border-t border-neutral-800 pt-2 mt-2 text-xs text-neutral-500">
                          {selectedFields.includes("code") && client.code && (
                            <div>{client.code}</div>
                          )}
                          {selectedFields.includes("invoices") && (
                            <div>{stats.totalInvoices} invoice{stats.totalInvoices !== 1 ? "s" : ""}</div>
                          )}
                          {selectedFields.includes("outstanding") && (
                            <div className="font-medium text-white">
                              {stats.outstanding.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                            </div>
                          )}
                        </div>
                      )}
                    </Link>
                  </div>

                  {/* Three-dot menu */}
                  <div className="relative flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setClientMenuOpen(clientMenuOpen === client.id ? null : client.id);
                      }}
                      className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>
                    {clientMenuOpen === client.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setClientMenuOpen(null)} />
                        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-neutral-700 bg-neutral-900 py-1 shadow-xl">
                          <Link
                            href={`/dashboard/clients/${client.id}`}
                            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-800"
                            onClick={() => setClientMenuOpen(null)}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            View
                          </Link>
                          <Link
                            href={`/dashboard/clients/${client.id}`}
                            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-800"
                            onClick={() => setClientMenuOpen(null)}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${client.companyName}?`)) {
                                deleteClient(client.id);
                                setClientMenuOpen(null);
                              }
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-neutral-800"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NewClientModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      <ClientSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings ?? defaultSettings}
        updateSettings={updateSettings}
        clientTags={clientTags}
        customFieldDefinitions={customFieldDefinitions}
        addCustomFieldDefinition={addCustomFieldDefinition}
        updateCustomFieldDefinition={updateCustomFieldDefinition}
        deleteCustomFieldDefinition={deleteCustomFieldDefinition}
      />
    </div>
  );
}

function ClientSettingsModal({
  isOpen,
  onClose,
  settings,
  updateSettings,
  clientTags,
  customFieldDefinitions,
  addCustomFieldDefinition,
  updateCustomFieldDefinition,
  deleteCustomFieldDefinition,
}: {
  isOpen: boolean;
  onClose: () => void;
  settings: any;
  updateSettings: (data: any) => void;
  clientTags: string[];
  customFieldDefinitions: any[];
  addCustomFieldDefinition: (def: any) => void;
  updateCustomFieldDefinition: (id: string, data: any) => void;
  deleteCustomFieldDefinition: (id: string) => void;
}) {
  const [tab, setTab] = useState<"code" | "tags" | "fields">("tags");

  const inputClass =
    "mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500";
  const labelClass = "block text-sm font-medium text-neutral-300";

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-neutral-700 bg-neutral-900 shadow-xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-700 bg-neutral-900 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Client Settings</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-4">
            <div className="flex gap-1 rounded-lg border border-neutral-800 bg-neutral-800/50 p-1">
              <button
                type="button"
                onClick={() => setTab("tags")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  tab === "tags" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white"
                }`}
              >
                Client Tags
              </button>
              <button
                type="button"
                onClick={() => setTab("fields")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  tab === "fields" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white"
                }`}
              >
                Custom Fields
              </button>
              <button
                type="button"
                onClick={() => setTab("code")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  tab === "code" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white"
                }`}
              >
                Client Code
              </button>
            </div>

            <div className="mt-6">
              {tab === "tags" && (
                <ClientTagsSection
                  tags={clientTags}
                  onUpdate={(tags) => updateSettings({ clientTags: tags })}
                  inputClass={inputClass}
                  labelClass={labelClass}
                />
              )}

              {tab === "fields" && (
                <ClientFormFieldsSection
                  definitions={customFieldDefinitions}
                  onAdd={addCustomFieldDefinition}
                  onUpdate={updateCustomFieldDefinition}
                  onDelete={deleteCustomFieldDefinition}
                  inputClass={inputClass}
                  labelClass={labelClass}
                />
              )}

              {tab === "code" && (
                <ClientCodeStructureSection
                  format={settings.clientCode?.format ?? defaultSettings.clientCode?.format ?? "C-{000}"}
                  nextNumber={settings.clientCode?.nextNumber ?? defaultSettings.clientCode?.nextNumber ?? 1}
                  onUpdate={(format, nextNumber) => updateSettings({ clientCode: { format, nextNumber } })}
                  inputClass={inputClass}
                  labelClass={labelClass}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
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
      <h3 className="text-lg font-medium text-white">Client tags</h3>
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

function ClientFormFieldsSection({
  definitions,
  onAdd,
  onUpdate,
  onDelete,
  inputClass,
  labelClass,
}: {
  definitions: { id: string; name: string; type: CustomFieldType; required: boolean; defaultValue?: string; options?: string[] }[];
  onAdd: (def: { name: string; type: CustomFieldType; required: boolean; defaultValue?: string; options?: string[] }) => void;
  onUpdate: (id: string, data: Partial<{ name: string; type: CustomFieldType; required: boolean; defaultValue?: string; options?: string[] }>) => void;
  onDelete: (id: string) => void;
  inputClass: string;
  labelClass: string;
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
      <h3 className="text-lg font-medium text-white">Client form fields</h3>
      <p className="mt-1 text-sm text-neutral-400">Custom fields shown on client profiles. Add, edit, or remove fields.</p>
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
        <div className="mt-4 rounded-lg border border-neutral-700 bg-neutral-800/50 p-4 space-y-3">
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
      <h3 className="text-lg font-medium text-white">Client code structure</h3>
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
