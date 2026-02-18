"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { NewProjectModal } from "@/components/NewProjectModal";
import type { ProjectStatus } from "@/lib/types";
import { format } from "date-fns";

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
};

const PROJECT_STATUS_CLASS: Record<ProjectStatus, string> = {
  planning: "bg-blue-500/20 text-blue-400",
  active: "bg-emerald-500/20 text-emerald-400",
  on_hold: "bg-amber-500/20 text-amber-400",
  completed: "bg-neutral-500/20 text-neutral-400",
};

function formatDateSafe(dateStr: string | undefined, fmt: string, fallback = "—") {
  if (dateStr == null || dateStr === "") return fallback;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return fallback;
  return format(d, fmt);
}

export default function ProjectsPage() {
  const [mounted, setMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const projects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);
  const getBoardTasksForProject = useStore((s) => s.getBoardTasksForProject);
  const getBoardsByProject = useStore((s) => s.getBoardsByProject);
  const getBoardLists = useStore((s) => s.getBoardLists);
  const invoices = useStore((s) => s.invoices);

  const projectStats = useMemo(() => {
    const map: Record<string, { taskCount: number; doneCount: number; invoiceCount: number; boardCount: number }> = {};
    for (const p of projects) {
      const boardTasks = getBoardTasksForProject(p.id);
      const boards = getBoardsByProject(p.id);
      const doneListIds = new Set<string>();
      for (const b of boards) {
        const lists = getBoardLists(b.id);
        const doneList = lists.find((l) => l.name.toLowerCase() === "done");
        if (doneList) doneListIds.add(doneList.id);
      }
      const doneCount = boardTasks.filter((t) => doneListIds.has(t.listId)).length;
      const projectInvoices = invoices.filter((i) => i.projectId === p.id);
      map[p.id] = {
        taskCount: boardTasks.length,
        doneCount,
        invoiceCount: projectInvoices.length,
        boardCount: boards.length,
      };
    }
    return map;
  }, [projects, getBoardTasksForProject, getBoardsByProject, getBoardLists, invoices]);

  const filtered = useMemo(() => {
    let list = projects;
    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (clientFilter !== "all") {
      list = list.filter((p) => p.clientId === clientFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => {
        const client = clients.find((c) => c.id === p.clientId);
        return (
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          client?.companyName?.toLowerCase().includes(q) ||
          client?.contactName?.toLowerCase().includes(q)
        );
      });
    }
    return list.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [projects, statusFilter, clientFilter, search, clients]);

  const hasActiveFilters = statusFilter !== "all" || clientFilter !== "all";

  const inputClass =
    "rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";
  const selectClass =
    "rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

  if (!mounted) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-white">Projects</h1>
        <div className="mt-8 flex min-h-[200px] items-center justify-center">
          <p className="text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-white">Projects</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-neutral-600 bg-neutral-800/50 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-md p-2 ${viewMode === "grid" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white"}`}
              title="Grid view"
              aria-label="Grid view"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-md p-2 ${viewMode === "list" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white"}`}
              title="List view"
              aria-label="List view"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-400"
          >
            New Project
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputClass}
        />
        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterMenuOpen(!filterMenuOpen)}
            className={`relative flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
              hasActiveFilters
                ? "border-orange-500 bg-orange-500 text-white hover:bg-orange-400"
                : "border-neutral-600 bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
            }`}
            title="Filter projects"
            aria-label="Filter projects"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-xs font-medium text-white">
                {(statusFilter !== "all" ? 1 : 0) + (clientFilter !== "all" ? 1 : 0)}
              </span>
            )}
          </button>
          {filterMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFilterMenuOpen(false)} />
              <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-lg border border-neutral-700 bg-neutral-900 py-2 shadow-xl max-h-96 overflow-y-auto">
                {/* Status Filter Section */}
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Filter by Status
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("all");
                    setFilterMenuOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${
                    statusFilter === "all"
                      ? "bg-orange-500/10 text-orange-400"
                      : "text-neutral-200 hover:bg-neutral-800"
                  }`}
                >
                  <span>All</span>
                  {statusFilter === "all" && (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setStatusFilter(s);
                      setFilterMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${
                      statusFilter === s
                        ? "bg-orange-500/10 text-orange-400"
                        : "text-neutral-200 hover:bg-neutral-800"
                    }`}
                  >
                    <span>{PROJECT_STATUS_LABELS[s]}</span>
                    {statusFilter === s && (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}

                {/* Client Filter Section */}
                <div className="mt-2 border-t border-neutral-800 pt-2">
                  <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Filter by Client
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setClientFilter("all");
                      setFilterMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${
                      clientFilter === "all"
                        ? "bg-orange-500/10 text-orange-400"
                        : "text-neutral-200 hover:bg-neutral-800"
                    }`}
                  >
                    <span>All</span>
                    {clientFilter === "all" && (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  {clients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setClientFilter(c.id);
                        setFilterMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${
                        clientFilter === c.id
                          ? "bg-orange-500/10 text-orange-400"
                          : "text-neutral-200 hover:bg-neutral-800"
                      }`}
                    >
                      <span>{c.companyName}</span>
                      {clientFilter === c.id && (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed border-neutral-700 bg-neutral-900/50 py-16 text-center">
          <p className="text-neutral-400">
            {projects.length === 0
              ? "No projects yet. Create your first project."
              : "No projects match your filters."}
          </p>
          {projects.length === 0 && (
            <button
              onClick={() => setModalOpen(true)}
              className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
            >
              New Project
            </button>
          )}
        </div>
      ) : viewMode === "list" ? (
        <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-700 bg-neutral-800/50">
                <th className="p-3 font-medium text-neutral-300">Project</th>
                <th className="p-3 font-medium text-neutral-300">Client</th>
                <th className="p-3 font-medium text-neutral-300">Status</th>
                <th className="p-3 font-medium text-neutral-300">Tasks</th>
                <th className="p-3 font-medium text-neutral-300">Value</th>
                <th className="p-3 font-medium text-neutral-300">Due</th>
                <th className="p-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => {
                const client = clients.find((c) => c.id === project.clientId);
                const stats = projectStats[project.id] || { taskCount: 0, doneCount: 0, invoiceCount: 0, boardCount: 0 };
                return (
                  <tr
                    key={project.id}
                    className="border-b border-neutral-800 hover:bg-neutral-800/50"
                  >
                    <td className="p-3">
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="font-medium text-orange-400 hover:underline"
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td className="p-3 text-neutral-300">
                      <Link
                        href={`/dashboard/clients/${project.clientId}`}
                        className="hover:text-orange-400 hover:underline"
                      >
                        {client?.companyName ?? "—"}
                      </Link>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          PROJECT_STATUS_CLASS[project.status]
                        }`}
                      >
                        {PROJECT_STATUS_LABELS[project.status]}
                      </span>
                    </td>
                    <td className="p-3 text-neutral-400">
                      {stats.doneCount}/{stats.taskCount} tasks
                    </td>
                    <td className="p-3 text-neutral-400">
                      {project.totalValue != null
                        ? project.totalValue.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                          })
                        : "—"}
                    </td>
                    <td className="p-3 text-neutral-400">
                      {formatDateSafe(project.dueDate, "MMM d, yyyy")}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="text-orange-400 hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => {
            const client = clients.find((c) => c.id === project.clientId);
            const stats = projectStats[project.id] || { taskCount: 0, doneCount: 0, invoiceCount: 0, boardCount: 0 };
            const progress =
              stats.taskCount > 0 ? Math.round((stats.doneCount / stats.taskCount) * 100) : 0;
            return (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 transition-colors hover:border-neutral-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-white">{project.name}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      PROJECT_STATUS_CLASS[project.status]
                    }`}
                  >
                    {PROJECT_STATUS_LABELS[project.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-400">{client?.companyName}</p>
                {project.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-neutral-500">
                    {project.description}
                  </p>
                )}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Progress</span>
                    <span className="text-white">{progress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
                    <div
                      className="h-full rounded-full bg-orange-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-between border-t border-neutral-800 pt-3 text-sm">
                  <span className="text-neutral-400">
                    {stats.doneCount}/{stats.taskCount} tasks
                  </span>
                  <span className="text-neutral-400">
                    {project.totalValue != null
                      ? project.totalValue.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                          maximumFractionDigits: 0,
                        })
                      : "—"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <NewProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaveAndManage={(id) => {
          setModalOpen(false);
          window.location.href = `/dashboard/projects/${id}`;
        }}
      />
    </div>
  );
}
