"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { ClientTag } from "@/lib/types";

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated?: (clientId: string) => void;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewClientModal({
  isOpen,
  onClose,
  onClientCreated,
}: NewClientModalProps) {
  const addClient = useStore((s) => s.addClient);
  const settings = useStore((s) => s.settings ?? null);
  const clientTags = settings?.clientTags ?? ["VIP", "Regular", "Retainer", "One-time"];
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [tags, setTags] = useState<ClientTag[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [newTag, setNewTag] = useState("");

  if (!isOpen) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!companyName.trim()) e.companyName = "Company name is required";
    if (!contactName.trim()) e.contactName = "Contact name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!emailRegex.test(email)) e.email = "Enter a valid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddClient = () => {
    if (!validate()) return;
    const client = addClient({
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      email: email.trim(),
      tags,
    });
    reset();
    onClose();
    if (onClientCreated) onClientCreated(client.id);
  };

  const reset = () => {
    setCompanyName("");
    setContactName("");
    setEmail("");
    setTags([]);
    setErrors({});
    setShowNewTagInput(false);
    setNewTag("");
  };

  const toggleTag = (tag: ClientTag) => {
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));
  };

  const handleAddNewTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !clientTags.includes(trimmedTag) && !tags.includes(trimmedTag as ClientTag)) {
      setTags((t) => [...t, trimmedTag as ClientTag]);
      setNewTag("");
      setShowNewTagInput(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-neutral-900 dark:border dark:border-neutral-800 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">New Client</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Quick create</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Company Name *</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
              placeholder="Acme Inc."
            />
            {errors.companyName && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.companyName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Contact Name *</label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
              placeholder="Jane Doe"
            />
            {errors.contactName && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.contactName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
              placeholder="jane@acme.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Tags</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {clientTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag as ClientTag)}
                  className={`rounded-full px-3 py-1 text-sm ${
                    tags.includes(tag as ClientTag)
                      ? "bg-orange-600 text-white dark:bg-orange-500"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
                  }`}
                >
                  {tag}
                </button>
              ))}
              {!showNewTagInput ? (
                <button
                  type="button"
                  onClick={() => setShowNewTagInput(true)}
                  className="flex items-center gap-1 rounded-full px-3 py-1 text-sm bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add tag
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddNewTag();
                      } else if (e.key === "Escape") {
                        setShowNewTagInput(false);
                        setNewTag("");
                      }
                    }}
                    placeholder="Tag name"
                    autoFocus
                    className="w-32 rounded-full border border-neutral-200 bg-white px-3 py-1 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewTag}
                    className="rounded-full p-1 text-orange-600 hover:bg-orange-100 dark:text-orange-400 dark:hover:bg-orange-900/20"
                    title="Add"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewTagInput(false);
                      setNewTag("");
                    }}
                    className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    title="Cancel"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleAddClient}
            className="rounded-lg bg-orange-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-orange-500 dark:bg-orange-500 dark:hover:bg-orange-400"
          >
            Add Client
          </button>
        </div>
      </div>
    </div>
  );
}
