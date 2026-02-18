"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import type { Board } from "@/lib/types";

interface NewBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BOARD_BACKGROUNDS = [
  { value: "", label: "Default" },
  { value: "linear-gradient(135deg,#1e3a5f 0%,#0f172a 100%)", label: "Slate" },
  { value: "linear-gradient(135deg,#422006 0%,#1c1917 100%)", label: "Amber" },
  { value: "linear-gradient(135deg,#431407 0%,#1c1917 100%)", label: "Orange" },
  { value: "linear-gradient(135deg,#14532d 0%,#0f172a 100%)", label: "Green" },
  { value: "linear-gradient(135deg,#4c1d95 0%,#1e1b4b 100%)", label: "Violet" },
];

export function NewBoardModal({ isOpen, onClose }: NewBoardModalProps) {
  const router = useRouter();
  const addBoard = useStore((s) => s.addBoard);
  const createBoardFromTemplate = useStore((s) => s.createBoardFromTemplate);
  const boardTemplates = useStore((s) => s.boardTemplates);
  const projects = useStore((s) => s.projects);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [background, setBackground] = useState("");
  const [projectId, setProjectId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Task board name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    let board: Board;
    if (templateId && projectId) {
      // Create from template with project
      board = createBoardFromTemplate(projectId, templateId);
      // Update additional properties
      useStore.getState().updateBoard(board.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        background: background || undefined,
      });
    } else if (templateId) {
      // Create from template without project
      board = addBoard({
        name: name.trim(),
        description: description.trim() || undefined,
        background: background || undefined,
        projectId: undefined,
      });
      // Add template lists
      const template = boardTemplates.find((t) => t.id === templateId);
      if (template) {
        const addBoardList = useStore.getState().addBoardList;
        template.listNames.forEach((listName, index) => {
          addBoardList({
            boardId: board.id,
            name: listName,
            order: index,
          });
        });
      }
    } else {
      // Create empty board
      board = addBoard({
        name: name.trim(),
        description: description.trim() || undefined,
        background: background || undefined,
        projectId: projectId || undefined,
      });
    }
    setName("");
    setDescription("");
    setBackground("");
    setProjectId("");
    setTemplateId("");
    setErrors({});
    onClose();
    router.push(`/dashboard/task-boards/${board.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">New Task Board</h2>
        <p className="mt-1 text-sm text-neutral-400">Create a new task board (standalone or linked to a project)</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300">Task board name *</label>
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
            <label className="block text-sm font-medium text-neutral-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Template (optional)</label>
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
          <div>
            <label className="block text-sm font-medium text-neutral-300">Link to project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">None (standalone board)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Background</label>
            <select
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              {BOARD_BACKGROUNDS.map((bg) => (
                <option key={bg.value || "default"} value={bg.value}>{bg.label}</option>
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
            Create Task Board
          </button>
        </div>
      </div>
    </div>
  );
}
