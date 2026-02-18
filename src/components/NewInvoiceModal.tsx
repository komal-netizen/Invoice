"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { defaultSettings } from "@/lib/defaults";
import { NewClientModal } from "@/components/NewClientModal";
import { Toggle } from "@/components/Toggle";
import type { RecurrenceFrequency } from "@/lib/types";
import { RECURRENCE_FREQUENCIES } from "@/lib/types";
import { addDays, addMonths, format } from "date-fns";

type InvoiceType = "single" | "recurring";

interface NewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewInvoiceModal({ isOpen, onClose }: NewInvoiceModalProps) {
  const router = useRouter();
  const clients = useStore((s) => s.clients);
  const getProjectsByClient = useStore((s) => s.getProjectsByClient);
  const addClient = useStore((s) => s.addClient);
  const addProject = useStore((s) => s.addProject);
  const addInvoice = useStore((s) => s.addInvoice);
  const getNextInvoiceNumber = useStore((s) => s.getNextInvoiceNumber);
  const settings = useStore((s) => s.settings ?? null);

  const [invoiceType, setInvoiceType] = useState<InvoiceType>("single");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("monthly");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState("");
  const [noEndDate, setNoEndDate] = useState(true);
  const [autoSend, setAutoSend] = useState(false);
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [newProjectName, setNewProjectName] = useState("");
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [showRecurringOptions, setShowRecurringOptions] = useState(false);

  if (!isOpen) return null;

  const selectedClient = clients.find((c) => c.id === clientId);
  const projects = clientId ? getProjectsByClient(clientId) : [];
  const canSubmit = !!clientId;

  const handleCreate = () => {
    let finalProjectId = projectId;
    if (showNewProjectInput && newProjectName.trim() && clientId) {
      const proj = addProject({
        clientId,
        name: newProjectName.trim(),
        status: "active",
      });
      finalProjectId = proj.id;
    }

    const dueDate =
      selectedClient?.paymentTerms === "Net 15"
        ? addDays(new Date(), 15)
        : selectedClient?.paymentTerms === "Net 60"
          ? addMonths(new Date(), 2)
          : addMonths(new Date(), 1);
    const invNumber = getNextInvoiceNumber();
    const s = settings ?? defaultSettings;
    const currency = selectedClient?.currency ?? s.invoiceDefaults.defaultCurrency;
    const invoice = addInvoice({
      invoiceNumber: invNumber,
      clientId,
      projectId: finalProjectId,
      template: s.template,
      status: "draft",
      issueDate: format(new Date(), "yyyy-MM-dd"),
      dueDate: format(dueDate, "yyyy-MM-dd"),
      lineItems: [],
      subtotal: 0,
      taxRate: s.invoiceDefaults.defaultTaxRate,
      taxName: s.invoiceDefaults.defaultTaxName,
      taxAmount: 0,
      discountType: "none",
      discountValue: 0,
      discountAmount: 0,
      total: 0,
      currency,
      paymentMethods: (s.paymentMethods ?? []).filter((p) => p.enabled).map((p) => p.name),
      termsAndConditions: s.invoiceDefaults?.defaultTermsAndConditions ?? undefined,
      lateFeeEnabled: false,
      showLogo: true,
      showHeaderImage: false,
      applyTax: (s.invoiceDefaults?.defaultTaxRate ?? 0) > 0,
      displayTaxId: s.invoiceDefaults?.displayTaxId ?? true,
      shippingAddress: false,
      showReferenceNumber: false,
      recurringConfig:
        invoiceType === "recurring"
          ? {
              frequency,
              startDate,
              endDate: noEndDate ? undefined : endDate,
              noEndDate,
              autoSend,
            }
          : undefined,
    });
    onClose();
    reset();
    router.push(`/dashboard/invoices/${invoice.id}`);
  };

  const reset = () => {
    setInvoiceType("single");
    setClientId("");
    setProjectId(undefined);
    setNewProjectName("");
    setShowNewProjectInput(false);
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  const handleNewClientCreated = (newClientId: string) => {
    setClientId(newClientId);
    setShowNewClientModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-neutral-900 dark:border dark:border-neutral-800">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">New Invoice</h2>

        <div className="mt-6 space-y-5">
          {/* Invoice type */}
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">Invoice type</p>
            <div className="mt-2 flex gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  checked={invoiceType === "single"}
                  onChange={() => setInvoiceType("single")}
                  className="text-orange-600 dark:text-orange-400"
                />
                <span className="text-sm">Single</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  checked={invoiceType === "recurring"}
                  onChange={() => setInvoiceType("recurring")}
                  className="text-orange-600 dark:text-orange-400"
                />
                <span className="text-sm">Recurring</span>
              </label>
            </div>
            {invoiceType === "recurring" && (
              <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 space-y-3 dark:border-neutral-700 dark:bg-neutral-800/50">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  >
                    {RECURRENCE_FREQUENCIES.map((f) => (
                      <option key={f} value={f}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400">Start date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <Toggle checked={noEndDate} onChange={setNoEndDate} aria-label="No end date" />
                  <span className="text-sm text-neutral-900 dark:text-white">No end date</span>
                </label>
                {!noEndDate && (
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400">End date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    />
                  </div>
                )}
                <label className="flex items-center gap-2">
                  <Toggle checked={autoSend} onChange={setAutoSend} aria-label="Auto-send when generated" />
                  <span className="text-sm text-neutral-900 dark:text-white">Auto-send when generated</span>
                </label>
              </div>
            )}
          </div>

          {/* Client */}
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">Client</p>
            <div className="mt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowNewClientModal(true)}
                className="w-full rounded-lg border border-dashed border-orange-500 bg-orange-50 py-2 text-sm font-medium text-orange-600 hover:bg-orange-100 dark:border-orange-500 dark:bg-orange-950/30 dark:text-orange-400 dark:hover:bg-orange-950/50"
              >
                + Add New Client
              </button>
              <select
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  setProjectId(undefined);
                  setShowNewProjectInput(false);
                  setNewProjectName("");
                }}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 text-neutral-900 dark:text-white"
              >
                <option value="">Choose a client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} · {c.contactName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Project (optional) */}
          {clientId && (
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-white">Project <span className="text-xs text-neutral-500">(optional)</span></p>
              <div className="mt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewProjectInput(true);
                    setProjectId(undefined);
                  }}
                  className="w-full rounded-lg border border-dashed border-orange-500 bg-orange-50 py-2 text-sm font-medium text-orange-600 hover:bg-orange-100 dark:border-orange-500 dark:bg-orange-950/30 dark:text-orange-400 dark:hover:bg-orange-950/50"
                >
                  + New Project
                </button>
                {showNewProjectInput ? (
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Project name"
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                ) : projects.length > 0 ? (
                  <select
                    value={projectId ?? ""}
                    onChange={(e) => setProjectId(e.target.value || undefined)}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  >
                    <option value="">No Project (optional)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    No projects for this client. You can create one above or proceed without a project.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canSubmit}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50 dark:bg-orange-500 dark:hover:bg-orange-400"
          >
            Create Invoice
          </button>
        </div>
      </div>

      {showNewClientModal && (
        <NewClientModal
          isOpen={true}
          onClose={() => setShowNewClientModal(false)}
          onClientCreated={handleNewClientCreated}
        />
      )}
    </div>
  );
}
