"use client";

import { useState, useRef, useEffect } from "react";

interface BlockHeaderProps {
  title?: string;
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  onTitleChange?: (newTitle: string) => void;
  onRemove?: () => void;
  showControls?: boolean;
}

export function BlockHeader({
  title,
  isCollapsible = false,
  defaultCollapsed = false,
  onCollapse,
  onTitleChange,
  onRemove,
  showControls = true,
}: BlockHeaderProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onCollapse?.(newState);
  };

  const handleRemove = () => {
    if (confirm("Are you sure you want to remove this section?")) {
      onRemove?.();
    }
  };

  const handleDoubleClick = () => {
    if (onTitleChange) {
      setEditValue(title || "");
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (editValue.trim() && editValue !== title) {
      onTitleChange?.(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(title || "");
      setIsEditing(false);
    }
  };

  if (!title && !showControls) return null;

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2 flex-1">
        {title && (
          isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="text-sm font-semibold text-neutral-400 uppercase tracking-wide bg-neutral-800 border border-neutral-600 rounded px-2 py-1 focus:border-orange-500 focus:outline-none"
            />
          ) : (
            <h2 
              className="text-sm font-semibold text-neutral-400 uppercase tracking-wide cursor-pointer hover:text-neutral-300 transition-colors"
              onDoubleClick={handleDoubleClick}
              title={onTitleChange ? "Double-click to rename" : undefined}
            >
              {title}
            </h2>
          )
        )}
      </div>

      {showControls && (
        <div className="flex items-center gap-1">
          {isCollapsible && (
            <button
              onClick={handleCollapse}
              className="rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-white transition-colors"
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              <svg
                className={`h-4 w-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}

          {onRemove && (
            <button
              onClick={handleRemove}
              className="rounded p-1 text-neutral-500 hover:bg-red-900/20 hover:text-red-400 transition-colors"
              title="Remove section"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
