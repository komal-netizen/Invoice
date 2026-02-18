"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import type { ServicePricingType } from "@/lib/types";
import { SERVICE_PRICING_TYPES } from "@/lib/types";
import type { CustomFieldType } from "@/lib/types";

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500";
const labelClass = "block text-sm font-medium text-neutral-300";

export default function ServiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const getProduct = useStore((s) => s.getProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const getServiceCategoryById = useStore((s) => s.getServiceCategoryById);
  const getServiceCategoryByName = useStore((s) => s.getServiceCategoryByName);
  const addServiceCategory = useStore((s) => s.addServiceCategory);
  const settings = useStore((s) => s.settings);
  const serviceCustomFieldDefinitions = useStore((s) => s.serviceCustomFieldDefinitions);
  const categories = settings.serviceCategories ?? [];
  const currency = settings.invoiceDefaults?.defaultCurrency ?? "USD";

  const service = getProduct(id);
  const [form, setForm] = useState({
    name: "",
    description: "",
    defaultPrice: 0,
    pricingType: "per hour" as ServicePricingType,
    categoryInput: "",
    customFieldValues: [] as { fieldId: string; value: string | number | boolean }[],
  });
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  useEffect(() => {
    if (!service) return;
    const catName = service.categoryId
      ? getServiceCategoryById(service.categoryId)?.name
      : (service as { category?: string }).category ?? "";
    setForm({
      name: service.name ?? "",
      description: service.description ?? "",
      defaultPrice: service.defaultPrice ?? 0,
      pricingType: (service.pricingType ?? "per hour") as ServicePricingType,
      categoryInput: catName ?? "",
      customFieldValues: service.customFieldValues ?? [],
    });
  }, [service]);

  if (!service) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-neutral-400">Service not found.</p>
        <Link href="/dashboard/products" className="mt-4 inline-block text-orange-400 hover:underline">
          ← Back to Services
        </Link>
      </div>
    );
  }

  const resolveCategoryId = (name: string): string | undefined => {
    const t = name.trim();
    if (!t) return undefined;
    const existing = getServiceCategoryByName(t);
    if (existing) return existing.id;
    const created = addServiceCategory({ name: t, color: "#64748b" });
    return created.id;
  };

  const handleSave = () => {
    const categoryId = resolveCategoryId(form.categoryInput);
    updateProduct(id, {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      defaultPrice: Number(form.defaultPrice) || 0,
      pricingType: form.pricingType,
      categoryId,
      customFieldValues: form.customFieldValues,
    });
  };

  const categoryMatches = form.categoryInput.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(form.categoryInput.trim().toLowerCase()))
    : categories;

  const setCustomValue = (fieldId: string, value: string | number | boolean) => {
    setForm((f) => {
      const list = f.customFieldValues.filter((v) => v.fieldId !== fieldId);
      list.push({ fieldId, value });
      return { ...f, customFieldValues: list };
    });
  };

  const getCustomValue = (fieldId: string) => {
    return form.customFieldValues.find((v) => v.fieldId === fieldId)?.value ?? "";
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link href="/dashboard/products" className="text-sm text-neutral-400 hover:text-white">
          ← Services
        </Link>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h1 className="text-2xl font-semibold text-white">Edit service</h1>
        <p className="mt-1 text-sm text-neutral-400">Update details and custom fields.</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className={labelClass}>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              onBlur={handleSave}
              className={inputClass}
              placeholder="Service name"
            />
          </div>
          <div>
            <label className={labelClass}>Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              onBlur={handleSave}
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
              onBlur={handleSave}
              className={inputClass}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelClass}>Pricing type</label>
            <select
              value={form.pricingType}
              onChange={(e) => {
                setForm((f) => ({ ...f, pricingType: e.target.value as ServicePricingType }));
                updateProduct(id, { pricingType: e.target.value as ServicePricingType });
              }}
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
              onBlur={() => {
                setTimeout(() => setCategoryDropdownOpen(false), 150);
                handleSave();
              }}
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
                        updateProduct(id, { categoryId: c.id });
                      }}
                    >
                      {c.name}
                    </button>
                  ))
                ) : form.categoryInput.trim() ? (
                  <div className="px-3 py-2 text-sm text-neutral-400">
                    Blur or save to create &quot;{form.categoryInput.trim()}&quot;
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {serviceCustomFieldDefinitions.length > 0 && (
          <div className="mt-8 border-t border-neutral-700 pt-6">
            <h2 className="text-sm font-medium text-neutral-400">Custom fields</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Manage field definitions in User profile → Service form fields.
            </p>
            <div className="mt-4 space-y-4">
              {serviceCustomFieldDefinitions.map((def) => (
                <div key={def.id}>
                  <label className={labelClass}>
                    {def.name}
                    {def.required && <span className="text-red-400"> *</span>}
                  </label>
                  {renderCustomFieldInput(
                    def.type,
                    getCustomValue(def.id),
                    (value) => setCustomValue(def.id, value),
                    def.options
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => updateProduct(id, { customFieldValues: form.customFieldValues })}
              className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
            >
              Save custom fields
            </button>
          </div>
        )}

        {serviceCustomFieldDefinitions.length === 0 && (
          <div className="mt-8 border-t border-neutral-700 pt-6">
            <p className="text-sm text-neutral-500">
              No custom fields for services yet. Add them in User profile → Service form fields.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function renderCustomFieldInput(
  type: CustomFieldType,
  value: string | number | boolean,
  onChange: (v: string | number | boolean) => void,
  options?: string[]
) {
  const inputCls = inputClass;
  if (type === "text" || type === "email" || type === "phone" || type === "url") {
    return (
      <input
        type={type === "email" ? "email" : type === "url" ? "url" : "text"}
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    );
  }
  if (type === "longtext") {
    return (
      <textarea
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
        rows={3}
      />
    );
  }
  if (type === "number" || type === "currency") {
    return (
      <input
        type="number"
        value={value === "" || value == null ? "" : Number(value)}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className={inputCls}
      />
    );
  }
  if (type === "date") {
    return (
      <input
        type="date"
        value={value ? String(value).slice(0, 10) : ""}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    );
  }
  if (type === "dropdown" && options?.length) {
    return (
      <select
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    );
  }
  if (type === "checkbox") {
    return (
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="rounded border-neutral-600 bg-neutral-800 text-orange-500"
        />
        <span className="text-sm text-neutral-300">Yes</span>
      </label>
    );
  }
  return (
    <input
      type="text"
      value={String(value)}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
    />
  );
}
