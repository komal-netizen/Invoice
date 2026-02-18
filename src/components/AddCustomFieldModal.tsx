"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Toggle } from "@/components/Toggle";
import { CUSTOM_FIELD_TYPES, type CustomFieldType } from "@/lib/types";

interface AddCustomFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddCustomFieldModal({ isOpen, onClose }: AddCustomFieldModalProps) {
  const addDefinition = useStore((s) => s.addCustomFieldDefinition);
  const [name, setName] = useState("");
  const [type, setType] = useState<CustomFieldType>("text");
  const [required, setRequired] = useState(false);
  const [defaultValue, setDefaultValue] = useState("");
  const [options, setOptions] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    addDefinition({
      name: name.trim(),
      type,
      required,
      defaultValue: defaultValue.trim() || undefined,
      options: type === "dropdown" ? options.split(",").map((o) => o.trim()).filter(Boolean) : undefined,
    });
    setName("");
    setType("text");
    setRequired(false);
    setDefaultValue("");
    setOptions("");
    onClose();
  };

  const needsOptions = type === "dropdown";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-ink">Add Custom Field</h2>
        <p className="mt-1 text-sm text-ink-muted">This field will appear on all client profiles.</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">Field Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-black/12 bg-white px-3 py-2 text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="e.g. Project Manager, Industry"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Field Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CustomFieldType)}
              className="mt-1 w-full rounded-lg border border-black/12 bg-white px-3 py-2 text-ink focus:border-accent focus:outline-none"
            >
              {CUSTOM_FIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "longtext" ? "Long Text" : t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
          {needsOptions && (
            <div>
              <label className="block text-sm font-medium text-ink">Options (comma-separated)</label>
              <input
                type="text"
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                className="mt-1 w-full rounded-lg border border-black/12 bg-white px-3 py-2 text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="Option 1, Option 2, Option 3"
              />
            </div>
          )}
          <div>
            <label className="flex items-center gap-2">
              <Toggle checked={required} onChange={setRequired} aria-label="Required" className="focus:ring-offset-white" />
              <span className="text-sm text-ink">Required</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Default Value (optional)</label>
            <input
              type="text"
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
              className="mt-1 w-full rounded-lg border border-black/12 bg-white px-3 py-2 text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-black/12 bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            Add Field
          </button>
        </div>
      </div>
    </div>
  );
}
