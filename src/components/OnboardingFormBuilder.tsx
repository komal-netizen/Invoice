"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import type { OnboardingForm, FormField, FormFieldType } from "@/lib/types";
import { FORM_FIELD_TYPES } from "@/lib/types";
import { v4 as uuid } from "uuid";

interface OnboardingFormBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  editingForm?: OnboardingForm;
}

const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  text: "Short Text",
  textarea: "Long Text",
  "multiple-choice": "Multiple Choice",
  checkboxes: "Checkboxes",
  dropdown: "Dropdown",
  email: "Email",
  phone: "Phone",
  date: "Date",
  "file-upload": "File Upload",
};

const FIELD_TYPE_ICONS: Record<FormFieldType, string> = {
  text: "Aa",
  textarea: "¶",
  "multiple-choice": "◉",
  checkboxes: "☑",
  dropdown: "▼",
  email: "@",
  phone: "☎",
  date: "📅",
  "file-upload": "📎",
};

export function OnboardingFormBuilder({
  isOpen,
  onClose,
  editingForm,
}: OnboardingFormBuilderProps) {
  const addOnboardingForm = useStore((s) => s.addOnboardingForm);
  const updateOnboardingForm = useStore((s) => s.updateOnboardingForm);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when editing
  useEffect(() => {
    if (isOpen && editingForm) {
      setName(editingForm.name);
      setDescription(editingForm.description || "");
      setFields([...editingForm.fields].sort((a, b) => a.order - b.order));
    } else if (isOpen) {
      reset();
    }
  }, [isOpen, editingForm]);

  if (!isOpen) return null;

  const reset = () => {
    setName("");
    setDescription("");
    setFields([]);
    setEditingFieldId(null);
    setErrors({});
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Form name is required";
    if (fields.length === 0) e.fields = "Add at least one field";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const formData = {
      name: name.trim(),
      description: description.trim() || undefined,
      fields: fields.map((f, idx) => ({ ...f, order: idx })),
      isTemplate: false,
    };

    if (editingForm) {
      updateOnboardingForm(editingForm.id, formData);
    } else {
      addOnboardingForm(formData);
    }

    reset();
    onClose();
  };

  const addField = (type: FormFieldType) => {
    const newField: FormField = {
      id: uuid(),
      type,
      label: `New ${FIELD_TYPE_LABELS[type]} Field`,
      required: false,
      order: fields.length,
      options: type === "multiple-choice" || type === "checkboxes" || type === "dropdown" 
        ? ["Option 1", "Option 2", "Option 3"]
        : undefined,
    };
    setFields([...fields, newField]);
    setEditingFieldId(newField.id);
  };

  const updateField = (id: string, data: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...data } : f)));
  };

  const deleteField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
    if (editingFieldId === id) setEditingFieldId(null);
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    const newFields = [...fields];
    const [moved] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, moved);
    setFields(newFields);
  };

  const handleFieldDragStart = (fieldId: string) => {
    setDraggedFieldId(fieldId);
  };

  const handleFieldDragOver = (e: React.DragEvent, targetFieldId: string) => {
    e.preventDefault();
    if (!draggedFieldId || draggedFieldId === targetFieldId) return;

    const fromIndex = fields.findIndex((f) => f.id === draggedFieldId);
    const toIndex = fields.findIndex((f) => f.id === targetFieldId);
    if (fromIndex === -1 || toIndex === -1) return;

    moveField(fromIndex, toIndex);
  };

  const handleFieldDragEnd = () => {
    setDraggedFieldId(null);
  };

  const editingField = editingFieldId ? fields.find((f) => f.id === editingFieldId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-5xl rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {editingForm ? "Edit Onboarding Form" : "Create Onboarding Form"}
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              Build a custom form to collect client information
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Left: Form Settings & Field List */}
          <div className="lg:col-span-2 border-r border-neutral-800 p-6 space-y-6">
            {/* Form Name & Description */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Form Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="e.g., Web Design Onboarding"
                />
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="Brief description of this form"
                />
              </div>
            </div>

            {/* Field Palette */}
            <div>
              <p className="text-sm font-medium text-neutral-300 mb-2">Add Field</p>
              <div className="flex flex-wrap gap-2">
                {FORM_FIELD_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addField(type)}
                    className="inline-flex items-center gap-2 rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-300 hover:border-orange-500 hover:text-orange-400"
                  >
                    <span className="font-medium">{FIELD_TYPE_ICONS[type]}</span>
                    {FIELD_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
              {errors.fields && <p className="mt-1 text-xs text-red-400">{errors.fields}</p>}
            </div>

            {/* Field List */}
            <div>
              <p className="text-sm font-medium text-neutral-300 mb-2">
                Form Fields ({fields.length})
              </p>
              {fields.length === 0 ? (
                <div className="rounded-lg border border-dashed border-neutral-700 bg-neutral-800/50 py-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-neutral-400">No fields yet</p>
                  <p className="mt-1 text-xs text-neutral-500">Click a field type above to add it</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      draggable
                      onDragStart={() => handleFieldDragStart(field.id)}
                      onDragOver={(e) => handleFieldDragOver(e, field.id)}
                      onDragEnd={handleFieldDragEnd}
                      className={`group flex items-center gap-3 rounded-lg border border-neutral-700 bg-neutral-800 p-3 cursor-move transition-all ${
                        draggedFieldId === field.id ? "opacity-50 scale-95" : ""
                      } ${editingFieldId === field.id ? "ring-2 ring-orange-500" : ""}`}
                    >
                      {/* Drag Handle */}
                      <div className="flex flex-col gap-0.5 text-neutral-500">
                        <svg className="h-2 w-3" fill="currentColor" viewBox="0 0 6 10">
                          <circle cx="1" cy="1" r="1" />
                          <circle cx="1" cy="5" r="1" />
                          <circle cx="1" cy="9" r="1" />
                          <circle cx="5" cy="1" r="1" />
                          <circle cx="5" cy="5" r="1" />
                          <circle cx="5" cy="9" r="1" />
                        </svg>
                      </div>

                      {/* Field Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-neutral-500">
                            {FIELD_TYPE_LABELS[field.type]}
                          </span>
                          {field.required && (
                            <span className="rounded bg-red-900/40 px-1.5 py-0.5 text-xs text-red-300">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-white truncate">{field.label}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingFieldId(field.id)}
                          className="rounded p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                          aria-label="Edit field"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Delete this field?")) {
                              deleteField(field.id);
                            }
                          }}
                          className="rounded p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-red-400"
                          aria-label="Delete field"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Field Editor */}
          <div className="p-6 bg-neutral-900/50">
            {editingField ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Edit Field</h3>
                  <button
                    type="button"
                    onClick={() => setEditingFieldId(null)}
                    className="text-xs text-neutral-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Field Label *
                  </label>
                  <input
                    type="text"
                    value={editingField.label}
                    onChange={(e) => updateField(editingField.id, { label: e.target.value })}
                    className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Placeholder (optional)
                  </label>
                  <input
                    type="text"
                    value={editingField.placeholder || ""}
                    onChange={(e) => updateField(editingField.id, { placeholder: e.target.value })}
                    className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Help Text (optional)
                  </label>
                  <textarea
                    value={editingField.helpText || ""}
                    onChange={(e) => updateField(editingField.id, { helpText: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {(editingField.type === "multiple-choice" || 
                  editingField.type === "checkboxes" || 
                  editingField.type === "dropdown") && (
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Options (one per line) *
                    </label>
                    <textarea
                      value={(editingField.options || []).join("\n")}
                      onChange={(e) => updateField(editingField.id, { 
                        options: e.target.value.split("\n").filter((o) => o.trim()) 
                      })}
                      rows={5}
                      className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="field-required"
                    checked={editingField.required}
                    onChange={(e) => updateField(editingField.id, { required: e.target.checked })}
                    className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 text-orange-500 focus:ring-orange-500"
                  />
                  <label htmlFor="field-required" className="text-sm text-neutral-300">
                    Required field
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <svg className="mx-auto h-12 w-12 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <p className="mt-2 text-sm text-neutral-400">Select a field to edit</p>
                  <p className="text-xs text-neutral-500">Click on any field from the list</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-800 px-6 py-4">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-orange-500 px-6 py-2 text-sm font-medium text-white hover:bg-orange-400"
          >
            {editingForm ? "Update Form" : "Create Form"}
          </button>
        </div>
      </div>
    </div>
  );
}
