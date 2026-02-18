"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

const inputClass =
  "rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

interface GenerateInvoiceFromTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClientId?: string;
  defaultProjectId?: string;
  defaultBoardId?: string;
}

export function GenerateInvoiceFromTasksModal({
  isOpen,
  onClose,
  defaultClientId,
  defaultProjectId,
  defaultBoardId,
}: GenerateInvoiceFromTasksModalProps) {
  const router = useRouter();
  const clients = useStore((s) => s.clients);
  const projects = useStore((s) => s.projects);
  const products = useStore((s) => s.products);
  const getUninvoicedBillableTasks = useStore((s) => s.getUninvoicedBillableTasks);
  const getTimeTrackedForTask = useStore((s) => s.getTimeTrackedForTask);
  const getProduct = useStore((s) => s.getProduct);
  const createInvoiceFromTasks = useStore((s) => s.createInvoiceFromTasks);
  const settings = useStore((s) => s.settings);
  const taxRate = settings?.invoiceDefaults?.defaultTaxRate ?? 0;
  const taxName = settings?.invoiceDefaults?.defaultTaxName ?? "Tax";

  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [projectId, setProjectId] = useState(defaultProjectId ?? "");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const uninvoicedTasks = isOpen
    ? getUninvoicedBillableTasks({
        clientId: clientId || undefined,
        projectId: projectId || undefined,
        boardId: defaultBoardId,
      })
    : [];

  useEffect(() => {
    if (!isOpen) return;
    setClientId(defaultClientId ?? "");
    setProjectId(defaultProjectId ?? "");
    const tasks = getUninvoicedBillableTasks({
      clientId: defaultClientId || undefined,
      projectId: defaultProjectId || undefined,
      boardId: defaultBoardId,
    });
    setSelectedIds(new Set(tasks.map((t) => t.id)));
  }, [isOpen, defaultClientId, defaultProjectId, defaultBoardId, getUninvoicedBillableTasks]);

  useEffect(() => {
    if (isOpen && clientId && !projectId) {
      const firstProject = projects.find((p) => p.clientId === clientId);
      if (firstProject) setProjectId(firstProject.id);
    }
  }, [isOpen, clientId, projectId, projects]);

  const toggleTask = (taskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(uninvoicedTasks.map((t) => t.id)));
  };

  const selectNone = () => setSelectedIds(new Set());

  let subtotal = 0;
  const rows = uninvoicedTasks.map((t) => {
    const hours = getTimeTrackedForTask(t.id);
    const service = t.serviceId ? getProduct(t.serviceId) : undefined;
    const rate = service?.defaultPrice ?? 0;
    const amount = Math.round(hours * rate * 100) / 100;
    if (selectedIds.has(t.id)) subtotal += amount;
    return { task: t, hours, service, rate, amount };
  });

  const taxAmount = Math.round(subtotal * taxRate * 0.01 * 100) / 100;
  const total = subtotal + taxAmount;

  const handleCreate = () => {
    if (!clientId || selectedIds.size === 0) return;
    const invoice = createInvoiceFromTasks({
      taskIds: Array.from(selectedIds),
      clientId,
      projectId: projectId || undefined,
    });
    onClose();
    if (invoice) router.push(`/dashboard/invoices/${invoice.id}`);
  };

  if (!isOpen) return null;

  const clientProjects = projects.filter((p) => p.clientId === clientId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-neutral-700 bg-neutral-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-white">Generate Invoice from Tasks</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-white"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Client</label>
              <select
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  setProjectId("");
                }}
                className={`w-full ${inputClass}`}
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className={`w-full ${inputClass}`}
                disabled={!clientId}
              >
                <option value="">All / None</option>
                {clientProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-neutral-400">Select tasks</label>
              <div className="flex gap-2">
                <button type="button" onClick={selectAll} className="text-xs text-orange-400 hover:underline">All</button>
                <button type="button" onClick={selectNone} className="text-xs text-neutral-500 hover:underline">None</button>
              </div>
            </div>
            {uninvoicedTasks.length === 0 ? (
              <p className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-4 text-sm text-neutral-500">
                No completed billable tasks to invoice for this client{projectId ? " / project" : ""}. Mark tasks as billable, set a service, and move them to a Done/Approved list.
              </p>
            ) : (
              <ul className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-800/50 p-2">
                {rows.map(({ task, hours, service, rate, amount }) => (
                  <li key={task.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-neutral-700/50">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(task.id)}
                      onChange={() => toggleTask(task.id)}
                      className="rounded border-neutral-600 bg-neutral-800 text-orange-500"
                    />
                    <span className="min-w-0 flex-1 truncate text-white" title={task.title}>{task.title}</span>
                    <span className="shrink-0 text-neutral-400">{hours.toFixed(1)}h</span>
                    <span className="shrink-0 text-neutral-500">{service?.name ?? "—"}</span>
                    <span className="shrink-0 font-medium text-emerald-400">${amount.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-3 text-sm">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal</span>
                <span className="text-white">${subtotal.toFixed(2)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between text-neutral-400 mt-1">
                  <span>{taxName} ({taxRate}%)</span>
                  <span className="text-white">${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-neutral-600 pt-2 font-medium text-white">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-neutral-700 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!clientId || selectedIds.size === 0}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50 disabled:pointer-events-none"
          >
            Create Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
