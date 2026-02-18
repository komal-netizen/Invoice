"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import type { Board } from "@/lib/types";

interface EditBoardModalProps {
  board: Board;
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

const LABEL_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#6B7280"];

export function EditBoardModal({ board, isOpen, onClose }: EditBoardModalProps) {
  const updateBoard = useStore((s) => s.updateBoard);
  const projects = useStore((s) => s.projects);
  const getBoardLabels = useStore((s) => s.getBoardLabels);
  const addBoardLabel = useStore((s) => s.addBoardLabel);
  const updateBoardLabel = useStore((s) => s.updateBoardLabel);
  const deleteBoardLabel = useStore((s) => s.deleteBoardLabel);

  const [name, setName] = useState(board.name);
  const [description, setDescription] = useState(board.description ?? "");
  const [background, setBackground] = useState(board.background ?? "");
  const [projectId, setProjectId] = useState(board.projectId ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelName, setEditingLabelName] = useState("");
  const [editingLabelColor, setEditingLabelColor] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(board.name);
      setDescription(board.description ?? "");
      setBackground(board.background ?? "");
      setProjectId(board.projectId ?? "");
      setEditingLabelId(null);
    }
  }, [isOpen, board.id, board.name, board.description, board.background, board.projectId]);

  const boardLabels = isOpen ? getBoardLabels(board.id) : [];

  if (!isOpen) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Task board name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    updateBoard(board.id, {
      name: name.trim(),
      description: description.trim() || undefined,
      background: background || undefined,
      projectId: projectId || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">Edit Task Board</h2>
        <p className="mt-1 text-sm text-neutral-400">Update task board name, description, background, and project link</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300">Task board name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="Task board name"
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
            <label className="block text-sm font-medium text-neutral-300">Link to project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">None (standalone task board)</option>
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

          <div>
            <label className="block text-sm font-medium text-neutral-300">Task board labels</label>
            <p className="mt-0.5 text-xs text-neutral-500">Labels shared across tasks on this task board</p>
            <ul className="mt-2 space-y-1.5">
              {boardLabels.map((l) => (
                <li key={l.id} className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800/50 px-2 py-1.5 text-sm">
                  {editingLabelId === l.id ? (
                    <>
                      <input type="text" value={editingLabelName} onChange={(e) => setEditingLabelName(e.target.value)} className="flex-1 rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-white text-sm" placeholder="Label name" />
                      <div className="flex gap-1">
                        {LABEL_COLORS.map((c) => (
                          <button key={c} type="button" onClick={() => setEditingLabelColor(c)} className={`h-6 w-6 rounded-full ${editingLabelColor === c ? "ring-2 ring-white" : ""}`} style={{ backgroundColor: c }} aria-label="Color" />
                        ))}
                      </div>
                      <button type="button" onClick={() => { updateBoardLabel(l.id, { name: editingLabelName.trim(), color: editingLabelColor }); setEditingLabelId(null); }} className="text-orange-400 text-xs">Save</button>
                      <button type="button" onClick={() => setEditingLabelId(null)} className="text-neutral-400 text-xs">Cancel</button>
                    </>
                  ) : (
                    <>
                      <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: l.color }} />
                      <span className="flex-1 text-white">{l.name}</span>
                      <button type="button" onClick={() => { setEditingLabelId(l.id); setEditingLabelName(l.name); setEditingLabelColor(l.color); }} className="text-neutral-400 hover:text-white text-xs">Edit</button>
                      <button type="button" onClick={() => deleteBoardLabel(l.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <input type="text" value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} className="flex-1 rounded-lg border border-neutral-600 bg-neutral-800 px-2 py-1.5 text-white text-sm" placeholder="New label name" />
              <div className="flex gap-0.5">
                {LABEL_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setNewLabelColor(c)} className={`h-7 w-7 rounded-full shrink-0 ${newLabelColor === c ? "ring-2 ring-white" : ""}`} style={{ backgroundColor: c }} aria-label="Color" />
                ))}
              </div>
              <button type="button" onClick={() => { if (newLabelName.trim()) { addBoardLabel(board.id, { name: newLabelName.trim(), color: newLabelColor }); setNewLabelName(""); } }} className="rounded bg-orange-600 px-2 py-1.5 text-sm text-white hover:bg-orange-500">Add</button>
            </div>
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
