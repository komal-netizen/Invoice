"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";

interface SaveBoardAsTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBoardId?: string;
}

export function SaveBoardAsTemplateModal({ isOpen, onClose, defaultBoardId = "" }: SaveBoardAsTemplateModalProps) {
  const addBoardTemplate = useStore((s) => s.addBoardTemplate);
  const boards = useStore((s) => s.boards);
  const getBoardLists = useStore((s) => s.getBoardLists);
  const getBoard = useStore((s) => s.getBoard);

  const [boardId, setBoardId] = useState(defaultBoardId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && defaultBoardId) {
      setBoardId(defaultBoardId);
      const board = getBoard(defaultBoardId);
      if (board) setName(board.name + " Template");
    }
  }, [isOpen, defaultBoardId, getBoard]);

  useEffect(() => {
    if (boardId) {
      const board = getBoard(boardId);
      if (board && !name) {
        setName(board.name + " Template");
      }
    }
  }, [boardId, getBoard, name]);

  if (!isOpen) return null;

  const selectedBoard = boardId ? getBoard(boardId) : null;
  const listNames = boardId ? getBoardLists(boardId).map((l) => l.name) : [];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!boardId) e.boardId = "Please select a task board";
    if (!name.trim()) e.name = "Template name is required";
    if (listNames.length === 0) e.boardId = "Selected task board has no lists";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    addBoardTemplate({
      name: name.trim(),
      description: description.trim() || undefined,
      isCustom: true,
      listNames,
    });
    reset();
    onClose();
  };

  const reset = () => {
    setBoardId(defaultBoardId);
    setName("");
    setDescription("");
    setErrors({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">Save Task Board as Template</h2>
        <p className="mt-1 text-sm text-neutral-400">Create a template from an existing task board's structure</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300">Select task board *</label>
            <select
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">Choose a task board...</option>
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </select>
            {errors.boardId && <p className="mt-1 text-xs text-red-400">{errors.boardId}</p>}
          </div>

          {selectedBoard && listNames.length > 0 && (
            <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-3">
              <p className="text-xs font-medium text-neutral-400 mb-2">Lists that will be captured:</p>
              <div className="flex flex-wrap gap-2">
                {listNames.map((listName, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 rounded-full bg-neutral-700 px-2.5 py-1 text-xs text-neutral-300"
                  >
                    <span className="text-neutral-500">{index + 1}.</span>
                    {listName}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-300">Template name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="e.g. Web Design Template"
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
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => { reset(); onClose(); }}
            className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
          >
            Save as Template
          </button>
        </div>
      </div>
    </div>
  );
}
