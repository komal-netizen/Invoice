"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { AddCustomFieldModal } from "@/components/AddCustomFieldModal";
import { GenerateInvoiceFromTasksModal } from "@/components/GenerateInvoiceFromTasksModal";
import { ClientResourcesModal } from "@/components/ClientResourcesModal";
import { Toggle } from "@/components/Toggle";
import { BlockRenderer } from "@/components/client-dashboard/BlockRenderer";
import { BlockManager } from "@/components/client-dashboard/BlockManager";
import type { ClientDashboardBlockType } from "@/lib/client-dashboard-types";
import {
  PAYMENT_TERMS_OPTIONS,
  CURRENCIES,
  type PaymentTerm,
  type Currency,
  type ClientTag,
  type Address,
} from "@/lib/types";
import { format, formatDistanceToNow } from "date-fns";

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDateSafe(dateStr: string | undefined, fmt: string, fallback = "—") {
  if (dateStr == null || dateStr === "") return fallback;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return fallback;
  return format(d, fmt);
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending: "Pending",
  paid: "Paid",
  overdue: "Overdue",
  outstanding: "Outstanding",
  scheduled: "Scheduled",
};

function formatAddress(addr: { street?: string; city?: string; state?: string; zip?: string; country?: string } | undefined) {
  if (!addr) return "";
  const parts = [addr.street, [addr.city, addr.state, addr.zip].filter(Boolean).join(", "), addr.country].filter(Boolean);
  return parts.join(", ");
}

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const getClient = useStore((s) => s.getClient);
  const updateClient = useStore((s) => s.updateClient);
  const deleteClient = useStore((s) => s.deleteClient);
  const settings = useStore((s) => s.settings ?? null);
  const customFieldDefinitions = useStore((s) => s.customFieldDefinitions);
  const getProjectsByClient = useStore((s) => s.getProjectsByClient);
  const invoices = useStore((s) => s.invoices);
  const getBillableSummaryForClient = useStore((s) => s.getBillableSummaryForClient);
  const getUninvoicedBillableTasks = useStore((s) => s.getUninvoicedBillableTasks);
  const getTimeTrackedForTask = useStore((s) => s.getTimeTrackedForTask);
  const getProduct = useStore((s) => s.getProduct);
  const generateClientBoardToken = useStore((s) => s.generateClientBoardToken);
  const regenerateClientBoardToken = useStore((s) => s.regenerateClientBoardToken);
  const toggleClientBoard = useStore((s) => s.toggleClientBoard);
  const getClientResources = useStore((s) => s.getClientResources);
  const boardTasks = useStore((s) => s.boardTasks);
  const boardLists = useStore((s) => s.boardLists);
  const timeEntries = useStore((s) => s.timeEntries);
  const addClientNote = useStore((s) => s.addClientNote);
  const updateClientNote = useStore((s) => s.updateClientNote);
  const deleteClientNote = useStore((s) => s.deleteClientNote);
  const getClientNotes = useStore((s) => s.getClientNotes);
  const getClientDashboardTemplate = useStore((s) => s.getClientDashboardTemplate);
  const addDashboardBlock = useStore((s) => s.addDashboardBlock);
  const removeDashboardBlock = useStore((s) => s.removeDashboardBlock);
  const updateDashboardBlock = useStore((s) => s.updateDashboardBlock);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Get dashboard blocks
  const dashboardTemplate = getClientDashboardTemplate();
  const dashboardBlocks = dashboardTemplate.blocks.filter((b) => b.visible).sort((a, b) => a.order - b.order);

  const client = getClient(id);
  const clientTags = settings?.clientTags ?? ["VIP", "Regular", "Retainer", "One-time"];
  const [customFieldModalOpen, setCustomFieldModalOpen] = useState(false);
  const [showEditDetails, setShowEditDetails] = useState(false);
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [resourcesModalOpen, setResourcesModalOpen] = useState(false);
  const [copiedBoard, setCopiedBoard] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const projects = getProjectsByClient(id);
  const parseDateSafe = (s: string | undefined) => {
    if (s == null || s === "") return 0;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  };
  const clientInvoices = invoices
    .filter((inv) => inv.clientId === id)
    .sort((a, b) => parseDateSafe(b.issueDate) - parseDateSafe(a.issueDate))
    .slice(0, 10);

  const [form, setForm] = useState({
    code: "",
    companyName: "",
    contactName: "",
    email: "",
    website: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    paymentTerms: "Net 30" as PaymentTerm,
    currency: "USD" as Currency,
    taxId: "",
    tags: [] as string[],
    customFieldValues: [] as { fieldId: string; value: string | number | boolean }[],
  });

  useEffect(() => {
    if (!client) return;
    setForm({
      code: client.code ?? "",
      companyName: client.companyName ?? "",
      contactName: client.contactName ?? "",
      email: client.email ?? "",
      website: client.website ?? "",
      phone: client.phone ?? "",
      street: client.address?.street ?? "",
      city: client.address?.city ?? "",
      state: client.address?.state ?? "",
      zip: client.address?.zip ?? "",
      country: client.address?.country ?? "",
      paymentTerms: (client.paymentTerms ?? "Net 30") as PaymentTerm,
      currency: (client.currency ?? "USD") as Currency,
      taxId: client.taxId ?? "",
      tags: client.tags ?? [],
      customFieldValues: client.customFieldValues ?? [],
    });
  }, [client]);

  // Aggregate recent activities - must be before any returns to follow Rules of Hooks
  const recentActivities = useMemo(() => {
    if (!mounted || !client) return [];
    
    const activities: Array<{ id: string; type: string; timestamp: string; description: string; link?: string }> = [];
    
    // Invoices
    invoices
      .filter((inv) => inv.clientId === id)
      .forEach((inv) => {
        activities.push({
          id: `inv-${inv.id}`,
          type: inv.status === "paid" ? "invoice_paid" : "invoice_created",
          timestamp: inv.issueDate || inv.createdAt,
          description: inv.status === "paid" 
            ? `Invoice ${inv.invoiceNumber} paid - ${inv.total.toLocaleString("en-US", { style: "currency", currency: inv.currency })}`
            : `Invoice ${inv.invoiceNumber} created - ${inv.total.toLocaleString("en-US", { style: "currency", currency: inv.currency })}`,
          link: `/dashboard/invoices/${inv.id}`,
        });
      });

    // Projects
    projects.forEach((proj) => {
      activities.push({
        id: `proj-${proj.id}`,
        type: proj.status === "completed" ? "project_completed" : "project_created",
        timestamp: proj.createdAt,
        description: proj.status === "completed"
          ? `Project "${proj.name}" completed`
          : `Project "${proj.name}" created`,
        link: `/dashboard/projects/${proj.id}`,
      });
    });

    // Time entries (filter by project's clientId)
    const clientProjectIds = projects.map((p) => p.id);
    timeEntries
      .filter((te) => clientProjectIds.includes(te.projectId))
      .slice(0, 5)
      .forEach((te) => {
        activities.push({
          id: `time-${te.id}`,
          type: "time_logged",
          timestamp: te.date,
          description: `${te.hours}h logged${te.notes ? ` - ${te.notes}` : ""}`,
        });
      });

    // Notes
    const notes = getClientNotes(id);
    notes.forEach((note) => {
      activities.push({
        id: `note-${note.id}`,
        type: "note_added",
        timestamp: note.createdAt,
        description: `Note added: ${note.content.slice(0, 50)}${note.content.length > 50 ? "..." : ""}`,
      });
    });

    // Sort by timestamp descending and take top 15
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 15);
  }, [mounted, client, invoices, projects, timeEntries, id, getClientNotes]);

  if (!mounted) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-neutral-400">Loading...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-neutral-400">Client not found.</p>
        <Link href="/dashboard/clients" className="mt-4 inline-block text-orange-400 hover:underline">
          ← Back to Clients
        </Link>
      </div>
    );
  }

  const handleSave = () => {
    const address: Address = {
      street: form.street || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      zip: form.zip || undefined,
      country: form.country || undefined,
    };
    updateClient(id, {
      code: form.code.trim() || client.code,
      companyName: form.companyName.trim() || client.companyName,
      contactName: form.contactName.trim() || client.contactName,
      email: form.email.trim() || client.email,
      website: form.website || undefined,
      phone: form.phone || undefined,
      address: Object.values(address).some(Boolean) ? address : undefined,
      paymentTerms: form.paymentTerms,
      currency: form.currency,
      taxId: form.taxId || undefined,
      tags: form.tags as ClientTag[],
      customFieldValues: form.customFieldValues,
    });
    setShowEditDetails(false);
  };

  const handleArchive = () => {
    updateClient(id, { status: "archived" });
  };

  const handleUnarchive = () => {
    updateClient(id, { status: "active" });
  };

  const setCustomValue = (fieldId: string, value: string | number | boolean) => {
    setForm((f) => {
      const list = f.customFieldValues.filter((v) => v.fieldId !== fieldId);
      list.push({ fieldId, value });
      return { ...f, customFieldValues: list };
    });
  };

  const getCustomValue = (fieldId: string) => {
    return form.customFieldValues.find((v) => v.fieldId === fieldId)?.value ?? "";
  };

  const toggleTag = (tag: ClientTag) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  };

  const syncBoardDataToServer = async (token: string) => {
    const resources = getClientResources(id);
    const clientProjects = projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      startDate: p.startDate,
      dueDate: p.dueDate,
    }));
    
    const projectIds = new Set(projects.map((p) => p.id));
    const clientTasks = boardTasks
      .filter((t) => t.clientId === id || (t.projectId && projectIds.has(t.projectId)))
      .map((t) => {
        const list = boardLists.find((l) => l.id === t.listId);
        return {
          id: t.id,
          projectId: t.projectId,
          title: t.title,
          description: t.description,
          priority: t.priority,
          dueDate: t.dueDate,
          completedAt: t.completedAt,
          listName: list?.name,
        };
      });

    await fetch('/api/client-board/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        data: {
          client: {
            companyName: client.companyName,
            contactName: client.contactName,
            boardWelcomeMessage: client.boardWelcomeMessage,
          },
          projects: clientProjects,
          tasks: clientTasks,
          resources,
          lastUpdated: new Date().toISOString(),
        },
      }),
    });
  };

  const handleGenerateToken = async () => {
    const token = generateClientBoardToken(id);
    await syncBoardDataToServer(token);
  };

  const handleRegenerateToken = async () => {
    const token = regenerateClientBoardToken(id);
    await syncBoardDataToServer(token);
  };

  const handleCopyBoardLink = () => {
    if (!client.boardToken) return;
    const url = `${window.location.origin}/client-board/${client.boardToken}`;
    navigator.clipboard.writeText(url);
    setCopiedBoard(true);
    setTimeout(() => setCopiedBoard(false), 2000);
  };

  const handleToggleBoard = async (enabled: boolean) => {
    toggleClientBoard(id, enabled);
    if (enabled && client.boardToken) {
      await syncBoardDataToServer(client.boardToken);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert("Please upload an image file");
      return;
    }

    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Logo size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      updateClient(id, { logo: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    if (confirm("Remove client logo?")) {
      updateClient(id, { logo: undefined });
    }
  };

  const handleAddBlock = (blockType: ClientDashboardBlockType) => {
    const defaultConfig = {
      title: blockType.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      showHeader: true,
      isCollapsible: false,
      defaultCollapsed: false,
    };

    addDashboardBlock({
      type: blockType,
      config: defaultConfig as any,
      visible: true,
    });
  };

  const handleRemoveBlock = (blockId: string) => {
    removeDashboardBlock(blockId);
  };

  const handleTitleChange = (blockId: string, newTitle: string) => {
    const block = dashboardBlocks.find(b => b.id === blockId);
    if (block) {
      updateDashboardBlock(blockId, {
        config: {
          ...block.config,
          title: newTitle,
        },
      });
    }
  };

  const inputClass = "mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500";
  const labelClass = "block text-sm font-medium text-neutral-300";

  const status = client.status ?? "active";
  const isArchived = status === "archived";
  const initials = getInitials(client.companyName);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Back link */}
      <Link href="/dashboard/clients" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white mb-6">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Clients
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex items-start gap-4">
          {/* Logo/Initials */}
          <div className="relative group">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full overflow-hidden border-2 border-transparent hover:border-orange-500 transition-colors cursor-pointer">
              {client.logo ? (
                <img src={client.logo} alt={client.companyName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-orange-500/20 text-orange-400 text-xl font-bold">
                  {initials}
                </div>
              )}
              <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
            {client.logo && (
              <button
                onClick={handleRemoveLogo}
                className="absolute -bottom-1 -right-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 transition-colors"
                title="Remove logo"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Client Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-white">{client.companyName}</h1>
                <p className="mt-1 text-neutral-400">{client.contactName}</p>
                <p className="text-sm text-neutral-500">{client.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    isArchived ? "bg-neutral-600 text-neutral-300" : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {isArchived ? "Archived" : "Active"}
                </span>
                
                {/* Three-dot menu - only render after mount to avoid hydration errors */}
                {mounted && (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                    title="More options"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                    </svg>
                  </button>
                  
                  {menuOpen && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpen(false)}
                      />
                      
                      {/* Dropdown Menu */}
                      <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-neutral-700 bg-neutral-800 shadow-xl">
                        <div className="py-1">
                          {/* Shareable Link Section */}
                          {client.boardToken ? (
                            <>
                              <button
                                onClick={() => {
                                  handleCopyBoardLink();
                                  setMenuOpen(false);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-neutral-300 hover:bg-neutral-700"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                </svg>
                                <div className="flex-1">
                                  <div className="font-medium text-white">{copiedBoard ? "Link Copied!" : "Copy Shareable Link"}</div>
                                  <div className="text-xs text-neutral-500">Client board portal</div>
                                </div>
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Regenerate the client board link? The old link will stop working.")) {
                                    handleRegenerateToken();
                                  }
                                  setMenuOpen(false);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-neutral-300 hover:bg-neutral-700"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                                <div className="flex-1">
                                  <div className="font-medium text-white">Regenerate Link</div>
                                  <div className="text-xs text-neutral-500">Create new board link</div>
                                </div>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                handleGenerateToken();
                                setMenuOpen(false);
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-neutral-300 hover:bg-neutral-700"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                              </svg>
                              <div className="flex-1">
                                <div className="font-medium text-white">Create Shareable Link</div>
                                <div className="text-xs text-neutral-500">Generate client board</div>
                              </div>
                            </button>
                          )}
                          
                          <div className="my-1 border-t border-neutral-700" />
                          
                          {/* Edit Details */}
                          <button
                            onClick={() => {
                              setShowEditDetails(true);
                              setMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-neutral-300 hover:bg-neutral-700"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                            <div className="flex-1">
                              <div className="font-medium text-white">Edit Details</div>
                              <div className="text-xs text-neutral-500">Update client information</div>
                            </div>
                          </button>
                          
                          <div className="my-1 border-t border-neutral-700" />
                          
                          {/* Archive/Unarchive */}
                          {isArchived ? (
                            <button
                              onClick={() => {
                                handleUnarchive();
                                setMenuOpen(false);
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-emerald-400 hover:bg-neutral-700"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
                              </svg>
                              <div className="flex-1">
                                <div className="font-medium">Unarchive Client</div>
                                <div className="text-xs text-emerald-500/70">Make client active</div>
                              </div>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (confirm(`Archive ${client.companyName}? This will hide them from active lists, but you can restore them later.`)) {
                                  handleArchive();
                                }
                                setMenuOpen(false);
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-400 hover:bg-neutral-700"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                              </svg>
                              <div className="flex-1">
                                <div className="font-medium">Archive Client</div>
                                <div className="text-xs text-red-500/70">Hide from active lists</div>
                              </div>
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                )}
              </div>
            </div>
            {client.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {client.tags.map((t) => (
                  <span key={t} className="rounded-full bg-orange-900/40 px-2 py-0.5 text-xs font-medium text-orange-300">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions - Minimalist Design */}
      <div className="mt-6 flex items-center gap-2">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide mr-2">Actions:</span>
        
        <button
          onClick={() => router.push(`/dashboard/projects?clientId=${id}`)}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-600 hover:bg-neutral-700 hover:text-white"
          title="Add Project"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
          Project
        </button>

        <button
          onClick={() => router.push(`/dashboard/invoices?clientId=${id}`)}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-600 hover:bg-neutral-700 hover:text-white"
          title="Create Invoice"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
          Invoice
        </button>

        <button
          onClick={() => router.push(`/dashboard/onboarding-forms?clientId=${id}`)}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-600 hover:bg-neutral-700 hover:text-white"
          title="Onboarding Form"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
          Onboarding
        </button>

        <button
          onClick={() => setResourcesModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-600 hover:bg-neutral-700 hover:text-white"
          title="Upload Items"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Upload
        </button>

        <button
          onClick={() => router.push(`/dashboard/task-boards`)}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-600 hover:bg-neutral-700 hover:text-white"
          title="Task Boards"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
          </svg>
          Tasks
        </button>

        {client.boardToken && client.boardEnabled && (
          <button
            onClick={handleCopyBoardLink}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-600 hover:bg-neutral-700 hover:text-white"
            title={copiedBoard ? "Link Copied!" : "Copy Client Board Link"}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
            {copiedBoard ? "Copied" : "Board"}
          </button>
        )}
      </div>

      {/* Client Dashboard Blocks */}
      <div className="mt-6 space-y-6">
        {/* Add Section Button */}
        <div className="flex justify-end">
          <BlockManager 
            onAddBlock={handleAddBlock}
            existingBlocks={dashboardBlocks}
          />
        </div>
        
        {/* Render Blocks - Masonry Layout */}
        <div className="columns-1 md:columns-2 md:column-gap-6">
          {dashboardBlocks.map((block) => (
            <div key={block.id} className="break-inside-avoid mb-6">
              <BlockRenderer 
                block={block}
                clientId={id}
                activities={recentActivities}
                onTitleChange={handleTitleChange}
                onRemove={handleRemoveBlock}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Projects */}
      <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-4">Projects</h2>
        {projects.length === 0 ? (
          <p className="text-sm text-neutral-500">No projects for this client.</p>
        ) : (
          <ul className="space-y-2">
            {projects.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2">
                <span className="font-medium text-white">{p.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  p.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
                  p.status === "completed" ? "bg-neutral-600 text-neutral-300" : "bg-amber-500/20 text-amber-400"
                }`}>
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Client Details */}
      <section className="mt-6">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-4">Client Details</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
                {client.phone && (
                  <>
                    <dt className="text-xs text-neutral-500">Phone</dt>
                    <dd className="text-sm text-white">{client.phone}</dd>
                  </>
                )}
                {client.website && (
                  <>
                    <dt className="text-xs text-neutral-500">Website</dt>
                    <dd className="text-sm text-white">
                      <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">
                        {client.website}
                      </a>
                    </dd>
                  </>
                )}
                {client.address && (client.address.street || client.address.city) && (
                  <>
                    <dt className="text-xs text-neutral-500">Address</dt>
                    <dd className="text-sm text-white">{formatAddress(client.address)}</dd>
                  </>
                )}
                <dt className="text-xs text-neutral-500">Payment terms</dt>
                <dd className="text-sm text-white">{client.paymentTerms ?? "—"}</dd>
                <dt className="text-xs text-neutral-500">Currency</dt>
                <dd className="text-sm text-white">{client.currency ?? "—"}</dd>
                {client.taxId && (
                  <>
                    <dt className="text-xs text-neutral-500">Tax ID</dt>
                    <dd className="text-sm text-white">{client.taxId}</dd>
                  </>
                )}
          </dl>
        </div>
      </section>

      {/* Past Invoices */}
      <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-4">Past Invoices</h2>
        {clientInvoices.length === 0 ? (
          <p className="text-sm text-neutral-500">No invoices for this client.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-800 text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="pb-2">Number</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Due</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {clientInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-neutral-800">
                    <td className="py-2">
                      <Link href={`/dashboard/invoices/${inv.id}`} className="text-orange-400 hover:underline">
                        {inv.invoiceNumber || "—"}
                      </Link>
                    </td>
                    <td className="py-2 text-neutral-400">{formatDateSafe(inv.issueDate, "MMM d, yyyy")}</td>
                    <td className="py-2 text-neutral-400">{formatDateSafe(inv.dueDate, "MMM d, yyyy")}</td>
                    <td className="py-2 text-white font-medium">
                      {inv.total.toLocaleString("en-US", { style: "currency", currency: inv.currency })}
                    </td>
                    <td className="py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          inv.status === "paid" ? "bg-emerald-500/20 text-emerald-400" :
                          inv.status === "overdue" ? "bg-red-500/20 text-red-400" :
                          inv.status === "pending" ? "bg-blue-500/20 text-blue-400" :
                          "bg-neutral-600 text-neutral-300"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Billing Summary */}
      <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">Billing Summary</h2>
          <button
            type="button"
            onClick={() => setBillingModalOpen(true)}
            className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-400"
          >
            Invoice completed tasks
          </button>
        </div>
        {(() => {
          const summary = getBillableSummaryForClient(id);
          const uninvoiced = getUninvoicedBillableTasks({ clientId: id });
          return (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-neutral-500">Unbilled: </span>
                  <span className="font-medium text-amber-400">
                    {summary.totalUnbilled.toLocaleString("en-US", { style: "currency", currency: client.currency ?? "USD" })}
                  </span>
                  <span className="text-neutral-500"> ({summary.tasksUnbilled} tasks)</span>
                </div>
                <div>
                  <span className="text-neutral-500">Invoiced: </span>
                  <span className="font-medium text-emerald-400">
                    {summary.totalInvoiced.toLocaleString("en-US", { style: "currency", currency: client.currency ?? "USD" })}
                  </span>
                  <span className="text-neutral-500"> ({summary.tasksInvoiced} tasks)</span>
                </div>
              </div>
              {uninvoiced.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-neutral-500 mb-1">Tasks ready to invoice</h3>
                  <ul className="space-y-1 rounded-lg border border-neutral-700 bg-neutral-800/50 p-2 text-sm">
                    {uninvoiced.slice(0, 10).map((t) => {
                      const hours = getTimeTrackedForTask(t.id);
                      const svc = t.serviceId ? getProduct(t.serviceId) : undefined;
                      const rate = svc?.defaultPrice ?? 0;
                      const amount = hours * rate;
                      return (
                        <li key={t.id} className="flex justify-between text-neutral-300">
                          <span className="truncate">{t.title}</span>
                          <span className="shrink-0 text-emerald-400">${amount.toFixed(0)}</span>
                        </li>
                      );
                    })}
                    {uninvoiced.length > 10 && (
                      <li className="text-neutral-500">+{uninvoiced.length - 10} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          );
        })()}
      </section>

      {/* Edit Details */}
      <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">Edit Details</h2>
              <button
                type="button"
                onClick={() => setShowEditDetails((v) => !v)}
                className="text-sm font-medium text-orange-400 hover:underline"
              >
                {showEditDetails ? "Hide" : "Edit details"}
              </button>
            </div>
            {showEditDetails && (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-1">
                  <div>
                <label className={labelClass}>Client code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  className={inputClass}
                  placeholder="e.g. C-005"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Short unique reference, used to identify this client.
                </p>
              </div>
              <div>
                <label className={labelClass}>Company name</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                  className={inputClass}
                  placeholder="Company or business name"
                />
              </div>
              <div>
                <label className={labelClass}>Contact name</label>
                <input
                  type="text"
                  value={form.contactName}
                  onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                  className={inputClass}
                  placeholder="Contact person name"
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={inputClass}
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Website</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  className={inputClass}
                  placeholder="https://"
                />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input
                type="text"
                value={form.street}
                onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
                className={inputClass}
                placeholder="Street"
              />
              <div className="mt-2 grid gap-2 sm:grid-cols-4">
                <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className={inputClass} placeholder="City" />
                <input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} className={inputClass} placeholder="State" />
                <input value={form.zip} onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))} className={inputClass} placeholder="ZIP" />
                <input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} className={inputClass} placeholder="Country" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Payment terms</label>
                <select
                  value={form.paymentTerms}
                  onChange={(e) => setForm((f) => ({ ...f, paymentTerms: e.target.value as PaymentTerm }))}
                  className={inputClass}
                >
                  {PAYMENT_TERMS_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value as Currency }))}
                  className={inputClass}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Tax ID / VAT</label>
              <input
                type="text"
                value={form.taxId}
                onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tags</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {clientTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag as ClientTag)}
                    className={`rounded-full px-3 py-1 text-sm ${
                      form.tags.includes(tag) ? "bg-orange-500 text-white" : "bg-neutral-700 text-neutral-400 hover:bg-neutral-600"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-neutral-700 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-neutral-400">Custom fields</h3>
                <button
                  type="button"
                  onClick={() => setCustomFieldModalOpen(true)}
                  className="text-sm font-medium text-orange-400 hover:underline"
                >
                  + Add custom field
                </button>
              </div>
              {customFieldDefinitions.length === 0 ? (
                <p className="mt-2 text-sm text-neutral-500">No custom fields. Add one in User profile → Client form fields, or use the button above.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {customFieldDefinitions.map((def) => (
                    <div key={def.id}>
                      <label className={labelClass}>{def.name}</label>
                      {def.type === "text" || def.type === "email" || def.type === "phone" || def.type === "url" ? (
                        <input
                          type={def.type === "email" ? "email" : "text"}
                          value={String(getCustomValue(def.id))}
                          onChange={(e) => setCustomValue(def.id, e.target.value)}
                          className={inputClass}
                        />
                      ) : def.type === "longtext" ? (
                        <textarea
                          value={String(getCustomValue(def.id))}
                          onChange={(e) => setCustomValue(def.id, e.target.value)}
                          rows={2}
                          className={inputClass}
                        />
                      ) : def.type === "number" || def.type === "currency" ? (
                        <input
                          type="number"
                          value={String(getCustomValue(def.id))}
                          onChange={(e) => setCustomValue(def.id, e.target.value ? Number(e.target.value) : "")}
                          className={inputClass}
                        />
                      ) : def.type === "date" ? (
                        <input
                          type="date"
                          value={String(getCustomValue(def.id))}
                          onChange={(e) => setCustomValue(def.id, e.target.value)}
                          className={inputClass}
                        />
                      ) : def.type === "dropdown" ? (
                        <select
                          value={String(getCustomValue(def.id))}
                          onChange={(e) => setCustomValue(def.id, e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Select...</option>
                          {(def.options ?? []).map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      ) : def.type === "checkbox" ? (
                        <label className="flex items-center gap-2">
                          <Toggle
                            checked={Boolean(getCustomValue(def.id))}
                            onChange={(v) => setCustomValue(def.id, v)}
                            aria-label={def.name}
                          />
                          <span className="text-sm text-neutral-300">Yes</span>
                        </label>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={() => setShowEditDetails(false)}
                className="rounded-lg border border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <AddCustomFieldModal isOpen={customFieldModalOpen} onClose={() => setCustomFieldModalOpen(false)} />
      {billingModalOpen && (
        <GenerateInvoiceFromTasksModal
          isOpen={billingModalOpen}
          onClose={() => setBillingModalOpen(false)}
          defaultClientId={id}
        />
      )}
      <ClientResourcesModal
        isOpen={resourcesModalOpen}
        onClose={async () => {
          setResourcesModalOpen(false);
          // Sync resources to server if board is enabled
          if (client.boardToken && client.boardEnabled) {
            await syncBoardDataToServer(client.boardToken);
          }
        }}
        clientId={id}
      />
    </div>
  );
}
