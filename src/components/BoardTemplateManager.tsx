"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { NewTemplateModal } from "./NewTemplateModal";
import { SaveBoardAsTemplateModal } from "./SaveBoardAsTemplateModal";

interface BoardTemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BoardTemplateManager({ isOpen, onClose }: BoardTemplateManagerProps) {
  const boardTemplates = useStore((s) => s.boardTemplates);
  const updateBoardTemplate = useStore((s) => s.updateBoardTemplate);
  const deleteBoardTemplate = useStore((s) => s.deleteBoardTemplate);

  const [newTemplateOpen, setNewTemplateOpen] = useState(false);
  const [saveFromBoardOpen, setSaveFromBoardOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  if (!isOpen) return null;

  const builtInTemplates = boardTemplates.filter((t) => !t.isCustom);
  const customTemplates = boardTemplates.filter((t) => t.isCustom);

  const handleStartEdit = (templateId: string) => {
    const template = boardTemplates.find((t) => t.id === templateId);
    if (!template) return;
    setEditingId(templateId);
    setEditName(template.name);
    setEditDescription(template.description || "");
  };

  const handleSaveEdit = (templateId: string) => {
    if (!editName.trim()) return;
    updateBoardTemplate(templateId, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
    });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  const handleDelete = (templateId: string) => {
    const template = boardTemplates.find((t) => t.id === templateId);
    if (!template) return;
    if (typeof window !== "undefined" && window.confirm(`Delete template "${template.name}"?`)) {
      deleteBoardTemplate(templateId);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-3xl rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between border-b border-neutral-800 p-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Task Board Templates</h2>
              <p className="mt-1 text-sm text-neutral-400">Manage your custom task board templates</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNewTemplateOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Template
              </button>
              <button
                type="button"
                onClick={() => setSaveFromBoardOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save from Board
              </button>
            </div>

            {/* Built-in templates */}
            <div>
              <h3 className="text-sm font-medium text-neutral-300 mb-3">Built-in Templates</h3>
              <div className="space-y-2">
                {builtInTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-white">{template.name}</h4>
                          <span className="rounded bg-blue-900/40 px-2 py-0.5 text-xs text-blue-300">Built-in</span>
                        </div>
                        {template.description && (
                          <p className="mt-1 text-sm text-neutral-400">{template.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {template.listNames.map((listName, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded bg-neutral-700 px-2 py-0.5 text-xs text-neutral-300"
                            >
                              <span className="text-neutral-500">{idx + 1}.</span>
                              {listName}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom templates */}
            <div>
              <h3 className="text-sm font-medium text-neutral-300 mb-3">
                Custom Templates ({customTemplates.length})
              </h3>
              {customTemplates.length === 0 ? (
                <p className="text-sm text-neutral-500 italic">No custom templates yet. Create one above.</p>
              ) : (
                <div className="space-y-2">
                  {customTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-4"
                    >
                      {editingId === template.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-neutral-400 mb-1">Name</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-neutral-400 mb-1">Description</label>
                            <textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              rows={2}
                              className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="rounded px-3 py-1.5 text-sm text-neutral-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(template.id)}
                              className="rounded bg-orange-500 px-3 py-1.5 text-sm text-white hover:bg-orange-400"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white">{template.name}</h4>
                            {template.description && (
                              <p className="mt-1 text-sm text-neutral-400">{template.description}</p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {template.listNames.map((listName, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 rounded bg-neutral-700 px-2 py-0.5 text-xs text-neutral-300"
                                >
                                  <span className="text-neutral-500">{idx + 1}.</span>
                                  {listName}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(template.id)}
                              className="rounded p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                              title="Edit template"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(template.id)}
                              className="rounded p-1.5 text-red-400 hover:bg-red-900/30"
                              title="Delete template"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <NewTemplateModal isOpen={newTemplateOpen} onClose={() => setNewTemplateOpen(false)} />
      <SaveBoardAsTemplateModal isOpen={saveFromBoardOpen} onClose={() => setSaveFromBoardOpen(false)} />
    </>
  );
}
