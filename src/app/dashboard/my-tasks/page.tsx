"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import type { BoardTask, TaskPriority } from "@/lib/types";
import { TASK_PRIORITIES } from "@/lib/types";
import { format } from "date-fns";

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  low: "bg-neutral-500/20 text-neutral-400",
  medium: "bg-blue-500/20 text-blue-400",
  high: "bg-amber-500/20 text-amber-400",
  urgent: "bg-red-500/20 text-red-400",
};

function formatDateSafe(dateStr: string | undefined, fmt: string, fallback = "—") {
  if (dateStr == null || dateStr === "") return fallback;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return fallback;
  return format(d, fmt);
}

export default function MyTasksPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");

  useEffect(() => setMounted(true), []);

  const teamMembers = useStore((s) => s.settings?.teamMembers ?? []);
  const myTasksLabel = useStore((s) => s.settings?.myTasksLabel ?? "My Tasks");
  const teamSectionLabel = useStore((s) => s.settings?.teamSectionLabel ?? "Team");
  const boardTasks = useStore((s) => s.boardTasks);
  const boards = useStore((s) => s.boards);
  const boardLists = useStore((s) => s.boardLists);
  const projects = useStore((s) => s.projects);
  
  // Sync selected member from URL ?member=id
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const memberParam = params.get("member");
    if (memberParam && teamMembers.some((m) => m.id === memberParam)) {
      setSelectedMemberId(memberParam);
    } else if (!selectedMemberId && teamMembers.length > 0) {
      setSelectedMemberId(teamMembers[0].id);
    }
  }, [teamMembers, selectedMemberId]);

  const isSoloMode = teamMembers.length === 0;

  const tasks = useMemo(() => {
    if (isSoloMode) {
      return boardTasks
        .filter((t) => !t.archivedAt)
        .sort((a, b) => {
          const aDue = a.dueDateTime ?? a.dueDate ?? "";
          const bDue = b.dueDateTime ?? b.dueDate ?? "";
          if (aDue && bDue) return aDue.localeCompare(bDue);
          if (aDue) return -1;
          if (bDue) return 1;
          return 0;
        });
    }
    if (!selectedMemberId) return [];
    return boardTasks
      .filter((t) => t.assigneeId === selectedMemberId && !t.archivedAt)
      .sort((a, b) => {
        const aDue = a.dueDateTime ?? a.dueDate ?? "";
        const bDue = b.dueDateTime ?? b.dueDate ?? "";
        if (aDue && bDue) return aDue.localeCompare(bDue);
        if (aDue) return -1;
        if (bDue) return 1;
        return 0;
      });
  }, [boardTasks, selectedMemberId, isSoloMode]);

  const tasksByBoard = useMemo(() => {
    const map: Record<string, BoardTask[]> = {};
    for (const t of tasks) {
      if (!map[t.boardId]) map[t.boardId] = [];
      map[t.boardId].push(t);
    }
    for (const boardId of Object.keys(map)) {
      map[boardId].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return map;
  }, [tasks]);

  const getBoardName = (boardId: string) =>
    boards.find((b) => b.id === boardId)?.name ?? "Unknown board";
  const getListName = (listId: string) =>
    boardLists.find((l) => l.id === listId)?.name ?? "—";
  const getProjectName = (projectId: string | undefined) =>
    projectId ? projects.find((p) => p.id === projectId)?.name : null;

  const selectedMember = teamMembers.find((m) => m.id === selectedMemberId);

  if (!mounted) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-white">{myTasksLabel}</h1>
        <div className="mt-8 space-y-6">
          <div className="h-10 w-64 animate-pulse rounded-lg bg-neutral-800" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-neutral-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-white">{myTasksLabel}</h1>
        <Link
          href="/dashboard/team"
          className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
        >
          {teamSectionLabel}
        </Link>
      </div>

      <p className="mt-2 text-sm text-neutral-400">
        {isSoloMode
          ? `All your tasks across boards. Add team members in ${teamSectionLabel} to filter by assignee.`
          : "View tasks assigned to a team member. Only tasks assigned to the selected person are shown."}
      </p>

      {!isSoloMode && (
        <div className="mt-6">
          <label className="block text-sm font-medium text-neutral-300">View tasks for</label>
          <select
            value={selectedMemberId}
            onChange={(e) => {
              setSelectedMemberId(e.target.value);
              const url = new URL(window.location.href);
              url.searchParams.set("member", e.target.value);
              window.history.replaceState({}, "", url.toString());
            }}
            className="mt-1 w-full max-w-xs rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="">Select team member</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {!isSoloMode && !selectedMemberId ? (
        <div className="mt-8 rounded-xl border border-dashed border-neutral-700 bg-neutral-900/50 py-16 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800">
              <svg className="h-8 w-8 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-white">Select a team member</h3>
          <p className="mt-2 text-sm text-neutral-400 max-w-md mx-auto">Choose a team member from the dropdown above to see their assigned tasks.</p>
          <Link
            href="/dashboard/team"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-neutral-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Manage {teamSectionLabel}
          </Link>
        </div>
      ) : tasks.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-neutral-700 bg-neutral-900/50 py-16 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800">
              <svg className="h-8 w-8 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-white">
            {isSoloMode ? "No tasks yet" : "No assigned tasks"}
          </h3>
          <p className="mt-2 text-sm text-neutral-400 max-w-md mx-auto">
            {isSoloMode
              ? "Create a task board and add tasks to get started with project management."
              : `${selectedMember?.name ?? "This team member"} has no tasks assigned yet. Assign tasks from your boards.`}
          </p>
          <Link
            href="/dashboard/task-boards"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-orange-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            {isSoloMode ? "Create Your First Board" : "Go to Task Boards"}
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-medium text-white">
            {isSoloMode ? "Your tasks" : `Tasks for ${selectedMember?.name}`} ({tasks.length})
          </h2>
          <div className="space-y-6">
            {Object.entries(tasksByBoard).map(([boardId, boardTaskList]) => (
              <div
                key={boardId}
                className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4"
              >
                <h3 className="mb-3 text-sm font-medium text-white">
                  <Link
                    href={`/dashboard/task-boards/${boardId}`}
                    className="text-orange-400 hover:underline"
                  >
                    {getBoardName(boardId)}
                  </Link>
                  {getProjectName(boardTaskList[0]?.projectId) && (
                    <span className="ml-2 text-neutral-400">
                      · {getProjectName(boardTaskList[0].projectId)}
                    </span>
                  )}
                </h3>
                <ul className="space-y-2">
                  {boardTaskList.map((task) => (
                    <li key={task.id}>
                      <Link
                        href={`/dashboard/task-boards/${boardId}`}
                        className="flex items-center gap-3 rounded-lg border border-neutral-700 bg-neutral-800 p-3 transition-colors hover:border-neutral-600"
                      >
                        <span className="font-medium text-white">{task.title}</span>
                        <span className="text-xs text-neutral-400">
                          {getListName(task.listId)}
                        </span>
                        <div className="ml-auto flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              PRIORITY_CLASS[task.priority]
                            }`}
                          >
                            {PRIORITY_LABELS[task.priority]}
                          </span>
                          {(task.dueDateTime ?? task.dueDate) && (
                            <span className="text-xs text-neutral-500">
                              Due {formatDateSafe(task.dueDateTime ?? task.dueDate, "MMM d")}
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
