"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";

const inputClass =
  "rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500";
const labelClass = "block text-sm font-medium text-neutral-300 mb-1";

const DEFAULT_COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#8b5cf6", "#0ea5e9", "#64748b",
  "#ef4444", "#14b8a6", "#f97316",
];

export default function ServiceCategoriesPage() {
  const settings = useStore((s) => s.settings ?? null);
  const updateServiceCategory = useStore((s) => s.updateServiceCategory);
  const deleteServiceCategory = useStore((s) => s.deleteServiceCategory);
  const categories = settings?.serviceCategories ?? [];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const saveEdit = (id: string) => {
    if (editingId !== id) return;
    const name = editName.trim();
    if (name) updateServiceCategory(id, { name });
    setEditingId(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (typeof window !== "undefined" && window.confirm(`Delete category "${name}"? Services using it will have no category.`)) {
      deleteServiceCategory(id);
    }
  };

  if (categories.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/dashboard/products" className="text-sm text-neutral-400 hover:text-white">
            ← Services
          </Link>
        </div>
        <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-900/50 py-16 text-center">
          <p className="text-neutral-400">No categories yet.</p>
          <p className="mt-1 text-sm text-neutral-500">
            Add a category when creating or editing a service (type a new category name). It will appear here so you can set a color or rename it.
          </p>
          <Link
            href="/dashboard/products"
            className="mt-4 inline-block rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
          >
            Go to Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/dashboard/products" className="text-sm text-neutral-400 hover:text-white">
          ← Services
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-white">Categories</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Manage service categories. Set a color and name. Deleting removes it from services that use it.
      </p>
      <ul className="mt-6 space-y-3">
        {categories.map((cat) => (
          <li
            key={cat.id}
            className="flex flex-wrap items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4"
          >
            <div
              className="h-8 w-8 shrink-0 rounded-full border border-neutral-600"
              style={{ backgroundColor: cat.color }}
              title={cat.color}
            />
            <div className="min-w-0 flex-1">
              {editingId === cat.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(cat.id)}
                    className={inputClass}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => saveEdit(cat.id)}
                    className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-400"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-lg border border-neutral-600 px-3 py-1.5 text-sm text-neutral-400 hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <span className="font-medium text-white">{cat.name}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">Color</span>
              <select
                value={cat.color}
                onChange={(e) => updateServiceCategory(cat.id, { color: e.target.value })}
                className="rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-sm text-white"
                style={{ width: "6rem" }}
              >
                {DEFAULT_COLORS.map((hex) => (
                  <option key={hex} value={hex}>{hex}</option>
                ))}
              </select>
            </div>
            {editingId !== cat.id && (
              <>
                <button
                  type="button"
                  onClick={() => startEdit(cat.id, cat.name)}
                  className="rounded p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-orange-400"
                  title="Rename"
                  aria-label={`Rename ${cat.name}`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="rounded p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-red-400"
                  title="Delete"
                  aria-label={`Delete ${cat.name}`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
