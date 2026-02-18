"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import type { BoardList, BoardTask, TaskPriority, TeamMember, Product, Invoice } from "@/lib/types";
import { TASK_PRIORITIES } from "@/lib/types";
import { format } from "date-fns";
import { NewBoardTaskModal } from "@/components/NewBoardTaskModal";
import { EditBoardModal } from "@/components/EditBoardModal";
import { EditBoardTaskModal } from "@/components/EditBoardTaskModal";
import { TaskDetailModal } from "@/components/TaskDetailModal";

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

const EMPTY_TEAM: TeamMember[] = [];

function formatDateSafe(dateStr: string | undefined, fmt: string, fallback = "—") {
  if (dateStr == null || dateStr === "") return fallback;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return fallback;
  return format(d, fmt);
}

/** Due date badge: red overdue, yellow due within 24h, gray normal */
function dueDateBadgeClass(dueDate?: string, dueDateTime?: string): string {
  const raw = dueDateTime ?? dueDate ?? "";
  if (!raw) return "bg-neutral-600/40 text-neutral-400";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "bg-neutral-600/40 text-neutral-400";
  const now = Date.now();
  const due = d.getTime();
  if (due < now) return "bg-red-900/50 text-red-300";
  if (due - now <= 24 * 60 * 60 * 1000) return "bg-amber-900/50 text-amber-300";
  return "bg-neutral-600/40 text-neutral-400";
}

