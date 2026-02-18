"use client";

import { useState } from "react";
import { AddBlockModal } from "./AddBlockModal";
import type { ClientDashboardBlock, ClientDashboardBlockType } from "@/lib/client-dashboard-types";

interface BlockManagerProps {
  onAddBlock: (blockType: ClientDashboardBlockType) => void;
  existingBlocks: ClientDashboardBlock[];
}

export function BlockManager({ onAddBlock, existingBlocks }: BlockManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const existingBlockTypes = existingBlocks.map((b) => b.type);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:border-neutral-600 hover:bg-neutral-700 hover:text-white"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add Section
      </button>

      <AddBlockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={onAddBlock}
        existingBlockTypes={existingBlockTypes}
      />
    </>
  );
}
