"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import type { RecentInvoicesConfig } from "@/lib/dashboard-types";
import { format } from "date-fns";

interface RecentInvoicesWidgetProps {
  config: RecentInvoicesConfig;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending: "Pending",
  paid: "Paid",
  overdue: "Overdue",
  outstanding: "Outstanding",
  scheduled: "Scheduled",
};

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  outstanding: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
};

export function RecentInvoicesWidget({ config }: RecentInvoicesWidgetProps) {
  const invoices = useStore((s) => s.invoices);
  const getClient = useStore((s) => s.getClient);

  const filteredInvoices = invoices
    .filter((inv) => {
      if (config.filterStatus && config.filterStatus.length > 0) {
        return config.filterStatus.includes(inv.status);
      }
      return true;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, config.rowCount);

  if (filteredInvoices.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <svg className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">No invoices yet</h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Create your first invoice to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50">
            {config.showColumns.includes("invoiceNumber") && (
              <th className="p-4 font-medium text-neutral-700 dark:text-neutral-300">Invoice</th>
            )}
            {config.showColumns.includes("client") && (
              <th className="p-4 font-medium text-neutral-700 dark:text-neutral-300">Client</th>
            )}
            {config.showColumns.includes("dueDate") && (
              <th className="p-4 font-medium text-neutral-700 dark:text-neutral-300">Due</th>
            )}
            {config.showColumns.includes("amount") && (
              <th className="p-4 font-medium text-neutral-700 dark:text-neutral-300">Amount</th>
            )}
            {config.showColumns.includes("status") && (
              <th className="p-4 font-medium text-neutral-700 dark:text-neutral-300">Status</th>
            )}
          </tr>
        </thead>
        <tbody>
          {filteredInvoices.map((inv) => {
            const client = getClient(inv.clientId);
            return (
              <tr
                key={inv.id}
                className="border-b border-neutral-100 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50 transition-colors"
              >
                {config.showColumns.includes("invoiceNumber") && (
                  <td className="p-4">
                    <Link
                      href={`/dashboard/invoices/${inv.id}`}
                      className="font-medium text-orange-600 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                )}
                {config.showColumns.includes("client") && (
                  <td className="p-4 text-neutral-600 dark:text-neutral-400">
                    {client?.companyName ?? "—"}
                  </td>
                )}
                {config.showColumns.includes("dueDate") && (
                  <td className="p-4 text-neutral-600 dark:text-neutral-400">
                    {inv.dueDate ? format(new Date(inv.dueDate), "MMM d, yyyy") : "—"}
                  </td>
                )}
                {config.showColumns.includes("amount") && (
                  <td className="p-4 font-medium text-neutral-900 dark:text-white">
                    {inv.total.toLocaleString("en-US", {
                      style: "currency",
                      currency: inv.currency,
                    })}
                  </td>
                )}
                {config.showColumns.includes("status") && (
                  <td className="p-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_CLASS[inv.status] ?? ""
                      }`}
                    >
                      {STATUS_LABELS[inv.status]}
                    </span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
