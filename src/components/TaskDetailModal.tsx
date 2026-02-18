"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useStore } from "@/lib/store";
import type { BoardTask, BoardList, TaskPriority, TeamMember, TaskChecklistItem, ApprovalStatus } from "@/lib/types";
import type { TimeEntry } from "@/lib/types";
import { TASK_PRIORITIES, APPROVAL_STATUSES } from "@/lib/types";
import { format } from "date-fns";
import { v4 as uuid } from "uuid";
import { AddTaskTimeEntryModal } from "./AddTaskTimeEntryModal";
import { RichTextEditor } from "./RichTextEditor";
import { FilePreviewModal } from "./FilePreviewModal";

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  not_required: "Not Required",
  pending_review: "Pending Review",
  changes_requested: "Changes Requested",
  approved: "Approved",
};

function formatDateSafe(dateStr: string | undefined, fmt: string, fallback = "—") {
  if (dateStr == null || dateStr === "") return fallback;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return fallback;
  return format(d, fmt);
}

function formatTimerSeconds(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function TimeEntryRow({
  entry,
  getTeamMember,
  onDelete,
}: {
  entry: TimeEntry;
  getTeamMember: (id: string) => TeamMember | undefined;
  onDelete: () => void;
}) {
  const member = getTeamMember(entry.teamMemberId);
  const [showDel, setShowDel] = useState(false);
  return (
    <li className="flex items-center justify-between gap-2 rounded border border-neutral-700 bg-neutral-800/50 px-2 py-1.5 text-sm">
      <span className="text-white">{entry.hours.toFixed(1)}h</span>
      <span className="text-neutral-400">{formatDateSafe(entry.date, "MMM d")}</span>
      <span className="text-neutral-400">{member?.name ?? "—"}</span>
      {entry.notes && <span className="min-w-0 truncate text-neutral-500" title={entry.notes}>{entry.notes}</span>}
      {entry.billable && <span className="text-emerald-400 text-xs">$</span>}
      <button
        type="button"
        onClick={() => setShowDel(true)}
        className="text-neutral-500 hover:text-red-400 text-xs"
        aria-label="Delete entry"
      >
        {showDel ? (
          <span className="flex gap-1">
            <span onClick={(e) => { e.stopPropagation(); onDelete(); setShowDel(false); }}>Yes</span>
            <span onClick={(e) => { e.stopPropagation(); setShowDel(false); }}>No</span>
          </span>
        ) : (
          "Delete"
        )}
      </button>
    </li>
  );
}

interface TaskDetailModalProps {
  task: BoardTask;
  lists: BoardList[];
  teamMembers: TeamMember[];
  onClose: () => void;
  onSave: (data: Partial<BoardTask>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onMoveToList: (listId: string) => void;
}

function TaskDetailModalInner({
  task,
  lists,
  teamMembers,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  onArchive,
  onMoveToList,
}: TaskDetailModalProps) {
  const clients = useStore((s) => s.clients);
  const projects = useStore((s) => s.projects);
  const getTimeTrackedForTask = useStore((s) => s.getTimeTrackedForTask);
  const getTimeEntriesByTask = useStore((s) => s.getTimeEntriesByTask);
  const getBillableHoursForTask = useStore((s) => s.getBillableHoursForTask);
  const getBoard = useStore((s) => s.getBoard);
  const getTeamMember = useStore((s) => s.getTeamMember);
  const runningTimer = useStore((s) => s.runningTimer);
  const startTimer = useStore((s) => s.startTimer);
  const stopTimer = useStore((s) => s.stopTimer);
  const deleteTimeEntry = useStore((s) => s.deleteTimeEntry);
  const products = useStore((s) => s.products);
  const getInvoice = useStore((s) => s.getInvoice);
  const getProduct = useStore((s) => s.getProduct);
  const getAttachmentsByTask = useStore((s) => s.getAttachmentsByTask);
  const addTaskAttachment = useStore((s) => s.addTaskAttachment);
  const deleteTaskAttachment = useStore((s) => s.deleteTaskAttachment);
  const getCommentsByTask = useStore((s) => s.getCommentsByTask);
  const addTaskComment = useStore((s) => s.addTaskComment);
  const updateTaskComment = useStore((s) => s.updateTaskComment);
  const deleteTaskComment = useStore((s) => s.deleteTaskComment);
  const getBoardLabels = useStore((s) => s.getBoardLabels);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [assigneeId, setAssigneeId] = useState(task.assigneeId ?? "");
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [dueTime, setDueTime] = useState(() => {
    const dt = task.dueDateTime ?? task.dueDate ?? "";
    if (dt.includes("T")) return dt.slice(11, 16);
    return "";
  });
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [listId, setListId] = useState(task.listId);
  const [estimatedHours, setEstimatedHours] = useState(task.estimatedHours != null ? String(task.estimatedHours) : "");
  const [billable, setBillable] = useState(task.billable ?? false);
  const [serviceId, setServiceId] = useState(task.serviceId ?? "");
  const [clientId, setClientId] = useState(task.clientId ?? "");
  const [projectId, setProjectId] = useState(task.projectId ?? "");
  const [labelsInput, setLabelsInput] = useState((task.labels ?? []).join(", "));
  const [labelIds, setLabelIds] = useState<string[]>(task.labelIds ?? []);
  const [checklist, setChecklist] = useState<TaskChecklistItem[]>(task.checklist ?? []);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(task.approvalStatus ?? "not_required");
  const [reviewNotes, setReviewNotes] = useState(task.reviewNotes ?? "");
  const [designFileUrl, setDesignFileUrl] = useState(task.designFileUrl ?? "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type?: string } | null>(null);
  const [addTimeModalOpen, setAddTimeModalOpen] = useState(false);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState<"all" | "comments" | "changes">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const board = task.boardId ? getBoard(task.boardId) : null;
  const currentList = lists.find((l) => l.id === task.listId);
  const client = clientId ? clients.find((c) => c.id === clientId) : null;
  const project = projectId ? projects.find((p) => p.id === projectId) : null;
  const timeTracked = getTimeTrackedForTask(task.id);
  const timeEntries = getTimeEntriesByTask(task.id);
  const billableHours = getBillableHoursForTask(task.id);
  const activities = task.activities ?? [];
  const isTimerRunning = runningTimer?.taskId === task.id;
  const attachments = getAttachmentsByTask(task.id);
  const taskComments = getCommentsByTask(task.id);
  const currentUserId = (assigneeId || teamMembers[0]?.id) ?? "";
  const filteredActivities = useMemo(() => {
    if (activityFilter === "all") return activities;
    if (activityFilter === "comments") return activities.filter((a) => a.type === "comment");
    return activities.filter((a) => a.type !== "comment");
  }, [activities, activityFilter]);

  // Elapsed time for running timer. Depend only on isTimerRunning so we don't re-run when
  // runningTimer object reference changes (which can cause update loops). Read startTime from ref.
  const runningTimerRef = useRef(runningTimer);
  runningTimerRef.current = runningTimer;
  useEffect(() => {
    if (!isTimerRunning || !runningTimerRef.current) {
      setTimerElapsed((prev) => (prev === 0 ? prev : 0));
      return;
    }
    const start = new Date(runningTimerRef.current.startTime).getTime();
    const tick = () => setTimerElapsed((Date.now() - start) / 1000);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isTimerRunning]);

  // Auto-fill client when project changes. Depend only on projectId so we don't re-run when
  // projects array reference changes (which can contribute to update loops). Read projects from ref.
  const projectsRef = useRef(projects);
  projectsRef.current = projects;
  useEffect(() => {
    if (!projectId) return;
    const proj = projectsRef.current.find((p) => p.id === projectId);
    if (proj && proj.clientId) setClientId((prev) => (prev === proj.clientId ? prev : proj.clientId));
  }, [projectId]);

  // Sync from task only when switching to a different task (by id). Skip sync on first mount so we
  // don't run 15+ setState on open (initial state from useState(task.*) is already correct).
  const prevTaskIdRef = useRef<string | null>(null);
  useEffect(() => {
    const isFirstMount = prevTaskIdRef.current === null;
    const taskChanged = prevTaskIdRef.current !== task.id;
    prevTaskIdRef.current = task.id;
    const didSync = !isFirstMount && taskChanged;
    if (didSync) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setAssigneeId(task.assigneeId ?? "");
      setDueDate(task.dueDate ?? "");
      setDueTime((task.dueDateTime ?? task.dueDate ?? "").includes("T") ? (task.dueDateTime ?? "").slice(11, 16) : "");
      setPriority(task.priority);
      setListId(task.listId);
      setEstimatedHours(task.estimatedHours != null ? String(task.estimatedHours) : "");
      setBillable(task.billable ?? false);
      setServiceId(task.serviceId ?? "");
      setClientId(task.clientId ?? "");
      setProjectId(task.projectId ?? "");
      setLabelsInput((task.labels ?? []).join(", "));
      setLabelIds(task.labelIds ?? []);
      setChecklist(task.checklist ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only re-run when task identity changes to avoid update loops
  }, [task.id]);

  const handleSave = () => {
    const assigneeMember = assigneeId ? teamMembers.find((m) => m.id === assigneeId) : null;
    const labels = labelsInput.trim() ? labelsInput.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
    const boardLabelsList = getBoardLabels(task.boardId);
    if (listId !== task.listId) {
      onMoveToList(listId);
    }
    onSave({
      title: title.trim(),
      description: (typeof description === "string" ? description.trim() : description) || undefined,
      assigneeId: assigneeId || undefined,
      assignee: assigneeMember?.name,
      dueDate: dueDate || undefined,
      dueDateTime: dueDate && dueTime ? `${dueDate}T${dueTime}:00` : dueDate || undefined,
      priority,
      listId,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      billable,
      serviceId: serviceId || undefined,
      clientId: clientId || undefined,
      projectId: projectId || undefined,
      labels: boardLabelsList.length === 0 ? labels : undefined,
      labelIds: boardLabelsList.length > 0 ? (labelIds.length ? labelIds : undefined) : undefined,
      checklist: checklist.length ? checklist : undefined,
      approvalStatus: approvalStatus !== "not_required" ? approvalStatus : undefined,
      reviewNotes: reviewNotes.trim() || undefined,
      designFileUrl: designFileUrl.trim() || undefined,
    });
    onClose();
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const item: TaskChecklistItem = { id: uuid(), text: newChecklistItem.trim(), completed: false };
    setChecklist((prev) => [...prev, item]);
    setNewChecklistItem("");
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, completed: !c.completed } : c)));
  };

  const removeChecklistItem = (id: string) => {
    setChecklist((prev) => prev.filter((c) => c.id !== id));
  };

  const checklistDone = checklist.filter((c) => c.completed).length;
  const inputClass = "rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-neutral-800 p-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-white placeholder:text-neutral-500 focus:outline-none focus:ring-0"
            placeholder="Task title"
          />
          <div className="flex items-center gap-2">
            <span className="rounded bg-neutral-700 px-2 py-0.5 text-xs text-neutral-400">
              {currentList?.name ?? "—"}
            </span>
            <button type="button" onClick={onClose} className="rounded p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white" aria-label="Close">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Description (rich text); key={task.id} so each task gets a fresh editor instance */}
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Description</label>
            <RichTextEditor
              key={task.id}
              value={description}
              onChange={setDescription}
              onBlur={() => {}}
              placeholder="Add description... (bold, lists, links, paste images)"
            />
          </div>

          {/* Assignee, Due date, Priority, Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Assignee</label>
              <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={`w-full ${inputClass}`}>
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Due date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`w-full ${inputClass}`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Due time</label>
              <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className={`w-full ${inputClass}`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className={`w-full ${inputClass}`}>
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Status (list)</label>
              <select value={listId} onChange={(e) => setListId(e.target.value)} className={`w-full ${inputClass}`}>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Client & Project */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Client</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={`w-full ${inputClass}`}>
                <option value="">None</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Project</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={`w-full ${inputClass}`}>
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Approval Workflow */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Approval Status</label>
              <select value={approvalStatus} onChange={(e) => setApprovalStatus(e.target.value as ApprovalStatus)} className={`w-full ${inputClass}`}>
                {APPROVAL_STATUSES.map((s) => (
                  <option key={s} value={s}>{APPROVAL_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Design File URL</label>
              <input type="url" value={designFileUrl} onChange={(e) => setDesignFileUrl(e.target.value)} className={`w-full ${inputClass}`} placeholder="https://..." />
            </div>
          </div>
          {approvalStatus !== "not_required" && (
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Review Notes</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                className={`w-full ${inputClass}`}
                placeholder="Feedback from client or reviewer..."
              />
            </div>
          )}

          {/* Estimated hours, Service, Billable */}
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Est. hours</label>
              <input type="number" min={0} step={0.5} value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} className={`w-24 ${inputClass}`} placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Service</label>
              <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={`min-w-[160px] ${inputClass}`}>
                <option value="">—</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (${p.defaultPrice}/{p.pricingType === "per hour" ? "hr" : p.pricingType})</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="billable" checked={billable} onChange={(e) => setBillable(e.target.checked)} className="rounded border-neutral-600 bg-neutral-800 text-orange-500" />
              <label htmlFor="billable" className="text-sm text-neutral-400">Billable</label>
            </div>
            {timeTracked > 0 && (
              <div className="pt-6 text-sm text-neutral-400">
                Time tracked: <span className="text-white font-medium">{timeTracked.toFixed(1)}h</span>
              </div>
            )}
            {billable && timeTracked > 0 && serviceId && (() => {
              const svc = getProduct(serviceId);
              const rate = svc?.defaultPrice ?? 0;
              const amount = timeTracked * rate;
              return (
                <div className="pt-6 text-sm text-emerald-400">
                  Billable amount: <span className="font-medium">${amount.toFixed(2)}</span> ({timeTracked.toFixed(1)}h × ${rate})
                </div>
              );
            })()}
          </div>
          {task.invoiceId && (
            <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm">
              <span className="text-neutral-400">Invoiced: </span>
              <a href={`/dashboard/invoices/${task.invoiceId}`} className="text-orange-400 hover:underline" target="_blank" rel="noopener noreferrer">
                {getInvoice(task.invoiceId)?.invoiceNumber ?? task.invoiceId}
              </a>
            </div>
          )}

          {/* Time Tracking widget */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-800/50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-300">
              <span aria-hidden>⏱️</span> Time Tracking
            </h3>
            <div className="mb-3 flex items-center gap-4 text-sm">
              <span className="text-neutral-400">Estimated: {task.estimatedHours ?? 0}h</span>
              <span className="text-white font-medium">Tracked: {(timeTracked + (isTimerRunning ? timerElapsed / 3600 : 0)).toFixed(1)}h</span>
              {billableHours > 0 && (
                <span className="text-emerald-400">Billable: {billableHours.toFixed(1)}h</span>
              )}
            </div>
            {(task.estimatedHours ?? 0) > 0 && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-neutral-500 mb-1">
                  <span>Time vs estimate</span>
                  <span className={timeTracked > (task.estimatedHours ?? 0) ? "text-red-400" : ""}>
                    {Math.round(((timeTracked + (isTimerRunning ? timerElapsed / 3600 : 0)) / (task.estimatedHours ?? 1)) * 100)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-700">
                  <div
                    className={`h-full rounded-full transition-all ${
                      timeTracked > (task.estimatedHours ?? 0) ? "bg-red-500" : "bg-orange-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        ((timeTracked + (isTimerRunning ? timerElapsed / 3600 : 0)) / (task.estimatedHours ?? 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
            <div className="mb-3 flex flex-wrap gap-2">
              {!isTimerRunning ? (
                <button
                  type="button"
                  onClick={() => {
                    const memberId = assigneeId || teamMembers[0]?.id;
                    if (memberId) startTimer(task.id, memberId);
                  }}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
                  disabled={teamMembers.length === 0}
                >
                  ▶ Start Timer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => stopTimer()}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500"
                >
                  ■ Stop Timer: {formatTimerSeconds(timerElapsed)}
                </button>
              )}
            </div>
            {timeEntries.length > 0 && (
              <div className="mb-3">
                <p className="mb-2 text-xs font-medium text-neutral-400">Time entries</p>
                <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                  {timeEntries.map((entry) => (
                    <TimeEntryRow key={entry.id} entry={entry} getTeamMember={getTeamMember} onDelete={() => deleteTimeEntry(entry.id)} />
                  ))}
                </ul>
              </div>
            )}
            <button
              type="button"
              onClick={() => setAddTimeModalOpen(true)}
              className="text-sm text-orange-400 hover:underline"
            >
              + Add time entry manually
            </button>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Labels</label>
            {getBoardLabels(task.boardId).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {getBoardLabels(task.boardId).map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLabelIds((prev) => (prev.includes(l.id) ? prev.filter((id) => id !== l.id) : [...prev, l.id]))}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${labelIds.includes(l.id) ? "ring-1 ring-offset-1 ring-offset-neutral-900" : "opacity-60 hover:opacity-100"}`}
                    style={{ backgroundColor: l.color + "40", color: l.color }}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            ) : (
              <input type="text" value={labelsInput} onChange={(e) => setLabelsInput(e.target.value)} className={`w-full ${inputClass}`} placeholder="Design, Urgent, ... (comma-separated)" />
            )}
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-neutral-400">Checklist ({checklistDone}/{checklist.length})</label>
              {checklist.length > 0 && (
                <div className="w-24 h-1.5 rounded-full bg-neutral-700 overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${(checklistDone / checklist.length) * 100}%` }} />
                </div>
              )}
            </div>
            <div className="space-y-2">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={item.completed} onChange={() => toggleChecklistItem(item.id)} className="rounded border-neutral-600 bg-neutral-800 text-orange-500" />
                  <span className={item.completed ? "text-neutral-500 line-through" : "text-white"}>{item.text}</span>
                  <button type="button" onClick={() => removeChecklistItem(item.id)} className="ml-auto text-neutral-500 hover:text-red-400 text-sm">Remove</button>
                </div>
              ))}
              <div className="flex gap-2">
                <input type="text" value={newChecklistItem} onChange={(e) => setNewChecklistItem(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addChecklistItem()} className={`flex-1 ${inputClass}`} placeholder="Add item..." />
                <button type="button" onClick={addChecklistItem} className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700">Add</button>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Attachments</label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => {
                const files = e.target.files;
                if (!files?.length) return;
                for (let i = 0; i < files.length; i++) {
                  const f = files[i];
                  if (f.size > 10 * 1024 * 1024) continue;
                  const reader = new FileReader();
                  reader.onload = () => {
                    addTaskAttachment(task.id, { name: f.name, mimeType: f.type, size: f.size, url: reader.result as string });
                  };
                  reader.readAsDataURL(f);
                }
                e.target.value = "";
              }}
            />
            <div className="flex flex-wrap gap-2 mb-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-700">
                Upload file (max 10MB)
              </button>
            </div>
            {attachments.length > 0 && (
              <ul className="space-y-2 rounded-lg border border-neutral-700 bg-neutral-800/50 p-2">
                {attachments.map((att) => (
                  <li key={att.id} className="flex items-center justify-between gap-2 text-sm">
                    {att.mimeType.startsWith("image/") ? (
                      <button
                        type="button"
                        onClick={() => setPreviewFile({ url: att.url, name: att.name, type: att.mimeType })}
                        className="flex items-center gap-2 text-orange-400 hover:underline text-left"
                      >
                        <img src={att.url} alt="" className="h-10 w-10 rounded object-cover" />
                        <span className="truncate">{att.name}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPreviewFile({ url: att.url, name: att.name, type: att.mimeType })}
                        className="truncate text-orange-400 hover:underline text-left"
                      >
                        {att.name}
                      </button>
                    )}
                    <button type="button" onClick={() => deleteTaskAttachment(att.id)} className="text-neutral-500 hover:text-red-400 text-xs">Delete</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Comments</label>
            <div className="space-y-2 mb-2">
              {taskComments.map((c) => {
                const isOwn = c.authorId === currentUserId;
                const canEdit = isOwn && (Date.now() - new Date(c.createdAt).getTime() < 5 * 60 * 1000);
                return (
                  <div key={c.id} className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-2 text-sm">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-neutral-500">{getTeamMember(c.authorId)?.name ?? "—"}</span>
                      <span className="text-neutral-500 text-xs">{formatDateSafe(c.createdAt, "MMM d, HH:mm")}</span>
                      {canEdit && editingCommentId !== c.id && (
                        <span className="flex gap-1">
                          <button type="button" onClick={() => setEditingCommentId(c.id)} className="text-orange-400 hover:underline text-xs">Edit</button>
                          <button type="button" onClick={() => deleteTaskComment(c.id)} className="text-red-400 hover:underline text-xs">Delete</button>
                        </span>
                      )}
                    </div>
                    {editingCommentId === c.id ? (
                      <div className="flex gap-2">
                        <input type="text" defaultValue={c.body} id={`edit-${c.id}`} className={`flex-1 ${inputClass}`} onKeyDown={(e) => e.key === "Enter" && (updateTaskComment(c.id, (e.target as HTMLInputElement).value), setEditingCommentId(null))} />
                        <button type="button" onClick={() => { const el = document.getElementById(`edit-${c.id}`) as HTMLInputElement; if (el) { updateTaskComment(c.id, el.value); setEditingCommentId(null); } }} className="rounded bg-orange-600 px-2 py-1 text-xs text-white">Save</button>
                        <button type="button" onClick={() => setEditingCommentId(null)} className="text-neutral-400 text-xs">Cancel</button>
                      </div>
                    ) : (
                      <p className="text-neutral-200 whitespace-pre-wrap">{c.body}</p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && currentUserId && newComment.trim()) {
                    addTaskComment(task.id, currentUserId, newComment.trim());
                    setNewComment("");
                  }
                }}
                className={`flex-1 ${inputClass}`}
                placeholder="Add a comment..."
              />
              <button
                type="button"
                onClick={() => {
                  if (currentUserId && newComment.trim()) {
                    addTaskComment(task.id, currentUserId, newComment.trim());
                    setNewComment("");
                  }
                }}
                className="rounded-lg bg-orange-600 px-3 py-1.5 text-sm text-white hover:bg-orange-500"
                disabled={!newComment.trim() || !currentUserId}
              >
                Post
              </button>
            </div>
          </div>

          {/* Activity log */}
          {activities.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-neutral-400">Activity</label>
                <select value={activityFilter} onChange={(e) => setActivityFilter(e.target.value as "all" | "comments" | "changes")} className="rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-xs text-white">
                  <option value="all">All</option>
                  <option value="comments">Comments</option>
                  <option value="changes">Changes</option>
                </select>
              </div>
              <ul className="space-y-2 rounded-lg border border-neutral-800 bg-neutral-800/50 p-3">
                {[...filteredActivities].reverse().map((a) => (
                  <li key={a.id} className="flex items-start gap-2 text-sm">
                    <span className="shrink-0 text-neutral-500">{formatDateSafe(a.at, "MMM d, HH:mm")}</span>
                    <span className="text-neutral-300">{a.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer: actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handleSave} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400">Save</button>
            <button type="button" onClick={onClose} className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700">Cancel</button>
            <button type="button" onClick={onDuplicate} className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700">Duplicate</button>
            <button type="button" onClick={onArchive} className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700">Archive</button>
            {!showDeleteConfirm ? (
              <button type="button" onClick={() => setShowDeleteConfirm(true)} className="rounded-lg px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10">Delete</button>
            ) : (
              <span className="flex items-center gap-2 text-sm text-neutral-400">
                Confirm? <button type="button" onClick={onDelete} className="text-red-400 hover:underline">Yes</button> <button type="button" onClick={() => setShowDeleteConfirm(false)} className="text-neutral-300 hover:underline">No</button>
              </span>
            )}
          </div>
        </div>
      </div>
      {addTimeModalOpen && (
        <AddTaskTimeEntryModal
          task={task}
          isOpen={addTimeModalOpen}
          onClose={() => setAddTimeModalOpen(false)}
          onAdded={() => {}}
        />
      )}
      {previewFile && (
        <FilePreviewModal
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          fileUrl={previewFile.url}
          fileName={previewFile.name}
          fileType={previewFile.type}
        />
      )}
    </div>
  );
}

export const TaskDetailModal = React.memo(TaskDetailModalInner);
