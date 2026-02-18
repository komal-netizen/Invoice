"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import type { ActivitiesBlockConfig } from "@/lib/client-dashboard-types";
import { BlockHeader } from "../BlockHeader";

interface Activity {
  id: string;
  type: string;
  timestamp: string;
  description: string;
  link?: string;
}

interface ActivitiesBlockProps {
  clientId: string;
  activities: Activity[];
  config: ActivitiesBlockConfig;
  onTitleChange?: (newTitle: string) => void;
  onRemove?: () => void;
}

export function ActivitiesBlock({
  clientId,
  activities,
  config,
  onTitleChange,
  onRemove,
}: ActivitiesBlockProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const displayedActivities = config.maxItems
    ? activities.slice(0, config.maxItems)
    : activities;

  const getActivityIcon = (type: string) => {
    if (type === "invoice_created") {
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      );
    } else if (type === "invoice_paid") {
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (type === "project_created" || type === "project_completed") {
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
      );
    } else if (type === "time_logged") {
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else {
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      );
    }
  };

  const getActivityColorClass = (type: string) => {
    if (type === "invoice_paid" || type === "project_completed") {
      return "text-emerald-400 bg-emerald-500/10";
    } else if (type === "invoice_created") {
      return "text-orange-400 bg-orange-500/10";
    } else if (type === "time_logged") {
      return "text-blue-400 bg-blue-500/10";
    } else {
      return "text-purple-400 bg-purple-500/10";
    }
  };

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
      <BlockHeader
        title={config.title}
        isCollapsible={config.isCollapsible}
        defaultCollapsed={config.defaultCollapsed}
        onTitleChange={onTitleChange}
        onRemove={onRemove}
      />

      {displayedActivities.length === 0 ? (
        <p className="text-sm text-neutral-500">No recent activity</p>
      ) : (
        <div className="space-y-4">
          {displayedActivities.map((activity) => {
            const icon = config.showIcons !== false ? getActivityIcon(activity.type) : null;
            const colorClass = getActivityColorClass(activity.type);

            return (
              <div key={activity.id} className="flex gap-3">
                {icon && (
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                    {icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {activity.link ? (
                    <Link href={activity.link} className="text-sm text-white hover:text-orange-400 line-clamp-2">
                      {activity.description}
                    </Link>
                  ) : (
                    <p className="text-sm text-white line-clamp-2">{activity.description}</p>
                  )}
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {mounted
                      ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })
                      : format(new Date(activity.timestamp), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
