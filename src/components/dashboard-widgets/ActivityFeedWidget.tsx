"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import type { ActivityFeedConfig, ActivityEvent } from "@/lib/dashboard-types";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";

interface ActivityFeedWidgetProps {
  config: ActivityFeedConfig;
}

export function ActivityFeedWidget({ config }: ActivityFeedWidgetProps) {
  const invoices = useStore((s) => s.invoices);
  const projects = useStore((s) => s.projects);
  const timeEntries = useStore((s) => s.timeEntries);
  const boardTasks = useStore((s) => s.boardTasks);
  const clients = useStore((s) => s.clients);
  const getClient = useStore((s) => s.getClient);

  const activities = useMemo(() => {
    const events: ActivityEvent[] = [];

    // Invoice activities
    invoices.forEach((inv) => {
      const client = getClient(inv.clientId);

      // Invoice paid
      if (inv.status === "paid" && inv.paidAt) {
        events.push({
          id: `invoice-paid-${inv.id}`,
          type: "invoice_paid",
          timestamp: inv.paidAt,
          title: `Invoice ${inv.invoiceNumber} paid`,
          description: `${client?.companyName ?? "Unknown client"}`,
          metadata: {
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            clientId: inv.clientId,
            clientName: client?.companyName,
            amount: inv.total,
            currency: inv.currency,
          },
        });
      }

      // Invoice created (use createdAt)
      if (inv.createdAt) {
        events.push({
          id: `invoice-created-${inv.id}`,
          type: "invoice_created",
          timestamp: inv.createdAt,
          title: `Invoice ${inv.invoiceNumber} created`,
          description: `For ${client?.companyName ?? "Unknown client"}`,
          metadata: {
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            clientId: inv.clientId,
            clientName: client?.companyName,
            amount: inv.total,
            currency: inv.currency,
          },
        });
      }
    });

    // Project activities
    projects.forEach((proj) => {
      const client = getClient(proj.clientId);
      if (proj.createdAt) {
        events.push({
          id: `project-created-${proj.id}`,
          type: "project_created",
          timestamp: proj.createdAt,
          title: `Project "${proj.name}" created`,
          description: `For ${client?.companyName ?? "Unknown client"}`,
          metadata: {
            projectId: proj.id,
            projectName: proj.name,
            clientId: proj.clientId,
            clientName: client?.companyName,
          },
        });
      }
    });

    // Time tracking activities (recent time entries)
    timeEntries.slice(-20).forEach((entry) => {
      if (entry.createdAt) {
        const task = boardTasks.find((t) => t.id === entry.taskId);
        events.push({
          id: `time-logged-${entry.id}`,
          type: "time_logged",
          timestamp: entry.createdAt,
          title: `${entry.hours.toFixed(1)} hours logged`,
          description: task ? `On task: ${task.title}` : "Time entry added",
          metadata: {
            hours: entry.hours,
            taskId: entry.taskId,
            taskTitle: task?.title,
          },
        });
      }
    });

    // Task activities (completed tasks)
    boardTasks
      .filter((t) => t.completedAt)
      .forEach((task) => {
        events.push({
          id: `task-completed-${task.id}`,
          type: "task_completed",
          timestamp: task.completedAt!,
          title: `Task completed: ${task.title}`,
          description: task.description?.slice(0, 60) ?? "No description",
          metadata: {
            taskId: task.id,
            taskTitle: task.title,
          },
        });
      });

    // Client activities
    clients.slice(-10).forEach((client) => {
      if (client.createdAt) {
        events.push({
          id: `client-added-${client.id}`,
          type: "client_added",
          timestamp: client.createdAt,
          title: `Client added: ${client.companyName}`,
          description: client.email || "New client",
          metadata: {
            clientId: client.id,
            clientName: client.companyName,
          },
        });
      }
    });

    // Sort by timestamp (most recent first)
    const sorted = events.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Limit to maxItems
    return sorted.slice(0, config.maxItems ?? 10);
  }, [invoices, projects, timeEntries, boardTasks, clients, getClient, config.maxItems]);

  // Group activities by date if configured
  const groupedActivities = useMemo(() => {
    if (!config.groupByDate) {
      return [{ label: "All Activity", events: activities }];
    }

    const groups: { label: string; events: ActivityEvent[] }[] = [];
    const today: ActivityEvent[] = [];
    const yesterday: ActivityEvent[] = [];
    const thisWeek: ActivityEvent[] = [];
    const older: ActivityEvent[] = [];

    activities.forEach((event) => {
      const date = new Date(event.timestamp);
      if (isToday(date)) {
        today.push(event);
      } else if (isYesterday(date)) {
        yesterday.push(event);
      } else if (isThisWeek(date, { weekStartsOn: 1 })) {
        thisWeek.push(event);
      } else {
        older.push(event);
      }
    });

    if (today.length > 0) groups.push({ label: "Today", events: today });
    if (yesterday.length > 0) groups.push({ label: "Yesterday", events: yesterday });
    if (thisWeek.length > 0) groups.push({ label: "This Week", events: thisWeek });
    if (older.length > 0) groups.push({ label: "Older", events: older });

    return groups;
  }, [activities, config.groupByDate]);

  const getEventIcon = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "invoice_paid":
      case "payment_received":
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
            <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case "invoice_created":
      case "invoice_sent":
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
            <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case "project_created":
      case "project_updated":
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950">
            <svg className="h-4 w-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </div>
        );
      case "time_logged":
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950">
            <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case "task_created":
      case "task_completed":
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950">
            <svg className="h-4 w-4 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
      case "client_added":
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-950">
            <svg className="h-4 w-4 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <svg className="h-4 w-4 text-neutral-600 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  if (activities.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <svg className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">No recent activity</h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Your activity will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5">
      {groupedActivities.map((group) => (
        <div key={group.label} className="mb-6 last:mb-0">
          {config.groupByDate && (
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {group.label}
            </h4>
          )}
          <ul className="space-y-3">
            {group.events.map((event) => (
              <li key={event.id} className="flex items-start gap-3">
                {getEventIcon(event.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    {event.title}
                    {event.metadata?.amount && (
                      <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                        {event.metadata.amount.toLocaleString("en-US", {
                          style: "currency",
                          currency: event.metadata.currency ?? "USD",
                        })}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                    {event.description}
                  </p>
                  <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                    {format(new Date(event.timestamp), "MMM d, h:mm a")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