export default function BoardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;

  // Redirect to new tabbed interface
  useEffect(() => {
    router.replace('/dashboard/task-boards');
  }, [router]);

  const [editBoardOpen, setEditBoardOpen] = useState(false);
  const [newTaskListId, setNewTaskListId] = useState<string | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<BoardTask | null>(null);
  const [detailTask, setDetailTask] = useState<BoardTask | null>(null);
  const [draggedTask, setDraggedTask] = useState<BoardTask | null>(null);
  const [dragOverListId, setDragOverListId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [draggedListId, setDraggedListId] = useState<string | null>(null);
  const [listDropIndex, setListDropIndex] = useState<number | null>(null);
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all"); // all | under5 | 5to10 | over10
  const [sortBy, setSortBy] = useState<string>("default"); // default | timeAsc | timeDesc
  const [priorityFilter, setPriorityFilter] = useState<string>("all"); // all | low | medium | high | urgent
  const [labelFilter, setLabelFilter] = useState<string>("all"); // all | labelId
  const [newDropdownOpen, setNewDropdownOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const board = useStore((s) => s.getBoard(boardId));
  const projects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);
  // Subscribe so component re-renders when tasks/lists change (getters alone are stable refs and don't trigger updates)
  useStore((s) => s.boardTasks); // full array so task updates (e.g. completedAt) and add/delete trigger re-render
  useStore((s) => s.boardLists); // full array so name edits (updateBoardList) trigger re-render
  const getBoardLists = useStore((s) => s.getBoardLists);
  const getBoardTasksByList = useStore((s) => s.getBoardTasksByList);
  const updateBoard = useStore((s) => s.updateBoard);
  const updateBoardList = useStore((s) => s.updateBoardList);
  const deleteBoardList = useStore((s) => s.deleteBoardList);
  const reorderBoardLists = useStore((s) => s.reorderBoardLists);
  const addBoardTask = useStore((s) => s.addBoardTask);
  const updateBoardTask = useStore((s) => s.updateBoardTask);
  const deleteBoardTask = useStore((s) => s.deleteBoardTask);
  const moveBoardTaskToList = useStore((s) => s.moveBoardTaskToList);
  const reorderBoardTasksInList = useStore((s) => s.reorderBoardTasksInList);
  const duplicateBoardTask = useStore((s) => s.duplicateBoardTask);
  const getTimeTrackedForTask = useStore((s) => s.getTimeTrackedForTask);
  const getProduct = useStore((s) => s.getProduct);
  const getInvoice = useStore((s) => s.getInvoice);
  const toggleBoardSaved = useStore((s) => s.toggleBoardSaved);
  const getTeamMember = useStore((s) => s.getTeamMember);
  const teamMembers = useStore((s) => s.settings?.teamMembers ?? EMPTY_TEAM);

  const lists = useMemo(() => getBoardLists(boardId), [getBoardLists, boardId]);

  // Filter tasks by client/project (for display in lists)
  const listTasksFiltered = useCallback(
    (listId: string) => {
      let tasks = getBoardTasksByList(listId);
      if (clientFilter !== "all") {
        tasks = tasks.filter((t) => t.clientId === clientFilter);
      }
      if (projectFilter !== "all") {
        tasks = tasks.filter((t) => t.projectId === projectFilter);
      }
      if (timeFilter !== "all") {
        tasks = tasks.filter((t) => {
          const h = getTimeTrackedForTask(t.id);
          if (timeFilter === "under5") return h < 5;
          if (timeFilter === "5to10") return h >= 5 && h <= 10;
          if (timeFilter === "over10") return h > 10;
          return true;
        });
      }
      if (priorityFilter !== "all") tasks = tasks.filter((t) => t.priority === priorityFilter);
      if (labelFilter !== "all") tasks = tasks.filter((t) => (t.labelIds ?? []).includes(labelFilter));
      if (sortBy === "timeAsc" || sortBy === "timeDesc") {
        tasks = [...tasks].sort((a, b) => {
          const ha = getTimeTrackedForTask(a.id);
          const hb = getTimeTrackedForTask(b.id);
          return sortBy === "timeAsc" ? ha - hb : hb - ha;
        });
      }
      if (sortBy === "dueDate") {
        tasks = [...tasks].sort((a, b) => {
          const da = (a.dueDateTime ?? a.dueDate ?? "").replace("T", " ").trim() || "9999";
          const db = (b.dueDateTime ?? b.dueDate ?? "").replace("T", " ").trim() || "9999";
          return da.localeCompare(db);
        });
      }
      if (sortBy === "priority") {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        tasks = [...tasks].sort((a, b) => (order[a.priority] ?? 4) - (order[b.priority] ?? 4));
      }
      // Completed tasks (completedAt set) always at bottom
      tasks = [...tasks].sort((a, b) => (a.completedAt ? 1 : 0) - (b.completedAt ? 1 : 0));
      return tasks;
    },
    [getBoardTasksByList, clientFilter, projectFilter, timeFilter, priorityFilter, labelFilter, sortBy, getTimeTrackedForTask]
  );
  const boardLabelsRaw = useStore((s) => s.boardLabels);
  const boardLabels = useMemo(
    () => boardLabelsRaw.filter((l) => l.boardId === boardId),
    [boardLabelsRaw, boardId]
  );
  const project = board?.projectId ? projects.find((p) => p.id === board.projectId) : null;
  const client = project ? clients.find((c) => c.id === project.clientId) : null;

  const assigneeName = useCallback(
    (t: BoardTask) => (t.assigneeId ? getTeamMember(t.assigneeId)?.name : null) ?? t.assignee ?? "—",
    [getTeamMember]
  );

  // List drag-and-drop
  const handleListDragStart = useCallback((e: React.DragEvent, list: BoardList) => {
    setDraggedListId(list.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/list-id", list.id);
  }, []);

  const handleListDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setListDropIndex(index);
  }, []);

  const handleListDragLeave = useCallback(() => {
    setListDropIndex(null);
  }, []);

  const handleListDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      setListDropIndex(null);
      const listId = e.dataTransfer.getData("application/list-id");
      if (!listId || !draggedListId || listId !== draggedListId) return;
      const currentOrder = lists.map((l) => l.id);
      const fromIdx = currentOrder.indexOf(listId);
      if (fromIdx === -1 || fromIdx === targetIndex) return;
      const reordered = [...currentOrder];
      reordered.splice(fromIdx, 1);
      reordered.splice(targetIndex, 0, listId);
      reorderBoardLists(boardId, reordered);
      setDraggedListId(null);
    },
    [boardId, draggedListId, lists, reorderBoardLists]
  );

  const handleListDragEnd = useCallback(() => {
    setDraggedListId(null);
    setListDropIndex(null);
  }, []);

  // Task drag-and-drop
  const handleTaskDragStart = useCallback((e: React.DragEvent, task: BoardTask) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/task-id", task.id);
  }, []);

  const handleTaskDragEnd = useCallback(() => {
    setDraggedTask(null);
    setDragOverListId(null);
    setDragOverTaskId(null);
  }, []);

  const handleTaskDragOver = useCallback((e: React.DragEvent, listId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverListId(listId);
  }, []);

  const handleTaskDragLeave = useCallback(() => {
    setDragOverListId(null);
  }, []);

  const handleTaskDrop = useCallback(
    (e: React.DragEvent, targetListId: string) => {
      e.preventDefault();
      setDragOverListId(null);
      const taskId = e.dataTransfer.getData("application/task-id");
      if (!taskId || !draggedTask) return;
      if (draggedTask.listId === targetListId) return;
      moveBoardTaskToList(taskId, targetListId);
      setDraggedTask(null);
    },
    [draggedTask, moveBoardTaskToList]
  );

  // Reorder within same list: drop on a task card to insert before it
  const handleTaskDropOnTask = useCallback(
    (e: React.DragEvent, targetTask: BoardTask) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverListId(null);
      setDragOverTaskId(null);
      const taskId = e.dataTransfer.getData("application/task-id");
      if (!taskId || !draggedTask) return;
      if (draggedTask.listId !== targetTask.listId) return;
      if (draggedTask.id === targetTask.id) return;
      const listTasks = getBoardTasksByList(targetTask.listId);
      const currentOrder = listTasks.map((t) => t.id);
      const fromIdx = currentOrder.indexOf(taskId);
      const toIdx = currentOrder.indexOf(targetTask.id);
      if (fromIdx === -1 || toIdx === -1) return;
      const reordered = [...currentOrder];
      reordered.splice(fromIdx, 1);
      reordered.splice(reordered.indexOf(targetTask.id), 0, taskId);
      reorderBoardTasksInList(targetTask.listId, reordered);
      setDraggedTask(null);
    },
    [draggedTask, getBoardTasksByList, reorderBoardTasksInList]
  );

  const handleAddList = useCallback(() => {
    const addBoardList = useStore.getState().addBoardList;
    addBoardList({ boardId, name: "New group", order: lists.length });
  }, [boardId, lists.length]);

  const handleDeleteList = useCallback(
    (listId: string) => {
      if (typeof window !== "undefined" && !window.confirm("Delete this group? Tasks in it will be archived.")) return;
      deleteBoardList(listId);
      setEditingListId(null);
    },
    [deleteBoardList]
  );

  // Only redirect when the board truly doesn't exist (e.g. invalid ID). Use a short delay so we
  // don't redirect during brief undefined states when adding a list or during store rehydration.
  useEffect(() => {
    if (!boardId || board) return;
    const t = setTimeout(() => {
      if (!useStore.getState().getBoard(boardId)) {
        router.replace("/dashboard/task-boards");
      }
    }, 150);
    return () => clearTimeout(t);
  }, [boardId, board, router]);

  useEffect(() => {
    const closeFilter = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("click", closeFilter);
    return () => document.removeEventListener("click", closeFilter);
  }, []);

  // Defer store-dependent content until after mount so server and first client render match (avoids hydration error)
  useEffect(() => {
    setMounted(true);
  }, []);

  const onDetailClose = useCallback(() => setDetailTask(null), []);
  const onDetailSave = useCallback(
    (data: Partial<BoardTask>) => {
      if (!detailTask) return;
      if (data.listId && data.listId !== detailTask.listId) {
        moveBoardTaskToList(detailTask.id, data.listId);
        const { listId: _l, ...rest } = data;
        updateBoardTask(detailTask.id, rest);
      } else {
        updateBoardTask(detailTask.id, data);
      }
      setDetailTask(null);
    },
    [detailTask, moveBoardTaskToList, updateBoardTask]
  );
  const onDetailDelete = useCallback(() => {
    if (!detailTask) return;
    deleteBoardTask(detailTask.id);
    setDetailTask(null);
  }, [detailTask, deleteBoardTask]);
  const onDetailDuplicate = useCallback(() => {
    if (!detailTask) return;
    const copy = duplicateBoardTask(detailTask.id);
    if (copy) setDetailTask(copy);
  }, [detailTask, duplicateBoardTask]);
  const onDetailArchive = useCallback(() => {
    if (!detailTask) return;
    updateBoardTask(detailTask.id, { archivedAt: new Date().toISOString() });
    setDetailTask(null);
  }, [detailTask, updateBoardTask]);
  const onDetailMoveToList = useCallback(
    (listId: string) => {
      if (!detailTask) return;
      moveBoardTaskToList(detailTask.id, listId);
    },
    [detailTask, moveBoardTaskToList]
  );

  if (!mounted) {
    return (
      <div className="mx-auto max-w-[1600px] px-6 py-6">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <p className="text-neutral-400">Board not found.</p>
        <Link href="/dashboard/task-boards" className="mt-2 inline-block text-orange-400 hover:underline">
          Back to Boards
        </Link>
      </div>
    );
  }

  const LIST_HEADER_COLORS = [
    "bg-pink-500/20 text-pink-200 border-pink-500/30",
    "bg-amber-500/20 text-amber-200 border-amber-500/30",
    "bg-rose-500/20 text-rose-200 border-rose-500/30",
    "bg-sky-500/20 text-sky-200 border-sky-500/30",
    "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
  ];

  return (
    <div className="min-h-screen bg-neutral-800/80" style={board.background ? { background: board.background } : undefined}>
      <div className="mx-auto max-w-[1600px] px-6 py-6">
        {/* Top bar - image inspired: tabs, actions, New dropdown */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/task-boards"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-neutral-400 hover:bg-neutral-700/50 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Boards
            </Link>
            <span className="rounded-md bg-neutral-700/80 px-3 py-1.5 text-sm font-medium text-white">
              {board.name}
            </span>
            {project && (
              <span className="rounded bg-neutral-600/80 px-2 py-0.5 text-xs text-neutral-300">
                {project.name}
              </span>
            )}
            <button
              type="button"
              onClick={() => toggleBoardSaved(boardId)}
              className="rounded p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-amber-400"
              title={board.isSaved ? "Unsave" : "Save"}
              aria-label={board.isSaved ? "Unsave" : "Save"}
            >
              {board.isSaved ? "★" : "☆"}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                className="relative flex h-9 items-center gap-2 rounded-lg border border-neutral-600 bg-neutral-800 px-3 text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white"
                aria-label="Filters"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-sm">Filters</span>
                {(() => {
                  const count = [clientFilter !== "all", projectFilter !== "all", timeFilter !== "all", priorityFilter !== "all", labelFilter !== "all"].filter(Boolean).length;
                  return count > 0 ? <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-medium text-white">{count}</span> : null;
                })()}
              </button>
              {filterOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-xl border border-neutral-700 bg-neutral-800 p-4 shadow-xl">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Client</p>
                  <select
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value)}
                    className="mb-3 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="all">All clients</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.companyName}</option>
                    ))}
                  </select>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Project</p>
                  <select
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    className="mb-3 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="all">All projects</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Time tracked</p>
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="mb-3 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="all">All time</option>
                    <option value="under5">⏱ &lt; 5h</option>
                    <option value="5to10">⏱ 5–10h</option>
                    <option value="over10">⏱ &gt; 10h</option>
                  </select>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Priority</p>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="mb-3 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="all">All priority</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  {boardLabels.length > 0 && (
                    <>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Label</p>
                      <select
                        value={labelFilter}
                        onChange={(e) => setLabelFilter(e.target.value)}
                        className="mb-3 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="all">All labels</option>
                        {boardLabels.map((l) => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </>
                  )}
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Sort</p>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="mb-3 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="default">Default</option>
                    <option value="dueDate">Due date</option>
                    <option value="priority">Priority</option>
                    <option value="timeAsc">Time ↑</option>
                    <option value="timeDesc">Time ↓</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setClientFilter("all");
                        setProjectFilter("all");
                        setTimeFilter("all");
                        setPriorityFilter("all");
                        setLabelFilter("all");
                        setSortBy("default");
                      }}
                      className="flex-1 rounded-lg border border-neutral-600 bg-neutral-800 py-2 text-sm font-medium text-neutral-400 hover:bg-neutral-700 hover:text-white"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterOpen(false)}
                      className="flex-1 rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-400"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setNewDropdownOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
              >
                New
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {newDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" aria-hidden onClick={() => setNewDropdownOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-neutral-700 bg-neutral-900 py-1 shadow-xl">
                    <button type="button" onClick={() => { setNewTaskListId(lists[0]?.id ?? null); setNewDropdownOpen(false); }} className="w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-800">
                      New task
                    </button>
                    <button type="button" onClick={() => { handleAddList(); setNewDropdownOpen(false); }} className="w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-800">
                      New group
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setEditBoardOpen(true)}
              className="rounded-lg border border-neutral-600 bg-neutral-800 p-1.5 text-neutral-200 hover:bg-neutral-700"
              title="Task board settings"
              aria-label="Task board settings"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(clientFilter !== "all" || projectFilter !== "all" || timeFilter !== "all" || priorityFilter !== "all" || labelFilter !== "all") && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-400">Active filters:</span>
            {clientFilter !== "all" && (
              <button
                type="button"
                onClick={() => setClientFilter("all")}
                className="inline-flex items-center gap-1 rounded-full border border-neutral-600 bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300 hover:border-orange-500 hover:text-orange-400"
              >
                Client: {clients.find(c => c.id === clientFilter)?.companyName || "Unknown"}
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {projectFilter !== "all" && (
              <button
                type="button"
                onClick={() => setProjectFilter("all")}
                className="inline-flex items-center gap-1 rounded-full border border-neutral-600 bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300 hover:border-orange-500 hover:text-orange-400"
              >
                Project: {projects.find(p => p.id === projectFilter)?.name || "Unknown"}
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {timeFilter !== "all" && (
              <button
                type="button"
                onClick={() => setTimeFilter("all")}
                className="inline-flex items-center gap-1 rounded-full border border-neutral-600 bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300 hover:border-orange-500 hover:text-orange-400"
              >
                Time: {timeFilter === "under5" ? "< 5h" : timeFilter === "5to10" ? "5-10h" : "> 10h"}
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {priorityFilter !== "all" && (
              <button
                type="button"
                onClick={() => setPriorityFilter("all")}
                className="inline-flex items-center gap-1 rounded-full border border-neutral-600 bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300 hover:border-orange-500 hover:text-orange-400"
              >
                Priority: {priorityFilter.charAt(0).toUpperCase() + priorityFilter.slice(1)}
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {labelFilter !== "all" && (
              <button
                type="button"
                onClick={() => setLabelFilter("all")}
                className="inline-flex items-center gap-1 rounded-full border border-neutral-600 bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300 hover:border-orange-500 hover:text-orange-400"
              >
                Label: {boardLabels.find(l => l.id === labelFilter)?.name || "Unknown"}
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setClientFilter("all");
                setProjectFilter("all");
                setTimeFilter("all");
                setPriorityFilter("all");
                setLabelFilter("all");
              }}
              className="text-xs text-orange-400 hover:text-orange-300 hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Lists - horizontal scroll, image-inspired columns */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {lists.map((list, listIndex) => (
            <div
              key={list.id}
              draggable
              onDragStart={(e) => {
                if ((e.target as HTMLElement).closest("[data-list-menu]")) {
                  e.preventDefault();
                  return;
                }
                handleListDragStart(e, list);
              }}
              onDragEnd={handleListDragEnd}
              onDragOver={(e) => handleListDragOver(e, listIndex)}
              onDragLeave={handleListDragLeave}
              onDrop={(e) => handleListDrop(e, listIndex)}
              className={`flex min-w-[280px] max-w-[280px] shrink-0 self-start flex-col rounded-xl border transition-all duration-200 ${
                draggedListId === list.id ? "opacity-50 scale-95" : ""
              } ${listDropIndex === listIndex ? "ring-4 ring-orange-400 scale-105 shadow-2xl shadow-orange-500/50" : "border-neutral-700"} bg-neutral-900/60`}
            >
              <ListHeader
                list={list}
                listIndex={listIndex}
                headerColorClass={LIST_HEADER_COLORS[listIndex % LIST_HEADER_COLORS.length]}
                isEditing={editingListId === list.id}
                onStartEdit={() => setEditingListId(list.id)}
                onSave={(name, wipLimit) => {
                  updateBoardList(list.id, {
                    name,
                    wipLimit: wipLimit == null || wipLimit === 0 ? undefined : Math.max(0, wipLimit),
                  });
                  setEditingListId(null);
                }}
                onCancelEdit={() => setEditingListId(null)}
                onDelete={() => handleDeleteList(list.id)}
                onAddTask={() => setNewTaskListId(list.id)}
                taskCount={listTasksFiltered(list.id).length}
              />
              <div
                className={`min-h-[100px] space-y-2 overflow-y-auto p-3 transition-all duration-200 ${
                  dragOverListId === list.id ? "bg-orange-500/40 ring-4 ring-orange-400 ring-inset rounded-lg shadow-[inset_0_0_20px_rgba(249,115,22,0.3)]" : ""
                }`}
                onDragOver={(e) => handleTaskDragOver(e, list.id)}
                onDragLeave={handleTaskDragLeave}
                onDrop={(e) => handleTaskDrop(e, list.id)}
              >
                {listTasksFiltered(list.id).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    clients={clients}
                    projects={projects}
                    assigneeName={assigneeName(task)}
                    getTeamMember={getTeamMember}
                    getTimeTrackedForTask={getTimeTrackedForTask}
                    getProduct={getProduct}
                    getInvoice={getInvoice}
                    boardLabels={boardLabels}
                    isDragging={draggedTask?.id === task.id}
                    showDropIndicator={dragOverTaskId === task.id && draggedTask?.listId === task.listId && draggedTask?.id !== task.id}
                    onDragStart={(e) => handleTaskDragStart(e, task)}
                    onDragEnd={handleTaskDragEnd}
                    onDragOver={() => draggedTask && setDragOverTaskId(task.id)}
                    onDragLeave={() => setDragOverTaskId(null)}
                    onDropOnTask={(e) => handleTaskDropOnTask(e, task)}
                    onClick={() => setDetailTask(task)}
                    onEdit={() => setEditingTask(task)}
                    onDelete={() => {
                      if (typeof window !== "undefined" && window.confirm("Delete this task?")) {
                        deleteBoardTask(task.id);
                        setEditingTask(null);
                        setDetailTask(null);
                      }
                    }}
                    onMoveToList={(targetListId) => moveBoardTaskToList(task.id, targetListId)}
                    onToggleComplete={() => updateBoardTask(task.id, { completedAt: task.completedAt ? undefined : new Date().toISOString() })}
                    otherLists={lists.filter((l) => l.id !== list.id)}
                  />
                ))}
                <QuickAddInput
                  listId={list.id}
                  boardId={boardId}
                  onAdd={(title) => {
                    const tasksInList = getBoardTasksByList(list.id);
                    const maxOrder = tasksInList.length ? Math.max(...tasksInList.map((t) => t.order), -1) + 1 : 0;
                    addBoardTask({ listId: list.id, boardId, title, priority: "medium", order: maxOrder });
                  }}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddList}
            className="flex min-w-[200px] shrink-0 self-start items-center justify-center rounded-xl border border-dashed border-neutral-600 bg-neutral-900/40 px-4 py-3 text-sm font-medium text-neutral-500 transition-colors hover:border-neutral-500 hover:bg-neutral-800/50 hover:text-neutral-300"
          >
            + New group
          </button>
        </div>
      </div>

      <EditBoardModal
        board={board}
        isOpen={editBoardOpen}
        onClose={() => setEditBoardOpen(false)}
      />
      {newTaskListId && (
        <NewBoardTaskModal
          boardId={boardId}
          listId={newTaskListId}
          isOpen={!!newTaskListId}
          onClose={() => setNewTaskListId(null)}
          teamMembers={teamMembers}
          defaultProjectId={board?.projectId ?? ""}
        />
      )}
      {editingTask && (
        <EditBoardTaskModal
          task={editingTask}
          lists={lists}
          teamMembers={teamMembers}
          onClose={() => setEditingTask(null)}
          onSave={(data) => {
            if (data.listId && data.listId !== editingTask.listId) {
              moveBoardTaskToList(editingTask.id, data.listId);
              const { listId: _l, ...rest } = data;
              updateBoardTask(editingTask.id, rest);
            } else {
              updateBoardTask(editingTask.id, data);
            }
            setEditingTask(null);
          }}
        />
      )}
      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          lists={lists}
          teamMembers={teamMembers}
          onClose={onDetailClose}
          onSave={onDetailSave}
          onDelete={onDetailDelete}
          onDuplicate={onDetailDuplicate}
          onArchive={onDetailArchive}
          onMoveToList={onDetailMoveToList}
        />
      )}
    </div>
  );
}

function QuickAddInput({ listId, boardId, onAdd }: { listId: string; boardId: string; onAdd: (title: string) => void }) {
  const [value, setValue] = useState("");
  const handleSubmit = () => {
    const title = value.trim();
    if (!title) return;
    onAdd(title);
    setValue("");
  };
  return (
    <div className="pt-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="+ New task"
        className="w-full rounded-lg border border-dashed border-neutral-600 bg-transparent px-3 py-2 text-sm text-neutral-400 placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
      />
    </div>
  );
}

function ListHeader({
  list,
  listIndex,
  headerColorClass,
  isEditing,
  onStartEdit,
  onSave,
  onCancelEdit,
  onDelete,
  onAddTask,
  taskCount,
}: {
  list: BoardList;
  listIndex: number;
  headerColorClass: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (name: string, wipLimit?: number) => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onAddTask: () => void;
  taskCount: number;
}) {
  const [name, setName] = useState(list.name);
  const [wipLimit, setWipLimit] = useState(list.wipLimit != null ? String(list.wipLimit) : "");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setName(list.name);
    setWipLimit(list.wipLimit != null ? String(list.wipLimit) : "");
  }, [list.name, list.wipLimit]);

  if (isEditing) {
    return (
      <div className="space-y-2 border-b border-neutral-800 px-3 py-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave(name.trim(), wipLimit === "" ? undefined : parseInt(wipLimit, 10) || 0);
              if (e.key === "Escape") onCancelEdit();
            }}
            autoFocus
            className="flex-1 rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            placeholder="List name"
          />
          <button type="button" onClick={() => onSave(name.trim(), wipLimit === "" ? undefined : parseInt(wipLimit, 10) || 0)} className="text-orange-400 hover:underline text-sm">
            Save
          </button>
          <button type="button" onClick={onCancelEdit} className="text-neutral-400 hover:underline text-sm">
            Cancel
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-neutral-400">WIP limit (0 = none)</label>
          <input
            type="number"
            min={0}
            value={wipLimit}
            onChange={(e) => setWipLimit(e.target.value)}
            className="w-20 rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            placeholder="0"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-b border-neutral-700/50 px-3 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <h3
          className={`cursor-pointer truncate rounded-lg border px-2.5 py-1 text-sm font-medium ${headerColorClass}`}
          onClick={onStartEdit}
          title="Click to edit"
        >
          {list.name}
        </h3>
        {list.wipLimit != null && list.wipLimit > 0 && (
          <span className="shrink-0 rounded bg-neutral-700/80 px-1.5 py-0.5 text-xs text-neutral-400">
            {taskCount}/{list.wipLimit}
          </span>
        )}
        {(!list.wipLimit || list.wipLimit === 0) && (
          <span className="shrink-0 rounded bg-neutral-700/80 px-1.5 py-0.5 text-xs text-neutral-400">
            {taskCount}
          </span>
        )}
      </div>
      <div className="relative flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onAddTask}
          className="rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-white"
          title="Add task"
          aria-label="Add task"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-white"
          aria-label="List menu"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" aria-hidden onClick={() => setMenuOpen(false)} />
            <div
              data-list-menu
              className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border border-neutral-700 bg-neutral-900 py-1 shadow-xl"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onStartEdit(); }}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-800"
              >
                Edit list name
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete();
                  setMenuOpen(false);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-neutral-800"
              >
                Delete group
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  clients,
  projects,
  assigneeName,
  getTeamMember,
  getTimeTrackedForTask,
  getProduct,
  getInvoice,
  boardLabels = [],
  isDragging,
  showDropIndicator,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDropOnTask,
  onClick,
  onEdit,
  onDelete,
  onMoveToList,
  onToggleComplete,
  otherLists,
}: {
  task: BoardTask;
  clients: { id: string; companyName: string }[];
  projects: { id: string; name: string; clientId: string }[];
  assigneeName: string;
  getTeamMember: (id: string) => TeamMember | undefined;
  getTimeTrackedForTask: (taskId: string) => number;
  getProduct: (id: string) => Product | undefined;
  getInvoice: (id: string) => Invoice | undefined;
  boardLabels?: { id: string; name: string; color: string }[];
  isDragging: boolean;
  showDropIndicator?: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver?: () => void;
  onDragLeave?: () => void;
  onDropOnTask: (e: React.DragEvent, target: BoardTask) => void;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveToList: (listId: string) => void;
  onToggleComplete?: () => void;
  otherLists: BoardList[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const client = task.clientId ? clients.find((c) => c.id === task.clientId) : null;
  const project = task.projectId ? projects.find((p) => p.id === task.projectId) : null;
  const assignee = task.assigneeId ? getTeamMember(task.assigneeId) : null;
  const timeTracked = getTimeTrackedForTask(task.id);
  const checklist = task.checklist ?? [];
  const checklistDone = checklist.filter((c) => c.completed).length;
  const commentCount = task.commentCount ?? 0;
  const attachmentCount = task.attachmentCount ?? 0;
  const isCompleted = !!task.completedAt;

  const initials = assignee ? assignee.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : null;

  return (
    <div className="relative">
      {/* Drop indicator - shows above the task when dragging over it */}
      {showDropIndicator && (
        <div className="absolute -top-1 left-0 right-0 z-40 flex items-center">
          <div className="h-1 flex-1 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.6)]" />
          <div className="absolute -left-1 h-3 w-3 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.6)]" />
        </div>
      )}
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={(e) => { 
          e.preventDefault(); 
          e.stopPropagation(); 
          e.dataTransfer.dropEffect = "move";
          onDragOver?.();
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          onDragLeave?.();
        }}
        onDrop={(e) => onDropOnTask(e, task)}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onClick()}
        className={`group relative cursor-move rounded-xl border border-neutral-600/80 bg-white/95 p-3 shadow-sm transition-all duration-200 dark:bg-neutral-800 dark:border-neutral-700 ${
          isDragging ? "opacity-50 scale-95 rotate-3 shadow-2xl ring-4 ring-orange-400 z-50 bg-orange-50 dark:bg-orange-950/30" : "hover:shadow-md hover:border-neutral-500 dark:hover:border-neutral-600 hover:scale-[1.02]"
        }`}
      >
      <div className="flex items-start justify-between gap-2">
        {onToggleComplete && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleComplete(); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="mt-0.5 shrink-0 rounded border border-neutral-400 bg-transparent p-0.5 text-neutral-500 hover:border-neutral-500 hover:text-neutral-700 dark:border-neutral-500 dark:hover:border-neutral-400"
            aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
          >
            {isCompleted ? (
              <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <div className="h-4 w-4" />
            )}
          </button>
        )}
        <h4 className={`min-w-0 flex-1 font-medium line-clamp-2 ${isCompleted ? "text-neutral-500 line-through dark:text-neutral-400" : "text-neutral-900 dark:text-white"}`}>{task.title}</h4>
        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
            className="rounded p-1 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-neutral-200 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-white"
            aria-label="Task menu"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" aria-hidden onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-neutral-700 bg-neutral-900 py-1 shadow-xl">
                <button type="button" onClick={() => { setMenuOpen(false); onEdit(); }} className="w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-800">Edit</button>
                {otherLists.map((l) => (
                  <button key={l.id} type="button" onClick={() => { setMenuOpen(false); onMoveToList(l.id); }} className="w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-800">Move to {l.name}</button>
                ))}
                <button type="button" onClick={() => { setMenuOpen(false); onDelete(); }} className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-neutral-800">Delete</button>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Badges: client, project, invoiced */}
      {(client || project || task.invoiceId) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.invoiceId && (
            <span className="rounded bg-emerald-900/40 px-1.5 py-0.5 text-xs text-emerald-300" title="Invoiced">
              ✅ Invoiced ({getInvoice(task.invoiceId)?.invoiceNumber ?? "—"})
            </span>
          )}
          {project && (
            <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-xs text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">
              {project.name}
            </span>
          )}
          {client && (
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-700/80 dark:text-neutral-400">
              {client.companyName}
            </span>
          )}
        </div>
      )}
      {/* Approval Status Badge */}
      {task.approvalStatus && task.approvalStatus !== "not_required" && (
        <div className="mt-2">
          <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${
            task.approvalStatus === "approved" ? "bg-emerald-900/40 text-emerald-300" :
            task.approvalStatus === "pending_review" ? "bg-amber-900/40 text-amber-300" :
            task.approvalStatus === "changes_requested" ? "bg-red-900/40 text-red-300" :
            "bg-neutral-700 text-neutral-300"
          }`} title="Approval Status">
            {task.approvalStatus === "approved" && "✓ Approved"}
            {task.approvalStatus === "pending_review" && "👁 Pending Review"}
            {task.approvalStatus === "changes_requested" && "✎ Changes Requested"}
          </span>
        </div>
      )}
      {/* Billable amount */}
      {task.billable && timeTracked > 0 && task.serviceId && (() => {
        const svc = getProduct(task.serviceId!);
        return svc ? (
          <div className="mt-1 text-xs text-emerald-400">
            💰 ${(timeTracked * svc.defaultPrice).toFixed(0)} ({timeTracked.toFixed(1)}h × ${svc.defaultPrice})
          </div>
        ) : null;
      })()}
      {/* Labels */}
      {((task.labelIds?.length ?? 0) > 0 || (task.labels ?? []).length > 0) && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {(task.labelIds ?? []).length > 0
            ? (task.labelIds ?? []).slice(0, 3).map((id) => {
                const l = boardLabels.find((x) => x.id === id);
                return l ? (
                  <span key={l.id} className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: l.color + "40", color: l.color }}>
                    {l.name}
                  </span>
                ) : null;
              })
            : (task.labels ?? []).slice(0, 3).map((label) => (
                <span key={label} className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
                  {label}
                </span>
              ))}
          {(task.labelIds?.length ?? 0) > 3 && <span className="text-xs text-neutral-500">+{(task.labelIds?.length ?? 0) - 3}</span>}
          {(task.labels ?? []).length > 3 && (task.labelIds?.length ?? 0) === 0 && <span className="text-xs text-neutral-500">+{(task.labels?.length ?? 0) - 3}</span>}
        </div>
      )}
      {/* Footer: assignee avatar, due date, time tracked, checklist, comments, attachments */}
      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-2 dark:border-neutral-700">
        {assignee && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-medium text-white" title={assignee.name}>
            {initials ?? "?"}
          </span>
        )}
        {(task.dueDateTime ?? task.dueDate) && (
          <span className={`rounded px-1.5 py-0.5 text-xs ${dueDateBadgeClass(task.dueDate, task.dueDateTime)}`} title="Due date">
            {formatDateSafe(task.dueDateTime ?? task.dueDate, task.dueDateTime ? "MMM d, HH:mm" : "MMM d")}
          </span>
        )}
        {(timeTracked > 0 || (task.estimatedHours ?? 0) > 0) && (
          <span
            className={`text-xs ${timeTracked > (task.estimatedHours ?? 0) && (task.estimatedHours ?? 0) > 0 ? "text-red-400 font-medium" : "text-neutral-500"}`}
            title="Time tracked / Estimated"
          >
            ⏱️ {timeTracked.toFixed(1)}h
            {(task.estimatedHours ?? 0) > 0 && ` / ${task.estimatedHours}h`}
            {timeTracked > (task.estimatedHours ?? 0) && (task.estimatedHours ?? 0) > 0 && " ⚠️"}
          </span>
        )}
        {checklist.length > 0 && (
          <span className="text-xs text-neutral-500">
            {checklistDone}/{checklist.length}
          </span>
        )}
        {commentCount > 0 && (
          <span className="text-xs text-neutral-500" title="Comments">
            💬 {commentCount}
          </span>
        )}
        {attachmentCount > 0 && (
          <span className="text-xs text-neutral-500" title="Attachments">
            📎 {attachmentCount}
          </span>
        )}
      </div>
      </div>
    </div>
  );
}
