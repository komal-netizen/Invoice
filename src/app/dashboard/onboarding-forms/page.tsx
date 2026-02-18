"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { OnboardingFormBuilder } from "@/components/OnboardingFormBuilder";
import { FORM_TEMPLATES } from "@/lib/form-templates";
import { syncFormsToServer } from "@/lib/sync-forms";
import type { OnboardingForm } from "@/lib/types";
import { format } from "date-fns";

export default function OnboardingFormsPage() {
  const onboardingForms = useStore((s) => s.onboardingForms);
  const formSubmissions = useStore((s) => s.formSubmissions);
  const addOnboardingForm = useStore((s) => s.addOnboardingForm);
  const deleteOnboardingForm = useStore((s) => s.deleteOnboardingForm);
  const duplicateOnboardingForm = useStore((s) => s.duplicateOnboardingForm);
  const generateFormToken = useStore((s) => s.generateFormToken);
  const regenerateFormToken = useStore((s) => s.regenerateFormToken);
  const toggleFormAccess = useStore((s) => s.toggleFormAccess);

  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<OnboardingForm | undefined>(undefined);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Sync forms to server whenever they change
  useEffect(() => {
    if (onboardingForms.length > 0) {
      syncFormsToServer(onboardingForms).catch((err) => {
        console.error("Failed to sync forms:", err);
      });
    }
  }, [onboardingForms]);

  const formStats = useMemo(() => {
    return onboardingForms.map((form) => ({
      form,
      submissionCount: formSubmissions.filter((s) => s.formId === form.id).length,
      pendingCount: formSubmissions.filter((s) => s.formId === form.id && s.status === "pending").length,
    }));
  }, [onboardingForms, formSubmissions]);

  const handleCreateFromTemplate = (template: typeof FORM_TEMPLATES[0]) => {
    addOnboardingForm(template);
    setTemplatesOpen(false);
  };

  const handleEdit = (form: OnboardingForm) => {
    setEditingForm(form);
    setBuilderOpen(true);
  };

  const handleGenerateLink = (formId: string) => {
    const token = generateFormToken(formId);
    const url = `${window.location.origin}/onboarding/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(formId);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRegenerateLink = (formId: string) => {
    if (!window.confirm("This will invalidate the old link. Continue?")) return;
    const token = regenerateFormToken(formId);
    const url = `${window.location.origin}/onboarding/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(formId);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleCopyLink = (form: OnboardingForm) => {
    if (!form.token) return;
    const url = `${window.location.origin}/onboarding/${form.token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(form.id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Onboarding Forms</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Create and manage client onboarding forms
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTemplatesOpen(!templatesOpen)}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Use Template
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingForm(undefined);
              setBuilderOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Custom Form
          </button>
        </div>
      </div>

      {/* Template Selector */}
      {templatesOpen && (
        <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Choose a Template</h2>
            <button
              type="button"
              onClick={() => setTemplatesOpen(false)}
              className="text-sm text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FORM_TEMPLATES.map((template, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleCreateFromTemplate(template)}
                className="rounded-lg border border-neutral-700 bg-neutral-800 p-4 text-left hover:border-orange-500 hover:bg-neutral-800/50"
              >
                <h3 className="font-medium text-white">{template.name}</h3>
                <p className="mt-1 text-sm text-neutral-400">{template.description}</p>
                <p className="mt-2 text-xs text-neutral-500">{template.fields.length} fields</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Forms List */}
      <div className="mt-8">
        {formStats.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-900/50 py-16 text-center">
            <svg className="mx-auto h-16 w-16 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-white">No onboarding forms yet</h3>
            <p className="mt-2 text-sm text-neutral-400">
              Create your first form to start collecting client information
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setTemplatesOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
              >
                Use Template
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingForm(undefined);
                  setBuilderOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-400"
              >
                Create Custom Form
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {formStats.map(({ form, submissionCount, pendingCount }) => (
              <div
                key={form.id}
                className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 hover:border-neutral-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{form.name}</h3>
                    {form.isTemplate && (
                      <span className="mt-1 inline-block rounded bg-blue-900/40 px-2 py-0.5 text-xs text-blue-300">
                        From Template
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                      onClick={(e) => {
                        e.currentTarget.nextElementSibling?.classList.toggle("hidden");
                      }}
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="5" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="12" cy="19" r="1.5" />
                      </svg>
                    </button>
                    <div className="absolute right-0 top-full z-50 mt-1 hidden min-w-[160px] rounded-lg border border-neutral-700 bg-neutral-800 py-1 shadow-xl">
                      <button
                        type="button"
                        onClick={() => handleEdit(form)}
                        className="w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          duplicateOnboardingForm(form.id);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-700"
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Delete this form?")) {
                            deleteOnboardingForm(form.id);
                          }
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-neutral-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {form.description && (
                  <p className="mt-2 text-sm text-neutral-400 line-clamp-2">{form.description}</p>
                )}

                <div className="mt-4 flex items-center gap-4 text-sm text-neutral-500">
                  <span>{form.fields.length} fields</span>
                  <span>•</span>
                  <span>{submissionCount} submissions</span>
                  {pendingCount > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-amber-400">{pendingCount} pending</span>
                    </>
                  )}
                </div>

                {/* Link Management */}
                <div className="mt-4 space-y-2 border-t border-neutral-800 pt-4">
                  {form.token ? (
                    <>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={`${window.location.origin}/onboarding/${form.token}`}
                          readOnly
                          className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopyLink(form)}
                          className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700"
                          title="Copy link"
                        >
                          {copiedToken === form.id ? "✓" : "Copy"}
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`enabled-${form.id}`}
                            checked={form.tokenEnabled ?? false}
                            onChange={(e) => toggleFormAccess(form.id, e.target.checked)}
                            className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 text-orange-500"
                          />
                          <label htmlFor={`enabled-${form.id}`} className="text-xs text-neutral-400">
                            {form.tokenEnabled ? "Active" : "Disabled"}
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRegenerateLink(form.id)}
                          className="text-xs text-orange-400 hover:underline"
                        >
                          Regenerate
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleGenerateLink(form.id)}
                      className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700"
                    >
                      Generate Shareable Link
                    </button>
                  )}
                </div>

                {/* View Submissions Link */}
                {submissionCount > 0 && (
                  <Link
                    href="/dashboard/onboarding-forms/submissions"
                    className="mt-3 block rounded-lg bg-orange-500/10 border border-orange-500/30 px-3 py-2 text-center text-sm text-orange-400 hover:bg-orange-500/20"
                  >
                    View {submissionCount} Submission{submissionCount !== 1 ? "s" : ""}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Builder Modal */}
      <OnboardingFormBuilder
        isOpen={builderOpen}
        onClose={() => {
          setBuilderOpen(false);
          setEditingForm(undefined);
        }}
        editingForm={editingForm}
      />
    </div>
  );
}
