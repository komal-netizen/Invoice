"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Toggle } from "@/components/Toggle";
import type { ServicePricingType, CustomFieldType } from "@/lib/types";
import { SERVICE_PRICING_TYPES, CUSTOM_FIELD_TYPES } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500";
const labelClass = "block text-sm font-medium text-neutral-300 mb-1";

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

export default function ServicesPage() {
  const products = useStore((s) => s.products);
  const addProduct = useStore((s) => s.addProduct);
  const deleteProduct = useStore((s) => s.deleteProduct);
  const getServiceCategoryById = useStore((s) => s.getServiceCategoryById);
  const getServiceCategoryByName = useStore((s) => s.getServiceCategoryByName);
  const addServiceCategory = useStore((s) => s.addServiceCategory);
  const settings = useStore((s) => s.settings);
  const categories = settings.serviceCategories ?? [];

  const currency = settings.invoiceDefaults?.defaultCurrency ?? "USD";
  const [modalOpen, setModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    defaultPrice: 0,
    pricingType: "per hour" as ServicePricingType,
    categoryInput: "",
  });
  const serviceCustomFieldDefinitions = useStore((s) => s.serviceCustomFieldDefinitions);
  const addServiceCustomFieldDefinition = useStore((s) => s.addServiceCustomFieldDefinition);
  const updateServiceCustomFieldDefinition = useStore((s) => s.updateServiceCustomFieldDefinition);
  const deleteServiceCustomFieldDefinition = useStore((s) => s.deleteServiceCustomFieldDefinition);

  const openNew = () => {
    setForm({
      name: "",
      description: "",
      defaultPrice: 0,
      pricingType: "per hour",
      categoryInput: "",
    });
    setCategoryDropdownOpen(false);
    setModalOpen(true);
  };

  const resolveCategoryId = (name: string): string | undefined => {
    const t = name.trim();
    if (!t) return undefined;
    const existing = getServiceCategoryByName(t);
    if (existing) return existing.id;
    const created = addServiceCategory({ name: t, color: "#64748b" });
    return created.id;
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const categoryId = resolveCategoryId(form.categoryInput);
    addProduct({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      defaultPrice: Number(form.defaultPrice) || 0,
      pricingType: form.pricingType,
      categoryId,
      customFieldValues: [],
    });
    setForm((f) => ({ ...f, categoryInput: "" }));
    setModalOpen(false);
  };

  const categoryMatches = form.categoryInput.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(form.categoryInput.trim().toLowerCase()))
    : categories;

  const handleDelete = (id: string, name: string) => {
    if (typeof window !== "undefined" && window.confirm(`Delete service "${name}"?`)) {
      deleteProduct(id);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Services</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Manage services for your invoices. Use premade ones or create your own. Edit a service to add custom fields.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className="rounded-lg border border-neutral-600 bg-neutral-800 p-2.5 text-neutral-400 hover:bg-neutral-700 hover:text-white"
            aria-label="Service settings"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <Link
            href="/dashboard/products/categories"
            className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Categories
          </Link>
          <button
            type="button"
            onClick={openNew}
            className="rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-400"
          >
            Add service
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed border-neutral-700 bg-neutral-900/50 py-16 text-center">
          <p className="text-neutral-400">No services yet. Add one or create from scratch.</p>
          <button
            type="button"
            onClick={openNew}
            className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
          >
            Add service
          </button>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-700 bg-neutral-800/50">
                <th className="p-3 font-medium text-neutral-300">Name</th>
                <th className="p-3 font-medium text-neutral-300">Type</th>
                <th className="p-3 font-medium text-neutral-300">Category</th>
                <th className="p-3 font-medium text-neutral-300">Default price</th>
                <th className="p-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-neutral-800 hover:bg-neutral-800/50">
                  <td className="p-3 font-medium text-white">{p.name}</td>
                  <td className="p-3 text-neutral-400">{p.pricingType ?? "per hour"}</td>
                  <td className="p-3 text-neutral-400">{p.categoryId ? getServiceCategoryById(p.categoryId)?.name : (p as { category?: string }).category ?? "—"}</td>
                  <td className="p-3 text-neutral-300">
                    {(p.defaultPrice ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/products/${p.id}`}
                        className="rounded p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-orange-400"
                        title="Edit"
                        aria-label={`Edit ${p.name}`}
                      >
                        <EditIcon className="h-5 w-5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.name)}
                        className="rounded p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-red-400"
                        title="Delete"
                        aria-label={`Delete ${p.name}`}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-neutral-700 bg-neutral-900 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white">Add service</h2>
            <p className="mt-1 text-sm text-neutral-400">Create a new service from scratch.</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputClass}
                  placeholder="e.g. Consulting, Design"
                />
              </div>
              <div>
                <label className={labelClass}>Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className={inputClass}
                  rows={2}
                  placeholder="Short description"
                />
              </div>
              <div>
                <label className={labelClass}>Default price ({currency})</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.defaultPrice || ""}
                  onChange={(e) => setForm((f) => ({ ...f, defaultPrice: Number(e.target.value) || 0 }))}
                  className={inputClass}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelClass}>Pricing type</label>
                <select
                  value={form.pricingType}
                  onChange={(e) => setForm((f) => ({ ...f, pricingType: e.target.value as ServicePricingType }))}
                  className={inputClass}
                >
                  {SERVICE_PRICING_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <label className={labelClass}>Category</label>
                <input
                  type="text"
                  value={form.categoryInput}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, categoryInput: e.target.value }));
                    setCategoryDropdownOpen(true);
                  }}
                  onFocus={() => setCategoryDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setCategoryDropdownOpen(false), 150)}
                  className={inputClass}
                  placeholder="Type to pick existing or create new"
                />
                {categoryDropdownOpen && (
                  <div className="absolute left-0 top-full z-10 mt-0.5 max-h-40 w-full overflow-auto rounded-lg border border-neutral-600 bg-neutral-900 py-1 shadow-xl">
                    {categoryMatches.length > 0 ? (
                      categoryMatches.slice(0, 10).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm text-white hover:bg-neutral-700"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setForm((f) => ({ ...f, categoryInput: c.name }));
                            setCategoryDropdownOpen(false);
                          }}
                        >
                          {c.name}
                        </button>
                      ))
                    ) : form.categoryInput.trim() ? (
                      <div className="px-3 py-2 text-sm text-neutral-400">
                        Press Add to create &quot;{form.categoryInput.trim()}&quot;
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {settingsModalOpen && (
        <ServiceSettingsModal
          onClose={() => setSettingsModalOpen(false)}
          serviceCustomFieldDefinitions={serviceCustomFieldDefinitions}
          addServiceCustomFieldDefinition={addServiceCustomFieldDefinition}
          updateServiceCustomFieldDefinition={updateServiceCustomFieldDefinition}
          deleteServiceCustomFieldDefinition={deleteServiceCustomFieldDefinition}
        />
      )}
    </div>
  );
}

function ServiceSettingsModal({
  onClose,
  serviceCustomFieldDefinitions,
  addServiceCustomFieldDefinition,
  updateServiceCustomFieldDefinition,
  deleteServiceCustomFieldDefinition,
}: {
  onClose: () => void;
  serviceCustomFieldDefinitions: any[];
  addServiceCustomFieldDefinition: (def: any) => void;
  updateServiceCustomFieldDefinition: (id: string, data: any) => void;
  deleteServiceCustomFieldDefinition: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<CustomFieldType>("text");
  const [newRequired, setNewRequired] = useState(false);
  const [newOptions, setNewOptions] = useState("");

  const inputClass =
    "mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500";
  const labelClass = "block text-sm font-medium text-neutral-300";

  const handleAdd = () => {
    if (!newName.trim()) return;
    addServiceCustomFieldDefinition({
      name: newName.trim(),
      type: newType,
      required: newRequired,
      options: newType === "dropdown" ? newOptions.split(",").map((o) => o.trim()).filter(Boolean) : undefined,
    });
    setNewName("");
    setNewType("text");
    setNewRequired(false);
    setNewOptions("");
    setAdding(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-neutral-700 bg-neutral-900 shadow-xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-700 bg-neutral-900 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Service Settings</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-6">
            <section>
              <h3 className="text-lg font-medium text-white">Service custom fields</h3>
              <p className="mt-1 text-sm text-neutral-400">Custom fields shown when editing a service. Add, edit, or remove fields.</p>
              <ul className="mt-4 space-y-2">
                {serviceCustomFieldDefinitions.map((def) => (
                  <li key={def.id} className="flex items-center justify-between rounded-lg border border-neutral-700 bg-neutral-800/50 p-3">
                    <div>
                      <span className="font-medium text-white">{def.name}</span>
                      <span className="ml-2 text-xs text-neutral-400">({def.type}{def.required ? ", required" : ""})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteServiceCustomFieldDefinition(def.id)}
                      className="text-sm text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
              {adding ? (
                <div className="mt-4 rounded-lg border border-neutral-700 bg-neutral-800/50 p-4 space-y-3">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className={inputClass}
                    placeholder="Field name"
                  />
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as CustomFieldType)}
                    className={inputClass}
                  >
                    {CUSTOM_FIELD_TYPES.map((t) => (
                      <option key={t} value={t}>{t === "longtext" ? "Long text" : t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                  {newType === "dropdown" && (
                    <input
                      type="text"
                      value={newOptions}
                      onChange={(e) => setNewOptions(e.target.value)}
                      className={inputClass}
                      placeholder="Options (comma-separated)"
                    />
                  )}
                  <label className="flex items-center gap-2">
                    <Toggle checked={newRequired} onChange={setNewRequired} aria-label="Required" />
                    <span className="text-sm text-neutral-300">Required</span>
                  </label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setAdding(false)} className="rounded-lg border border-neutral-600 px-4 py-2 text-sm text-white hover:bg-neutral-700">Cancel</button>
                    <button type="button" onClick={handleAdd} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400">Add field</button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="mt-4 rounded-lg border border-neutral-600 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
                >
                  + Add custom field
                </button>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
