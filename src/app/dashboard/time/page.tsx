"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { NewTimeEntryModal } from "@/components/NewTimeEntryModal";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { CURRENCIES } from "@/lib/types";

const EMPTY_TEAM_MEMBERS: { id: string; name: string; email?: string; defaultHourlyRate?: number }[] = [];

const inputClass =
  "rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";
const selectClass =
  "rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

function TimeTrackingContent() {
  const searchParams = useSearchParams();
  const projectFromUrl = searchParams.get("project") ?? "";
  const [mounted, setMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(() => format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [projectFilter, setProjectFilter] = useState<string>(projectFromUrl || "all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [billableFilter, setBillableFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [memberFilter, setMemberFilter] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [openEntryMenuId, setOpenEntryMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupBy, setGroupBy] = useState<"none" | "day" | "week" | "month" | "project" | "member" | "task">("day");
  const [groupByMenuOpen, setGroupByMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (projectFromUrl) setProjectFilter(projectFromUrl);
  }, [projectFromUrl]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-filter-panel]') && !target.closest('[data-filter-button]')) {
        setFiltersOpen(false);
      }
      if (!target.closest('[data-more-menu]') && !target.closest('[data-more-button]')) {
        setMoreMenuOpen(false);
      }
      if (!target.closest('[data-groupby-menu]') && !target.closest('[data-groupby-button]')) {
        setGroupByMenuOpen(false);
      }
      // Close entry menu if clicking outside
      if (openEntryMenuId && !target.closest('.relative')) {
        setOpenEntryMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openEntryMenuId]);

  const timeEntries = useStore((s) => s.timeEntries);
  const projects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);
  const boardTasks = useStore((s) => s.boardTasks);
  const teamMembers = useStore((s) => s.settings?.teamMembers ?? EMPTY_TEAM_MEMBERS);
  const getTotalTimeByProject = useStore((s) => s.getTotalTimeByProject);
  const getTotalTimeByClient = useStore((s) => s.getTotalTimeByClient);
  const getTotalTimeByTeamMember = useStore((s) => s.getTotalTimeByTeamMember);
  const updateTimeEntry = useStore((s) => s.updateTimeEntry);
  const deleteTimeEntry = useStore((s) => s.deleteTimeEntry);
  const [showReports, setShowReports] = useState(false);
  const addTeamMember = useStore((s) => s.addTeamMember);
  const updateTeamMember = useStore((s) => s.updateTeamMember);
  const deleteTeamMember = useStore((s) => s.deleteTeamMember);

  const filtered = useMemo(() => {
    let list = timeEntries.filter(
      (e) => e.date >= dateFrom && e.date <= dateTo
    );
    if (projectFilter !== "all") list = list.filter((e) => e.projectId === projectFilter);
    if (teamFilter !== "all") list = list.filter((e) => e.teamMemberId === teamFilter);
    if (billableFilter === "billable") list = list.filter((e) => e.billable);
    if (billableFilter === "nonbillable") list = list.filter((e) => !e.billable);
    if (clientFilter !== "all") {
      list = list.filter((e) => {
        const project = projects.find((p) => p.id === e.projectId);
        return project?.clientId === clientFilter;
      });
    }
    if (memberFilter.length > 0) {
      list = list.filter((e) => memberFilter.includes(e.teamMemberId));
    }
    if (currencyFilter !== "all") {
      list = list.filter((e) => e.currency === currencyFilter);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((e) => {
        const project = projects.find((p) => p.id === e.projectId);
        const task = e.taskId ? boardTasks.find((t) => t.id === e.taskId) : null;
        const member = teamMembers.find((m) => m.id === e.teamMemberId);
        return (
          project?.name.toLowerCase().includes(query) ||
          task?.title.toLowerCase().includes(query) ||
          member?.name.toLowerCase().includes(query) ||
          e.notes?.toLowerCase().includes(query)
        );
      });
    }
    
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [timeEntries, dateFrom, dateTo, projectFilter, teamFilter, billableFilter, clientFilter, memberFilter, currencyFilter, searchQuery, projects, boardTasks, teamMembers]);

  const summary = useMemo(() => {
    let totalHours = 0;
    let billableHours = 0;
    let billableAmount = 0;
    for (const e of filtered) {
      totalHours += e.hours;
      if (e.billable) {
        billableHours += e.hours;
        billableAmount += e.amount;
      }
    }
    return { totalHours, billableHours, billableAmount };
  }, [filtered]);

  // Flexible grouping function
  const groupedEntries = useMemo(() => {
    if (groupBy === "none") {
      return [];
    }

    const groups = new Map<string, typeof filtered>();
    
    filtered.forEach((entry) => {
      let key = "";
      
      switch (groupBy) {
        case "day":
          key = entry.date;
          break;
        case "week":
          const weekStart = new Date(entry.date);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = format(weekStart, "yyyy-MM-dd");
          break;
        case "month":
          key = format(new Date(entry.date), "yyyy-MM");
          break;
        case "project":
          key = entry.projectId;
          break;
        case "member":
          key = entry.teamMemberId;
          break;
        case "task":
          key = entry.taskId || "no-task";
          break;
      }
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(entry);
    });
    
    return Array.from(groups.entries()).map(([key, entries]) => {
      let label = "";
      
      switch (groupBy) {
        case "day":
          const dateObj = new Date(key);
          label = `${format(dateObj, "EEE")}, ${format(dateObj, "MMM d, yyyy")}`;
          break;
        case "week":
          const weekStart = new Date(key);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          label = `Week of ${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
          break;
        case "month":
          label = format(new Date(key + "-01"), "MMMM yyyy");
          break;
        case "project":
          label = projects.find((p) => p.id === key)?.name || "Unknown Project";
          break;
        case "member":
          label = teamMembers.find((m) => m.id === key)?.name || "Unknown Member";
          break;
        case "task":
          if (key === "no-task") {
            label = "No Task";
          } else {
            label = boardTasks.find((t) => t.id === key)?.title || "Unknown Task";
          }
          break;
      }
      
      return {
        key,
        label,
        entries,
        totalHours: entries.reduce((sum, e) => sum + e.hours, 0),
      };
    }).sort((a, b) => {
      // Sort groups by most recent entry
      const aDate = a.entries[0]?.date || "";
      const bDate = b.entries[0]?.date || "";
      return bDate.localeCompare(aDate);
    });
  }, [filtered, groupBy, projects, teamMembers, boardTasks]);

  // Auto-expand all groups when data changes
  useEffect(() => {
    if (groupBy !== "none" && groupedEntries.length > 0) {
      setExpandedGroups(new Set(groupedEntries.map((g) => g.key)));
    }
  }, [groupedEntries, groupBy]);

  const toggleGroupExpanded = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDelete = (id: string) => {
    if (typeof window !== "undefined" && window.confirm("Delete this time entry?")) {
      deleteTimeEntry(id);
      setOpenEntryMenuId(null);
    }
  };

  const handleToggleBillable = (id: string, currentBillable: boolean) => {
    updateTimeEntry(id, { billable: !currentBillable });
    setOpenEntryMenuId(null);
  };

  const handleExportCsv = () => {
    const headers = ["Date", "Project", "Task", "Team Member", "Hours", "Notes", "Billable", "Amount"];
    const rows = filtered.map((e) => {
      const proj = projects.find((p) => p.id === e.projectId);
      const task = e.taskId ? boardTasks.find((t) => t.id === e.taskId) : null;
      const member = teamMembers.find((m) => m.id === e.teamMemberId);
      return [
        e.date,
        proj?.name ?? "",
        task?.title ?? "",
        member?.name ?? "",
        e.hours.toFixed(2),
        e.notes ?? "",
        e.billable ? "Yes" : "No",
        e.amount.toFixed(2),
      ];
    });
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `time-entries-${dateFrom}-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!mounted) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-white">Time Tracking</h1>
        <div className="mt-8 flex min-h-[200px] items-center justify-center">
          <p className="text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-white">Time Tracking</h1>
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Search */}
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-neutral-600 bg-neutral-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Filter Button */}
          <button
            type="button"
            data-filter-button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="relative inline-flex items-center gap-2 rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
            {(projectFilter !== "all" || teamFilter !== "all" || billableFilter !== "all" || clientFilter !== "all" || memberFilter.length > 0 || roleFilter.length > 0 || statusFilter !== "all" || currencyFilter !== "all" || tagsFilter.length > 0) && (
              <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-medium text-white">
                {[
                  projectFilter !== "all",
                  teamFilter !== "all",
                  billableFilter !== "all",
                  clientFilter !== "all",
                  memberFilter.length > 0,
                  roleFilter.length > 0,
                  statusFilter !== "all",
                  currencyFilter !== "all",
                  tagsFilter.length > 0
                ].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Group By Dropdown */}
          <div className="relative">
            <button
              type="button"
              data-groupby-button
              onClick={() => setGroupByMenuOpen(!groupByMenuOpen)}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              By {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
            </button>
            {groupByMenuOpen && (
              <div data-groupby-menu className="absolute left-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border border-neutral-700 bg-neutral-800 py-1 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setGroupBy("none");
                    setGroupByMenuOpen(false);
                  }}
                  className={`flex w-full items-center px-4 py-2 text-left text-sm hover:bg-neutral-700 ${
                    groupBy === "none" ? "text-orange-400 font-medium" : "text-neutral-200"
                  }`}
                >
                  None
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGroupBy("day");
                    setGroupByMenuOpen(false);
                  }}
                  className={`flex w-full items-center px-4 py-2 text-left text-sm hover:bg-neutral-700 ${
                    groupBy === "day" ? "text-orange-400 font-medium" : "text-neutral-200"
                  }`}
                >
                  Day
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGroupBy("week");
                    setGroupByMenuOpen(false);
                  }}
                  className={`flex w-full items-center px-4 py-2 text-left text-sm hover:bg-neutral-700 ${
                    groupBy === "week" ? "text-orange-400 font-medium" : "text-neutral-200"
                  }`}
                >
                  Week
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGroupBy("month");
                    setGroupByMenuOpen(false);
                  }}
                  className={`flex w-full items-center px-4 py-2 text-left text-sm hover:bg-neutral-700 ${
                    groupBy === "month" ? "text-orange-400 font-medium" : "text-neutral-200"
                  }`}
                >
                  Month
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGroupBy("project");
                    setGroupByMenuOpen(false);
                  }}
                  className={`flex w-full items-center px-4 py-2 text-left text-sm hover:bg-neutral-700 ${
                    groupBy === "project" ? "text-orange-400 font-medium" : "text-neutral-200"
                  }`}
                >
                  Project
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGroupBy("member");
                    setGroupByMenuOpen(false);
                  }}
                  className={`flex w-full items-center px-4 py-2 text-left text-sm hover:bg-neutral-700 ${
                    groupBy === "member" ? "text-orange-400 font-medium" : "text-neutral-200"
                  }`}
                >
                  Member
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGroupBy("task");
                    setGroupByMenuOpen(false);
                  }}
                  className={`flex w-full items-center px-4 py-2 text-left text-sm hover:bg-neutral-700 ${
                    groupBy === "task" ? "text-orange-400 font-medium" : "text-neutral-200"
                  }`}
                >
                  Task
                </button>
              </div>
            )}
          </div>

          {/* More Actions Menu */}
          <div className="relative">
            <button
              type="button"
              data-more-button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className="rounded-lg border border-neutral-600 bg-neutral-800 p-2.5 text-neutral-400 hover:bg-neutral-700 hover:text-white"
              aria-label="More actions"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            {moreMenuOpen && (
              <div data-more-menu className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-neutral-700 bg-neutral-800 py-1 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setShowReports((r) => !r);
                    setMoreMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {showReports ? "Hide Reports" : "Time Reports"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTeamModal(true);
                    setMoreMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Team Members
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExportCsv();
                    setMoreMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
                <div className="my-1 border-t border-neutral-700"></div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(true);
                    setMoreMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-700"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
              </div>
            )}
          </div>

          {/* Primary Action */}
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-500"
          >
            Add Time
          </button>
        </div>
      </div>

      {showReports && (
        <div className="mt-6 rounded-xl border border-neutral-700 bg-neutral-900/50 p-4">
          <h2 className="mb-4 text-lg font-medium text-white">Time Reports (from tasks)</h2>
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
            <div>
              <h3 className="mb-2 text-sm font-medium text-neutral-300">By Project</h3>
              <ul className="space-y-1 rounded-lg border border-neutral-700 bg-neutral-800/50 p-2 text-sm">
                {projects.map((p) => {
                  const h = getTotalTimeByProject(p.id);
                  if (h === 0) return null;
                  return (
                    <li key={p.id} className="flex justify-between text-neutral-200">
                      <span className="truncate">{p.name}</span>
                      <span className="shrink-0 font-medium text-white">{h.toFixed(1)}h</span>
                    </li>
                  );
                })}
                {projects.every((p) => getTotalTimeByProject(p.id) === 0) && (
                  <li className="text-neutral-500">No time by project</li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-neutral-300">By Client</h3>
              <ul className="space-y-1 rounded-lg border border-neutral-700 bg-neutral-800/50 p-2 text-sm">
                {clients.map((c) => {
                  const h = getTotalTimeByClient(c.id);
                  if (h === 0) return null;
                  return (
                    <li key={c.id} className="flex justify-between text-neutral-200">
                      <span className="truncate">{c.companyName}</span>
                      <span className="shrink-0 font-medium text-white">{h.toFixed(1)}h</span>
                    </li>
                  );
                })}
                {clients.every((c) => getTotalTimeByClient(c.id) === 0) && (
                  <li className="text-neutral-500">No time by client</li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-neutral-300">By Team Member</h3>
              <ul className="space-y-1 rounded-lg border border-neutral-700 bg-neutral-800/50 p-2 text-sm">
                {teamMembers.map((m) => {
                  const h = getTotalTimeByTeamMember(m.id);
                  if (h === 0) return null;
                  return (
                    <li key={m.id} className="flex justify-between text-neutral-200">
                      <span className="truncate">{m.name}</span>
                      <span className="shrink-0 font-medium text-white">{h.toFixed(1)}h</span>
                    </li>
                  );
                })}
                {teamMembers.every((m) => getTotalTimeByTeamMember(m.id) === 0) && (
                  <li className="text-neutral-500">No time by member</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {filtersOpen && (
        <div data-filter-panel className="mt-4 rounded-xl border border-neutral-700 bg-neutral-900/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-medium text-white">Filters</h3>
            <button
              type="button"
              onClick={() => {
                setDateFrom(format(startOfMonth(new Date()), "yyyy-MM-dd"));
                setDateTo(format(endOfMonth(new Date()), "yyyy-MM-dd"));
                setProjectFilter("all");
                setTeamFilter("all");
                setBillableFilter("all");
                setClientFilter("all");
                setMemberFilter([]);
                setRoleFilter([]);
                setStatusFilter("all");
                setCurrencyFilter("all");
                setTagsFilter([]);
              }}
              className="text-xs text-orange-400 hover:text-orange-300"
            >
              Clear All
            </button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Date Range */}
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-200">Date Range</label>
              <div className="relative flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="From"
                  className="flex-1 border-none bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none"
                />
                <svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="To"
                  className="flex-1 border-none bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Member */}
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-200">Member</label>
              <select
                multiple
                value={memberFilter}
                onChange={(e) => setMemberFilter(Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                size={1}
              >
                <option value="" disabled>Select items</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id} className="text-white">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Role */}
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-200">Role</label>
              <select
                multiple
                value={roleFilter}
                onChange={(e) => setRoleFilter(Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                size={1}
              >
                <option value="" disabled>Select items</option>
                <option value="developer" className="text-white">Developer</option>
                <option value="designer" className="text-white">Designer</option>
                <option value="manager" className="text-white">Manager</option>
                <option value="consultant" className="text-white">Consultant</option>
              </select>
            </div>

            {/* Team */}
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-200">Team</label>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="all">Select items</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id} className="text-white">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project */}
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-200">Project</label>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="all">Select projects...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="text-white">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Client */}
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-200">Client</label>
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="all">Select...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id} className="text-white">
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-200">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="all">Select...</option>
                <option value="pending" className="text-white">Pending</option>
                <option value="approved" className="text-white">Approved</option>
                <option value="billed" className="text-white">Billed</option>
                <option value="paid" className="text-white">Paid</option>
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-200">Currency</label>
              <select
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="all">Select currency</option>
                {CURRENCIES.map((curr) => (
                  <option key={curr} value={curr} className="text-white">
                    {curr}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-200">Tags</label>
              <select
                multiple
                value={tagsFilter}
                onChange={(e) => setTagsFilter(Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                size={1}
              >
                <option value="" disabled>Select...</option>
                <option value="urgent" className="text-white">Urgent</option>
                <option value="billable" className="text-white">Billable</option>
                <option value="internal" className="text-white">Internal</option>
                <option value="client-work" className="text-white">Client Work</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {(projectFilter !== "all" || teamFilter !== "all" || billableFilter !== "all" || clientFilter !== "all" || memberFilter.length > 0 || statusFilter !== "all" || currencyFilter !== "all") && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-400">Active filters:</span>
          {projectFilter !== "all" && (
            <button
              type="button"
              onClick={() => setProjectFilter("all")}
              className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 px-3 py-1 text-xs text-orange-300 hover:bg-orange-500/30"
            >
              <span>Project: {projects.find((p) => p.id === projectFilter)?.name}</span>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {clientFilter !== "all" && (
            <button
              type="button"
              onClick={() => setClientFilter("all")}
              className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 px-3 py-1 text-xs text-orange-300 hover:bg-orange-500/30"
            >
              <span>Client: {clients.find((c) => c.id === clientFilter)?.companyName}</span>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {teamFilter !== "all" && (
            <button
              type="button"
              onClick={() => setTeamFilter("all")}
              className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 px-3 py-1 text-xs text-orange-300 hover:bg-orange-500/30"
            >
              <span>Team: {teamMembers.find((m) => m.id === teamFilter)?.name}</span>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {memberFilter.length > 0 && (
            <button
              type="button"
              onClick={() => setMemberFilter([])}
              className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 px-3 py-1 text-xs text-orange-300 hover:bg-orange-500/30"
            >
              <span>Members: {memberFilter.length} selected</span>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {statusFilter !== "all" && (
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 px-3 py-1 text-xs text-orange-300 hover:bg-orange-500/30"
            >
              <span>Status: {statusFilter}</span>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {currencyFilter !== "all" && (
            <button
              type="button"
              onClick={() => setCurrencyFilter("all")}
              className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 px-3 py-1 text-xs text-orange-300 hover:bg-orange-500/30"
            >
              <span>Currency: {currencyFilter}</span>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {billableFilter !== "all" && (
            <button
              type="button"
              onClick={() => setBillableFilter("all")}
              className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 px-3 py-1 text-xs text-orange-300 hover:bg-orange-500/30"
            >
              <span>{billableFilter === "billable" ? "Billable only" : "Non-billable only"}</span>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setProjectFilter("all");
              setTeamFilter("all");
              setBillableFilter("all");
              setClientFilter("all");
              setMemberFilter([]);
              setRoleFilter([]);
              setStatusFilter("all");
              setCurrencyFilter("all");
              setTagsFilter([]);
            }}
            className="text-xs text-neutral-500 hover:text-neutral-400"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Time Entries Table */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-700 bg-neutral-800/30">
              <th className="p-3 text-xs font-medium uppercase tracking-wide text-neutral-400">Date ▼</th>
              <th className="p-3 text-xs font-medium uppercase tracking-wide text-neutral-400">Member</th>
              <th className="p-3 text-xs font-medium uppercase tracking-wide text-neutral-400">Task</th>
              <th className="p-3 text-center text-xs font-medium uppercase tracking-wide text-neutral-400">Billing</th>
              <th className="p-3 text-xs font-medium uppercase tracking-wide text-neutral-400">Billing Status</th>
              <th className="p-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-400">Hours</th>
              <th className="p-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {groupBy !== "none" ? (
              // Grouped View
              groupedEntries.map(({ key, label, entries, totalHours }) => {
                const isExpanded = expandedGroups.has(key);
                
                return (
                  <>
                    {/* Group Header Row */}
                    <tr key={key} className="border-b border-neutral-800 bg-neutral-850">
                      <td colSpan={7} className="p-0">
                        <button
                          type="button"
                          onClick={() => toggleGroupExpanded(key)}
                          className="flex w-full items-center justify-between px-3 py-3 text-left hover:bg-neutral-800/50"
                        >
                          <div className="flex items-center gap-3">
                            <svg
                              className={`h-4 w-4 text-neutral-400 transition-transform ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium text-white">{label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-neutral-400">{totalHours.toFixed(0)}h {((totalHours % 1) * 60).toFixed(0)}m</span>
                            <svg className={`h-4 w-4 text-neutral-500 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </div>
                        </button>
                      </td>
                    </tr>
                    
                    {/* Entry Rows (shown when expanded) */}
                    {isExpanded && entries.map((entry) => {
                      const project = projects.find((p) => p.id === entry.projectId);
                      const task = entry.taskId ? boardTasks.find((t) => t.id === entry.taskId) : null;
                      const member = teamMembers.find((m) => m.id === entry.teamMemberId);
                      
                      return (
                        <tr key={entry.id} className="border-b border-neutral-800 hover:bg-neutral-800/30">
                          <td className="p-3 text-neutral-500 text-sm">
                            {format(new Date(entry.date), "MMM d, yyyy")}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
                                {member ? getInitials(member.name) : "?"}
                              </div>
                              <span className="text-sm text-neutral-300">{member?.name ?? "—"}</span>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-neutral-300">
                            {task?.title ?? project?.name ?? "—"}
                          </td>
                          <td className="p-3 text-center">
                            {entry.billable && (
                              <span className="text-emerald-500">$</span>
                            )}
                          </td>
                          <td className="p-3">
                            {entry.billable && (
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                <span className="text-sm text-neutral-300">Billed</span>
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-right text-sm text-neutral-300">
                            {entry.hours.toFixed(2).replace('.', ':')}:00
                          </td>
                          <td className="p-3">
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setOpenEntryMenuId(openEntryMenuId === entry.id ? null : entry.id)}
                                className="rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                              >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                  <circle cx="12" cy="5" r="1.5" />
                                  <circle cx="12" cy="12" r="1.5" />
                                  <circle cx="12" cy="19" r="1.5" />
                                </svg>
                              </button>
                              {openEntryMenuId === entry.id && (
                                <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-neutral-700 bg-neutral-800 py-1 shadow-xl">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingId(entry.id);
                                      setOpenEntryMenuId(null);
                                    }}
                                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-700"
                                  >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit Entry
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleBillable(entry.id, entry.billable)}
                                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-700"
                                  >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {entry.billable ? "Mark as Unbilled" : "Mark as Billed"}
                                  </button>
                                  <div className="my-1 border-t border-neutral-700"></div>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(entry.id)}
                                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-400 hover:bg-neutral-700"
                                  >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete Entry
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </>
                );
              })
            ) : (
              // List View (ungrouped)
              filtered.map((entry) => {
                const project = projects.find((p) => p.id === entry.projectId);
                const task = entry.taskId ? boardTasks.find((t) => t.id === entry.taskId) : null;
                const member = teamMembers.find((m) => m.id === entry.teamMemberId);
                
                return (
                  <tr key={entry.id} className="border-b border-neutral-800 hover:bg-neutral-800/30">
                    <td className="p-3 text-neutral-500 text-sm">
                      {format(new Date(entry.date), "MMM d, yyyy")}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
                          {member ? getInitials(member.name) : "?"}
                        </div>
                        <span className="text-sm text-neutral-300">{member?.name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-neutral-300">
                      {task?.title ?? project?.name ?? "—"}
                    </td>
                    <td className="p-3 text-center">
                      {entry.billable && (
                        <span className="text-emerald-500">$</span>
                      )}
                    </td>
                    <td className="p-3">
                      {entry.billable && (
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                          <span className="text-sm text-neutral-300">Billed</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right text-sm text-neutral-300">
                      {entry.hours.toFixed(2).replace('.', ':')}:00
                    </td>
                    <td className="p-3">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenEntryMenuId(openEntryMenuId === entry.id ? null : entry.id)}
                          className="rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="5" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                            <circle cx="12" cy="19" r="1.5" />
                          </svg>
                        </button>
                        {openEntryMenuId === entry.id && (
                          <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-neutral-700 bg-neutral-800 py-1 shadow-xl">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(entry.id);
                                setOpenEntryMenuId(null);
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-700"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit Entry
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleBillable(entry.id, entry.billable)}
                              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-700"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {entry.billable ? "Mark as Unbilled" : "Mark as Billed"}
                            </button>
                            <div className="my-1 border-t border-neutral-700"></div>
                            <button
                              type="button"
                              onClick={() => handleDelete(entry.id)}
                              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-400 hover:bg-neutral-700"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete Entry
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-neutral-700 bg-neutral-900/50 py-16 text-center">
          <p className="text-neutral-400">
            {timeEntries.length === 0
              ? "No time entries yet. Log your first hours."
              : "No time entries match your filters."}
          </p>
          {timeEntries.length === 0 && (
            <button
              onClick={() => setModalOpen(true)}
              className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
            >
              Log Time
            </button>
          )}
        </div>
      )}

      <NewTimeEntryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultProjectId={projectFilter !== "all" ? projectFilter : undefined}
      />

      {showTeamModal && (
        <TeamMembersModal
          onClose={() => setShowTeamModal(false)}
          teamMembers={teamMembers}
          onAdd={addTeamMember}
          onUpdate={updateTeamMember}
          onDelete={deleteTeamMember}
        />
      )}

      {editingId && (
        <EditTimeEntryModal
          key={editingId}
          entryId={editingId}
          onClose={() => setEditingId(null)}
          onSave={() => setEditingId(null)}
        />
      )}

      {showSettingsModal && (
        <TimeTrackingSettingsModal onClose={() => setShowSettingsModal(false)} />
      )}
    </div>
  );
}

export default function TimeTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-6 py-8">
          <h1 className="text-2xl font-semibold text-white">Time Tracking</h1>
          <div className="mt-8 flex min-h-[200px] items-center justify-center">
            <p className="text-neutral-500">Loading...</p>
          </div>
        </div>
      }
    >
      <TimeTrackingContent />
    </Suspense>
  );
}

function TeamMembersModal({
  onClose,
  teamMembers,
  onAdd,
  onUpdate,
  onDelete,
}: {
  onClose: () => void;
  teamMembers: { id: string; name: string; email?: string; defaultHourlyRate?: number }[];
  onAdd: (m: { name: string; email?: string; defaultHourlyRate?: number }) => void;
  onUpdate: (id: string, data: Partial<{ name: string; email?: string; defaultHourlyRate?: number }>) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rate, setRate] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), email: email.trim() || undefined, defaultHourlyRate: rate ? parseFloat(rate) : undefined });
    setName("");
    setEmail("");
    setRate("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">Team Members</h2>
        <p className="mt-1 text-sm text-neutral-400">Manage who can log time</p>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="flex-1 rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="flex-1 rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
          />
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="$/hr"
            className="w-20 rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
          >
            Add
          </button>
        </div>

        <ul className="mt-4 space-y-2 max-h-60 overflow-y-auto">
          {teamMembers.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2"
            >
              <span className="text-white">{m.name}</span>
              <div className="flex items-center gap-2">
                {m.defaultHourlyRate != null && (
                  <span className="text-sm text-neutral-400">${m.defaultHourlyRate}/hr</span>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(m.id)}
                  className="text-sm text-red-400 hover:underline"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function EditTimeEntryModal({
  entryId,
  onClose,
  onSave,
}: {
  entryId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const timeEntries = useStore((s) => s.timeEntries);
  const projects = useStore((s) => s.projects);
  const boardTasks = useStore((s) => s.boardTasks);
  const teamMembers = useStore((s) => s.settings?.teamMembers ?? EMPTY_TEAM_MEMBERS);
  const updateTimeEntry = useStore((s) => s.updateTimeEntry);

  const entry = timeEntries.find((e) => e.id === entryId);
  const [hours, setHours] = useState(entry?.hours ?? 0);
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [billable, setBillable] = useState(entry?.billable ?? true);
  const [billingRate, setBillingRate] = useState(entry?.billingRate ?? 0);

  if (!entry) return null;

  const handleSave = () => {
    const amount = billable ? hours * billingRate : 0;
    updateTimeEntry(entryId, { hours, notes: notes || undefined, billable, billingRate, amount });
    onSave();
  };

  const inputClass =
    "rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">Edit Time Entry</h2>
        <p className="mt-1 text-sm text-neutral-400">
          {projects.find((p) => p.id === entry.projectId)?.name} · {new Date(entry.date).toLocaleDateString()} · {teamMembers.find((m) => m.id === entry.teamMemberId)?.name}
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300">Hours</label>
            <input
              type="number"
              min={0.25}
              step={0.25}
              value={hours}
              onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
              className={`mt-1 w-full ${inputClass}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`mt-1 w-full ${inputClass}`}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-billable"
              checked={billable}
              onChange={(e) => setBillable(e.target.checked)}
              className="rounded border-neutral-600 bg-neutral-800 text-orange-500"
            />
            <label htmlFor="edit-billable" className="text-sm text-neutral-300">Billable</label>
          </div>
          {billable && (
            <div>
              <label className="block text-sm font-medium text-neutral-300">Rate ($/hr)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={billingRate}
                onChange={(e) => setBillingRate(parseFloat(e.target.value) || 0)}
                className={`mt-1 w-full ${inputClass}`}
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function TimeTrackingSettingsModal({ onClose }: { onClose: () => void }) {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);

  const [defaultHourlyRate, setDefaultHourlyRate] = useState(
    settings?.timeTracking?.defaultHourlyRate ?? 125
  );
  const [defaultCurrency, setDefaultCurrency] = useState(
    settings?.timeTracking?.defaultCurrency ?? "USD"
  );

  const handleSave = () => {
    updateSettings({
      timeTracking: {
        defaultHourlyRate,
        defaultCurrency: defaultCurrency as "USD" | "EUR" | "GBP" | "INR" | "CAD" | "AUD",
      },
    });
    onClose();
  };

  const inputClass =
    "rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">Time Tracking Settings</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Default billing rate and currency used when logging time. Projects and team members can override these.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300">Default hourly rate</label>
            <input
              type="number"
              min={0}
              step={1}
              value={defaultHourlyRate}
              onChange={(e) => setDefaultHourlyRate(parseFloat(e.target.value) || 0)}
              className={`mt-1 w-full ${inputClass}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Default currency</label>
            <select
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value as typeof defaultCurrency)}
              className={`mt-1 w-full ${inputClass}`}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
