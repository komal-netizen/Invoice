"use client";

import { useState } from "react";
import type { OnboardingForm, FormField, FormResponse } from "@/lib/types";

interface OnboardingFormPublicProps {
  data: OnboardingForm;
  token: string;
}

export function OnboardingFormPublic({ data, token }: OnboardingFormPublicProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFormData = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    data.fields.forEach((field) => {
      if (field.required) {
        const value = formData[field.id];
        if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === "string" && !value.trim())) {
          newErrors[field.id] = "This field is required";
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (fieldId: string, file: File): Promise<string> => {
    // In a real app, upload to cloud storage (e.g., AWS S3, Cloudinary)
    // For now, we'll create a fake URL
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`/uploads/${file.name}`);
      }, 1000);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setUploading(true);

    try {
      // Process file uploads
      const responses: FormResponse[] = [];
      for (const field of data.fields) {
        const value = formData[field.id];
        if (!value && !field.required) continue;

        if (field.type === "file-upload" && value instanceof File) {
          const fileUrl = await handleFileUpload(field.id, value);
          responses.push({
            fieldId: field.id,
            fieldLabel: field.label,
            fieldType: field.type,
            value: value.name,
            fileUrl,
          });
        } else if (field.type === "checkboxes" && Array.isArray(value)) {
          responses.push({
            fieldId: field.id,
            fieldLabel: field.label,
            fieldType: field.type,
            value: value,
          });
        } else {
          responses.push({
            fieldId: field.id,
            fieldLabel: field.label,
            fieldType: field.type,
            value: value || "",
          });
        }
      }

      // Extract email for notification
      const emailField = responses.find((r) => r.fieldType === "email");
      const nameField = responses.find((r) => r.fieldLabel.toLowerCase().includes("name"));

      // Submit to API
      const res = await fetch("/api/onboarding-form/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: data.id,
          formName: data.name,
          responses,
          submitterEmail: emailField?.value as string,
          submitterName: nameField?.value as string,
        }),
      });

      if (!res.ok) throw new Error("Submission failed");

      setSubmitted(true);
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to submit form. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="max-w-lg w-full rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-900/30 flex items-center justify-center">
            <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-white">Thank You!</h1>
          <p className="mt-2 text-neutral-400">
            Your submission has been received. We'll review your information and get back to you soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 py-12 px-4">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8">
          <h1 className="text-3xl font-semibold text-white">{data.name}</h1>
          {data.description && (
            <p className="mt-2 text-neutral-400">{data.description}</p>
          )}
          <p className="mt-4 text-sm text-neutral-500">
            Fields marked with <span className="text-red-400">*</span> are required
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {data.fields
            .sort((a, b) => a.order - b.order)
            .map((field) => (
              <div key={field.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                <label className="block text-sm font-medium text-white">
                  {field.label}
                  {field.required && <span className="ml-1 text-red-400">*</span>}
                </label>
                {field.helpText && (
                  <p className="mt-1 text-xs text-neutral-500">{field.helpText}</p>
                )}

                <div className="mt-3">
                  {renderField(field, formData[field.id], (value) => updateFormData(field.id, value))}
                </div>

                {errors[field.id] && (
                  <p className="mt-2 text-sm text-red-400">{errors[field.id]}</p>
                )}
              </div>
            ))}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full rounded-xl bg-orange-500 px-6 py-4 text-lg font-medium text-white hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}

function renderField(field: FormField, value: any, onChange: (value: any) => void) {
  switch (field.type) {
    case "text":
    case "email":
    case "phone":
      return (
        <input
          type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
      );

    case "textarea":
      return (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
      );

    case "date":
      return (
        <input
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
      );

    case "dropdown":
      return (
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="">Select an option</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );

    case "multiple-choice":
      return (
        <div className="space-y-2">
          {field.options?.map((option) => (
            <label key={option} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name={field.id}
                value={option}
                checked={value === option}
                onChange={(e) => onChange(e.target.value)}
                className="h-4 w-4 border-neutral-600 bg-neutral-800 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-neutral-300 group-hover:text-white">{option}</span>
            </label>
          ))}
        </div>
      );

    case "checkboxes":
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          {field.options?.map((option) => (
            <label key={option} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedValues.includes(option)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selectedValues, option]);
                  } else {
                    onChange(selectedValues.filter((v: string) => v !== option));
                  }
                }}
                className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-neutral-300 group-hover:text-white">{option}</span>
            </label>
          ))}
        </div>
      );

    case "file-upload":
      return (
        <div>
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onChange(file);
            }}
            className="w-full text-sm text-neutral-400 file:mr-4 file:rounded-lg file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-white file:hover:bg-orange-400 file:cursor-pointer"
          />
          {value instanceof File && (
            <p className="mt-2 text-sm text-neutral-400">Selected: {value.name}</p>
          )}
        </div>
      );

    default:
      return null;
  }
}
