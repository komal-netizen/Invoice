"use client";

import { useState, useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { useStore } from "@/lib/store";
import type { NotesBlockConfig } from "@/lib/client-dashboard-types";
import { BlockHeader } from "../BlockHeader";

interface NotesBlockProps {
  clientId: string;
  config: NotesBlockConfig;
  onTitleChange?: (newTitle: string) => void;
  onRemove?: () => void;
}

export function NotesBlock({ clientId, config, onTitleChange, onRemove }: NotesBlockProps) {
  const [mounted, setMounted] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");

  useEffect(() => setMounted(true), []);

  const getClientNotes = useStore((s) => s.getClientNotes);
  const addClientNote = useStore((s) => s.addClientNote);
  const updateClientNote = useStore((s) => s.updateClientNote);
  const deleteClientNote = useStore((s) => s.deleteClientNote);

  const notes = getClientNotes(clientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const displayedNotes = config.maxNotes ? notes.slice(0, config.maxNotes) : notes;

  const handleSaveNote = () => {
    if (!noteContent.trim()) return;

    if (editingNote) {
      updateClientNote(clientId, editingNote, noteContent);
    } else {
      addClientNote(clientId, noteContent);
    }

    setNoteContent("");
    setEditingNote(null);
    setNoteModalOpen(false);
  };

  const handleAddNote = () => {
    setNoteContent("");
    setEditingNote(null);
    setNoteModalOpen(true);
  };

  return (
    <>
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 -mb-4">
            <BlockHeader
              title={config.title}
              onTitleChange={onTitleChange}
              onRemove={onRemove}
              showControls={true}
            />
          </div>
          {config.showAddButton && (
            <button
              onClick={handleAddNote}
              className="text-xs text-orange-400 hover:text-orange-300"
            >
              + Add Note
            </button>
          )}
        </div>

        {displayedNotes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-neutral-500">No notes yet.</p>
            {config.showAddButton && (
              <button
                onClick={handleAddNote}
                className="mt-2 text-sm text-orange-400 hover:text-orange-300"
              >
                Add your first note about this client
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {displayedNotes.map((note) => (
              <div key={note.id} className="rounded-lg border border-neutral-800 bg-neutral-800/50 p-3">
                <p className="text-sm text-white whitespace-pre-wrap">{note.content}</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-neutral-500">
                    {mounted
                      ? formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })
                      : format(new Date(note.createdAt), "MMM d, yyyy")}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setNoteContent(note.content);
                        setEditingNote(note.id);
                        setNoteModalOpen(true);
                      }}
                      className="text-xs text-neutral-400 hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this note?")) {
                          deleteClientNote(clientId, note.id);
                        }
                      }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note Modal */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingNote ? "Edit Note" : "Add Note"}
              </h3>
              <button
                onClick={() => setNoteModalOpen(false)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write your note..."
              className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 min-h-[150px]"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setNoteModalOpen(false)}
                className="rounded-lg border border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                disabled={!noteContent.trim()}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingNote ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
