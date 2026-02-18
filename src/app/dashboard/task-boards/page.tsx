"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useStore } from "@/lib/store";
import type { BoardTask, TaskPriority } from "@/lib/types";
import { format } from "date-fns";
import { NewBoardModal } from "@/components/NewBoardModal";
import { BoardTemplateManager } from "@/components/BoardTemplateManager";
import { NewBoardTaskModal } from "@/components/NewBoardTaskModal";
import { TaskDetailModal } from "@/components/TaskDetailModal";

function formatDateSafe(dateStr: string | undefined, fmt: string, fallback = "—") {
  if (dateStr == null || dateStr === "") return fallback;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return fallback;
  return format(d, fmt);
}

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  low: "bg-neutral-500/20 text-neutral-400",
  medium: "bg-blue-500/20 text-blue-400",
  high: "bg-amber-500/20 text-amber-400",
  urgent: "bg-red-500/20 text-red-400",
};

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-neutral-800/80 dark:bg-neutral-800/80">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-white">Task Boards</h1>
        <div className="mt-8 flex min-h-[200px] items-center justify-center">
          <p className="text-neutral-500">Loading...</p>
        </div>
      </div>
    </div>
  );
}

export default function BoardsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingScreen />;
  }

  return <BoardsPageContent />;
}

function BoardsPageContent() {
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [newBoardOpen, setNewBoardOpen] = useState(false);
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false);
  const [newDropdownOpen, setNewDropdownOpen] = useState(false);
  const [newTaskListId, setNewTaskListId] = useState<string | null>(null);
  const [detailTask, setDetailTask] = useState<BoardTask | null>(null);
  const [draggedTask, setDraggedTask] = useState<BoardTask | null>(null);
  const [dragOverListId, setDragOverListId] = useState<string | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const newDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeDropdowns = (e: MouseEvent) => {
      const target = e.target as Node;
      if (newDropdownRef.current && !newDropdownRef.current.contains(target)) setNewDropdownOpen(false);
    };
    document.addEventListener("click", closeDropdowns);
    return () => document.removeEventListener("click", closeDropdowns);
  }, []);

  const boards = useStore((s) => s.boards);
  const boardLists = useStore((s) => s.boardLists);
  const boardTasks = useStore((s) => s.boardTasks);
  const projects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);
  const toggleBoardSaved = useStore((s) => s.toggleBoardSaved);
  const addBoardList = useStore((s) => s.addBoardList);
  const updateBoardList = useStore((s) => s.updateBoardList);
  const deleteBoardList = useStore((s) => s.deleteBoardList);
  const updateBoardTask = useStore((s) => s.updateBoardTask);
  
  // Auto-select first board on mount
  useEffect(() => {
    if (boards.length > 0 && !selectedBoardId) {
      setSelectedBoardId(boards[0].id);
    }
  }, [boards, selectedBoardId]);

  const selectedBoard = selectedBoardId ? boards.find((b) => b.id === selectedBoardId) : null;
  const selectedProject = selectedBoard?.projectId ? projects.find((p) => p.id === selectedBoard.projectId) : null;
  const selectedClient = selectedProject ? clients.find((c) => c.id === selectedProject.clientId) : null;

  const lists = useMemo(() => {
    if (!selectedBoardId) return [];
    return boardLists
      .filter((l) => l.boardId === selectedBoardId)
      .sort((a, b) => a.order - b.order);
  }, [boardLists, selectedBoardId]);

  const getTasksForList = useCallback((listId: string) => {
    return boardTasks
      .filter((t) => t.listId === listId)
      .sort((a, b) => {
        const aCompleted = !!a.completedAt;
        const bCompleted = !!b.completedAt;
        if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
        return a.order - b.order;
      });
  }, [boardTasks]);

  const handleAddList = () => {
    if (!selectedBoardId) return;
    const maxOrder = lists.length > 0 ? Math.max(...lists.map((l) => l.order)) + 1 : 0;
    addBoardList({
      boardId: selectedBoardId,
      name: "New group",
      order: maxOrder,
    });
  };

  const handleTaskDragStart = (task: BoardTask) => {
    setDraggedTask(task);
  };

  const handleTaskDrop = (targetListId: string) => {
    if (!draggedTask || draggedTask.listId === targetListId) {
      setDraggedTask(null);
      setDragOverListId(null);
      return;
    }
    const tasksInTarget = getTasksForList(targetListId);
    const maxOrder = tasksInTarget.length > 0 ? Math.max(...tasksInTarget.map((t) => t.order)) + 1 : 0;
    updateBoardTask(draggedTask.id, { listId: targetListId, order: maxOrder });
    setDraggedTask(null);
    setDragOverListId(null);
  };

  return (
    <div className="min-h-screen bg-neutral-800/80 dark:bg-neutral-800/80">
      <div className="mx-auto max-w-[1600px] px-6 py-6">
        {/* Header with tabs and actions */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {/* Board tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {boards.map((board) => {
              const project = board.projectId ? projects.find((p) => p.id === board.projectId) : null;
              const isActive = selectedBoardId === board.id;
              return (
                <button
                  key={board.id}
                  type="button"
                  onClick={() => setSelectedBoardId(board.id)}
                  className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white"
                      : "bg-neutral-700/50 text-neutral-300 hover:bg-neutral-700 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {board.isSaved && <span className="text-amber-400">★</span>}
                    <span>{board.name}</span>
                    {project && <span className="text-xs opacity-60">· {project.name}</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTemplateManagerOpen(true)}
              className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
            >
              Manage Templates
            </button>
            <div className="relative" ref={newDropdownRef}>
              <button
                type="button"
                onClick={() => setNewDropdownOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-400"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New
              </button>
              {newDropdownOpen && (
                <div className="absolute right-0 top-full z-10 mt-1 min-w-[200px] rounded-xl border border-neutral-700 bg-neutral-800 py-1 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setNewDropdownOpen(false);
                      setNewBoardOpen(true);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-neutral-700"
                  >
                    New Task Board
                  </button>
                  {selectedBoardId && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewDropdownOpen(false);
                        handleAddList();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-neutral-700"
                    >
                      New Group
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Kanban Board View */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {boards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white/50 py-20 text-center dark:border-neutral-700 dark:bg-neutral-900/50 w-full">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-950/50 dark:to-amber-950/50 flex items-center justify-center mb-6">
              <svg className="h-10 w-10 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h3A2.25 2.25 0 0111.25 6v12A2.25 2.25 0 019 20.25H6A2.25 2.25 0 013.75 18V6zM13.5 6A2.25 2.25 0 0115.75 3.75h3A2.25 2.25 0 0121 6v8.25A2.25 2.25 0 0118.75 16.5h-3a2.25 2.25 0 01-2.25-2.25V6z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              Create your first task board
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md mx-auto mb-8">
              Organize your projects visually with kanban-style task boards. Choose from built-in templates or create your own custom workflow.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setNewBoardOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-400 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create Task Board
              </button>
              <button
                type="button"
                onClick={() => setTemplateManagerOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-6 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
                Browse Templates
              </button>
            </div>
          </div>
        ) : selectedBoard ? (
          <>
            {/* Render board lists */}
            {lists.map((list) => {
              const tasks = getTasksForList(list.id);
              return (
                <div
                  key={list.id}
                  className="flex min-w-[280px] max-w-[280px] shrink-0 self-start flex-col rounded-xl border border-neutral-700 bg-neutral-900/60"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverListId(list.id);
                  }}
                  onDragLeave={() => setDragOverListId(null)}
                  onDrop={() => handleTaskDrop(list.id)}
                >
                  {/* List Header */}
                  <div className="flex items-center justify-between border-b border-neutral-700/50 px-3 py-2.5">
                    {editingListId === list.id ? (
                      <input
                        type="text"
                        value={list.name}
                        onChange={(e) => updateBoardList(list.id, { name: e.target.value })}
                        onBlur={() => setEditingListId(null)}
                        onKeyDown={(e) => e.key === "Enter" && setEditingListId(null)}
                        className="w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-sm text-white"
                        autoFocus
                      />
                    ) : (
                      <h3
                        className="flex-1 text-sm font-semibold text-white cursor-pointer"
                        onClick={() => setEditingListId(list.id)}
                      >
                        {list.name} <span className="text-xs text-neutral-500">({tasks.length})</span>
                      </h3>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteBoardList(list.id)}
                      className="ml-2 text-neutral-500 hover:text-red-400"
                      aria-label="Delete group"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Task Cards */}
                  <div className="min-h-[100px] space-y-2 overflow-y-auto p-3">
                    {tasks.map((task) => {
                      const taskProject = task.projectId ? projects.find(p => p.id === task.projectId) : null;
                      const taskClient = task.clientId ? clients.find(c => c.id === task.clientId) : null;
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleTaskDragStart(task)}
                          className="group relative cursor-pointer rounded-xl border border-neutral-600/80 bg-white/95 p-3 shadow-sm transition-all dark:bg-neutral-800 dark:border-neutral-700 hover:shadow-md hover:border-neutral-500 dark:hover:border-neutral-600"
                          onClick={() => setDetailTask(task)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateBoardTask(task.id, { completedAt: task.completedAt ? undefined : new Date().toISOString() });
                              }}
                              className="mt-0.5 shrink-0 rounded border border-neutral-400 bg-transparent p-0.5 text-neutral-500 hover:border-neutral-500 hover:text-neutral-700 dark:border-neutral-500 dark:hover:border-neutral-400"
                              aria-label={task.completedAt ? "Mark incomplete" : "Mark complete"}
                            >
                              {task.completedAt ? (
                                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <div className="h-3 w-3" />
                              )}
                            </button>
                            <p className={`flex-1 text-sm text-neutral-900 dark:text-white ${task.completedAt ? 'line-through opacity-60' : ''}`}>
                              {task.title}
                            </p>
                          </div>
                          {(task.priority || task.dueDate || taskProject || taskClient) && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {task.priority && task.priority !== 'medium' && (
                                <span className={`rounded px-2 py-0.5 text-xs font-medium ${PRIORITY_CLASS[task.priority]}`}>
                                  {task.priority}
                                </span>
                              )}
                              {task.dueDate && (
                                <span className="rounded bg-neutral-600/40 px-2 py-0.5 text-xs text-neutral-400">
                                  {formatDateSafe(task.dueDate, "MMM d")}
                                </span>
                              )}
                              {taskClient && (
                                <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
                                  {taskClient.companyName}
                                </span>
                              )}
                              {taskProject && (
                                <span className="rounded bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400">
                                  {taskProject.name}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick Add Task */}
                  <div className="border-t border-neutral-700/50 p-2">
                    <button
                      type="button"
                      onClick={() => setNewTaskListId(list.id)}
                      className="w-full rounded-lg py-2 text-sm text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                    >
                      + Add task
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add New Group Button */}
            <button
              type="button"
              onClick={handleAddList}
              className="flex min-w-[200px] shrink-0 items-center justify-center rounded-xl border border-dashed border-neutral-600 bg-neutral-900/40 py-8 text-sm font-medium text-neutral-500 transition-colors hover:border-neutral-500 hover:bg-neutral-800/50 hover:text-neutral-300"
            >
              + New group
            </button>
          </>
        ) : (
          <div className="flex min-h-[400px] items-center justify-center w-full">
            <p className="text-neutral-500">Select a board to view tasks</p>
          </div>
        )}
      </div>

      <NewBoardModal
        isOpen={newBoardOpen}
        onClose={() => setNewBoardOpen(false)}
      />
      <BoardTemplateManager
        isOpen={templateManagerOpen}
        onClose={() => setTemplateManagerOpen(false)}
      />
      {newTaskListId && selectedBoardId && (
        <NewBoardTaskModal
          boardId={selectedBoardId}
          listId={newTaskListId}
          isOpen={true}
          onClose={() => setNewTaskListId(null)}
        />
      )}
      {detailTask && selectedBoardId && (
        <TaskDetailModal
          task={detailTask}
          lists={lists}
          teamMembers={[]}
          onSave={(updates) => {
            updateBoardTask(detailTask.id, updates);
            setDetailTask(null);
          }}
          onDelete={() => {
            setDetailTask(null);
          }}
          onDuplicate={() => {
            setDetailTask(null);
          }}
          onArchive={() => {
            setDetailTask(null);
          }}
          onMoveToList={(listId) => {
            updateBoardTask(detailTask.id, { listId });
            setDetailTask(null);
          }}
          onClose={() => setDetailTask(null)}
        />
      )}
      </div>
    </div>
  );
}
