"use client";

import type { ClientDashboardBlock } from "@/lib/client-dashboard-types";
import { UploadsBlock } from "./blocks/UploadsBlock";
import { NotesBlock } from "./blocks/NotesBlock";
import { ActivitiesBlock } from "./blocks/ActivitiesBlock";

interface BlockRendererProps {
  block: ClientDashboardBlock;
  clientId: string;
  activities?: any[]; // For activities block
  onTitleChange?: (blockId: string, newTitle: string) => void;
  onRemove?: (blockId: string) => void;
}

export function BlockRenderer({
  block,
  clientId,
  activities = [],
  onTitleChange,
  onRemove,
}: BlockRendererProps) {
  const handleTitleChange = (newTitle: string) => onTitleChange?.(block.id, newTitle);
  const handleRemove = () => onRemove?.(block.id);

  switch (block.type) {
    case "uploads":
      return (
        <UploadsBlock
          clientId={clientId}
          config={block.config as any}
          onTitleChange={handleTitleChange}
          onRemove={handleRemove}
        />
      );

    case "notes":
      return (
        <NotesBlock
          clientId={clientId}
          config={block.config as any}
          onTitleChange={handleTitleChange}
          onRemove={handleRemove}
        />
      );

    case "activities":
      return (
        <ActivitiesBlock
          clientId={clientId}
          activities={activities}
          config={block.config as any}
          onTitleChange={handleTitleChange}
          onRemove={handleRemove}
        />
      );

    case "text-section":
      return (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-500">Text Section - Coming Soon</p>
        </div>
      );

    case "table":
      return (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-500">Table - Coming Soon</p>
        </div>
      );

    case "chart":
      return (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-500">Chart - Coming Soon</p>
        </div>
      );

    case "gallery":
      return (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-500">Gallery - Coming Soon</p>
        </div>
      );

    case "links":
      return (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-500">Links - Coming Soon</p>
        </div>
      );

    case "embedded-content":
      return (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-500">Embedded Content - Coming Soon</p>
        </div>
      );

    case "custom-fields":
      return (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-500">Custom Fields - Coming Soon</p>
        </div>
      );

    case "timeline":
      return (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-500">Timeline - Coming Soon</p>
        </div>
      );

    case "kanban":
      return (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-500">Kanban - Coming Soon</p>
        </div>
      );

    default:
      return (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-500">Unknown block type</p>
        </div>
      );
  }
}
