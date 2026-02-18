"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import type { ActionCenterConfig } from "@/lib/dashboard-types";
import { format } from "date-fns";

interface ActionCenterWidgetProps {
  config: ActionCenterConfig;
}

export function ActionCenterWidget({ config }: ActionCenterWidgetProps) {
  const invoices = useStore((s) => s.invoices);
  const getClient = useStore((s) => s.getClient);
  const getTotalUnbilledAmount = useStore((s) => s.getTotalUnbilledAmount);
  const formSubmissions = useStore((s) => s.formSubmissions);

  const actionItems = useMemo(() => {
    const items: Array<{
      id: string;
      type: "overdue" | "unbilled" | "pending";
      title: string;
      description: string;
      href: string;
      amount?: string;
      priority: number;
    }> = [];

    // Overdue invoices
    if (config.showOverdue) {
      const overdueInvoices = invoices.filter((inv) => {
        if (inv.status !== "pending" && inv.status !== "overdue") return false;
        const due = new Date(inv.dueDate);
        return due < new Date();
      });

      overdueInvoices.forEach((inv) => {
        const client = getClient(inv.clientId);
        items.push({
          id: `overdue-${inv.id}`,
          type: "overdue",
          title: `Invoice ${inv.invoiceNumber} is overdue`,
          description: `${client?.companyName ?? "Unknown client"} • Due ${format(new Date(inv.dueDate), "MMM d, yyyy")}`,
          href: `/dashboard/invoices/${inv.id}`,
          amount: inv.total.toLocaleString("en-US", {
            style: "currency",
            currency: inv.currency,
          }),
          priority: 3, // Highest priority
        });
      });
    }

    // Unbilled work
    if (config.showUnbilled) {
      const unbilled = getTotalUnbilledAmount();
      if (unbilled.amount > 0 && unbilled.taskCount > 0) {
        items.push({
          id: "unbilled-work",
          type: "unbilled",
          title: `${unbilled.taskCount} completed ${unbilled.taskCount === 1 ? "task" : "tasks"} ready to invoice`,
          description: "Create invoices from completed billable work",
          href: "/dashboard/task-boards",
          amount: unbilled.amount.toLocaleString("en-US", {
            style: "currency",
            currency: unbilled.currency,
          }),
          priority: 2,
        });
      }
    }

    // Pending form submissions
    if (config.showPending) {
      const pendingForms = formSubmissions.filter((s) => s.status === "pending");
      pendingForms.forEach((submission) => {
        items.push({
          id: `pending-${submission.id}`,
          type: "pending",
          title: "New onboarding form submission",
          description: `Submitted ${format(new Date(submission.submittedAt), "MMM d, yyyy")}`,
          href: `/dashboard/onboarding-forms/submissions`,
          priority: 1,
        });
      });
    }

    // Sort by priority (highest first) and limit
    return items
      .sort((a, b) => b.priority - a.priority)
      .slice(0, config.maxItems ?? 10);
  }, [
    invoices,
    getClient,
    getTotalUnbilledAmount,
    formSubmissions,
    config.showOverdue,
    config.showUnbilled,
    config.showPending,
    config.maxItems,
  ]);

  if (actionItems.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
            <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">All caught up!</h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            No urgent items requiring your attention
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5">
      <ul className="space-y-3">
        {actionItems.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="block rounded-lg border border-neutral-200 bg-white p-4 transition-all hover:border-orange-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-orange-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {item.type === "overdue" && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
                        <svg className="h-3.5 w-3.5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                      </div>
                    )}
                    {item.type === "unbilled" && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
                        <svg className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                    {item.type === "pending" && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
                        <svg className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                    <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                      {item.title}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 truncate">
                    {item.description}
                  </p>
                </div>
                {item.amount && (
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {item.amount}
                    </p>
                  </div>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
