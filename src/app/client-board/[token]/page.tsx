"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import type { ClientBoardSnapshot } from "@/lib/client-board-store";
import { ClientTimeline } from "@/components/ClientTimeline";

function formatDateSafe(dateStr: string | undefined, fmt: string, fallback = "—") {
  if (!dateStr) return fallback;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return fallback;
  return format(d, fmt);
}

const PROJECT_STATUS_CLASS: Record<string, string> = {
  planning: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  on_hold: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  completed: "bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300",
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
};

const PRIORITY_CLASS: Record<string, string> = {
  low: "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  high: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export default function ClientBoardPage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<ClientBoardSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"projects" | "deliverables" | "timeline" | "resources" | "gallery" | "onboarding">("projects");

  useEffect(() => {
    if (!token) return;

    fetch(`/api/client-board/${encodeURIComponent(token)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Board not found");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <svg className="mx-auto h-16 w-16 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h1 className="mt-4 text-xl font-semibold text-neutral-900 dark:text-white">Board Not Available</h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              This client board could not be found or has been disabled.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="animate-pulse rounded-xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mx-auto h-16 w-16 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            <div className="mt-4 h-6 w-48 mx-auto rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="mt-2 h-4 w-64 mx-auto rounded bg-neutral-100 dark:bg-neutral-800" />
          </div>
        </div>
      </div>
    );
  }

  const activeProjects = data.projects.filter((p) => p.status === "active" || p.status === "planning");
  const completedProjects = data.projects.filter((p) => p.status === "completed");
  const tasksByProject = data.tasks.reduce((acc, task) => {
    const projectId = task.projectId || "unassigned";
    if (!acc[projectId]) acc[projectId] = [];
    acc[projectId].push(task);
    return acc;
  }, {} as Record<string, typeof data.tasks>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                {data.client.companyName}
              </h1>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Project Portal
              </p>
            </div>
            <div className="text-right text-sm text-neutral-500 dark:text-neutral-400">
              <p>Last updated</p>
              <p className="font-medium text-neutral-700 dark:text-neutral-300">
                {formatDateSafe(data.lastUpdated, "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Message */}
        {data.client.boardWelcomeMessage && (
          <div className="mb-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 flex-shrink-0 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <div className="flex-1">
                <h2 className="text-sm font-medium text-neutral-900 dark:text-white">Welcome</h2>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                  {data.client.boardWelcomeMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
          <button
            onClick={() => setActiveTab("projects")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "projects"
                ? "bg-orange-500 text-white"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            Projects ({data.projects.length})
          </button>
          <button
            onClick={() => setActiveTab("deliverables")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "deliverables"
                ? "bg-orange-500 text-white"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            Deliverables ({data.tasks.length})
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "timeline"
                ? "bg-orange-500 text-white"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setActiveTab("resources")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "resources"
                ? "bg-orange-500 text-white"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            Resources ({data.resources.filter(r => r.type !== "image" && r.type !== "video").length})
          </button>
          <button
            onClick={() => setActiveTab("gallery")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "gallery"
                ? "bg-orange-500 text-white"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            Gallery ({data.resources.filter(r => r.type === "image" || r.type === "video").length})
          </button>
          {data.onboardingSubmission && (
            <button
              onClick={() => setActiveTab("onboarding")}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "onboarding"
                  ? "bg-orange-500 text-white"
                  : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              Onboarding Details
            </button>
          )}
        </div>

        {/* Projects Tab */}
        {activeTab === "projects" && (
          <div className="space-y-6">
            {activeProjects.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">Active Projects</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {activeProjects.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-neutral-900 dark:text-white">{project.name}</h3>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${PROJECT_STATUS_CLASS[project.status] || ""}`}>
                          {PROJECT_STATUS_LABELS[project.status] || project.status}
                        </span>
                      </div>
                      {project.description && (
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <div className="mt-4 flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                        {project.startDate && (
                          <div>
                            <span className="font-medium">Started:</span> {formatDateSafe(project.startDate, "MMM d, yyyy")}
                          </div>
                        )}
                        {project.dueDate && (
                          <div>
                            <span className="font-medium">Due:</span> {formatDateSafe(project.dueDate, "MMM d, yyyy")}
                          </div>
                        )}
                      </div>
                      {tasksByProject[project.id] && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {tasksByProject[project.id].filter((t) => t.completedAt).length} / {tasksByProject[project.id].length} tasks completed
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completedProjects.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">Completed Projects</h2>
                <div className="space-y-3">
                  {completedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <div>
                        <h3 className="font-medium text-neutral-900 dark:text-white">{project.name}</h3>
                        {project.dueDate && (
                          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                            Completed: {formatDateSafe(project.dueDate, "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${PROJECT_STATUS_CLASS[project.status] || ""}`}>
                        {PROJECT_STATUS_LABELS[project.status] || project.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.projects.length === 0 && (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-white/50 py-12 text-center dark:border-neutral-700 dark:bg-neutral-900/50">
                <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">No projects yet</p>
              </div>
            )}
          </div>
        )}

        {/* Deliverables Tab */}
        {activeTab === "deliverables" && (
          <div className="space-y-6">
            {Object.entries(tasksByProject).map(([projectId, tasks]) => {
              const project = data.projects.find((p) => p.id === projectId);
              const projectName = project?.name || "General Tasks";
              
              return (
                <div key={projectId}>
                  <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">{projectName}</h2>
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-start gap-3 rounded-lg border p-4 ${
                          task.completedAt
                            ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                            : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                        }`}
                      >
                        <div className="mt-0.5">
                          {task.completedAt ? (
                            <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-neutral-300 dark:border-neutral-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className={`font-medium ${task.completedAt ? "text-neutral-600 dark:text-neutral-400" : "text-neutral-900 dark:text-white"}`}>
                              {task.title}
                            </h3>
                            {task.priority && task.priority !== "medium" && (
                              <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_CLASS[task.priority] || ""}`}>
                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{task.description}</p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                            {task.listName && (
                              <span className="inline-flex items-center gap-1">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                {task.listName}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className="inline-flex items-center gap-1">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {task.completedAt ? "Completed" : "Due"}: {formatDateSafe(task.completedAt || task.dueDate, "MMM d, yyyy")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {data.tasks.length === 0 && (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-white/50 py-12 text-center dark:border-neutral-700 dark:bg-neutral-900/50">
                <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">No deliverables yet</p>
              </div>
            )}
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === "timeline" && (
          <div>
            <ClientTimeline projects={data.projects} tasks={data.tasks} />
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === "resources" && (
          <div className="space-y-3">
            {data.resources.filter(r => r.type !== "image" && r.type !== "video").map((resource) => (
              <div
                key={resource.id}
                className="flex items-start gap-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex-shrink-0">
                  {resource.type === "file" && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                      <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {resource.type === "link" && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/40">
                      <svg className="h-6 w-6 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                  )}
                  {resource.type === "note" && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                      <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-neutral-900 dark:text-white">
                    {resource.title}
                    {resource.isPinned && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                        Pinned
                      </span>
                    )}
                  </h3>
                  {resource.description && (
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{resource.description}</p>
                  )}
                  {resource.content && resource.type === "note" && (
                    <div className="mt-2 rounded-md bg-neutral-50 p-3 text-sm text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 whitespace-pre-wrap">
                      {resource.content}
                    </div>
                  )}
                  {resource.url && (resource.type === "file" || resource.type === "link") && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                    >
                      {resource.type === "file" ? "Download" : "Open Link"}
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            ))}

            {data.resources.filter(r => r.type !== "image" && r.type !== "video").length === 0 && (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-white/50 py-12 text-center dark:border-neutral-700 dark:bg-neutral-900/50">
                <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">No resources available</p>
              </div>
            )}
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === "gallery" && (
          <div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.resources.filter(r => r.type === "image" || r.type === "video").map((item) => (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
                >
                  {/* Image/Video */}
                  <div className="aspect-video w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    {item.type === "image" && item.url && (
                      <img
                        src={item.url}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    {item.type === "video" && item.url && (
                      <video
                        src={item.url}
                        controls
                        className="h-full w-full object-cover"
                        poster={item.thumbnailUrl}
                      />
                    )}
                  </div>
                  
                  {/* Info Overlay */}
                  <div className="p-4">
                    <h3 className="font-medium text-neutral-900 dark:text-white">
                      {item.title}
                      {item.isPinned && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                          Featured
                        </span>
                      )}
                    </h3>
                    {item.description && (
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    {item.category && (
                      <span className="mt-2 inline-block rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                        {item.category}
                      </span>
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                      >
                        View Full Size
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {data.resources.filter(r => r.type === "image" || r.type === "video").length === 0 && (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-white/50 py-12 text-center dark:border-neutral-700 dark:bg-neutral-900/50">
                <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">No gallery items yet</p>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">Images and videos will appear here</p>
              </div>
            )}
          </div>
        )}

        {/* Onboarding Tab */}
        {activeTab === "onboarding" && data.onboardingSubmission && (
          <div>
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-6 border-b border-neutral-200 pb-4 dark:border-neutral-800">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {data.onboardingSubmission.formName}
                </h2>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Submitted on {formatDateSafe(data.onboardingSubmission.submittedAt, "PPp")}
                </p>
                {data.onboardingSubmission.status === "accepted" && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Accepted
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {data.onboardingSubmission.responses.map((response, idx) => (
                  <div key={idx} className="border-b border-neutral-100 pb-4 last:border-0 dark:border-neutral-800">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {response.fieldLabel}
                    </label>
                    <div className="mt-2">
                      {response.fieldType === "file-upload" ? (
                        <a
                          href={response.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          {response.value as string}
                        </a>
                      ) : Array.isArray(response.value) ? (
                        <ul className="mt-1 space-y-1">
                          {response.value.map((val, valIdx) => (
                            <li key={valIdx} className="flex items-center gap-2 text-sm text-neutral-900 dark:text-neutral-100">
                              <svg className="h-4 w-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              {val as string}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap">
                          {response.value ? response.value.toString() : "—"}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {data.onboardingSubmission.reviewNotes && (
                <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Review Notes
                  </p>
                  <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
                    {data.onboardingSubmission.reviewNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-neutral-200 bg-white py-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-neutral-500 dark:text-neutral-400 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} {data.client.companyName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
