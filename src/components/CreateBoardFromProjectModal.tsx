"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";

interface CreateBoardFromProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-select this project when opening (e.g. from project detail page) */
  defaultProjectId?: string;
}

export function CreateBoardFromProjectModal({ isOpen, onClose, defaultProjectId = "" }: CreateBoardFromProjectModalProps) {
  const router = useRouter();
  const createBoardFromTemplate = useStore((s) => s.createBoardFromTemplate);
  const addBoard = useStore((s) => s.addBoard);
  const boardTemplates = useStore((s) => s.boardTemplates);
  const projects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);

  const [projectId, setProjectId] = useState(defaultProjectId);
  const [templateId, setTemplateId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && defaultProjectId) {
      setProjectId(defaultProjectId);
    }
    // Set default template to first built-in (dev)
    if (isOpen && !templateId && boardTemplates.length > 0) {
      const devTemplate = boardTemplates.find((t) => t.id === "tpl_dev");
      if (devTemplate) setTemplateId(devTemplate.id);
    }
  }, [isOpen, defaultProjectId, templateId, boardTemplates]);

  if (!isOpen) return null;

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (!projectId) e.projectId = "Select a project";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    
    let board;
    if (templateId) {
      board = createBoardFromTemplate(projectId, templateId);
    } else {
      board = addBoard({ name: project.name, projectId });
    }
    
    setProjectId(defaultProjectId);
    setTemplateId("");
    setErrors({});
    onClose();
    router.push(`/dashboard/task-boards/${board.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">Create Task Board from Project</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Auto-generate a task board with the project name and list template.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300">Project *</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">Select project</option>
              {projects.map((p) => {
                const client = clients.find((c) => c.id === p.clientId);
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} {client ? `(${client.companyName})` : ""}
                  </option>
                );
              })}
            </select>
            {errors.projectId && <p className="mt-1 text-xs text-red-400">{errors.projectId}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Task Board Template</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">No template (empty task board)</option>
              <optgroup label="Built-in Templates">
                {boardTemplates.filter((t) => !t.isCustom).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.listNames.join(" → ")})
                  </option>
                ))}
              </optgroup>
              {boardTemplates.filter((t) => t.isCustom).length > 0 && (
                <optgroup label="Custom Templates">
                  {boardTemplates.filter((t) => t.isCustom).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.listNames.join(" → ")})
                    </option>
                  ))}
                </optgroup>
              )}
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
            Create Task Board
          </button>
        </div>
      </div>
    </div>
  );
}
