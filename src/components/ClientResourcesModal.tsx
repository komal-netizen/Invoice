"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import type { ClientResource } from "@/lib/types";

interface ClientResourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

const RESOURCE_TYPES = [
  { value: "file", label: "File", icon: "📄" },
  { value: "link", label: "Link", icon: "🔗" },
  { value: "note", label: "Note", icon: "📝" },
  { value: "image", label: "Image", icon: "🖼️" },
  { value: "video", label: "Video", icon: "🎥" },
] as const;

export function ClientResourcesModal({ isOpen, onClose, clientId }: ClientResourcesModalProps) {
  const addClientResource = useStore((s) => s.addClientResource);
  const updateClientResource = useStore((s) => s.updateClientResource);
  const deleteClientResource = useStore((s) => s.deleteClientResource);
  const getClientResources = useStore((s) => s.getClientResources);
  const reorderClientResources = useStore((s) => s.reorderClientResources);

  const resources = getClientResources(clientId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "file" as "file" | "link" | "note" | "image" | "video",
    title: "",
    description: "",
    url: "",
    content: "",
    category: "",
    isPinned: false,
  });
  const [uploadedFileName, setUploadedFileName] = useState<string>("");

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null);
      setUploadedFileName("");
      setForm({
        type: "file",
        title: "",
        description: "",
        url: "",
        content: "",
        category: "",
        isPinned: false,
      });
    }
  }, [isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB to avoid localStorage issues)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setForm((f) => ({
        ...f,
        title: f.title || file.name,
        url: dataUrl, // Store as data URL
      }));
      setUploadedFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = (resource: ClientResource) => {
    setEditingId(resource.id);
    setForm({
      type: resource.type,
      title: resource.title,
      description: resource.description || "",
      url: resource.url || "",
      content: resource.content || "",
      category: resource.category || "",
      isPinned: resource.isPinned || false,
    });
    // Extract filename from data URL or regular URL
    if (resource.type === "file" && resource.url) {
      const fileName = resource.url.startsWith("data:")
        ? resource.title
        : resource.url.split("/").pop() || "";
      setUploadedFileName(fileName);
    } else {
      setUploadedFileName("");
    }
  };

  const handleSave = () => {
    if (!form.title.trim()) return;

    if (editingId) {
      updateClientResource(editingId, {
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        url: form.url.trim() || undefined,
        content: form.content.trim() || undefined,
        category: form.category.trim() || undefined,
        isPinned: form.isPinned,
      });
    } else {
      addClientResource({
        clientId,
        type: form.type,
        title: form.title.trim(),
        category: form.category.trim() || undefined,
        description: form.description.trim() || undefined,
        url: form.url.trim() || undefined,
        content: form.content.trim() || undefined,
        isPinned: form.isPinned,
        order: resources.length,
      });
    }

    setEditingId(null);
    setUploadedFileName("");
    setForm({
      type: "file",
      title: "",
      description: "",
      url: "",
      content: "",
      category: "",
      isPinned: false,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this resource?")) {
      deleteClientResource(id);
      if (editingId === id) {
        setEditingId(null);
        setUploadedFileName("");
        setForm({
          type: "file",
          title: "",
          description: "",
          url: "",
          content: "",
          category: "",
          isPinned: false,
        });
      }
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...resources];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    reorderClientResources(
      clientId,
      newOrder.map((r) => r.id)
    );
  };

  const handleMoveDown = (index: number) => {
    if (index === resources.length - 1) return;
    const newOrder = [...resources];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    reorderClientResources(
      clientId,
      newOrder.map((r) => r.id)
    );
  };

  if (!isOpen) return null;

  const inputClass =
    "w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";
  const labelClass = "block text-sm font-medium text-neutral-300";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-white">Manage Client Resources</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          {/* Add/Edit Form */}
          <div className="mb-6 rounded-lg border border-neutral-700 bg-neutral-800/50 p-4">
            <h3 className="mb-3 text-sm font-medium text-white">
              {editingId ? "Edit Resource" : "Add Resource"}
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Type</label>
                <div className="mt-2 flex gap-2">
                  {RESOURCE_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, type: type.value }));
                        if (type.value !== "file") {
                          setUploadedFileName("");
                        }
                      }}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        form.type === type.value
                          ? "border-orange-500 bg-orange-500/20 text-orange-400"
                          : "border-neutral-600 text-neutral-300 hover:border-neutral-500"
                      }`}
                    >
                      <span className="mr-1">{type.icon}</span> {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className={inputClass}
                  placeholder="Resource title"
                />
              </div>

              <div>
                <label className={labelClass}>Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className={inputClass}
                  rows={2}
                  placeholder="Brief description"
                />
              </div>

              {form.type === "file" && (
                <div>
                  <label className={labelClass}>Upload File *</label>
                  <div className="mt-2">
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-600 bg-neutral-800/50 px-6 py-4 transition-colors hover:border-neutral-500 hover:bg-neutral-800">
                      <svg className="h-8 w-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <span className="mt-2 text-sm text-neutral-400">
                        {uploadedFileName || "Click to upload file"}
                      </span>
                      <span className="mt-1 text-xs text-neutral-500">
                        PDF, Excel, Word, Images, etc. (Max 5MB)
                      </span>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="*/*"
                      />
                    </label>
                  </div>
                  {uploadedFileName && (
                    <p className="mt-2 text-xs text-emerald-400">File uploaded: {uploadedFileName}</p>
                  )}
                </div>
              )}

              {(form.type === "link" || form.type === "image" || form.type === "video") && (
                <div>
                  <label className={labelClass}>URL *</label>
                  <input
                    type="url"
                    value={form.url}
                    onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                    className={inputClass}
                    placeholder={
                      form.type === "image" ? "https://example.com/image.jpg" :
                      form.type === "video" ? "https://example.com/video.mp4" :
                      "https://example.com"
                    }
                  />
                  <p className="mt-1 text-xs text-neutral-500">
                    {form.type === "image" || form.type === "video"
                      ? "Paste the direct URL to the image or video file"
                      : "Enter the full URL including https://"}
                  </p>
                </div>
              )}

              {(form.type === "image" || form.type === "video") && (
                <div>
                  <label className={labelClass}>Category (optional)</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className={inputClass}
                    placeholder="e.g. Logo Design, Web Design, Branding"
                  />
                  <p className="mt-1 text-xs text-neutral-500">
                    Categorize your work for easier browsing in the gallery
                  </p>
                </div>
              )}

              {form.type === "note" && (
                <div>
                  <label className={labelClass}>Content *</label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    className={inputClass}
                    rows={4}
                    placeholder="Note content (supports plain text)"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={form.isPinned}
                  onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))}
                  className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="isPinned" className="text-sm text-neutral-300">
                  Pin to top
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={!form.title.trim()}
                  className="flex-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingId ? "Update" : "Add"} Resource
                </button>
                {editingId && (
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setUploadedFileName("");
                      setForm({
                        type: "file",
                        title: "",
                        description: "",
                        url: "",
                        content: "",
                        category: "",
                        isPinned: false,
                      });
                    }}
                    className="rounded-lg border border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Resources List */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-white">
              Current Resources ({resources.length})
            </h3>
            {resources.length === 0 ? (
              <p className="rounded-lg border border-dashed border-neutral-700 bg-neutral-800/30 py-8 text-center text-sm text-neutral-400">
                No resources yet. Add files, links, or notes to share with your client.
              </p>
            ) : (
              <div className="space-y-2">
                {resources.map((resource, index) => (
                  <div
                    key={resource.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 ${
                      editingId === resource.id
                        ? "border-orange-500 bg-orange-500/10"
                        : "border-neutral-700 bg-neutral-800/50"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{RESOURCE_TYPES.find((t) => t.value === resource.type)?.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white">
                            {resource.title}
                            {resource.isPinned && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-orange-900/40 px-2 py-0.5 text-xs font-medium text-orange-300">
                                📌 Pinned
                              </span>
                            )}
                          </h4>
                          {resource.description && (
                            <p className="mt-1 text-sm text-neutral-400">{resource.description}</p>
                          )}
                          {resource.url && (
                            <a
                              href={resource.url}
                              download={resource.type === "file" && resource.url.startsWith("data:") ? resource.title : undefined}
                              target={resource.type === "file" && resource.url.startsWith("data:") ? undefined : "_blank"}
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-xs text-orange-400 hover:underline"
                            >
                              {resource.type === "file" && resource.url.startsWith("data:")
                                ? "📥 Download file"
                                : resource.url.slice(0, 50) + "..."}
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleEdit(resource)}
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                        title="Edit"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === resources.length - 1}
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="rounded p-1 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                        title="Delete"
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

        <div className="border-t border-neutral-800 p-6">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
