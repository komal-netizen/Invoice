"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { NewInvoiceModal } from "@/components/NewInvoiceModal";
import { EmptyState } from "@/components/EmptyState";
import { TableLoadingSkeleton } from "@/components/LoadingState";
import type { InvoiceStatus } from "@/lib/types";
import { INVOICE_STATUSES, INVOICE_LIST_COLUMN_LABELS } from "@/lib/types";
import { defaultReminderSettings, defaultSettings } from "@/lib/defaults";
import { format, differenceInDays, addDays } from "date-fns";

function formatDateSafe(dateStr: string | undefined, fmt: string, fallback = "—") {
  if (dateStr == null || dateStr === "") return fallback;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return fallback;
  return format(d, fmt);
}

function parseDateSafe(dateStr: string | undefined): Date | null {
  if (dateStr == null || dateStr === "") return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  paid: "Paid",
  overdue: "Overdue",
  outstanding: "Outstanding",
  scheduled: "Scheduled",
};

const STATUS_CLASS: Record<InvoiceStatus, string> = {
  draft: "bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  outstanding: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
};

export default function InvoicesPage() {
  const [mounted, setMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [sendModalInvoiceId, setSendModalInvoiceId] = useState<string | null>(null);
  const [reminderModalInvoiceId, setReminderModalInvoiceId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  useEffect(() => setMounted(true), []);

  const invoices = useStore((s) => s.invoices);
  const clients = useStore((s) => s.clients);
  const projects = useStore((s) => s.projects);
  const getClient = useStore((s) => s.getClient);
  const updateInvoice = useStore((s) => s.updateInvoice);
  const deleteInvoice = useStore((s) => s.deleteInvoice);
  const addInvoice = useStore((s) => s.addInvoice);
  const getNextInvoiceNumber = useStore((s) => s.getNextInvoiceNumber);
  const settings = useStore((s) => s.settings);

  const filtered = useMemo(() => {
    let list = invoices;
    if (statusFilter !== "all") {
      list = list.filter((i) => i.status === statusFilter);
    }
    if (clientFilter !== "all") {
      list = list.filter((i) => i.clientId === clientFilter);
    }
    if (projectFilter !== "all") {
      list = list.filter((i) => i.projectId === projectFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => {
        const client = getClient(i.clientId);
        const project = i.projectId ? projects.find((p) => p.id === i.projectId) : null;
        return (
          i.invoiceNumber.toLowerCase().includes(q) ||
          client?.companyName?.toLowerCase().includes(q) ||
          client?.contactName?.toLowerCase().includes(q) ||
          client?.email?.toLowerCase().includes(q) ||
          project?.name?.toLowerCase().includes(q) ||
          i.total.toString().includes(q) ||
          i.status.toLowerCase().includes(q)
        );
      });
    }
    
    // Sort
    return list.sort((a, b) => {
      let aVal: any;
      let bVal: any;
      
      switch (sortField) {
        case "invoiceNumber":
          aVal = a.invoiceNumber;
          bVal = b.invoiceNumber;
          break;
        case "issuedOn":
          aVal = new Date(a.issueDate).getTime();
          bVal = new Date(b.issueDate).getTime();
          break;
        case "dueDate":
          aVal = new Date(a.dueDate).getTime();
          bVal = new Date(b.dueDate).getTime();
          break;
        case "client":
          aVal = getClient(a.clientId)?.companyName || "";
          bVal = getClient(b.clientId)?.companyName || "";
          break;
        case "total":
          aVal = a.total;
          bVal = b.total;
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          aVal = new Date(a.updatedAt).getTime();
          bVal = new Date(b.updatedAt).getTime();
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [invoices, statusFilter, clientFilter, projectFilter, search, getClient, projects, sortField, sortDirection]);

  const projectsForClientFilter = useMemo(() => {
    if (clientFilter === "all") return projects;
    return projects.filter((p) => p.clientId === clientFilter);
  }, [projects, clientFilter]);

  const hasActiveFilters = statusFilter !== "all" || clientFilter !== "all" || projectFilter !== "all";
  const activeFilterCount = [statusFilter !== "all", clientFilter !== "all", projectFilter !== "all"].filter(Boolean).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkPaid = (invoiceId: string) => {
    setOpenMenuId(null);
    updateInvoice(invoiceId, {
      status: "paid",
      paidAt: new Date().toISOString(),
    });
  };

  const handleDuplicate = (invoiceId: string) => {
    setOpenMenuId(null);
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;
    const newNum = getNextInvoiceNumber();
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = inv;
    addInvoice({
      ...rest,
      invoiceNumber: newNum,
      status: "draft",
      lineItems: inv.lineItems.map((li) => ({ ...li, id: crypto.randomUUID(), total: li.quantity * li.price })),
    });
  };

  const handleDelete = (invoiceId: string) => {
    setOpenMenuId(null);
    if (typeof window !== "undefined" && window.confirm("Delete this invoice?")) {
      deleteInvoice(invoiceId);
    }
  };

  const handleViewPreview = (invoiceId: string) => {
    setOpenMenuId(null);
    if (typeof window !== "undefined") {
      window.open(`${window.location.origin}/dashboard/invoices/${invoiceId}?preview=1`, "_blank");
    }
  };

  const handleOpenInNewTab = (invoiceId: string) => {
    setOpenMenuId(null);
    if (typeof window !== "undefined") {
      window.open(`${window.location.origin}/dashboard/invoices/${invoiceId}`, "_blank");
    }
  };

  const handleSendInvoice = (invoiceId: string) => {
    setOpenMenuId(null);
    setSendModalInvoiceId(invoiceId);
  };

  const confirmSendInvoice = () => {
    if (!sendModalInvoiceId || !sendModalClient || !sendModalInv) return;
    const subj = settings.email.invoiceSubject
      .replace(/\{invoiceNumber\}/g, sendModalInv.invoiceNumber)
      .replace(/\{businessName\}/g, settings.business.name);
    const body = settings.email.invoiceBody;
    const mailto = `mailto:${encodeURIComponent(sendModalClient.email)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, "_blank", "noopener");
    updateInvoice(sendModalInvoiceId, { status: "pending", sentAt: new Date().toISOString() });
    setSendModalInvoiceId(null);
  };

  const handleManageReminders = (invoiceId: string) => {
    setOpenMenuId(null);
    setReminderModalInvoiceId(invoiceId);
  };

  const confirmSendReminder = () => {
    if (!reminderModalInvoiceId || !reminderModalInv) return;
    const client = getClient(reminderModalInv.clientId);
    if (!client?.email) {
      setReminderModalInvoiceId(null);
      return;
    }
    const subj = settings.email.reminderSubject.replace(/\{invoiceNumber\}/g, reminderModalInv.invoiceNumber);
    const body = settings.email.reminderBody.replace(/\{invoiceNumber\}/g, reminderModalInv.invoiceNumber);
    const mailto = `mailto:${encodeURIComponent(client.email)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, "_blank", "noopener");
    updateInvoice(reminderModalInvoiceId, { lastReminderAt: new Date().toISOString() });
    setReminderModalInvoiceId(null);
  };

  const sendModalInv = sendModalInvoiceId ? invoices.find((i) => i.id === sendModalInvoiceId) : null;
  const sendModalClient = sendModalInv ? getClient(sendModalInv.clientId) : null;
  const reminderModalInv = reminderModalInvoiceId ? invoices.find((i) => i.id === reminderModalInvoiceId) : null;
  const reminderBody = reminderModalInv
    ? settings.email.reminderBody.replace(/\{invoiceNumber\}/g, reminderModalInv.invoiceNumber)
    : "";

  const reminderSettings = settings.reminders ?? defaultReminderSettings;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueUnpaid = useMemo(
    () =>
      invoices.filter((i) => {
        if (i.status === "paid" || i.status === "draft") return false;
        const due = parseDateSafe(i.dueDate);
        return due != null && due.getTime() < today.getTime();
      }),
    [invoices, today]
  );
  const dueForReminder = useMemo(() => {
    if (!reminderSettings.autoRemindersEnabled) return [];
    return overdueUnpaid.filter((inv) => {
      const due = parseDateSafe(inv.dueDate);
      if (!due) return false;
      due.setHours(0, 0, 0, 0);
      const daysOverdue = differenceInDays(today, due);
      if (daysOverdue < reminderSettings.firstReminderDaysAfterDue) return false;
      const last = inv.lastReminderAt ? parseDateSafe(inv.lastReminderAt) : null;
      if (!last) return true;
      const nextDue = addDays(last, reminderSettings.reminderRepeatDays);
      return today.getTime() >= nextDue.getTime();
    });
  }, [overdueUnpaid, reminderSettings, today]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Invoices</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/settings"
            className="rounded-lg border border-neutral-200 bg-white p-2.5 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
            aria-label="Invoice settings"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-500 dark:bg-orange-500 dark:hover:bg-orange-400"
          >
            New Invoice
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search in all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[220px] rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500"
        />
        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterMenuOpen(!filterMenuOpen)}
            className={`relative flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
              hasActiveFilters
                ? "border-orange-500 bg-orange-500 text-white hover:bg-orange-400"
                : "border-neutral-600 bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white dark:border-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:hover:text-white"
            }`}
            title="Filter invoices"
            aria-label="Filter invoices"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-xs font-medium text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          {filterMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFilterMenuOpen(false)} aria-hidden="true" />
              <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-lg border border-neutral-700 bg-neutral-900 py-2 shadow-xl max-h-96 overflow-y-auto">
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Filter by Status
                </div>
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${
                    statusFilter === "all" ? "bg-orange-500/10 text-orange-400" : "text-neutral-200 hover:bg-neutral-800"
                  }`}
                >
                  <span>All statuses</span>
                  {statusFilter === "all" && (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                {INVOICE_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${
                      statusFilter === s ? "bg-orange-500/10 text-orange-400" : "text-neutral-200 hover:bg-neutral-800"
                    }`}
                  >
                    <span>{STATUS_LABELS[s]}</span>
                    {statusFilter === s && (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}

                <div className="my-2 border-t border-neutral-800" />
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Filter by Client
                </div>
                <button
                  type="button"
                  onClick={() => { setClientFilter("all"); setProjectFilter("all"); }}
                  className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${
                    clientFilter === "all" ? "bg-orange-500/10 text-orange-400" : "text-neutral-200 hover:bg-neutral-800"
                  }`}
                >
                  <span>All clients</span>
                  {clientFilter === "all" && (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                {clients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setClientFilter(c.id); setProjectFilter("all"); }}
                    className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${
                      clientFilter === c.id ? "bg-orange-500/10 text-orange-400" : "text-neutral-200 hover:bg-neutral-800"
                    }`}
                  >
                    <span className="truncate">{c.companyName}</span>
                    {clientFilter === c.id && (
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}

                <div className="my-2 border-t border-neutral-800" />
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Filter by Project
                </div>
                <button
                  type="button"
                  onClick={() => setProjectFilter("all")}
                  className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${
                    projectFilter === "all" ? "bg-orange-500/10 text-orange-400" : "text-neutral-200 hover:bg-neutral-800"
                  }`}
                >
                  <span>All projects</span>
                  {projectFilter === "all" && (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                {projectsForClientFilter.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProjectFilter(p.id)}
                    className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${
                      projectFilter === p.id ? "bg-orange-500/10 text-orange-400" : "text-neutral-200 hover:bg-neutral-800"
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    {projectFilter === p.id && (
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}

                {hasActiveFilters && (
                  <>
                    <div className="my-2 border-t border-neutral-800" />
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("all");
                        setClientFilter("all");
                        setProjectFilter("all");
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

      {mounted && dueForReminder.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">Due for reminder</h2>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
            {dueForReminder.length} overdue invoice{dueForReminder.length !== 1 ? "s" : ""} ready for a payment reminder.
          </p>
          <ul className="mt-3 space-y-2">
            {dueForReminder.map((inv) => {
              const client = getClient(inv.clientId);
              return (
                <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/60 py-2 px-3 dark:bg-neutral-900/40">
                  <span className="text-sm text-neutral-800 dark:text-neutral-200">
                    <Link href={`/dashboard/invoices/${inv.id}`} className="font-medium text-orange-600 hover:underline dark:text-orange-400">
                      {inv.invoiceNumber}
                    </Link>
                    {" — "}
                    {client?.companyName ?? "—"} · Due {formatDateSafe(inv.dueDate, "MMM d, yyyy")}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleManageReminders(inv.id)}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400"
                  >
                    Send reminder
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-8">
          {!mounted ? (
          <TableLoadingSkeleton rows={8} cols={9} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={
              <svg className="h-8 w-8 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            }
            title={invoices.length === 0 ? "No invoices yet" : "No matching invoices"}
            description={
              invoices.length === 0
                ? "Create your first invoice and start getting paid faster. Track payments, send reminders, and manage your business finances all in one place."
                : "No invoices match your current filters. Try adjusting your search criteria or clearing your filters."
            }
            action={
              invoices.length === 0
                ? {
                    label: "Create Your First Invoice",
                    onClick: () => setModalOpen(true),
                  }
                : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50">
                  {(settings.invoiceListColumns ?? defaultSettings.invoiceListColumns ?? []).map((colId) => (
                    <th key={colId} className={colId === "actions" ? "w-12 p-4" : "p-4 font-medium text-neutral-700 dark:text-neutral-300"}>
                      {colId !== "actions" && colId !== "paid" && colId !== "project" ? (
                        <button
                          type="button"
                          onClick={() => handleSort(colId)}
                          className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white transition-colors"
                        >
                          {INVOICE_LIST_COLUMN_LABELS[colId] ?? colId}
                          {sortField === colId && (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              {sortDirection === "asc" ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              )}
                            </svg>
                          )}
                        </button>
                      ) : (
                        INVOICE_LIST_COLUMN_LABELS[colId] ?? colId
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const client = getClient(inv.clientId);
                  const project = inv.projectId
                    ? projects.find((p) => p.id === inv.projectId)
                    : null;
                  const menuOpen = openMenuId === inv.id;
                  const cols = settings.invoiceListColumns ?? defaultSettings.invoiceListColumns ?? [];
                  const renderCell = (colId: string) => {
                    switch (colId) {
                      case "issuedOn":
                        return formatDateSafe(inv.issueDate, "MMM d, yyyy");
                      case "dueDate":
                        return formatDateSafe(inv.dueDate, "MMM d, yyyy");
                      case "invoiceNumber":
                        return (
                          <Link href={`/dashboard/invoices/${inv.id}`} className="text-orange-600 hover:underline dark:text-orange-400">
                            {inv.invoiceNumber}
                          </Link>
                        );
                      case "project":
                        return <span className="text-neutral-600 dark:text-neutral-400">{project?.name ?? "—"}</span>;
                      case "client":
                        return (
                          <Link href={`/dashboard/clients/${inv.clientId}`} className="text-neutral-900 hover:underline dark:text-white">
                            {client?.companyName ?? "—"}
                          </Link>
                        );
                      case "total":
                        return (
                          <span className="font-medium text-neutral-900 dark:text-white">
                            {inv.total.toLocaleString("en-US", { style: "currency", currency: inv.currency })}
                          </span>
                        );
                      case "paid":
                        return inv.status === "paid" && inv.paidAt
                          ? inv.total.toLocaleString("en-US", { style: "currency", currency: inv.currency })
                          : "—";
                      case "status":
                        return (
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[inv.status]}`}>
                            {STATUS_LABELS[inv.status]}
                          </span>
                        );
                      case "actions":
                        return null;
                      default:
                        return null;
                    }
                  };
                  return (
                    <tr
                      key={inv.id}
                      className="border-b border-neutral-100 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                    >
                      {cols.map((colId) => (
                        <td key={colId} className={`p-4 ${colId === "actions" ? "relative w-12" : ""}`}>
                          {colId === "actions" ? (
                            <div ref={menuOpen ? menuRef : undefined} className="relative">
                              <button
                                type="button"
                                onClick={() => setOpenMenuId(menuOpen ? null : inv.id)}
                                className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white"
                                aria-label="Actions"
                              >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                                  <circle cx="12" cy="5" r="1.5" />
                                  <circle cx="12" cy="12" r="1.5" />
                                  <circle cx="12" cy="19" r="1.5" />
                                </svg>
                              </button>
                              {menuOpen && (
                                <div className="absolute right-0 top-full z-[100] mt-1 min-w-[200px] rounded-lg border border-neutral-200 bg-white py-1 shadow-xl dark:border-neutral-700 dark:bg-neutral-800">
                            <button
                              type="button"
                              onClick={() => handleViewPreview(inv.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700"
                            >
                              View preview
                            </button>
                            <Link
                              href={`/dashboard/invoices/${inv.id}`}
                              onClick={() => setOpenMenuId(null)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700"
                            >
                              Edit
                            </Link>
                            {inv.status !== "paid" && (
                              <button
                                type="button"
                                onClick={() => handleSendInvoice(inv.id)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700"
                              >
                                Receive
                              </button>
                            )}
                            {inv.status !== "paid" && (
                              <button
                                type="button"
                                onClick={() => handleMarkPaid(inv.id)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700"
                              >
                                Mark as paid
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDuplicate(inv.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700"
                            >
                              Duplicate
                            </button>
                            {inv.status !== "paid" && (
                              <button
                                type="button"
                                onClick={() => handleManageReminders(inv.id)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700"
                              >
                                Manage reminders
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenInNewTab(inv.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700"
                            >
                              Open in new tab
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(inv.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                            >
                              Delete
                            </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            renderCell(colId)
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NewInvoiceModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Send invoice (Receive) modal */}
      {sendModalInv && sendModalClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-neutral-900 dark:border dark:border-neutral-800">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Send invoice</h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Your email client will open to send {sendModalInv.invoiceNumber} to {sendModalClient.email}. We’ll mark the invoice as sent.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSendModalInvoiceId(null)}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSendInvoice}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 dark:bg-orange-500 dark:hover:bg-orange-400"
              >
                Send invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage reminders modal */}
      {reminderModalInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-neutral-900 dark:border dark:border-neutral-800">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Send payment reminder</h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Invoice {reminderModalInv.invoiceNumber}
            </p>
            <div className="mt-4 rounded-lg bg-neutral-100 p-3 text-sm text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
              {reminderBody || "This is a friendly reminder that the following invoice is overdue."}
            </div>
            <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
              Your email client will open to send this reminder to the client. We’ll record that a reminder was sent.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReminderModalInvoiceId(null)}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSendReminder}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 dark:bg-orange-500 dark:hover:bg-orange-400"
              >
                Send reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
