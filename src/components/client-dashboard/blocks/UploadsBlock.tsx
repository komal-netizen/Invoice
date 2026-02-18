"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { UploadsBlockConfig } from "@/lib/client-dashboard-types";
import { BlockHeader } from "../BlockHeader";
import { format } from "date-fns";

interface UploadsBlockProps {
  clientId: string;
  config: UploadsBlockConfig;
  onTitleChange?: (newTitle: string) => void;
  onRemove?: () => void;
}

export function UploadsBlock({ clientId, config, onTitleChange, onRemove }: UploadsBlockProps) {
  const [resourcesModalOpen, setResourcesModalOpen] = useState(false);
  const getClientResources = useStore((s) => s.getClientResources);
  const deleteClientResource = useStore((s) => s.deleteClientResource);
  
  const resources = getClientResources(clientId);
  const fileResources = resources.filter((r) => r.type === "file");
  
  // Limit displayed items if configured
  const displayedResources = config.maxItems
    ? fileResources.slice(0, config.maxItems)
    : fileResources;

  // Group by type if configured
  const groupedResources = config.groupByType
    ? {
        documents: displayedResources.filter((r) =>
          r.url?.match(/\.(pdf|doc|docx|txt|xls|xlsx|csv)$/i) ||
          r.mimeType?.includes("document") ||
          r.mimeType?.includes("spreadsheet") ||
          r.mimeType?.includes("text")
        ),
        images: displayedResources.filter((r) =>
          r.url?.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) ||
          r.mimeType?.includes("image")
        ),
        videos: displayedResources.filter((r) =>
          r.url?.match(/\.(mp4|mov|avi|webm)$/i) ||
          r.mimeType?.includes("video")
        ),
        other: displayedResources.filter((r) => {
          const isDoc = r.url?.match(/\.(pdf|doc|docx|txt|xls|xlsx|csv)$/i) || r.mimeType?.includes("document") || r.mimeType?.includes("spreadsheet") || r.mimeType?.includes("text");
          const isImage = r.url?.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) || r.mimeType?.includes("image");
          const isVideo = r.url?.match(/\.(mp4|mov|avi|webm)$/i) || r.mimeType?.includes("video");
          return !isDoc && !isImage && !isVideo;
        }),
      }
    : null;

  const handleDelete = (id: string) => {
    if (confirm("Delete this file?")) {
      deleteClientResource(id);
    }
  };

  const getFileIcon = (resource: any) => {
    const url = resource.url || "";
    const mimeType = resource.mimeType || "";

    if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) || mimeType.includes("image")) {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      );
    }
    if (url.match(/\.(mp4|mov|avi|webm)$/i) || mimeType.includes("video")) {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
        </svg>
      );
    }
    if (url.match(/\.pdf$/i) || mimeType.includes("pdf")) {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      );
    }
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    );
  };

  const renderResource = (resource: any) => (
    <div
      key={resource.id}
      className="flex items-center gap-3 rounded-lg border border-neutral-700 bg-neutral-800/50 p-3 hover:border-neutral-600 transition-colors"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-700 text-neutral-400">
        {getFileIcon(resource)}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white truncate">{resource.title}</h4>
        <p className="text-xs text-neutral-500">
          {format(new Date(resource.createdAt), "MMM d, yyyy")}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <a
          href={resource.url}
          download={resource.type === "file" && resource.url?.startsWith("data:") ? resource.title : undefined}
          target={resource.type === "file" && resource.url?.startsWith("data:") ? undefined : "_blank"}
          rel="noopener noreferrer"
          className="rounded p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
          title="Download"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </a>
        <button
          onClick={() => handleDelete(resource.id)}
          className="rounded p-1.5 text-neutral-400 hover:bg-red-900/20 hover:text-red-400 transition-colors"
          title="Delete"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
      <BlockHeader
        title={config.title}
        isCollapsible={config.isCollapsible}
        defaultCollapsed={config.defaultCollapsed}
        onTitleChange={onTitleChange}
        onRemove={onRemove}
      />

      {fileResources.length === 0 ? (
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800 text-neutral-500">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-neutral-500 mb-4">No files uploaded yet</p>
          {config.showUploadButton && (
            <button
              onClick={() => setResourcesModalOpen(true)}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400 transition-colors"
            >
              Upload Files
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {config.groupByType && groupedResources ? (
            <>
              {groupedResources.documents.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                    Documents
                  </h3>
                  <div className="space-y-2">
                    {groupedResources.documents.map(renderResource)}
                  </div>
                </div>
              )}
              {groupedResources.images.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                    Images
                  </h3>
                  <div className="space-y-2">
                    {groupedResources.images.map(renderResource)}
                  </div>
                </div>
              )}
              {groupedResources.videos.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                    Videos
                  </h3>
                  <div className="space-y-2">
                    {groupedResources.videos.map(renderResource)}
                  </div>
                </div>
              )}
              {groupedResources.other.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                    Other
                  </h3>
                  <div className="space-y-2">
                    {groupedResources.other.map(renderResource)}
                  </div>
                </div>
              )}
            </>
          ) : (
            displayedResources.map(renderResource)
          )}

          {config.showUploadButton && (
            <button
              onClick={() => setResourcesModalOpen(true)}
              className="w-full rounded-lg border-2 border-dashed border-neutral-700 bg-neutral-800/30 px-4 py-3 text-sm font-medium text-neutral-400 hover:border-neutral-600 hover:text-white transition-colors"
            >
              + Upload More Files
            </button>
          )}
        </div>
      )}
    </div>
  );
}
