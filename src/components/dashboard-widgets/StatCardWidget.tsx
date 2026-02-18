"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import type { StatCardConfig, StatMetric } from "@/lib/dashboard-types";

interface StatCardWidgetProps {
  config: StatCardConfig;
}

export function StatCardWidget({ config }: StatCardWidgetProps) {
  const invoices = useStore((s) => s.invoices);
  const clients = useStore((s) => s.clients);
  const projects = useStore((s) => s.projects);
  const products = useStore((s) => s.products);
  const timeEntries = useStore((s) => s.timeEntries);
  const getTotalUnbilledAmount = useStore((s) => s.getTotalUnbilledAmount);
  const getOverdueTaskCount = useStore((s) => s.getOverdueTaskCount);

  const statData = useMemo(() => {
    const getMetricData = (metric: StatMetric) => {
      switch (metric) {
        case "total-invoices":
          return {
            value: invoices.length.toString(),
            label: "Total Invoices",
            href: "/dashboard/invoices",
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            ),
            color: "orange",
            bgGradient: "from-white to-neutral-50/30",
          };

        case "total-paid": {
          const paid = invoices.filter((i) => i.status === "paid");
          const totalPaid = paid.reduce((s, i) => s + i.total, 0);
          return {
            value: totalPaid.toLocaleString("en-US", { style: "currency", currency: "USD" }),
            label: "Total Paid",
            href: "/dashboard/invoices",
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            color: "emerald",
            bgGradient: "from-white to-emerald-50/30",
          };
        }

        case "total-outstanding": {
          const outstanding = invoices.filter(
            (i) => i.status === "pending" || i.status === "overdue" || i.status === "outstanding"
          );
          const totalOutstanding = outstanding.reduce((s, i) => s + i.total, 0);
          return {
            value: totalOutstanding.toLocaleString("en-US", { style: "currency", currency: "USD" }),
            label: "Outstanding",
            href: "/dashboard/invoices",
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            color: "amber",
            bgGradient: "from-white to-neutral-50",
          };
        }

        case "unbilled-work": {
          const unbilled = getTotalUnbilledAmount();
          return {
            value: unbilled.amount > 0
              ? unbilled.amount.toLocaleString("en-US", { style: "currency", currency: unbilled.currency })
              : "$0",
            label: "Unbilled Work",
            subLabel: `${unbilled.taskCount} ${unbilled.taskCount === 1 ? 'task' : 'tasks'} ready`,
            href: "/dashboard/task-boards",
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            ),
            color: "amber",
            bgGradient: "from-white to-amber-50/30",
            isHighlight: unbilled.amount > 0,
          };
        }

        case "overdue-tasks": {
          const overdueCount = getOverdueTaskCount();
          return {
            value: overdueCount.toString(),
            label: "Overdue Tasks",
            href: "/dashboard/task-boards",
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            ),
            color: overdueCount > 0 ? "red" : "neutral",
            bgGradient: overdueCount > 0 ? "from-red-50 to-red-100/50" : "from-white to-neutral-50",
            isAlert: overdueCount > 0,
          };
        }

        case "total-clients":
          return {
            value: clients.length.toString(),
            label: "Total Clients",
            href: "/dashboard/clients",
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            ),
            color: "blue",
            bgGradient: "from-white to-blue-50/30",
          };

        case "total-projects":
          return {
            value: projects.length.toString(),
            label: "Total Projects",
            href: "/dashboard/projects",
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            ),
            color: "purple",
            bgGradient: "from-white to-purple-50/30",
          };

        case "total-hours": {
          const totalHours = timeEntries.reduce((sum, e) => sum + e.hours, 0);
          return {
            value: totalHours.toFixed(1),
            label: "Total Hours",
            href: "/dashboard/time",
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            color: "indigo",
            bgGradient: "from-white to-indigo-50/30",
          };
        }

        case "total-services":
          return {
            value: products.length.toString(),
            label: "Total Services",
            href: "/dashboard/products",
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            ),
            color: "pink",
            bgGradient: "from-white to-pink-50/30",
          };

        default:
          return {
            value: "0",
            label: "Unknown Metric",
            href: "/dashboard",
            icon: null,
            color: "neutral",
            bgGradient: "from-white to-neutral-50",
          };
      }
    };

    return getMetricData(config.metric);
  }, [
    config.metric,
    invoices,
    clients,
    projects,
    products,
    timeEntries,
    getTotalUnbilledAmount,
    getOverdueTaskCount,
  ]);

  const colorClasses = {
    orange: {
      icon: "bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400",
      border: "border-orange-300 dark:border-orange-700",
      hover: "hover:border-orange-300 dark:hover:border-orange-700",
    },
    emerald: {
      icon: "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-300 dark:border-emerald-700",
      hover: "hover:border-emerald-300 dark:hover:border-emerald-700",
    },
    amber: {
      icon: "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
      border: "border-amber-300 dark:border-amber-700",
      hover: "hover:border-amber-300 dark:hover:border-amber-700",
    },
    red: {
      icon: "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400",
      border: "border-red-300 dark:border-red-900",
      hover: "hover:border-red-400 dark:hover:border-red-800",
    },
    blue: {
      icon: "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
      border: "border-blue-300 dark:border-blue-700",
      hover: "hover:border-blue-300 dark:hover:border-blue-700",
    },
    purple: {
      icon: "bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400",
      border: "border-purple-300 dark:border-purple-700",
      hover: "hover:border-purple-300 dark:hover:border-purple-700",
    },
    indigo: {
      icon: "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400",
      border: "border-indigo-300 dark:border-indigo-700",
      hover: "hover:border-indigo-300 dark:hover:border-indigo-700",
    },
    pink: {
      icon: "bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400",
      border: "border-pink-300 dark:border-pink-700",
      hover: "hover:border-pink-300 dark:hover:border-pink-700",
    },
    neutral: {
      icon: "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400",
      border: "border-neutral-300 dark:border-neutral-700",
      hover: "hover:border-neutral-300 dark:hover:border-neutral-700",
    },
  };

  const colors = colorClasses[statData.color as keyof typeof colorClasses] || colorClasses.neutral;

  return (
    <Link
      href={statData.href}
      className={`group flex h-full flex-col justify-between rounded-xl border border-neutral-200 bg-gradient-to-br ${statData.bgGradient} p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-900/50 ${colors.hover} dark:focus:ring-offset-neutral-950`}
      aria-label={`${statData.label}: ${statData.value}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{statData.label}</p>
        {statData.icon && (
          <div className={`rounded-lg p-2 ${colors.icon}`} aria-hidden="true">
            {statData.icon}
          </div>
        )}
      </div>
      <div className="mt-2">
        <p className={`text-3xl font-semibold ${statData.isHighlight ? `text-${statData.color}-600 dark:text-${statData.color}-400` : 'text-neutral-900 dark:text-white'}`}>
          {statData.value}
        </p>
        {statData.subLabel && (
          <p className="mt-2 text-xs text-neutral-400 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-400 transition-colors">
            {statData.subLabel}
          </p>
        )}
      </div>
    </Link>
  );
}
