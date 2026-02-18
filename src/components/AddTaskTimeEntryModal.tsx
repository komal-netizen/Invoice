"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { BoardTask } from "@/lib/types";
import { format } from "date-fns";

interface AddTaskTimeEntryModalProps {
  task: BoardTask;
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export function AddTaskTimeEntryModal({ task, isOpen, onClose, onAdded }: AddTaskTimeEntryModalProps) {
  const addTimeEntry = useStore((s) => s.addTimeEntry);
  const projects = useStore((s) => s.projects);
  const getTeamMember = useStore((s) => s.getTeamMember);
  const teamMembers = useStore((s) => s.settings?.teamMembers ?? []);
  const timeTracking = useStore((s) => s.settings?.timeTracking);
  const defaultRate = timeTracking?.defaultHourlyRate ?? 0;
  const defaultCurrency = timeTracking?.defaultCurrency ?? "USD";

  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [billable, setBillable] = useState(task.billable ?? true);
  const [teamMemberId, setTeamMemberId] = useState(task.assigneeId ?? teamMembers[0]?.id ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const project = task.projectId ? projects.find((p) => p.id === task.projectId) : undefined;
  const member = teamMemberId ? getTeamMember(teamMemberId) : undefined;
  const billingRate = project?.defaultBillingRate ?? member?.defaultHourlyRate ?? defaultRate;
  const currency = project?.billingCurrency ?? defaultCurrency;

  if (!isOpen) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    const h = parseFloat(hours) || 0;
    const m = parseFloat(minutes) || 0;
    const totalHours = h + m / 60;
    if (totalHours <= 0) e.hours = "Enter duration (hours and/or minutes)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const h = parseFloat(hours) || 0;
    const m = parseFloat(minutes) || 0;
    const totalHours = Math.round((h + m / 60) * 100) / 100;
    addTimeEntry({
      projectId: task.projectId ?? "",
      taskId: task.id,
      teamMemberId,
      date,
      hours: totalHours,
      notes: notes.trim() || undefined,
      billable,
      billingRate,
      currency,
    });
    setHours("");
    setMinutes("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setNotes("");
    setBillable(task.billable ?? true);
    setErrors({});
    onAdded();
    onClose();
  };

  const inputClass = "rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white">Add Time Entry</h2>
        <p className="mt-1 text-sm text-neutral-400">Log time for: {task.title}</p>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-400">Hours</label>
              <input
                type="number"
                min={0}
                step={0.25}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className={`mt-1 w-full ${inputClass}`}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400">Minutes</label>
              <input
                type="number"
                min={0}
                max={59}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className={`mt-1 w-full ${inputClass}`}
                placeholder="0"
              />
            </div>
          </div>
          {errors.hours && <p className="text-xs text-red-400">{errors.hours}</p>}
          {!task.projectId && (
            <p className="text-xs text-amber-400">Task has no project; entry will have no project link. Set project on task for reporting.</p>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-400">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`mt-1 w-full ${inputClass}`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400">Team member</label>
            <select value={teamMemberId} onChange={(e) => setTeamMemberId(e.target.value)} className={`mt-1 w-full ${inputClass}`}>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400">Description</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`mt-1 w-full ${inputClass}`} placeholder="What did you work on?" />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} className="rounded border-neutral-600 bg-neutral-800 text-orange-500" />
            <span className="text-sm text-neutral-400">Billable</span>
          </label>
          {billable && (
            <p className="text-xs text-neutral-500">
              Rate: {currency} {billingRate}/hr
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700">
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400">
            Add time
          </button>
        </div>
      </div>
    </div>
  );
}
