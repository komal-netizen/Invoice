"use client";

import { useState, useEffect } from "react";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileType?: string;
}

export function FilePreviewModal({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileType,
}: FilePreviewModalProps) {
  const [previewType, setPreviewType] = useState<"image" | "video" | "pdf" | "unknown">("unknown");

  useEffect(() => {
    if (!fileUrl) return;

    // Determine file type from URL extension or provided fileType
    const ext = fileUrl.split(".").pop()?.toLowerCase() || "";
    const mimeType = fileType?.toLowerCase() || "";

    if (
      ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext) ||
      mimeType.startsWith("image/")
    ) {
      setPreviewType("image");
    } else if (
      ["mp4", "webm", "ogg", "mov"].includes(ext) ||
      mimeType.startsWith("video/")
    ) {
      setPreviewType("video");
    } else if (ext === "pdf" || mimeType === "application/pdf") {
      setPreviewType("pdf");
    } else {
      setPreviewType("unknown");
    }
  }, [fileUrl, fileType]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-xl bg-neutral-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/95 px-6 py-4 backdrop-blur-sm">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-white">{fileName}</h2>
            <p className="text-sm text-neutral-400">
              {previewType === "unknown" ? "Preview not available" : `${previewType.toUpperCase()} Preview`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={fileName}
              className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
              onClick={(e) => e.stopPropagation()}
            >
              Download
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-neutral-800 p-2 text-white hover:bg-neutral-700"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex items-center justify-center bg-neutral-950 p-8" style={{ maxHeight: "calc(90vh - 80px)" }}>
          {previewType === "image" && (
            <img
              src={fileUrl}
              alt={fileName}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          )}

          {previewType === "video" && (
            <video
              src={fileUrl}
              controls
              autoPlay
              className="max-h-full max-w-full rounded-lg"
            >
              Your browser does not support the video tag.
            </video>
          )}

          {previewType === "pdf" && (
            <iframe
              src={fileUrl}
              className="h-full w-full rounded-lg"
              style={{ minHeight: "70vh" }}
              title={fileName}
            />
          )}

          {previewType === "unknown" && (
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 text-neutral-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-4 text-lg text-neutral-400">Preview not available</p>
              <p className="mt-2 text-sm text-neutral-500">
                This file type cannot be previewed in the browser
              </p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={fileName}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
