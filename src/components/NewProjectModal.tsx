"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { ProjectStatus } from "@/lib/types";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndManage?: (projectId: string) => void;
}

const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
];

export function NewProjectModal({
  isOpen,
  onClose,
  onSaveAndManage,
}: NewProjectModalProps) {
  const router = useRouter();
  const addProject = useStore((s) => s.addProject);
  const addBoard = useStore((s) => s.addBoard);
  const createBoardFromTemplate = useStore((s) => s.createBoardFromTemplate);
  const boardTemplates = useStore((s) => s.boardTemplates);
  const clients = useStore((s) => s.clients);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [totalValue, setTotalValue] = useState("");
  const [defaultBillingRate, setDefaultBillingRate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [createBoard, setCreateBoard] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Project name is required";
    if (!clientId) e.clientId = "Client is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveAndClose = () => {
    if (!validate()) return;
    const project = addProject({
      name: name.trim(),
      clientId,
      description: description.trim() || undefined,
      status,
      totalValue: totalValue ? parseFloat(totalValue) : undefined,
      defaultBillingRate: defaultBillingRate ? parseFloat(defaultBillingRate) : undefined,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
    });
    if (createBoard) {
      if (templateId) {
        createBoardFromTemplate(project.id, templateId);
      } else {
        addBoard({ name: project.name, projectId: project.id });
      }
    }
    reset();
    onClose();
  };

  const handleSaveAndManage = () => {
    if (!validate()) return;
    const project = addProject({
      name: name.trim(),
      clientId,
      description: description.trim() || undefined,
      status,
      totalValue: totalValue ? parseFloat(totalValue) : undefined,
      defaultBillingRate: defaultBillingRate ? parseFloat(defaultBillingRate) : undefined,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
    });
    if (createBoard) {
      if (templateId) {
        createBoardFromTemplate(project.id, templateId);
      } else {
        addBoard({ name: project.name, projectId: project.id });
      }
    }
    reset();
    onClose();
    if (onSaveAndManage) onSaveAndManage(project.id);
    else router.push(`/dashboard/projects/${project.id}`);
  };

  const reset = () => {
    setName("");
    setClientId("");
    setDescription("");
    setStatus("active");
    setTotalValue("");
    setDefaultBillingRate("");
    setStartDate("");
    setDueDate("");
    setCreateBoard(false);
    setTemplateId("");
    setErrors({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">New Project</h2>
        <p className="mt-1 text-sm text-neutral-400">Create a project for a client</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300">Project Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="e.g. Website Redesign"
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Client *</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
            {errors.clientId && <p className="mt-1 text-xs text-red-400">{errors.clientId}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="Brief project description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Default Billing Rate ($/hr)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={defaultBillingRate}
              onChange={(e) => setDefaultBillingRate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="Used for time tracking on this project"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300">Total Value</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
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

          {/* Board creation section */}
          <div className="border-t border-neutral-700 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createBoard}
                onChange={(e) => setCreateBoard(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 text-orange-500 focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-neutral-300">Create task board for this project</span>
            </label>

            {createBoard && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-neutral-400 mb-1">Task Board Template (optional)</label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">No template (empty task board)</option>
                  <optgroup label="Built-in Templates">
                    {boardTemplates.filter((t) => !t.isCustom).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </optgroup>
                  {boardTemplates.filter((t) => t.isCustom).length > 0 && (
                    <optgroup label="Custom Templates">
                      {boardTemplates.filter((t) => t.isCustom).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAndClose}
            className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
          >
            Save & Close
          </button>
          <button
            type="button"
            onClick={handleSaveAndManage}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
          >
            Save & Manage Tasks
          </button>
        </div>
      </div>
    </div>
  );
}
