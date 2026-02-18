"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

interface NewTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewTemplateModal({ isOpen, onClose }: NewTemplateModalProps) {
  const addBoardTemplate = useStore((s) => s.addBoardTemplate);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [listNames, setListNames] = useState<string[]>(["To Do", "In Progress", "Done"]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Template name is required";
    if (listNames.length === 0) e.listNames = "At least one list is required";
    if (listNames.some((n) => !n.trim())) e.listNames = "All list names must be filled";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    addBoardTemplate({
      name: name.trim(),
      description: description.trim() || undefined,
      isCustom: true,
      listNames: listNames.map((n) => n.trim()),
    });
    reset();
    onClose();
  };

  const reset = () => {
    setName("");
    setDescription("");
    setListNames(["To Do", "In Progress", "Done"]);
    setErrors({});
  };

  const addListName = () => {
    setListNames([...listNames, ""]);
  };

  const updateListName = (index: number, value: string) => {
    const updated = [...listNames];
    updated[index] = value;
    setListNames(updated);
  };

  const removeListName = (index: number) => {
    if (listNames.length <= 1) return;
    setListNames(listNames.filter((_, i) => i !== index));
  };

  const moveListUp = (index: number) => {
    if (index === 0) return;
    const updated = [...listNames];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setListNames(updated);
  };

  const moveListDown = (index: number) => {
    if (index === listNames.length - 1) return;
    const updated = [...listNames];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setListNames(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">New Task Board Template</h2>
        <p className="mt-1 text-sm text-neutral-400">Create a custom template from scratch</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300">Template name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="e.g. Marketing Campaign"
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
            <label className="block text-sm font-medium text-neutral-300 mb-2">List names *</label>
            <div className="space-y-2">
              {listNames.map((listName, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm text-neutral-500 w-6">{index + 1}.</span>
                  <input
                    type="text"
                    value={listName}
                    onChange={(e) => updateListName(index, e.target.value)}
                    className="flex-1 rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="List name"
                  />
                  <button
                    type="button"
                    onClick={() => moveListUp(index)}
                    disabled={index === 0}
                    className="rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-white disabled:opacity-30"
                    title="Move up"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveListDown(index)}
                    disabled={index === listNames.length - 1}
                    className="rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-white disabled:opacity-30"
                    title="Move down"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeListName(index)}
                    disabled={listNames.length <= 1}
                    className="rounded p-1 text-red-400 hover:bg-red-900/30 disabled:opacity-30"
                    title="Remove"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            {errors.listNames && <p className="mt-1 text-xs text-red-400">{errors.listNames}</p>}
            <button
              type="button"
              onClick={addListName}
              className="mt-2 flex items-center gap-1 rounded-lg border border-dashed border-neutral-600 px-3 py-1.5 text-sm text-neutral-400 hover:border-neutral-500 hover:text-neutral-300"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add list
            </button>
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
            Create Template
          </button>
        </div>
      </div>
    </div>
  );
}
