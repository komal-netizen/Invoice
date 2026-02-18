"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import type { TaskPriority, TeamMember, TeamRoleDefinition, ApprovalStatus } from "@/lib/types";
import { TASK_PRIORITIES, APPROVAL_STATUSES } from "@/lib/types";
import { defaultSettings } from "@/lib/defaults";

function getMemberRoleLabel(member: TeamMember, teamRoles: TeamRoleDefinition[]): string {
  const roleId = member.roleId ?? (member.role ? `role-${member.role}` : undefined);
  const role = roleId ? teamRoles.find((r) => r.id === roleId) : undefined;
  return role?.name ?? "";
}

interface NewBoardTaskModalProps {
  boardId: string;
  listId: string;
  isOpen: boolean;
  onClose: () => void;
  teamMembers?: TeamMember[];
  /** Pre-fill project (and client) when opening from a board linked to a project */
  defaultProjectId?: string;
}

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

export function NewBoardTaskModal({
  boardId,
  listId,
  isOpen,
  onClose,
  teamMembers = [],
  defaultProjectId = "",
}: NewBoardTaskModalProps) {
  const addBoardTask = useStore((s) => s.addBoardTask);
  const getBoardTasksByList = useStore((s) => s.getBoardTasksByList);
  const teamRoles = useStore((s) => s.settings?.teamRoles ?? defaultSettings.teamRoles ?? []);
  const projects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>("not_required");
  const [designFileUrl, setDesignFileUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAllFields, setShowAllFields] = useState(false);

  useEffect(() => {
    if (isOpen && defaultProjectId) setProjectId(defaultProjectId);
  }, [isOpen, defaultProjectId]);

  useEffect(() => {
    if (projectId) {
      const proj = projects.find((p) => p.id === projectId);
      if (proj) setClientId(proj.clientId);
    }
  }, [projectId, projects]);

  if (!isOpen) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Task title is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const existingTasks = getBoardTasksByList(listId);
    const maxOrder = existingTasks.length
      ? Math.max(...existingTasks.map((t) => t.order), -1) + 1
      : 0;
    const assigneeMember = assigneeId ? teamMembers.find((m) => m.id === assigneeId) : null;
    const payload = {
      listId,
      boardId,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      assigneeId: assigneeId || undefined,
      assignee: assigneeMember?.name,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      clientId: clientId || undefined,
      projectId: projectId || undefined,
      approvalStatus: approvalStatus !== "not_required" ? approvalStatus : undefined,
      designFileUrl: designFileUrl.trim() || undefined,
      order: maxOrder,
    };
    addBoardTask(payload);
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setAssigneeId("");
    setEstimatedHours("");
    setClientId("");
    setProjectId(defaultProjectId || "");
    setApprovalStatus("not_required");
    setDesignFileUrl("");
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">New Task</h2>
        <p className="mt-1 text-sm text-neutral-400">Add a task to this list</p>

        <div className="mt-5 space-y-4">
          {/* Essential fields - always visible */}
          <div>
            <label className="block text-sm font-medium text-neutral-300">Task title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="e.g. Design homepage mockups"
              autoFocus
            />
            {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300">Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Toggle for additional fields */}
          <button
            type="button"
            onClick={() => setShowAllFields(!showAllFields)}
            className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300"
          >
            <svg className={`h-4 w-4 transition-transform ${showAllFields ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {showAllFields ? 'Hide' : 'Show'} additional details
          </button>

          {/* Additional fields - collapsible */}
          {showAllFields && (
            <div className="space-y-4 pt-2 border-t border-neutral-700">
              <div>
                <label className="block text-sm font-medium text-neutral-300">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="Task details..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    {TASK_PRIORITIES.map((p) => (
                      <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300">Client</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">None</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.companyName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300">Assignee</label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((m) => {
                    const roleLabel = getMemberRoleLabel(m, teamRoles);
                    return (
                      <option key={m.id} value={m.id}>
                        {m.name}
                        {roleLabel ? ` (${roleLabel})` : ""}
                      </option>
                    );
                  })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300">Est. Hours</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300">Approval Status</label>
                  <select
                    value={approvalStatus}
                    onChange={(e) => setApprovalStatus(e.target.value as ApprovalStatus)}
                    className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    {APPROVAL_STATUSES.map((s) => (
                      <option key={s} value={s}>{APPROVAL_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300">Design File URL</label>
                  <input
                    type="url"
                    value={designFileUrl}
                    onChange={(e) => setDesignFileUrl(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="https://..."
                  />
                </div>
              </div>
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
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
}
