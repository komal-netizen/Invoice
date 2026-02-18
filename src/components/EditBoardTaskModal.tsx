"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { BoardTask, BoardList, TaskPriority, TeamMember, TeamRoleDefinition } from "@/lib/types";
import { TASK_PRIORITIES } from "@/lib/types";
import { defaultSettings } from "@/lib/defaults";

function getMemberRoleLabel(member: TeamMember, teamRoles: TeamRoleDefinition[]): string {
  const roleId = member.roleId ?? (member.role ? `role-${member.role}` : undefined);
  const role = roleId ? teamRoles.find((r) => r.id === roleId) : undefined;
  return role?.name ?? "";
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

interface EditBoardTaskModalProps {
  task: BoardTask;
  lists: BoardList[];
  teamMembers?: TeamMember[];
  onClose: () => void;
  onSave: (data: Partial<BoardTask>) => void;
}

export function EditBoardTaskModal({
  task,
  lists,
  teamMembers = [],
  onClose,
  onSave,
}: EditBoardTaskModalProps) {
  const teamRoles = useStore((s) => s.settings?.teamRoles ?? defaultSettings.teamRoles ?? []);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [assigneeId, setAssigneeId] = useState(task.assigneeId ?? "");
  const [estimatedHours, setEstimatedHours] = useState(
    task.estimatedHours != null ? String(task.estimatedHours) : ""
  );
  const [listId, setListId] = useState(task.listId);

  const handleSave = () => {
    const assigneeMember = assigneeId ? teamMembers.find((m) => m.id === assigneeId) : null;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      assigneeId: assigneeId || undefined,
      assignee: assigneeMember?.name,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      listId: listId !== task.listId ? listId : undefined,
    });
  };

  const otherLists = lists.filter((l) => l.id !== task.listId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">Edit Task</h2>
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300">List</label>
              <select
                value={listId}
                onChange={(e) => setListId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300">Est. Hours</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
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
