"use client";

import Link from "next/link";
import type { QuickActionsConfig, QuickAction } from "@/lib/dashboard-types";

interface QuickActionsWidgetProps {
  config: QuickActionsConfig;
}

export function QuickActionsWidget({ config }: QuickActionsWidgetProps) {
  const getActionData = (action: QuickAction) => {
    switch (action) {
      case "new-invoice":
        return {
          href: "/dashboard/invoices",
          label: "New Invoice",
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          ),
          primary: true,
        };
      case "log-time":
        return {
          href: "/dashboard/time",
          label: "Log Time",
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          primary: false,
        };
      case "add-task":
        return {
          href: "/dashboard/task-boards",
          label: "Add Task",
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ),
          primary: false,
        };
      case "add-client":
        return {
          href: "/dashboard/clients",
          label: "Add Client",
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          ),
          primary: false,
        };
      case "add-project":
        return {
          href: "/dashboard/projects",
          label: "Add Project",
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          ),
          primary: false,
        };
      case "create-board":
        return {
          href: "/dashboard/task-boards",
          label: "Create Board",
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          ),
          primary: false,
        };
      default:
        return {
          href: "/dashboard",
          label: "Unknown",
          icon: null,
          primary: false,
        };
    }
  };

  const buttonSize = {
    small: "px-3 py-2 text-sm",
    medium: "px-4 py-2.5 text-sm",
    large: "px-6 py-3 text-base",
  }[config.buttonSize];

  return (
    <div className="p-5">
      <div
        className={`flex ${
          config.layout === "grid"
            ? "flex-wrap gap-3"
            : "flex-wrap gap-2"
        }`}
      >
        {config.actions.map((action) => {
          const actionData = getActionData(action);
          return (
            <Link
              key={action}
              href={actionData.href}
              className={`inline-flex items-center gap-2 rounded-lg font-medium transition-all ${buttonSize} ${
                actionData.primary
                  ? "bg-orange-500 text-white hover:bg-orange-400 active:bg-orange-600"
                  : "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {actionData.icon}
              {actionData.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
