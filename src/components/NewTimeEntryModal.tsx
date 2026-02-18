"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import type { Currency } from "@/lib/types";
import { defaultTimeTrackingSettings } from "@/lib/defaults";

const EMPTY_TEAM_MEMBERS: { id: string; name: string; email?: string; defaultHourlyRate?: number }[] = [];

interface NewTimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  defaultDate?: string;
}

export function NewTimeEntryModal({
  isOpen,
  onClose,
  defaultProjectId = "",
  defaultDate,
}: NewTimeEntryModalProps) {
  const addTimeEntry = useStore((s) => s.addTimeEntry);
  const projects = useStore((s) => s.projects);
  const getBoardTasksForProject = useStore((s) => s.getBoardTasksForProject);
  const teamMembers = useStore((s) => s.settings?.teamMembers ?? EMPTY_TEAM_MEMBERS);
  const timeTracking = useStore((s) => s.settings?.timeTracking ?? defaultTimeTrackingSettings);

  const [projectId, setProjectId] = useState(defaultProjectId);
  const [taskId, setTaskId] = useState("");
  const [teamMemberId, setTeamMemberId] = useState(teamMembers[0]?.id ?? "");
  const [date, setDate] = useState(defaultDate ?? new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");
  const [billable, setBillable] = useState(true);
  const [billingRate, setBillingRate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const project = projects.find((p) => p.id === projectId);
  const projectTasks = useMemo(
    () => getBoardTasksForProject(projectId),
    [getBoardTasksForProject, projectId]
  );

  const resolvedRate = useMemo(() => {
    if (billingRate.trim()) return parseFloat(billingRate) || 0;
    const teamMember = teamMembers.find((m) => m.id === teamMemberId);
    return (
      project?.defaultBillingRate ??
      teamMember?.defaultHourlyRate ??
      timeTracking.defaultHourlyRate ??
      0
    );
  }, [billingRate, project?.defaultBillingRate, teamMemberId, teamMembers, timeTracking.defaultHourlyRate]);

  const resolvedCurrency: Currency =
    project?.billingCurrency ?? timeTracking.defaultCurrency ?? "USD";

  if (!isOpen) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!projectId) e.projectId = "Project is required";
    if (!teamMemberId) e.teamMemberId = "Team member is required";
    const h = parseFloat(hours);
    if (!hours.trim() || isNaN(h) || h <= 0) e.hours = "Valid hours required";
    if (billable && (!resolvedRate || resolvedRate <= 0)) e.billingRate = "Billing rate required for billable entries";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const h = parseFloat(hours);
    addTimeEntry({
      projectId,
      taskId: taskId || undefined,
      teamMemberId,
      date,
      hours: h,
      notes: notes.trim() || undefined,
      billable,
      billingRate: resolvedRate,
      currency: resolvedCurrency,
    });
    reset();
    onClose();
  };

  const reset = () => {
    setProjectId(defaultProjectId || "");
    setTaskId("");
    setTeamMemberId(teamMembers[0]?.id ?? "");
    setDate(defaultDate ?? new Date().toISOString().slice(0, 10));
    setHours("");
    setNotes("");
    setBillable(true);
    setBillingRate("");
    setErrors({});
  };

  const inputClass =
    "rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-white">Log Time</h2>
        <p className="mt-1 text-sm text-neutral-400">Add hours worked for a project</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`mt-1 w-full ${inputClass}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Project *</label>
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setTaskId("");
              }}
              className={`mt-1 w-full ${inputClass}`}
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.projectId && <p className="mt-1 text-xs text-red-400">{errors.projectId}</p>}
          </div>
          {projectId && (
            <div>
              <label className="block text-sm font-medium text-neutral-300">Task (optional)</label>
              <select
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className={`mt-1 w-full ${inputClass}`}
              >
                <option value="">No task</option>
                {projectTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-300">Team Member *</label>
            <select
              value={teamMemberId}
              onChange={(e) => setTeamMemberId(e.target.value)}
              className={`mt-1 w-full ${inputClass}`}
            >
              <option value="">Select team member</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {m.defaultHourlyRate ? ` ($${m.defaultHourlyRate}/hr)` : ""}
                </option>
              ))}
            </select>
            {errors.teamMemberId && <p className="mt-1 text-xs text-red-400">{errors.teamMemberId}</p>}
            {teamMembers.length === 0 && (
              <p className="mt-1 text-xs text-amber-400">Add team members in Time Tracking settings</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Hours *</label>
            <input
              type="number"
              min={0.25}
              step={0.25}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className={`mt-1 w-full ${inputClass}`}
              placeholder="e.g. 2.5"
            />
            {errors.hours && <p className="mt-1 text-xs text-red-400">{errors.hours}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`mt-1 w-full ${inputClass}`}
              placeholder="What did you work on?"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={billable}
                onChange={(e) => setBillable(e.target.checked)}
                className="rounded border-neutral-600 bg-neutral-800 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-neutral-300">Billable</span>
            </label>
          </div>
          {billable && (
            <div>
              <label className="block text-sm font-medium text-neutral-300">
                Billing Rate ({resolvedCurrency}/hr)
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={billingRate || (resolvedRate ? String(resolvedRate) : "")}
                onChange={(e) => setBillingRate(e.target.value)}
                className={`mt-1 w-full ${inputClass}`}
                placeholder={
                  project?.defaultBillingRate
                    ? `Project default: ${project.defaultBillingRate}`
                    : `Default: ${timeTracking.defaultHourlyRate ?? 125}`
                }
              />
              {errors.billingRate && <p className="mt-1 text-xs text-red-400">{errors.billingRate}</p>}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
          >
            Log Time
          </button>
        </div>
      </div>
    </div>
  );
}
